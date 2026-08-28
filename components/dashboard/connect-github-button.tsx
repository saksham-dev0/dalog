"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Loader2, Unlink } from "lucide-react"
import { toast } from "sonner"

import { BrightButton } from "@/components/bright/button"
import { GithubMark } from "@/components/dashboard/github-mark"
import { disconnectGithub } from "@/lib/github-actions"

/**
 * Scopes dalog needs beyond the connection's defaults: private repo contents
 * to draft from, and hooks to hear about pushes.
 */
const SCOPES = ["repo", "admin:repo_hook"] as const

/**
 * One click to link GitHub. Clerk creates the external account, hands back the
 * provider's authorize URL, and sends the user back here once they approve.
 */
function ConnectGithubButton({
  label = "Connect GitHub",
  variant = "primary",
  size = "sm",
  className,
}: {
  label?: string
  variant?: React.ComponentProps<typeof BrightButton>["variant"]
  size?: React.ComponentProps<typeof BrightButton>["size"]
  className?: string
}) {
  const { user, isLoaded } = useUser()
  const [pending, setPending] = React.useState(false)

  const connect = async () => {
    if (!user) return
    setPending(true)

    try {
      const externalAccount = await user.createExternalAccount({
        strategy: "oauth_github",
        additionalScopes: [...SCOPES],
        redirectUrl: "/dashboard/repos",
      })

      const url = externalAccount.verification?.externalVerificationRedirectURL
      if (!url) throw new Error("GitHub did not return an authorization URL")

      window.location.href = url.href
    } catch (error) {
      setPending(false)
      toast.error("Could not start the GitHub connection", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      })
    }
  }

  return (
    <BrightButton
      variant={variant}
      size={size}
      className={className}
      disabled={!isLoaded || pending}
      onClick={connect}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <GithubMark className="size-4" />
      )}
      {pending ? "Opening GitHub…" : label}
    </BrightButton>
  )
}

/** Unlinks the account. Watched repos go with it, so it asks first. */
function DisconnectGithubButton({
  externalAccountId,
}: {
  externalAccountId: string
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  const disconnect = async () => {
    if (
      !window.confirm("Disconnect GitHub? dalog will stop watching your repos.")
    )
      return

    setPending(true)
    try {
      await disconnectGithub(externalAccountId)
      toast.success("GitHub disconnected")
      router.refresh()
    } catch {
      toast.error("Could not disconnect GitHub")
    } finally {
      setPending(false)
    }
  }

  return (
    <BrightButton
      variant="ghost"
      size="sm"
      className="gap-1.5"
      disabled={pending}
      onClick={disconnect}
    >
      {pending ? (
        <Loader2 className="size-[14px] animate-spin" />
      ) : (
        <Unlink className="size-[14px]" />
      )}
      Disconnect
    </BrightButton>
  )
}

export { ConnectGithubButton, DisconnectGithubButton }
