import { BrightBadge, SpecLabel } from "@/components/bright/badge"
import { BrightButton } from "@/components/bright/button"
import { Surface } from "@/components/bright/card"
import { BrightDataTable } from "@/components/bright/data-table"
import { meetingRows } from "@/components/bright/tokens"
import { StatCard, type Stat } from "@/components/dashboard/stat-card"

const stats: Stat[] = [
  {
    label: "Recordings",
    value: "128",
    delta: "+12",
    trend: "up",
    meta: "this month, across 9 people",
  },
  {
    label: "Hours saved",
    value: "36.5",
    delta: "+4.1",
    trend: "up",
    meta: "vs. writing notes by hand",
  },
  {
    label: "Action items",
    value: "214",
    delta: "8 open",
    trend: "flat",
    meta: "pushed to your task tracker",
  },
  {
    label: "Sync failures",
    value: "2",
    delta: "needs review",
    trend: "down",
    meta: "CRM write-back retried twice",
  },
]

const upcoming = [
  { time: "09:30", title: "Northwind renewal", guests: 4, autoJoin: true },
  { time: "11:00", title: "Design review", guests: 6, autoJoin: true },
  { time: "14:15", title: "Candidate screen · Priya", guests: 2, autoJoin: false },
  { time: "16:00", title: "Weekly standup", guests: 9, autoJoin: true },
]

const activity = [
  {
    tone: "positive" as const,
    mark: "✓",
    text: "Summary pushed to Deals · Northwind renewal.",
    when: "6m ago",
  },
  {
    tone: "accent" as const,
    mark: "i",
    text: "Design review is transcribing — 68% complete.",
    when: "22m ago",
  },
  {
    tone: "attention" as const,
    mark: "!",
    text: "Calendar access expires in 3 days. Reconnect to keep auto-join.",
    when: "2h ago",
  },
  {
    tone: "positive" as const,
    mark: "✓",
    text: "Sam Ito joined the workspace.",
    when: "Yesterday",
  },
]

const toneClasses = {
  positive: "bg-positive-tint text-positive-ink",
  accent: "bg-accent-100 text-accent-600",
  attention: "bg-attention-tint text-attention-ink",
}

const markClasses = {
  positive: "text-positive",
  accent: "text-accent-500",
  attention: "text-attention-ink",
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-7">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SpecLabel>Overview</SpecLabel>
          <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.025em]">
            Good morning, Jane
          </h1>
          <p className="text-[15px] leading-[1.6] text-ink-500">
            Four meetings on the calendar today. Three will record themselves.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BrightButton
            variant="secondary"
            size="sm"
            className="px-[18px] py-[9px] text-sm"
          >
            Export
          </BrightButton>
          <BrightButton size="sm" className="px-[18px] py-[9px] text-sm">
            Invite teammates
          </BrightButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Recordings + side rail */}
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-[14px]">
          <div className="flex items-center justify-between gap-4">
            <SpecLabel>Recent recordings</SpecLabel>
            <button className="cursor-pointer bg-transparent text-[13px] font-bold text-accent-500">
              View all
            </button>
          </div>
          <div className="min-w-0 overflow-x-auto">
            <div className="min-w-[640px]">
              <BrightDataTable rows={meetingRows} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Today */}
          <Surface className="flex flex-col gap-4 p-[22px]">
            <div className="flex items-center justify-between gap-3">
              <SpecLabel>Today</SpecLabel>
              <BrightBadge tone="neutral">4 events</BrightBadge>
            </div>
            <div className="flex flex-col gap-3">
              {upcoming.map((event) => (
                <div key={event.title} className="flex items-start gap-3">
                  <span className="w-[42px] shrink-0 font-mono text-[11px] text-ink-500">
                    {event.time}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm font-semibold text-ink-900">
                      {event.title}
                    </span>
                    <span className="text-xs text-ink-300">
                      {event.guests} guests
                    </span>
                  </div>
                  {event.autoJoin ? (
                    <BrightBadge className="shrink-0">Auto-join</BrightBadge>
                  ) : (
                    <BrightBadge tone="neutral" className="shrink-0">
                      Manual
                    </BrightBadge>
                  )}
                </div>
              ))}
            </div>
          </Surface>

          {/* Processing */}
          <Surface className="flex flex-col gap-4 p-[22px]">
            <SpecLabel>Processing</SpecLabel>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-[13px] font-bold">Transcribing</span>
                <span className="font-mono text-xs text-ink-500">68%</span>
              </div>
              <div className="h-[7px] overflow-hidden rounded-full bg-sunken">
                <div className="h-full w-[68%] rounded-full bg-accent-500" />
              </div>
              <span className="text-xs text-ink-300">
                Design review · 31m · started 22m ago
              </span>
            </div>
            <div className="flex flex-col gap-2 border-t border-sunken pt-4">
              <div className="flex justify-between">
                <span className="text-[13px] font-bold">Storage used</span>
                <span className="font-mono text-xs text-ink-500">42%</span>
              </div>
              <div className="h-[7px] overflow-hidden rounded-full bg-sunken">
                <div className="h-full w-[42%] rounded-full bg-ink-900" />
              </div>
              <span className="text-xs text-ink-300">
                84 GB of 200 GB on the Team plan
              </span>
            </div>
          </Surface>

          {/* Workspace */}
          <Surface className="flex flex-col gap-4 p-[22px]">
            <SpecLabel>Workspace</SpecLabel>
            <div className="flex items-center gap-3">
              <div className="flex">
                <div className="size-8 rounded-full border-2 border-white bg-accent-100" />
                <div className="-ml-[10px] size-8 rounded-full border-2 border-white bg-positive-tint" />
                <div className="-ml-[10px] size-8 rounded-full border-2 border-white bg-attention-tint" />
                <div className="-ml-[10px] flex size-8 items-center justify-center rounded-full border-2 border-white bg-sunken text-[11px] font-bold text-ink-500">
                  +6
                </div>
              </div>
              <span className="text-[13px] text-ink-300">
                9 people in Northwind
              </span>
            </div>
            <BrightButton variant="secondary" size="sm" className="w-full">
              Manage members
            </BrightButton>
          </Surface>
        </div>
      </div>

      {/* Activity */}
      <div className="flex flex-col gap-[14px]">
        <SpecLabel>Activity</SpecLabel>
        <Surface elevation="none" className="flex flex-col gap-3 p-[26px]">
          {activity.map((item) => (
            <div
              key={item.text}
              className={`flex items-center gap-[11px] rounded-xl px-[15px] py-[13px] ${toneClasses[item.tone]}`}
            >
              <span className={`text-sm font-bold ${markClasses[item.tone]}`}>
                {item.mark}
              </span>
              <span className="flex-1 text-sm leading-[1.5]">{item.text}</span>
              <span className="font-mono text-[11px] opacity-70">
                {item.when}
              </span>
            </div>
          ))}
        </Surface>
      </div>
    </div>
  )
}
