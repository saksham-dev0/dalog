import "server-only"

import { auth } from "@clerk/nextjs/server"
import { ConvexHttpClient } from "convex/browser"

/**
 * Convex client for server code (Server Actions, server components), carrying
 * the caller's Clerk identity so Convex's own auth checks apply.
 */
export async function convexServerClient(): Promise<ConvexHttpClient> {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
  const token = await (await auth()).getToken({ template: "convex" })
  if (token) client.setAuth(token)

  return client
}

/**
 * Same client, but never throws: a missing "convex" JWT template or a signed-out
 * caller yields `fallback` instead of blowing up the page that reads it.
 */
export async function convexServerQuery<T>(
  run: (client: ConvexHttpClient) => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await run(await convexServerClient())
  } catch {
    return fallback
  }
}
