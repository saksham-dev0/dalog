/**
 * GitHub access, brokered by Clerk.
 *
 * The user connects GitHub as a Clerk external account (one click, no app of
 * our own), and Clerk holds the OAuth token. Everything here runs on the
 * server — the token never reaches the browser.
 */
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server"

/** Clerk reports the provider on the external account with the oauth_ prefix. */
const GITHUB_PROVIDER = "oauth_github"

export type GithubConnection = {
  username: string | null
  imageUrl: string
  scopes: string[]
  /** Id `deleteUserExternalAccount()` expects, for the disconnect action. */
  externalAccountId: string
}

export type GithubRepo = {
  id: number
  fullName: string
  private: boolean
  defaultBranch: string
  htmlUrl: string
  pushedAt: string | null
}

/** The connected GitHub account, or `null` when the user hasn't linked one. */
export async function getGithubConnection(): Promise<GithubConnection | null> {
  const user = await currentUser()
  const account = user?.externalAccounts.find(
    (a) => a.provider === GITHUB_PROVIDER
  )
  if (!account) return null

  return {
    username: account.username,
    imageUrl: account.imageUrl,
    scopes: account.approvedScopes
      .split(" ")
      .map((scope) => scope.trim())
      .filter(Boolean),
    externalAccountId: account.externalAccountId ?? account.id,
  }
}

/** Fresh GitHub token for the signed-in user, refreshed by Clerk as needed. */
async function getGithubToken(): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null

  const client = await clerkClient()
  const { data } = await client.users.getUserOauthAccessToken(userId, "github")

  return data[0]?.token ?? null
}

/**
 * Repos the grant covers, most recently pushed first. Returns `null` when
 * GitHub rejects the token so the page can ask for a re-connect instead of
 * rendering an empty list.
 */
export async function listGithubRepos(): Promise<GithubRepo[] | null> {
  const token = await getGithubToken()
  if (!token) return null

  const res = await fetch(
    "https://api.github.com/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    }
  )

  if (!res.ok) return null

  const repos = (await res.json()) as Array<{
    id: number
    full_name: string
    private: boolean
    default_branch: string
    html_url: string
    pushed_at: string | null
  }>

  return repos.map((repo) => ({
    id: repo.id,
    fullName: repo.full_name,
    private: repo.private,
    defaultBranch: repo.default_branch,
    htmlUrl: repo.html_url,
    pushedAt: repo.pushed_at,
  }))
}
