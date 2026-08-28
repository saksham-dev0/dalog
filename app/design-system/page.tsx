import { BrightAccordion } from "@/components/bright/accordion"
import { BrightBadge, Eyebrow, SpecLabel } from "@/components/bright/badge"
import { BrightButton } from "@/components/bright/button"
import { Surface } from "@/components/bright/card"
import { BrightDataTable } from "@/components/bright/data-table"
import { DialogDemo } from "@/components/bright/dialog-demo"
import { BrightNavBar } from "@/components/bright/nav-bar"
import { Section, SectionHeader } from "@/components/bright/section"
import { SegmentedTabs } from "@/components/bright/segmented-tabs"
import {
  colorGroups,
  faqData,
  logos,
  meetingRows,
  spacingScale,
  tabData,
  typeScale,
} from "@/components/bright/tokens"
import { WorkspaceForm } from "@/components/bright/workspace-form"

const radii = [
  { label: "sm 6", className: "rounded-[6px]" },
  { label: "md 10", className: "rounded-[10px]" },
  { label: "lg 18", className: "rounded-[18px]" },
  { label: "pill", className: "rounded-full" },
]

const elevations = [
  { label: "e1", className: "shadow-e1" },
  { label: "e2", className: "shadow-e2" },
  { label: "e3", className: "shadow-e3" },
]

export default function Page() {
  return (
    <div className="flex flex-col items-center gap-[72px] bg-canvas px-8 pt-14 pb-24 text-ink-900">
      <header className="flex w-full max-w-[1080px] flex-col gap-5">
        <div className="flex items-center gap-[10px]">
          <div className="size-[26px] rounded-lg bg-accent-500" />
          <span className="text-[17px] font-extrabold tracking-[-0.02em]">
            Bright
          </span>
          <span className="rounded-full border border-line bg-surface px-2 py-1 font-mono text-[11px] tracking-[0.08em] text-ink-500 uppercase">
            v1.0
          </span>
        </div>
        <h1 className="max-w-[780px] text-[52px] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance">
          A marketing design system for product pages
        </h1>
        <p className="max-w-[620px] text-[18px] leading-[1.55] text-pretty text-ink-500">
          Tokens and components extracted from the reference layout: a light
          neutral canvas, white elevated surfaces, dense bold headlines, and a
          single blue action color.
        </p>
      </header>

      {/* 01 — Color */}
      <Section>
        <SectionHeader index="01" title="Color" meta="14 tokens, 4 groups" />
        {colorGroups.map((group) => (
          <div key={group.name} className="mb-5 flex flex-col gap-3">
            <SpecLabel>{group.name}</SpecLabel>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
              {group.items.map((color) => (
                <Surface
                  key={color.token}
                  className="overflow-hidden rounded-[14px]"
                >
                  <div
                    className="h-[76px] border-b border-line"
                    style={{ background: color.hex }}
                  />
                  <div className="flex flex-col gap-[3px] px-[14px] py-3">
                    <span className="text-[13px] font-bold">{color.token}</span>
                    <span className="font-mono text-xs text-ink-500">
                      {color.hex}
                    </span>
                    <span className="text-xs text-ink-300">{color.use}</span>
                  </div>
                </Surface>
              ))}
            </div>
          </div>
        ))}
      </Section>

      {/* 02 — Typography */}
      <Section>
        <SectionHeader
          index="02"
          title="Typography"
          meta="Plus Jakarta Sans · IBM Plex Mono"
        />
        <Surface className="px-6 py-2">
          {typeScale.map((type) => (
            <div
              key={type.name}
              className="grid items-baseline gap-6 border-b border-sunken py-5 last:border-b-0 sm:grid-cols-[150px_1fr]"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-bold">{type.name}</span>
                <span className="font-mono text-[11px] text-ink-300">
                  {type.spec}
                </span>
              </div>
              <div className={type.className}>{type.sample}</div>
            </div>
          ))}
        </Surface>
      </Section>

      {/* 03 — Radius, elevation, spacing */}
      <Section>
        <SectionHeader index="03" title="Radius, elevation, spacing" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
          <Surface
            elevation="none"
            className="flex flex-col gap-[18px] p-[22px]"
          >
            <SpecLabel>Radius</SpecLabel>
            <div className="flex flex-wrap items-end gap-[14px]">
              {radii.map((r) => (
                <div
                  key={r.label}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`size-[58px] border border-line bg-canvas ${r.className}`}
                  />
                  <span className="font-mono text-[11px] text-ink-500">
                    {r.label}
                  </span>
                </div>
              ))}
            </div>
          </Surface>

          <Surface
            elevation="none"
            className="flex flex-col gap-[18px] p-[22px]"
          >
            <SpecLabel>Elevation</SpecLabel>
            <div className="flex flex-wrap gap-4">
              {elevations.map((e) => (
                <div
                  key={e.label}
                  className={`flex h-[62px] min-w-[76px] flex-1 items-center justify-center rounded-xl border border-line bg-surface font-mono text-[11px] text-ink-500 ${e.className}`}
                >
                  {e.label}
                </div>
              ))}
            </div>
            <span className="text-[13px] text-ink-300">
              e3 is reserved for the large product image frames.
            </span>
          </Surface>

          <Surface
            elevation="none"
            className="flex flex-col gap-[18px] p-[22px]"
          >
            <SpecLabel>Spacing · 4px base</SpecLabel>
            <div className="flex flex-col gap-[10px]">
              {spacingScale.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="w-[54px] font-mono text-[11px] text-ink-500">
                    {s.name}
                  </span>
                  <div
                    className="h-[10px] rounded-[3px] bg-accent-500"
                    style={{ width: s.px }}
                  />
                  <span className="font-mono text-[11px] text-ink-300">
                    {s.px}px
                  </span>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </Section>

      {/* 04 — Components */}
      <Section id="components" className="gap-7">
        <SectionHeader index="04" title="Components" />

        <div className="flex flex-col gap-[14px]">
          <SpecLabel>Buttons</SpecLabel>
          <Surface
            elevation="none"
            className="flex flex-col gap-[22px] p-[26px]"
          >
            <div className="flex flex-wrap items-center gap-3">
              <BrightButton>Get started</BrightButton>
              <BrightButton variant="secondary">Book a demo</BrightButton>
              <BrightButton variant="tint">Watch video</BrightButton>
              <BrightButton variant="ghost">Learn more</BrightButton>
              <BrightButton disabled>Disabled</BrightButton>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-sunken pt-5">
              <BrightButton size="sm">Small</BrightButton>
              <BrightButton size="md">Medium</BrightButton>
              <BrightButton size="lg">Large</BrightButton>
            </div>
          </Surface>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
          <div className="flex flex-col gap-[14px]">
            <SpecLabel>Eyebrows &amp; badges</SpecLabel>
            <Surface
              elevation="none"
              className="flex flex-wrap items-center gap-[10px] p-[26px]"
            >
              <Eyebrow>Meetings</Eyebrow>
              <BrightBadge>New</BrightBadge>
              <BrightBadge tone="positive">Live</BrightBadge>
              <BrightBadge tone="attention">Beta</BrightBadge>
              <BrightBadge tone="neutral">Changelog</BrightBadge>
              <BrightBadge tone="inverse">Pro</BrightBadge>
            </Surface>
          </div>

          <div className="flex flex-col gap-[14px]">
            <SpecLabel>Email capture</SpecLabel>
            <Surface elevation="none" className="flex flex-col gap-3 p-[26px]">
              <div className="flex gap-[10px]">
                <input
                  placeholder="you@company.com"
                  className="flex-1 rounded-full border border-line bg-canvas px-[18px] py-[11px] text-[15px] text-ink-900 outline-none placeholder:text-ink-300 focus:border-accent-500 focus:bg-surface"
                />
                <BrightButton>Start free</BrightButton>
              </div>
              <span className="text-[13px] text-ink-300">
                No card required. Cancel anytime.
              </span>
            </Surface>
          </div>
        </div>

        <div className="flex flex-col gap-[14px]">
          <SpecLabel>Segmented tabs</SpecLabel>
          <Surface elevation="none" className="p-[26px]">
            <SegmentedTabs tabs={tabData} />
          </Surface>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
          <Surface className="flex flex-col gap-[14px] p-[26px]">
            <div className="size-[34px] rounded-[10px] bg-accent-100" />
            <h3 className="text-[20px] font-extrabold tracking-[-0.02em]">
              Feature card
            </h3>
            <p className="text-[15px] leading-[1.6] text-ink-500">
              One idea per card, three per row. Body copy stays under three
              lines so the row heights match.
            </p>
            <a href="#components" className="text-sm font-bold text-accent-500">
              See how it works
            </a>
          </Surface>

          <Surface className="flex flex-col gap-[14px] p-[26px]">
            <div className="flex gap-[3px] text-[15px] text-attention">
              ★★★★★
            </div>
            <p className="text-[15px] leading-[1.6] text-ink-700">
              “Quote cards carry the star row on top, the quote in ink/700, and
              the attribution pinned to the bottom of the card.”
            </p>
            <div className="mt-auto flex items-center gap-[10px]">
              <div className="size-[34px] rounded-full border border-line bg-sunken" />
              <div className="flex flex-col">
                <span className="text-[13px] font-bold">Name Surname</span>
                <span className="text-xs text-ink-300">Role, Company</span>
              </div>
            </div>
          </Surface>

          <Surface className="flex flex-col gap-[14px] p-[26px]">
            <BrightBadge className="self-start">Outcome</BrightBadge>
            <h3 className="text-[20px] font-extrabold tracking-[-0.02em]">
              Checklist card
            </h3>
            <div className="flex flex-col gap-[9px]">
              {[
                "Every meeting summarised",
                "Action items assigned",
                "CRM updated automatically",
              ].map((item) => (
                <div key={item} className="flex items-start gap-[10px]">
                  <span className="text-sm leading-[1.5] font-bold text-positive">
                    ✓
                  </span>
                  <span className="text-[15px] leading-[1.5] text-ink-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </Surface>
        </div>

        <div className="flex flex-col gap-[14px]">
          <SpecLabel>Media frame &amp; logo strip</SpecLabel>
          <Surface
            elevation="none"
            className="flex flex-col gap-[22px] p-[26px]"
          >
            <div className="flex h-[260px] items-center justify-center overflow-hidden rounded-[14px] border border-line bg-[repeating-linear-gradient(135deg,var(--color-sunken)_0_10px,var(--color-line)_10px_20px)] shadow-e3">
              <span className="rounded-full border border-line bg-surface px-[14px] py-1.5 font-mono text-xs text-ink-500">
                product image · 16:9
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              {logos.map((logo) => (
                <div
                  key={logo}
                  className="flex h-9 min-w-[96px] flex-1 items-center justify-center rounded-[10px] border border-dashed border-line-strong font-mono text-[11px] text-ink-300"
                >
                  {logo}
                </div>
              ))}
            </div>
          </Surface>
        </div>

        <div className="flex flex-col gap-[14px]">
          <SpecLabel>Accordion</SpecLabel>
          <Surface elevation="none" className="px-[26px] py-2">
            <BrightAccordion items={faqData} />
          </Surface>
        </div>

        <div className="flex flex-col gap-[14px]">
          <SpecLabel>Navigation bar</SpecLabel>
          <BrightNavBar />
        </div>

        <div className="flex flex-col gap-[14px]">
          <SpecLabel>Form</SpecLabel>
          <WorkspaceForm />
        </div>

        <div className="flex flex-col gap-[14px]">
          <SpecLabel>Dialog</SpecLabel>
          <div className="flex flex-col items-center gap-[18px] rounded-[18px] border border-line bg-sunken px-[26px] py-10">
            <DialogDemo />
            <Surface
              elevation="e3"
              className="flex w-full max-w-[440px] flex-col gap-[14px] p-[26px]"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-[20px] font-extrabold tracking-[-0.02em]">
                  Delete this recording?
                </h3>
                <span className="text-lg text-ink-300">×</span>
              </div>
              <p className="text-[15px] leading-[1.6] text-ink-500">
                The transcript, summary, and any action items pushed to your CRM
                will be removed. This cannot be undone.
              </p>
              <div className="flex justify-end gap-[10px] pt-1.5">
                <BrightButton
                  variant="secondary"
                  size="sm"
                  className="px-[18px] py-[9px] text-sm"
                >
                  Keep it
                </BrightButton>
                <BrightButton
                  variant="critical"
                  size="sm"
                  className="px-[18px] py-[9px] text-sm"
                >
                  Delete
                </BrightButton>
              </div>
            </Surface>
            <span className="text-[13px] text-ink-500">
              Static specimen above; the button opens the live overlay.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
          <div className="flex flex-col gap-[14px]">
            <SpecLabel>Inline alerts &amp; toast</SpecLabel>
            <Surface elevation="none" className="flex flex-col gap-3 p-[26px]">
              <div className="flex gap-[11px] rounded-xl bg-accent-100 px-[15px] py-[13px]">
                <span className="text-sm font-bold text-accent-500">i</span>
                <span className="text-sm leading-[1.5] text-accent-600">
                  Recording starts automatically for events with three or more
                  guests.
                </span>
              </div>
              <div className="flex gap-[11px] rounded-xl bg-positive-tint px-[15px] py-[13px]">
                <span className="text-sm font-bold text-positive">✓</span>
                <span className="text-sm leading-[1.5] text-positive-ink">
                  Summary pushed to Deals · Northwind renewal.
                </span>
              </div>
              <div className="flex gap-[11px] rounded-xl bg-attention-tint px-[15px] py-[13px]">
                <span className="text-sm font-bold text-attention-ink">!</span>
                <span className="text-sm leading-[1.5] text-attention-ink">
                  Calendar access expires in 3 days. Reconnect to keep
                  auto-join.
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 rounded-xl bg-ink-900 px-[15px] py-[13px]">
                <span className="flex-1 text-sm font-semibold text-white">
                  Workspace created
                </span>
                <span className="cursor-pointer text-[13px] font-bold text-accent-light">
                  Undo
                </span>
              </div>
            </Surface>
          </div>

          <div className="flex flex-col gap-[14px]">
            <SpecLabel>Avatars, progress, skeleton</SpecLabel>
            <Surface elevation="none" className="flex flex-col gap-5 p-[26px]">
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
                  9 people in this workspace
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-[13px] font-bold">Transcribing</span>
                  <span className="font-mono text-xs text-ink-500">68%</span>
                </div>
                <div className="h-[7px] overflow-hidden rounded-full bg-sunken">
                  <div className="h-full w-[68%] rounded-full bg-accent-500" />
                </div>
              </div>
              <div className="flex flex-col gap-[9px]">
                <div className="h-3 w-[70%] rounded-full bg-sunken" />
                <div className="h-3 w-full rounded-full bg-sunken" />
                <div className="h-3 w-[45%] rounded-full bg-sunken" />
                <span className="text-xs text-ink-300">
                  Skeleton — loading state for text blocks
                </span>
              </div>
            </Surface>
          </div>
        </div>

        <div className="flex flex-col gap-[14px]">
          <SpecLabel>Data table</SpecLabel>
          <BrightDataTable rows={meetingRows} />
        </div>

        <div className="flex flex-col gap-[14px]">
          <SpecLabel>Closing banner</SpecLabel>
          <Surface
            elevation="e2"
            className="flex flex-col items-center gap-[18px] px-8 py-14 text-center"
          >
            <h2 className="max-w-[620px] text-[40px] leading-[1.05] font-extrabold tracking-[-0.03em]">
              Ready to get started?
            </h2>
            <p className="max-w-[520px] text-[18px] text-ink-300">
              Start recording in seconds.
            </p>
            <BrightButton size="lg" className="px-8">
              Start free
            </BrightButton>
          </Surface>
        </div>
      </Section>

      <footer className="flex w-full max-w-[1080px] flex-wrap justify-between gap-8 border-t border-line pt-7">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-[9px]">
            <div className="size-5 rounded-md bg-accent-500" />
            <span className="text-sm font-extrabold">Bright</span>
          </div>
          <span className="text-[13px] text-ink-300">Design system, 2026</span>
        </div>
        <div className="flex flex-wrap gap-14">
          {[
            { title: "Product", links: ["Components", "Tokens", "Changelog"] },
            {
              title: "Resources",
              links: ["Guidelines", "Accessibility", "Support"],
            },
          ].map((col) => (
            <div key={col.title} className="flex flex-col gap-[9px]">
              <span className="font-mono text-[11px] tracking-[0.1em] text-ink-300 uppercase">
                {col.title}
              </span>
              {col.links.map((link) => (
                <a
                  key={link}
                  href="#components"
                  className="text-sm text-ink-700 hover:text-accent-500"
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
      </footer>
    </div>
  )
}
