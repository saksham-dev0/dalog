import { GitBranch, Lock, Plus, RotateCw, Unlink } from "lucide-react"

import { GithubMark } from "@/components/dashboard/github-mark"

import { BrightBadge, SpecLabel } from "@/components/bright/badge"
import { BrightButton } from "@/components/bright/button"
import { Surface } from "@/components/bright/card"
import { WebhookPill } from "@/components/dashboard/status-pill"
import { repos } from "@/lib/mock-data"

export const metadata = {
  title: "Repos · dalog",
  description: "Connect repos and keep their webhooks alive.",
}

export default function ReposPage() {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SpecLabel>Repos</SpecLabel>
          <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.025em]">
            Connected repos
          </h1>
          <p className="text-[15px] leading-[1.6] text-ink-500">
            Connection health only. Counts live on the activity feed.
          </p>
        </div>
        {/* Opens the GitHub repo picker, scoped by the OAuth grant. */}
        <BrightButton size="sm" className="gap-1.5 px-[18px] py-[9px] text-sm">
          <Plus className="size-4" />
          Connect a repo
        </BrightButton>
      </div>

      <div className="flex flex-col gap-4">
        {repos.map((repo) => (
          <Surface
            key={repo.id}
            className="flex flex-wrap items-center gap-5 p-[22px]"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-sunken text-ink-900">
              <GithubMark className="size-[18px]" />
            </span>

            <div className="flex min-w-[220px] flex-1 flex-col gap-[6px]">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-ink-900">
                  {repo.name}
                </span>
                {repo.private ? (
                  <span className="flex items-center gap-1 text-ink-300">
                    <Lock className="size-3" />
                    <span className="text-xs">Private</span>
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[13px] text-ink-300">
                <span className="flex items-center gap-1.5">
                  <GitBranch className="size-[14px]" />
                  <span className="font-mono text-[12px]">{repo.branch}</span>
                </span>
                <span>·</span>
                <span>Connected {repo.connectedAt}</span>
              </div>
            </div>

            <WebhookPill status={repo.webhook} />

            <div className="flex items-center gap-2">
              {repo.webhook === "broken" ? (
                <BrightButton size="sm" className="gap-1.5">
                  <RotateCw className="size-[14px]" />
                  Reconnect webhook
                </BrightButton>
              ) : (
                <BrightButton variant="secondary" size="sm" className="gap-1.5">
                  <RotateCw className="size-[14px]" />
                  Re-send test ping
                </BrightButton>
              )}
              <BrightButton variant="ghost" size="sm" className="gap-1.5">
                <Unlink className="size-[14px]" />
                Disconnect
              </BrightButton>
            </div>
          </Surface>
        ))}
      </div>

      {/* Empty-state preview of the picker, so the flow reads end to end. */}
      <Surface
        elevation="none"
        className="flex flex-col items-center gap-4 border-dashed p-10 text-center"
      >
        <BrightBadge tone="neutral">GitHub OAuth</BrightBadge>
        <div className="flex max-w-[420px] flex-col gap-2">
          <h2 className="text-[19px] font-extrabold tracking-[-0.02em]">
            Watching a new repo takes one click
          </h2>
          <p className="text-[15px] leading-[1.6] text-ink-500">
            Pick a repo you already granted access to. dalog installs the push
            webhook and starts drafting on the next commit.
          </p>
        </div>
        <BrightButton variant="secondary" size="sm" className="gap-1.5">
          <GithubMark className="size-4" />
          Browse your repos
        </BrightButton>
      </Surface>
    </div>
  )
}
