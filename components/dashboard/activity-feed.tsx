"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GitBranch,
  GitCommitHorizontal,
  GitMerge,
  GitPullRequest,
  Layers,
  Loader2,
  Search,
  X,
} from "lucide-react"
import { useMutation, usePaginatedQuery, useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { toast } from "sonner"

import { BrightBadge } from "@/components/bright/badge"
import { BrightButton } from "@/components/bright/button"
import { Surface } from "@/components/bright/card"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { repoShortName, repoStyles } from "@/lib/repo-color"

/**
 * The projection `listWatched` returns, not the stored document — derived from
 * the query so it cannot drift from the server.
 */
type WatchedRepo = FunctionReturnType<typeof api.repos.listWatched>[number]

type EventKind = Doc<"repoEvents">["kind"]
type GroupBy = "day" | "repo"

const kindMeta = {
  commit: {
    icon: GitCommitHorizontal,
    label: "Commit",
    plural: "Commits",
    tone: "neutral",
    chip: "bg-sunken text-ink-700",
  },
  pull_request: {
    icon: GitPullRequest,
    label: "Pull request",
    plural: "Pull requests",
    tone: "accent",
    chip: "bg-accent-100 text-accent-500",
  },
  merge: {
    icon: GitMerge,
    label: "Merge",
    plural: "Merges",
    tone: "positive",
    chip: "bg-positive-tint text-positive",
  },
  branch: {
    icon: GitBranch,
    label: "Branch",
    plural: "Branches",
    tone: "attention",
    chip: "bg-attention-tint text-attention-ink",
  },
} as const

const KIND_ORDER: EventKind[] = ["commit", "pull_request", "merge", "branch"]

/** One numbered page of the feed — also the size of every Convex fetch. */
const PAGE_SIZE = 15

/**
 * The page numbers to render, with gaps collapsed to an ellipsis once the
 * loaded activity runs past a handful of pages: 1 … 4 5 6 … 12.
 */
function pageWindow(current: number, count: number): (number | "gap")[] {
  if (count <= 7) {
    return Array.from({ length: count }, (_, i) => i + 1)
  }

  const pages = new Set([1, count, current, current - 1, current + 1])
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= count)
    .sort((a, b) => a - b)

  const out: (number | "gap")[] = []
  let previous = 0
  for (const page of sorted) {
    if (previous && page - previous > 1) out.push("gap")
    out.push(page)
    previous = page
  }

  return out
}

function formatWhen(timestamp: number) {
  const seconds = Math.round((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  })
}

/** "Today" / "Yesterday" / "Mon, Mar 3" — the sticky day header. */
function formatDay(timestamp: number) {
  const day = new Date(timestamp)
  day.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysAgo = Math.round((today.getTime() - day.getTime()) / 86_400_000)
  if (daysAgo === 0) return "Today"
  if (daysAgo === 1) return "Yesterday"

  return day.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: day.getFullYear() === today.getFullYear() ? undefined : "numeric",
  })
}

function dayKey(timestamp: number) {
  const day = new Date(timestamp)
  day.setHours(0, 0, 0, 0)

  return String(day.getTime())
}

/** Colour dot + repo name. The one element that says "which repo is this". */
function RepoChip({
  fullName,
  size = "md",
}: {
  fullName: string
  size?: "sm" | "md"
}) {
  const styles = repoStyles(fullName)

  return (
    <span
      style={styles.chip}
      title={fullName}
      className={cn(
        "inline-flex max-w-[220px] items-center gap-[6px] rounded-full border font-semibold",
        size === "md"
          ? "px-[9px] py-[3px] text-[12px]"
          : "px-2 py-[2px] text-[11px]"
      )}
    >
      <span
        style={styles.dot}
        className="size-[6px] shrink-0 rounded-full"
        aria-hidden
      />
      <span className="truncate font-mono tracking-[-0.01em]">
        {repoShortName(fullName)}
      </span>
    </span>
  )
}

function EventRow({
  event,
  last,
  showRepo,
  onOpen,
  opening,
}: {
  event: Doc<"repoEvents">
  last: boolean
  showRepo: boolean
  onOpen: (event: Doc<"repoEvents">) => void
  opening: boolean
}) {
  const meta = kindMeta[event.kind]
  const Icon = meta.icon
  const styles = repoStyles(event.fullName)

  return (
    <div
      className={cn(
        "group relative flex items-stretch",
        last ? "" : "border-b border-sunken"
      )}
    >
      {/* Repo rail: the fastest read of "which repo" when scanning a column. */}
      <span
        style={styles.rail}
        aria-hidden
        className="w-[3px] shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
      />

      <button
        type="button"
        onClick={() => onOpen(event)}
        disabled={opening}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 bg-transparent px-[19px] py-[15px] text-left hover:bg-hover disabled:cursor-wait"
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
            meta.chip
          )}
        >
          {opening ? (
            <Loader2 className="size-[16px] animate-spin" />
          ) : (
            <Icon className="size-[16px]" />
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
          <div className="flex flex-wrap items-center gap-2">
            {showRepo ? <RepoChip fullName={event.fullName} /> : null}
            <BrightBadge tone={meta.tone} className="px-[9px] py-[3px]">
              {meta.label}
            </BrightBadge>
            {event.branch ? (
              <span className="truncate font-mono text-[11px] text-ink-300">
                {event.branch}
              </span>
            ) : null}
          </div>

          <span className="truncate text-[15px] font-semibold text-ink-900">
            {event.title}
          </span>

          <div className="flex flex-wrap items-center gap-[6px] text-[13px] text-ink-300">
            <span className="text-ink-500">{event.actor}</span>
            <span>·</span>
            <span>{event.action}</span>
            {event.number ? <span>· #{event.number}</span> : null}
            {event.sha ? (
              <span className="font-mono text-[12px]">
                · {event.sha.slice(0, 7)}
              </span>
            ) : null}
          </div>
        </div>

        <span
          title={new Date(event.occurredAt).toLocaleString()}
          className="w-[74px] shrink-0 text-right text-[13px] text-ink-300"
        >
          {formatWhen(event.occurredAt)}
        </span>
      </button>

      <a
        href={event.url}
        target="_blank"
        rel="noreferrer"
        aria-label="Open on GitHub"
        title="Open on GitHub"
        className="flex shrink-0 items-center pr-[19px] pl-2 text-ink-300 hover:text-accent-500"
      >
        <ExternalLink className="size-[14px]" />
      </a>
    </div>
  )
}

/** A pill in the kind / repo / grouping rows. */
function FilterPill({
  active,
  onClick,
  children,
  className,
  ...props
}: React.ComponentProps<"button"> & { active: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex cursor-pointer items-center gap-[6px] rounded-full border px-[11px] py-[6px] text-[13px] font-semibold transition-colors",
        active
          ? "border-ink-900 bg-ink-900 text-canvas"
          : "border-line bg-surface text-ink-500 hover:border-line-strong hover:text-ink-900",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * The kind row rides inside a sunken track, so its selected pill lifts on a
 * white surface rather than inverting. Returned as className, which twMerge
 * resolves last — the pill's own active styles are the ones being replaced.
 */
function segmentedPill(active: boolean) {
  return active
    ? "border-transparent bg-surface text-ink-900 shadow-e1"
    : "border-transparent bg-transparent"
}

function FilterBar({
  repos,
  repo,
  setRepo,
  kind,
  setKind,
  groupBy,
  setGroupBy,
  search,
  setSearch,
}: {
  repos: WatchedRepo[]
  repo: Id<"watchedRepos"> | undefined
  setRepo: (repo: Id<"watchedRepos"> | undefined) => void
  kind: EventKind | undefined
  setKind: (kind: EventKind | undefined) => void
  groupBy: GroupBy
  setGroupBy: (groupBy: GroupBy) => void
  search: string
  setSearch: (search: string) => void
}) {
  const multiRepo = repos.length > 1
  const dirty = Boolean(repo || kind || search)

  return (
    <Surface elevation="none" className="flex flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-[34px] min-w-[210px] flex-1 items-center gap-2 rounded-full border border-line bg-canvas px-[13px] focus-within:border-accent-500">
          <Search className="size-[14px] shrink-0 text-ink-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, author, branch or sha…"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-900 outline-none placeholder:text-ink-300"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="cursor-pointer text-ink-300 hover:text-ink-900"
            >
              <X className="size-[14px]" />
            </button>
          ) : null}
        </label>

        <div className="flex flex-wrap items-center gap-1 rounded-full bg-sunken p-1">
          <FilterPill
            active={kind === undefined}
            onClick={() => setKind(undefined)}
            className={segmentedPill(kind === undefined)}
          >
            All
          </FilterPill>
          {KIND_ORDER.map((value) => {
            const meta = kindMeta[value]
            const Icon = meta.icon

            return (
              <FilterPill
                key={value}
                active={kind === value}
                onClick={() => setKind(kind === value ? undefined : value)}
                className={segmentedPill(kind === value)}
              >
                <Icon className="size-[14px]" />
                {meta.plural}
              </FilterPill>
            )
          })}
        </div>

        {multiRepo ? (
          <FilterPill
            active={groupBy === "repo"}
            onClick={() => setGroupBy(groupBy === "repo" ? "day" : "repo")}
            title="Group the feed by repo instead of by day"
          >
            <Layers className="size-[14px]" />
            Group by repo
          </FilterPill>
        ) : null}

        {dirty ? (
          <BrightButton
            variant="ghost"
            size="sm"
            onClick={() => {
              setRepo(undefined)
              setKind(undefined)
              setSearch("")
            }}
          >
            Clear
          </BrightButton>
        ) : null}
      </div>

      {multiRepo ? (
        <div className="flex flex-wrap items-center gap-[6px] border-t border-sunken pt-3">
          <FilterPill
            active={repo === undefined}
            onClick={() => setRepo(undefined)}
          >
            All repos
            <span className="text-[11px] opacity-70">{repos.length}</span>
          </FilterPill>
          {repos.map((watched) => {
            const styles = repoStyles(watched.fullName)
            const active = repo === watched._id

            return (
              <FilterPill
                key={watched._id}
                active={active}
                onClick={() => setRepo(active ? undefined : watched._id)}
                title={watched.fullName}
                style={active ? undefined : styles.chip}
                className={cn("max-w-[240px]", active ? "" : "border")}
              >
                <span
                  style={active ? { background: "currentColor" } : styles.dot}
                  className="size-[7px] shrink-0 rounded-full"
                  aria-hidden
                />
                <span className="truncate font-mono text-[12px]">
                  {watched.fullName}
                </span>
                <span className="text-[11px] opacity-70">
                  {watched.eventCount}
                </span>
              </FilterPill>
            )
          })}
        </div>
      ) : null}
    </Surface>
  )
}

/**
 * Live feed of everything the watchers have recorded. The Convex query is
 * reactive, so webhook deliveries and workflow polls appear as they land.
 *
 * Repo and kind are filtered in the query (each combination is index-backed);
 * the text search runs over the pages already loaded, which is what the
 * "matches in what is loaded" hint tells the reader.
 */
/** Numbered pages over the activity that is already loaded. */
function Pagination({
  page,
  pageCount,
  setPage,
}: {
  page: number
  pageCount: number
  setPage: (page: number) => void
}) {
  const step = (delta: number) =>
    setPage(Math.min(pageCount, Math.max(1, page + delta)))

  return (
    <nav
      aria-label="Activity pages"
      className="flex items-center justify-center gap-1"
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => step(-1)}
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-line text-ink-500 transition-colors hover:border-line-strong hover:text-ink-900 disabled:cursor-default disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-500"
      >
        <ChevronLeft className="size-[15px]" />
      </button>

      {pageWindow(page, pageCount).map((entry, i) =>
        entry === "gap" ? (
          <span
            key={`gap-${i}`}
            className="px-1 text-[13px] text-ink-300"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            aria-current={entry === page ? "page" : undefined}
            onClick={() => setPage(entry)}
            className={cn(
              "inline-flex size-8 cursor-pointer items-center justify-center rounded-full border text-[13px] font-semibold transition-colors",
              entry === page
                ? "border-ink-900 bg-ink-900 text-canvas"
                : "border-line bg-surface text-ink-500 hover:border-line-strong hover:text-ink-900"
            )}
          >
            {entry}
          </button>
        )
      )}

      <button
        type="button"
        aria-label="Next page"
        disabled={page === pageCount}
        onClick={() => step(1)}
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-line text-ink-500 transition-colors hover:border-line-strong hover:text-ink-900 disabled:cursor-default disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-500"
      >
        <ChevronRight className="size-[15px]" />
      </button>
    </nav>
  )
}

function ActivityFeed() {
  const [repo, setRepo] = React.useState<Id<"watchedRepos"> | undefined>()
  const [kind, setKind] = React.useState<EventKind | undefined>()
  const [groupBy, setGroupBy] = React.useState<GroupBy>("day")
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)

  const watched = useQuery(api.repos.listWatched) ?? []
  const { results, status, loadMore } = usePaginatedQuery(
    api.repos.listEvents,
    { repo, kind },
    { initialNumItems: PAGE_SIZE }
  )

  const openDraft = useMutation(api.content.openEventDraft)
  const router = useRouter()
  const [opening, setOpening] = React.useState<string | null>(null)

  const needle = search.trim().toLowerCase()
  const events = React.useMemo(() => {
    if (!needle) return results

    return results.filter((event) =>
      [
        event.title,
        event.actor,
        event.branch,
        event.sha,
        event.fullName,
        event.action,
        event.number ? `#${event.number}` : "",
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle))
    )
  }, [results, needle])

  /** A filter change is a new feed — page 1 of it. Adjusted during render
   *  rather than in an effect, so the reset lands before anything paints. */
  const filterKey = `${repo ?? ""}|${kind ?? ""}|${needle}`
  const [lastFilterKey, setLastFilterKey] = React.useState(filterKey)
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey)
    setPage(1)
  }

  const loadedPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE))
  const hasMore = status === "CanLoadMore" || status === "LoadingMore"
  /** One page past what is loaded, whenever Convex still has rows: clicking
   *  it is what fetches them, so the reader never sees a "load more" button. */
  const pageCount = hasMore ? loadedPages + 1 : loadedPages
  /** Clamped, so a shrinking feed can never strand the reader past the end. */
  const currentPage = Math.min(page, pageCount)

  const goToPage = (next: number) => {
    setPage(next)
    if (next >= loadedPages && status === "CanLoadMore") loadMore(PAGE_SIZE)
  }
  const pageEvents = React.useMemo(
    () => events.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [events, currentPage]
  )

  /** One section per day, or one per repo — the repo grouping is the answer
   *  to "what shipped in this repo" when several repos are being watched. */
  const groups = React.useMemo(() => {
    const map = new Map<
      string,
      {
        key: string
        label: string
        fullName?: string
        events: typeof pageEvents
      }
    >()

    for (const event of pageEvents) {
      const key = groupBy === "repo" ? event.fullName : dayKey(event.occurredAt)
      const existing = map.get(key)
      if (existing) {
        existing.events.push(event)
        continue
      }

      map.set(key, {
        key,
        label:
          groupBy === "repo" ? event.fullName : formatDay(event.occurredAt),
        fullName: groupBy === "repo" ? event.fullName : undefined,
        events: [event],
      })
    }

    return [...map.values()]
  }, [pageEvents, groupBy])

  /** Click a row → open (or reuse) its draft and let the scan run in the
   *  background. The content page picks the scan up from there. */
  const open = async (event: Doc<"repoEvents">) => {
    setOpening(event._id)
    const toastId = toast.loading(`Scanning ${event.kind.replace("_", " ")}…`, {
      description: event.title,
    })

    try {
      const draftId = await openDraft({ eventId: event._id })
      toast.success("Scan running in the background", {
        id: toastId,
        description: "Opening the draft — generate once the context lands.",
      })
      router.push(`/dashboard/content/${draftId}`)
    } catch (error) {
      toast.error("Could not open that change", {
        id: toastId,
        description:
          error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setOpening(null)
    }
  }

  const filtered = Boolean(repo || kind || needle)

  // No repo watched yet — the filters would have nothing to act on.
  if (watched.length === 0 && results.length === 0) {
    return (
      <Surface
        elevation="none"
        className="flex flex-col items-center gap-3 border-dashed p-10 text-center"
      >
        <BrightBadge tone="neutral">Nothing yet</BrightBadge>
        <p className="max-w-[420px] text-[15px] leading-[1.6] text-ink-500">
          Watch a repo on the Repos page. Its commits, pull requests, merges and
          branches show up here the moment they happen. Click any of them to
          have the AI scan it and draft posts.
        </p>
      </Surface>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <FilterBar
        repos={watched}
        repo={repo}
        setRepo={setRepo}
        kind={kind}
        setKind={setKind}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        search={search}
        setSearch={setSearch}
      />

      {status === "LoadingFirstPage" ||
      (pageEvents.length === 0 && status === "LoadingMore") ? (
        <Surface
          elevation="none"
          className="flex items-center justify-center gap-2 border-dashed p-10 text-[15px] text-ink-300"
        >
          <Loader2 className="size-[15px] animate-spin" />
          Loading activity…
        </Surface>
      ) : events.length === 0 ? (
        <Surface
          elevation="none"
          className="flex flex-col items-center gap-3 border-dashed p-10 text-center"
        >
          <BrightBadge tone="neutral">
            {filtered ? "No matches" : "Nothing yet"}
          </BrightBadge>
          <p className="max-w-[420px] text-[15px] leading-[1.6] text-ink-500">
            {filtered
              ? "Nothing here matches those filters. Widen them, or page further into the activity if you were searching."
              : "Nothing has landed from your watched repos yet. Commits, pull requests, merges and branches show up the moment they happen."}
          </p>
          {filtered ? (
            <BrightButton
              variant="secondary"
              size="sm"
              onClick={() => {
                setRepo(undefined)
                setKind(undefined)
                setSearch("")
              }}
            >
              Clear filters
            </BrightButton>
          ) : null}
        </Surface>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="flex flex-col gap-2">
            <header className="sticky top-0 z-10 -mx-1 flex items-center gap-3 bg-canvas/90 px-1 py-2 backdrop-blur-sm">
              {group.fullName ? (
                <RepoChip fullName={group.fullName} />
              ) : (
                <span className="text-[13px] font-bold text-ink-900">
                  {group.label}
                </span>
              )}
              <span className="h-px flex-1 bg-line" />
              <span className="font-mono text-[11px] tracking-[0.06em] text-ink-300 uppercase">
                {group.events.length}{" "}
                {group.events.length === 1 ? "change" : "changes"}
              </span>
            </header>

            <Surface elevation="none" className="overflow-hidden">
              {group.events.map((event, i) => (
                <EventRow
                  key={event._id}
                  event={event}
                  last={i === group.events.length - 1}
                  showRepo={groupBy !== "repo" && watched.length > 1}
                  onOpen={open}
                  opening={opening === event._id}
                />
              ))}
            </Surface>
          </section>
        ))
      )}

      {events.length > 0 && status !== "LoadingFirstPage" ? (
        <div className="flex flex-col items-center gap-3">
          {pageCount > 1 ? (
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              setPage={goToPage}
            />
          ) : null}

          <span className="text-[12px] text-ink-300">
            {needle
              ? `${events.length} ${events.length === 1 ? "match" : "matches"} in the activity loaded so far`
              : `Page ${currentPage}${hasMore ? "" : ` of ${pageCount}`}`}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export { ActivityFeed }
