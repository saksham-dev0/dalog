import { BrightBadge, SpecLabel } from "@/components/bright/badge"
import { Surface } from "@/components/bright/card"
import {
  ConnectGithubButton,
  DisconnectGithubButton,
} from "@/components/dashboard/connect-github-button"
import { RepoList } from "@/components/dashboard/repo-list"
import { getGithubConnection, listGithubRepos } from "@/lib/github"

export const metadata = {
  title: "Repos · dalog",
  description: "Connect GitHub and pick the repos dalog watches.",
}

export default async function ReposPage() {
  const connection = await getGithubConnection()
  const repos = connection ? await listGithubRepos() : null

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SpecLabel>Repos</SpecLabel>
          <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.025em]">
            Connected repos
          </h1>
          <p className="text-[15px] leading-[1.6] text-ink-500">
            {connection
              ? "Watch a repo and dalog tracks its commits, PRs, merges and branches as they land."
              : "Connect GitHub once — dalog reads the repos you grant it."}
          </p>
        </div>
        {connection ? (
          <div className="flex items-center gap-2">
            <BrightBadge tone="positive" className="gap-[6px] px-[10px] py-1">
              <span className="size-[6px] rounded-full bg-positive" />
              {connection.username ? `@${connection.username}` : "Connected"}
            </BrightBadge>
            <DisconnectGithubButton
              externalAccountId={connection.externalAccountId}
            />
          </div>
        ) : (
          <ConnectGithubButton
            label="Connect GitHub"
            className="gap-1.5 px-[18px] py-[9px] text-sm"
          />
        )}
      </div>

      {connection ? (
        repos === null ? (
          /* Token rejected or revoked on GitHub's side — re-consent fixes it. */
          <Surface
            elevation="none"
            className="flex flex-col items-center gap-4 border-dashed p-10 text-center"
          >
            <BrightBadge tone="attention">GitHub unreachable</BrightBadge>
            <p className="max-w-[420px] text-[15px] leading-[1.6] text-ink-500">
              dalog could not read your repos. The grant may have been revoked
              on GitHub. Re-connect to hand it a fresh token.
            </p>
            <ConnectGithubButton
              label="Re-connect GitHub"
              variant="secondary"
            />
          </Surface>
        ) : repos.length === 0 ? (
          <Surface
            elevation="none"
            className="flex flex-col items-center gap-3 border-dashed p-10 text-center"
          >
            <p className="text-[15px] text-ink-500">
              That GitHub account has no repos dalog can see. Grant access to
              more repos or organizations, then re-connect.
            </p>
            <ConnectGithubButton
              label="Re-connect GitHub"
              variant="secondary"
            />
          </Surface>
        ) : (
          <RepoList repos={repos} />
        )
      ) : (
        <Surface
          elevation="none"
          className="flex flex-col items-center gap-4 border-dashed p-10 text-center"
        >
          <BrightBadge tone="neutral">GitHub OAuth</BrightBadge>
          <div className="flex max-w-[420px] flex-col gap-2">
            <h2 className="text-[19px] font-extrabold tracking-[-0.02em]">
              Watching a repo takes one click
            </h2>
            <p className="text-[15px] leading-[1.6] text-ink-500">
              Authorize dalog on GitHub and every repo you grant shows up here.
              Watch one and its commits, pull requests, merges and branches
              stream into your activity feed.
            </p>
          </div>
          <ConnectGithubButton label="Connect GitHub" />
        </Surface>
      )}
    </div>
  )
}
