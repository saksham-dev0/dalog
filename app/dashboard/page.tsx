import { SpecLabel } from "@/components/bright/badge"
import { ActivityFeed } from "@/components/dashboard/activity-feed"

export const metadata = {
  title: "Activity · dalog",
  description: "Commits, pull requests, merges and branches, as they land.",
}

export default function ActivityPage() {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SpecLabel>Activity</SpecLabel>
          <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.025em]">
            Everything you shipped
          </h1>
          <p className="text-[15px] leading-[1.6] text-ink-500">
            Live from every repo you watch — no refresh needed.
          </p>
        </div>
      </div>

      <ActivityFeed />
    </div>
  )
}
