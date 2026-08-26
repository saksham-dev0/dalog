import { RotateCw } from "lucide-react"

import { GithubMark } from "@/components/dashboard/github-mark"

import { BrightBadge, SpecLabel } from "@/components/bright/badge"
import { BrightButton } from "@/components/bright/button"
import { Surface } from "@/components/bright/card"
import { repos } from "@/lib/mock-data"

export const metadata = {
  title: "Settings · dalog",
  description: "Account and GitHub connection.",
}

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-7">
      <div className="flex flex-col gap-2">
        <SpecLabel>Settings</SpecLabel>
        <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.025em]">
          Account
        </h1>
        <p className="text-[15px] leading-[1.6] text-ink-500">
          Two things for v1: who you are, and whether GitHub still trusts us.
        </p>
      </div>

      {/* Account — read-only, sourced from Clerk. */}
      <Surface className="flex flex-col gap-5 p-[26px]">
        <SpecLabel>Profile</SpecLabel>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-100 text-[15px] font-bold text-accent-600">
            SS
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[15px] font-bold text-ink-900">
              Saksham Sharma
            </span>
            <span className="truncate text-[13px] text-ink-300">
              sharmaproduction69@gmail.com
            </span>
          </div>
          <BrightButton variant="secondary" size="sm">
            Manage account
          </BrightButton>
        </div>
        <p className="border-t border-sunken pt-4 text-[13px] text-ink-300">
          Name, email, and avatar come from Clerk. Change them there and they
          update here.
        </p>
      </Surface>

      {/* GitHub connection */}
      <Surface className="flex flex-col gap-5 p-[26px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SpecLabel>GitHub</SpecLabel>
          <BrightBadge tone="positive" className="gap-[6px] px-[10px] py-1">
            <span className="size-[6px] rounded-full bg-positive" />
            Connected
          </BrightBadge>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-sunken text-ink-900">
            <GithubMark className="size-[18px]" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[15px] font-bold text-ink-900">
              @saksham-dev0
            </span>
            <span className="text-[13px] text-ink-300">
              {repos.length} repos watched · scopes: repo, admin:repo_hook
            </span>
          </div>
          <BrightButton variant="secondary" size="sm" className="gap-1.5">
            <RotateCw className="size-[14px]" />
            Re-authenticate
          </BrightButton>
        </div>

        <p className="border-t border-sunken pt-4 text-[13px] text-ink-300">
          Re-authenticate if webhooks stop firing or you need to grant access to
          a new organization.
        </p>
      </Surface>
    </div>
  )
}
