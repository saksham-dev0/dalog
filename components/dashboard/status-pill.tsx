import * as React from "react"

import { BrightBadge } from "@/components/bright/badge"
import { cn } from "@/lib/utils"
import type { GenerationStatus, WebhookStatus } from "@/lib/mock-data"

const generation = {
  done: { tone: "positive", label: "Done" },
  generating: { tone: "accent", label: "Generating" },
  failed: { tone: "attention", label: "Failed" },
} as const

/** Generation state for one push — the only status that matters on the feed. */
function GenerationPill({
  status,
  className,
}: {
  status: GenerationStatus
  className?: string
}) {
  const { tone, label } = generation[status]

  return (
    <BrightBadge
      tone={tone}
      className={cn("gap-[6px] px-[10px] py-1", className)}
    >
      <span
        className={cn(
          "size-[6px] rounded-full",
          status === "done" && "bg-positive",
          status === "generating" && "animate-pulse bg-accent-500",
          status === "failed" && "bg-attention-ink"
        )}
      />
      {label}
    </BrightBadge>
  )
}

/** Webhook health for one repo. Broken webhooks fail silently, so say it loudly. */
function WebhookPill({ status }: { status: WebhookStatus }) {
  return (
    <BrightBadge
      tone={status === "active" ? "positive" : "attention"}
      className="gap-[6px] px-[10px] py-1"
    >
      <span
        className={cn(
          "size-[6px] rounded-full",
          status === "active" ? "bg-positive" : "bg-attention-ink"
        )}
      />
      {status === "active" ? "Webhook active" : "Webhook broken"}
    </BrightBadge>
  )
}

export { GenerationPill, WebhookPill }
