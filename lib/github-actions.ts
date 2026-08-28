"use server"

import { revalidatePath } from "next/cache"
import { auth, clerkClient } from "@clerk/nextjs/server"

import { api } from "@/convex/_generated/api"
import { convexServerQuery } from "@/lib/convex-server"

/** Server Functions are reachable by direct POST — every one re-checks auth. */
async function requireUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  return userId
}

/** Unlinks the GitHub account; the watch list is dropped along with it. */
export async function disconnectGithub(externalAccountId: string) {
  const userId = await requireUserId()

  // Stop the watch workflows first — without the OAuth token they can only fail.
  await convexServerQuery(
    (client) => client.mutation(api.repos.unwatchAll, {}),
    0
  )

  const client = await clerkClient()
  await client.users.deleteUserExternalAccount({ userId, externalAccountId })

  revalidatePath("/dashboard/repos")
  revalidatePath("/dashboard/settings")
}
