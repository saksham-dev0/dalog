export type ColorToken = { token: string; hex: string; use: string }
export type ColorGroup = { name: string; items: ColorToken[] }

export const colorGroups: ColorGroup[] = [
  {
    name: "Canvas & surface",
    items: [
      { token: "canvas", hex: "#F5F5F6", use: "page background" },
      { token: "surface", hex: "#FFFFFF", use: "cards, frames" },
      { token: "surface/sunken", hex: "#F0F0F2", use: "inputs, tab track" },
      { token: "line", hex: "#E4E4E7", use: "1px borders" },
    ],
  },
  {
    name: "Ink",
    items: [
      { token: "ink/900", hex: "#101013", use: "headlines" },
      { token: "ink/700", hex: "#3A3A40", use: "quotes, lists" },
      { token: "ink/500", hex: "#6C6C75", use: "body copy" },
      { token: "ink/300", hex: "#A8A8B0", use: "captions, meta" },
    ],
  },
  {
    name: "Accent",
    items: [
      { token: "accent/600", hex: "#1F55D0", use: "hover, active" },
      { token: "accent/500", hex: "#2E6BF0", use: "primary action" },
      { token: "accent/100", hex: "#E5EDFE", use: "tints, badges" },
    ],
  },
  {
    name: "Status",
    items: [
      { token: "positive", hex: "#17924D", use: "checkmarks" },
      { token: "attention", hex: "#E8A317", use: "rating stars" },
      { token: "critical", hex: "#D3453E", use: "errors only" },
    ],
  },
]

export type TypeSpec = {
  name: string
  spec: string
  sample: string
  className: string
}

export const typeScale: TypeSpec[] = [
  {
    name: "Display",
    spec: "52 / 1.02 / -0.035em / 800",
    sample: "Run your workday on autopilot",
    className: "text-[52px] leading-[1.02] font-extrabold tracking-[-0.035em]",
  },
  {
    name: "H1",
    spec: "40 / 1.05 / -0.03em / 800",
    sample: "Summarize any meeting",
    className: "text-[40px] leading-[1.05] font-extrabold tracking-[-0.03em]",
  },
  {
    name: "H2",
    spec: "26 / 1.15 / -0.025em / 800",
    sample: "Keep your tools updated",
    className: "text-[26px] leading-[1.15] font-extrabold tracking-[-0.025em]",
  },
  {
    name: "H3",
    spec: "20 / 1.25 / -0.02em / 800",
    sample: "Shared with colleagues",
    className: "text-[20px] leading-[1.25] font-extrabold tracking-[-0.02em]",
  },
  {
    name: "Body large",
    spec: "18 / 1.55 / 400",
    sample: "Used for the sentence directly under a headline.",
    className: "text-[18px] leading-[1.55] text-ink-500",
  },
  {
    name: "Body",
    spec: "15 / 1.6 / 400",
    sample: "The default paragraph size inside cards and lists.",
    className: "text-[15px] leading-[1.6] text-ink-500",
  },
  {
    name: "Caption",
    spec: "13 / 1.5 / 400",
    sample: "Attribution, footnotes, form hints.",
    className: "text-[13px] leading-[1.5] text-ink-300",
  },
  {
    name: "Eyebrow",
    spec: "Mono 11 / 0.1em / uppercase",
    sample: "MEETINGS",
    className:
      "font-mono text-[11px] tracking-[0.1em] uppercase text-accent-500",
  },
]

export const spacingScale = [
  { name: "space-1", px: 4 },
  { name: "space-2", px: 8 },
  { name: "space-3", px: 12 },
  { name: "space-4", px: 16 },
  { name: "space-6", px: 24 },
  { name: "space-8", px: 32 },
  { name: "space-12", px: 56 },
]

export const logos = [
  "logo 01",
  "logo 02",
  "logo 03",
  "logo 04",
  "logo 05",
  "logo 06",
]

export const tabData = [
  {
    label: "Fast, recurring",
    title: "Fast, recurring meetings",
    body: "Recaps land in the channel before the call ends. Owners and due dates are pulled from what was actually said.",
  },
  {
    label: "Categorised",
    title: "Categorised by outcome",
    body: "Every note is filed against a deal, a project, or a person, so nothing needs to be re-tagged by hand.",
  },
  {
    label: "Across your systems",
    title: "Across your systems",
    body: "The same summary writes back to your CRM, your task tracker, and your docs in one pass.",
  },
]

export const faqData = [
  {
    q: "Which meeting tools are supported?",
    a: "Anything running in a browser tab or a desktop client. No bot joins the call, so there is nothing for participants to accept.",
  },
  {
    q: "Where is recording data stored?",
    a: "In your workspace region, encrypted at rest, with a retention window you set per workspace.",
  },
  {
    q: "Can I edit a summary after the fact?",
    a: "Yes. Summaries are editable documents; edits sync back to any system the summary was pushed to.",
  },
  {
    q: "How does billing work?",
    a: "Per seat, monthly or annual, with unlimited recordings on every plan.",
  },
]

export type MeetingRow = {
  name: string
  owner: string
  status: "Synced" | "Processing" | "Needs review"
  length: string
}

export const meetingRows: MeetingRow[] = [
  { name: "Northwind renewal", owner: "Jane Mercer", status: "Synced", length: "42m" },
  { name: "Design review", owner: "Ola Berg", status: "Processing", length: "31m" },
  { name: "Weekly standup", owner: "Sam Ito", status: "Synced", length: "18m" },
  { name: "Candidate screen", owner: "Priya Raman", status: "Needs review", length: "27m" },
]
