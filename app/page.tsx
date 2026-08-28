import Link from "next/link"
import {
  CircleSlash,
  FileText,
  Layers,
  ListChecks,
  Mail,
  MessagesSquare,
  ScanText,
  Share2,
  Ticket,
} from "lucide-react"

import { FaqList } from "@/components/landing/faq"
import { MediaTabs } from "@/components/landing/media-tabs"
import { LandingNav } from "@/components/landing/nav"
import {
  ActionButton,
  Body,
  Caption,
  CheckItem,
  MediaPlaceholder,
  RuleQuote,
  Scribble,
  SectionEyebrow,
  SectionTitle,
  SubHeading,
  Wrap,
} from "@/components/landing/primitives"

export const metadata = {
  title: "Bright — AI Note Taker",
  description:
    "Bright records, summarises, and files every meeting, then keeps your tools updated.",
}

const trustedLogos = [
  "ByteDance",
  "TRADE REPUBLIC",
  "GitHub",
  "Canva",
  "duolingo",
  "MERCURY",
  "beam",
]

const noBotList = [
  "Pause recording to speak off the record",
  "Stops automatically if microphone is unused",
  "Split recordings if you're staying in the same room",
  "Separates speakers and remembers their names",
]

const callProviders = [
  "Zoom",
  "Meet",
  "Teams",
  "Slack",
  "Webex",
  "Whereby",
  "BlueJeans",
]

const greetings = [
  "안녕하세요",
  "Hallo",
  "Hello",
  "こんにちは",
  "Hei",
  "Bonjour",
  "Hola",
]

const sevenDays = [
  {
    title: "Start recording",
    items: [
      "Record your first meeting in seconds",
      "Get AI summaries and ask questions",
      "Connect with your calendar, email, and task apps",
    ],
  },
  {
    title: "Get organized",
    items: [
      "Connect Hubspot, Notion, Slack etc.",
      "Auto-create action items and have AI plan them",
      "Search your knowledge base from meetings",
    ],
  },
  {
    title: "Automate your workflows",
    items: [
      "Automate 90% of meeting follow-up tasks",
      "Generate meeting preparation 10x faster",
      "Win back hours per week, per team member",
    ],
  },
]

const integrations = [
  { name: "Hubspot", desc: "Add to leads/meetings", soon: false },
  { name: "Notion", desc: "Add to databases", soon: false },
  { name: "Slack", desc: "Send to any channel or person", soon: false },
  { name: "Linear", desc: "Create tickets from transcripts", soon: false },
  { name: "Pipedrive", desc: "Add to leads/customers", soon: false },
  { name: "Attio", desc: "Add to leads/customers", soon: true },
  { name: "Personio", desc: "Add to applicants", soon: true },
  { name: "Ashby", desc: "Add to applicants", soon: true },
  { name: "Greenhouse", desc: "Add to applicants", soon: true },
]

const pageGrouping = [
  {
    title: "By recurring event",
    body: "See how your project is progressing over time.",
  },
  {
    title: "By domain",
    body: "Make sure your customers get the care they deserve.",
  },
  {
    title: "Manually",
    body: "Keep track of topics, projects, or anything else.",
  },
]

const socialProof = [
  {
    name: "Oz",
    role: "Founder",
    text: "It doesn't have to suck to be productive, Bright reminds you of that",
  },
  {
    name: "Raf",
    role: "Designer",
    text: "nothing but joy. opening a calendar shouldn't be stressful. can't imagine to go back",
  },
  {
    name: "Noah",
    role: "Founder",
    text: "I can finally do time blocking and to-do lists from one interface.",
  },
]

const howItWorks = [
  {
    title: "Download Bright",
    body: "Available to download for macOS, Windows, and iOS",
  },
  {
    title: "Start recording",
    body: "Join your next meeting and start recording",
  },
  {
    title: "Save hours",
    body: "Turn meeting summaries into automated workflows",
  },
]

const faqs = [
  {
    q: "Can I use Bright at my company?",
    a: "Yes. Bright is used by teams from two people to a few thousand, with SSO, SCIM, and per-workspace retention on the Business plan.",
  },
  {
    q: "I've already used my trial. Can I get another one?",
    a: "Write to care@bright.so and we'll extend it. We would rather you make up your mind properly than churn in week two.",
  },
  {
    q: "Where do I connect more accounts?",
    a: "Settings → Integrations. Calendars, mail, CRM, and task trackers all connect from the same screen.",
  },
  {
    q: "How does Bright protect my privacy?",
    a: "Recordings stay in your workspace region, encrypted at rest, with a retention window you set. Nothing is used to train models.",
  },
  {
    q: "When can I use Bright on my device?",
    a: "macOS and iOS today, Windows in open beta. The web app works anywhere a browser does.",
  },
  {
    q: "Where can I send a feature request or report a bug?",
    a: "Use the in-app chat, or email care@bright.so. Feature requests go straight onto the public roadmap.",
  },
  {
    q: "Which video call providers do you support?",
    a: "All of them. Bright records from your device, so anything running in a tab or a desktop client works.",
  },
]

const footerColumns = [
  [
    "Blog",
    "Our Story",
    "Calendar",
    "Changelog",
    "Tools",
    "Templates",
    "Alternatives",
    "Best Apps",
    "MCP Server",
    "Recording API",
    "Routines",
    "AI Response Generator",
  ],
  ["Contact us", "Download", "Affiliates", "Reviews", "Art"],
  ["LinkedIn", "Instagram", "x.com"],
]

function Stars() {
  return <div className="flex gap-[2px] text-[13px] text-attention">★★★★★</div>
}

export default function LandingPage() {
  return (
    <div className="min-h-svh bg-page text-ink-900">
      <LandingNav />

      <main>
        {/* ---------- Hero ---------- */}
        <section className="pt-16 pb-10">
          <Wrap className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 rounded-full bg-[#FDE8E9] px-3 py-[6px] text-[13px] font-semibold text-mark-pink">
                <span className="flex size-[15px] items-center justify-center rounded-full bg-mark-pink text-[9px] font-black text-white">
                  P
                </span>
                #1 Product of the Day
              </span>
              <span className="flex items-center gap-2 px-2 text-[13px] text-ink-500">
                <span className="text-ink-300">❨</span>
                App Store Featured
                <span className="text-ink-300">❩</span>
              </span>
            </div>

            <h1 className="max-w-[760px] text-[56px] leading-[1.03] font-extrabold tracking-[-0.04em]">
              Run your workday on autopilot with AI agents
            </h1>

            <p className="max-w-[520px] text-[17px] leading-[1.5] text-ink-500">
              Our MCP gives Claude or ChatGPT access to your meeting notes,
              calendar, emails and todos.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <ActionButton href="/sign-up">Get started</ActionButton>
              <ActionButton href="/sign-in" tone="outline">
                <span className="text-base">☕</span> Request a demo
              </ActionButton>
            </div>

            <p className="pt-4 text-[13px] text-ink-500">
              ✦ Aug 20: better booking links, slack integration, many
              experiments
            </p>
          </Wrap>

          <Wrap className="pt-2">
            <MediaPlaceholder
              label="app · meeting notes workspace"
              className="h-[560px] shadow-panel"
            />
          </Wrap>
        </section>

        {/* ---------- Trusted by ---------- */}
        <section className="py-16">
          <Wrap className="flex flex-col gap-5">
            <span className="text-[13px] text-ink-300">
              Trusted by teams at
            </span>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 opacity-60 grayscale">
              {trustedLogos.map((logo) => (
                <span
                  key={logo}
                  className="text-[17px] font-bold tracking-[-0.02em] text-ink-500"
                >
                  {logo}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-ink-300">↳</span>
              <Scribble>* These companies have 10+ Bright users</Scribble>
            </div>
          </Wrap>
        </section>

        {/* ---------- 47 seconds ---------- */}
        <section className="py-16">
          <Wrap className="flex flex-col items-start gap-8">
            <h2 className="max-w-[760px] text-[42px] leading-[1.12] font-extrabold tracking-[-0.035em]">
              <span className="bg-sunken px-2 text-ink-500">
                Within 47 seconds:
              </span>{" "}
              Share summary. Keep CRM updated. Plan action items. Schedule next
              meeting.
            </h2>
            <ActionButton href="/sign-up">Get started</ActionButton>
          </Wrap>
        </section>

        {/* ---------- Meeting Notes ---------- */}
        <section id="meeting-notes" className="py-16">
          <Wrap className="flex flex-col gap-5">
            <SectionEyebrow tone="green">Meeting Notes</SectionEyebrow>
            <SectionTitle>Summarize any meeting, without a bot</SectionTitle>
            <p className="text-[15px] text-ink-500">
              <span className="font-semibold text-ink-900">Replaces:</span>{" "}
              Fireflies, Otter, Fathom
            </p>

            <div className="flex flex-col gap-3 pt-6">
              <SubHeading>Why Bright?</SubHeading>
              <Body>
                There are 27 meeting notes apps out there. If summaries is all
                you need, any of them will do. Many of them will even be
                cheaper.
              </Body>
              <Body>
                If you want to use them to become better at your job,
                you&apos;ll need Bright. An app that knows your conversations,
                should be able to take over your busy work.
              </Body>
            </div>

            <div className="grid gap-8 border-t border-line pt-8 sm:grid-cols-2 sm:divide-x sm:divide-line">
              {[
                {
                  name: "Quentin di Silvestro",
                  role: "GTM Lead • beam.ai",
                  text: "We use Bright daily, and without it, we'd be at least 50% less productive. It helps me to follow-up faster, which directly translates into more revenue closed.",
                },
                {
                  name: "Arnaud Mun",
                  role: "Co-founder • dev-id",
                  text: "Because of Bright we understand our customer's projects better: It summarizes all our meetings and we ask AI questions to speed up our workflow. There is not tool better than Bright to save time. And that is priceless",
                },
              ].map((review, i) => (
                <div
                  key={review.name}
                  className={
                    i === 1
                      ? "flex flex-col gap-3 sm:pl-8"
                      : "flex flex-col gap-3"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <Stars />
                    <span className="size-5 rounded-[6px] bg-[linear-gradient(135deg,#E01E5A,#36C5F0,#2EB67D,#ECB22E)]" />
                  </div>
                  <p className="text-[13px]">
                    <span className="font-bold text-ink-900">
                      {review.name},
                    </span>{" "}
                    <span className="text-ink-500">{review.role}</span>
                  </p>
                  <p className="text-[14px] leading-[1.6] text-ink-500">
                    {review.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 pt-8">
              <SubHeading>Summaries &amp; Action Items</SubHeading>
              <Body>
                When meetings go undocumented, progress rarely happens. Topics
                resurface week after week. But every conversation should move
                your team forward. AI summaries often miss the mark because they
                don&apos;t understand your business. Ours do, and turn every
                meeting into clear next steps.
              </Body>
              <Body>
                The common problem with AI summaries is that they don&apos;t
                know the context of your meeting and company. We ensure great
                summaries in two ways.
              </Body>
            </div>
          </Wrap>

          <Wrap className="pt-8">
            <MediaTabs
              skin="steel"
              tabs={[
                {
                  label: "No bots in calls",
                  icon: <CircleSlash className="size-4" />,
                  media: "recording · no bot in the call",
                },
                {
                  label: "Summary",
                  icon: <ScanText className="size-4" />,
                  media: "summary · week kickoff",
                },
                {
                  label: "Action items",
                  icon: <ListChecks className="size-4" />,
                  media: "action items · assigned",
                },
              ]}
            />
          </Wrap>

          <Wrap className="flex flex-col gap-3 pt-12">
            <div className="flex flex-wrap items-baseline justify-center gap-6 opacity-30">
              {greetings.map((word) => (
                <span
                  key={word}
                  className="text-[26px] font-semibold tracking-[-0.02em] italic"
                >
                  {word}
                </span>
              ))}
            </div>
            <Caption>
              We speak <span className="underline">17 languages</span> really
              well. And <span className="underline">82 more</span> without
              speaker labeling.
            </Caption>
          </Wrap>
        </section>

        {/* ---------- No more bot ---------- */}
        <section className="py-16">
          <Wrap className="flex flex-col gap-4">
            <SubHeading>No more bot in your calls</SubHeading>
            <Body>
              When you record with Bright, you control everything from your
              notch. Without the weird bots joining, we can offer a better
              experience:
            </Body>
            <ul className="flex flex-col gap-[10px] pt-4">
              {noBotList.map((item) => (
                <CheckItem key={item} filled>
                  {item}
                </CheckItem>
              ))}
            </ul>
          </Wrap>

          <Wrap className="flex flex-col gap-3 pt-8">
            <div className="overflow-hidden rounded-[14px] bg-[linear-gradient(160deg,#7DC7F5_0%,#C9A7E8_55%,#F0A6C8_100%)] p-10">
              <MediaPlaceholder
                label="notch overlay · live call"
                className="h-[260px] border-none bg-ink-900/85"
              />
            </div>
            <Caption>
              If you don&apos;t have a notch, you&apos;ll instead see a floating
              UI. It&apos;s a good reason to upgrade your Mac though.
            </Caption>
          </Wrap>

          <Wrap className="pt-8">
            <RuleQuote
              tone="green"
              quote="The notch-like overlay UI is super neat and out of the way, the transcription works great and is multilingual which is super powerful. The automatic todo suggestions that can just add to my tasks in one click is a killer feature."
              name="Gabriel Saillard"
              role="Software Engineer"
            />
          </Wrap>
        </section>

        {/* ---------- Works wherever ---------- */}
        <section className="py-16">
          <Wrap className="flex flex-col gap-4">
            <SubHeading>Works wherever you have meetings</SubHeading>
            <Body>
              Recording works for calls across all providers. Whether you use
              Zoom, Google Meet, Slack Huddle, or Microsoft Teams, we&apos;ll
              get the notes.
            </Body>

            <div className="mt-4 grid grid-cols-4 divide-x divide-line overflow-hidden rounded-[12px] border border-line bg-surface sm:grid-cols-7">
              {callProviders.map((provider) => (
                <div
                  key={provider}
                  className="flex h-[72px] items-center justify-center text-[13px] font-semibold text-ink-500"
                >
                  {provider}
                </div>
              ))}
            </div>
            <Caption>Bright works with any video call provider.</Caption>

            <div className="flex flex-col gap-3 pt-6">
              <Body>
                When you join meetings through Bright, we&apos;ll automatically
                record them. If you join them through eg. Google Calendar,
                we&apos;ll automatically ask you to start recording the call.
                We&apos;ll also auto-stop the recording.
              </Body>
              <Body>
                If you want Bright to work fully in the background, you can
                enable fully-automatic recordings. This will record every call
                without you having to do anything.
              </Body>
            </div>

            <div className="flex flex-col gap-3 pt-8">
              <SubHeading>Customize the summary with private notes</SubHeading>
              <Body>
                Take notes in private, before or during the meeting. We&apos;ll
                then use those raw notes as focus points for the summary. You
                can define the headings we should use. List out key numbers as
                emphasis. Or use it to prepare the agenda.
              </Body>
              <Body>
                Private notes taking in the dedicated tab are not visible to
                anyone else. This makes them great for time-based notetaking.
              </Body>
            </div>
          </Wrap>
        </section>

        {/* ---------- 7 days ---------- */}
        <section className="py-20">
          <Wrap className="flex flex-col items-center gap-10">
            <h2 className="max-w-[560px] text-center text-[34px] leading-[1.15] font-extrabold tracking-[-0.03em]">
              What you can achieve with Bright{" "}
              <span className="bg-accent-100 px-1 text-sky-600">
                in just 7 days
              </span>
            </h2>

            <div className="flex w-full max-w-[620px] items-center">
              {["Today", "Day 3", "Day 7"].map((step, i) => (
                <div
                  key={step}
                  className="flex flex-1 items-center last:flex-none"
                >
                  <span
                    className={
                      i === 0
                        ? "rounded-full bg-ink-700 px-4 py-[6px] text-[13px] font-semibold text-white"
                        : "rounded-full bg-sunken px-4 py-[6px] text-[13px] font-semibold text-ink-300"
                    }
                  >
                    {step}
                  </span>
                  {i < 2 ? <span className="h-px flex-1 bg-line" /> : null}
                </div>
              ))}
            </div>

            <div className="grid w-full divide-y divide-line overflow-hidden rounded-[12px] border border-line bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {sevenDays.map((col) => (
                <div key={col.title} className="flex flex-col gap-4 p-7">
                  <h3 className="text-center text-[17px] font-bold tracking-[-0.01em]">
                    {col.title}
                  </h3>
                  <ul className="flex flex-col gap-3">
                    {col.items.map((item) => (
                      <CheckItem key={item}>{item}</CheckItem>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <ActionButton href="/sign-up">Start free trial</ActionButton>
          </Wrap>
        </section>

        {/* ---------- AI Chat ---------- */}
        <section className="py-16">
          <Wrap className="flex flex-col gap-6">
            <SectionEyebrow tone="blue">AI Chat</SectionEyebrow>
            <SectionTitle className="text-[38px]">
              Ask Bright to do or find anything
            </SectionTitle>

            <div className="flex items-start gap-3 pt-2">
              <span className="font-serif text-[40px] leading-none text-ink-300">
                “
              </span>
              <div className="flex flex-col gap-2">
                <p className="max-w-[420px] rounded-[10px] bg-sunken px-4 py-3 text-[15px] leading-[1.55] text-ink-900">
                  It&apos;s like ChatGPT, but it has full context about my
                  company and job. It&apos;s integrated with Gcal and Gmail. So
                  no more copy+pasting.
                </p>
                <span className="text-[13px] text-ink-300">
                  Dennis Müller • Founder, Bright
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Scribble>This is a real review we got</Scribble>
              <span className="text-eyebrow-green">↘</span>
            </div>

            <div className="mx-auto w-full max-w-[520px] overflow-hidden rounded-[10px] border border-line bg-surface shadow-e1">
              <div className="flex items-center gap-2 border-b border-line px-4 py-[10px] text-[13px] font-semibold">
                <Mail className="size-[14px] text-sky-500" /> Email
              </div>
              <div className="grid grid-cols-[64px_1fr] gap-y-[2px] border-b border-line px-4 py-[10px] text-[13px]">
                <span className="text-ink-500">From</span>
                <span className="text-ink-900">Nish Budhraja</span>
              </div>
              <div className="grid grid-cols-[64px_1fr] border-b border-line px-4 py-[10px] text-[13px]">
                <span className="text-ink-500">Subject</span>
                <span className="text-ink-900">
                  Feedback - Loving the new Bright!
                </span>
              </div>
              <div className="flex flex-col gap-3 px-4 py-4 text-[13px] leading-[1.6] text-ink-700">
                <p>
                  You absolutely cooked - loving the new Bright. Was an instant
                  upgrade to Business for me. I had churned last year but you
                  won me back.
                </p>
                <p>
                  With tasks / calendar / meeting recordings, you replaced
                  Superlist, Notion Calendar, and Granola for me.
                </p>
                <p className="font-bold text-ink-900">
                  All-in-one solution has enabled some pretty magical workflows
                  for me:
                </p>
                <p>
                  1. Record meeting → follow up tasks logged → add tasks to my
                  lists → add to calendar
                </p>
                <p>
                  2. Have a meeting → have AI assistant write follow up email →
                  AI assistant has all of the context needed → writes amazing
                  email → send directly from Bright
                </p>
              </div>
            </div>
            <Caption>Nish really was too kind with his review.</Caption>
          </Wrap>
        </section>

        {/* ---------- Chat Actions ---------- */}
        <section className="border-t border-line py-16">
          <Wrap className="flex flex-col gap-4">
            <SubHeading className="text-[19px]">Chat Actions</SubHeading>
            <Body>
              Saving you time is our priority. And chat actions is the way we
              achieve that. You can ask Bright to draft emails, create or update
              meetings, rewrite summaries, create mind maps from summaries, and
              more.
            </Body>
            <p className="text-[15px]">
              <span className="bg-accent-100 px-1 font-medium text-ink-900">
                One of my favorite use cases:
              </span>{" "}
              <span className="text-ink-700">
                &quot;I&apos;m sick, move everything to Thursday.&quot; And
                Bright will do it for you.
              </span>
            </p>
          </Wrap>

          <Wrap className="pt-8">
            <MediaTabs
              skin="violet"
              tabs={[
                {
                  label: "Send follow-up emails",
                  icon: <Mail className="size-4" />,
                  media: "chat · drafting follow-up email",
                },
                {
                  label: "Combine actions",
                  icon: <Layers className="size-4" />,
                  media: "chat · chained actions",
                },
                {
                  label: "Create Linear tickets",
                  icon: <Ticket className="size-4" />,
                  media: "chat · linear tickets",
                },
              ]}
            />
          </Wrap>
        </section>

        {/* ---------- Integrations ---------- */}
        <section className="py-16">
          <Wrap className="flex flex-col gap-5">
            <SectionEyebrow tone="blue">Integrations</SectionEyebrow>
            <SectionTitle>Keep your tools updated, with one click</SectionTitle>
            <Body>
              Too many tools require you to use them all the time to be useful.
              Bright works just as well in the background. The integrations with
              Google and Apple Calendar make sure every meeting gets recorded.
            </Body>
            <Body>
              The Gmail integration lets us re-create your writing style. To
              AI-draft your emails just like you wrote it.
            </Body>
            <Body>
              We know that you likely have a system of record already.
              We&apos;ve built integrations with Slack, Notion, Hubspot and
              Pipedrive. So that you can get the summaries there with a few
              clicks.
            </Body>
          </Wrap>

          <Wrap className="pt-8">
            <div className="rounded-[14px] border border-line bg-surface p-10">
              <div className="grid grid-cols-3 items-center gap-6">
                <div className="flex flex-col items-center gap-3">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-ink-300 [writing-mode:vertical-rl]">
                    SOURCES
                  </span>
                </div>
                <MediaPlaceholder
                  label="via BRIGHT"
                  className="h-[180px] border-none bg-[linear-gradient(150deg,#7C3AED,#EC4899,#3B82F6)]"
                />
                <div className="flex flex-col items-center gap-3">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-ink-300 [writing-mode:vertical-rl]">
                    DESTINATIONS
                  </span>
                </div>
              </div>
            </div>
            <Caption className="pt-4">
              Export meeting notes to Pipedrive, Notion, Slack, Hubspot, Linear.
              Request integrations at care@bright.so
            </Caption>
          </Wrap>

          <Wrap className="grid gap-x-10 gap-y-6 pt-10 sm:grid-cols-3">
            {integrations.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <span
                  className={
                    item.soon
                      ? "size-[34px] shrink-0 rounded-[9px] border border-line bg-sunken"
                      : "size-[34px] shrink-0 rounded-[9px] bg-[linear-gradient(140deg,#2E6BF0,#8B5CF6)]"
                  }
                />
                <div className="flex flex-col">
                  <span
                    className={
                      item.soon
                        ? "text-[14px] font-bold text-ink-300"
                        : "text-[14px] font-bold text-ink-900"
                    }
                  >
                    {item.name}
                    {item.soon ? (
                      <span className="ml-2 text-[13px] font-normal text-ink-300">
                        Soon
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[13px] text-ink-300">{item.desc}</span>
                </div>
              </div>
            ))}
          </Wrap>
        </section>

        {/* ---------- Shareable Pages ---------- */}
        <section className="py-16">
          <Wrap className="flex flex-col gap-5">
            <SectionEyebrow tone="purple">Shareable Pages</SectionEyebrow>
            <SectionTitle>Shared with colleagues and customers</SectionTitle>
            <Body>
              Recording all your meetings is a great start. And most tools stop
              there. The context that many notes create over time is a goldmine.
            </Body>
            <Body>
              When you ask the AI chat questions, we pull in all the context
              from the pages. Wherever you are, you can always ask questions
              about any meeting.
            </Body>

            <div className="pt-4">
              <RuleQuote
                tone="purple"
                quote="Wow, auto-generated pages are the kind of thing that you don't even know you need until you see it. It's like an AI-native CRM."
                name="Victor Fteha"
                role="Founder, Fundmore"
              />
            </div>
          </Wrap>

          <Wrap className="pt-8">
            <MediaTabs
              skin="slate"
              tabs={[
                {
                  label: "Share with anyone",
                  icon: <Share2 className="size-4" />,
                  media: "pages · shared workspace",
                },
                {
                  label: "Share like a document",
                  icon: <FileText className="size-4" />,
                  media: "pages · document view",
                },
                {
                  label: "Ask in context",
                  icon: <MessagesSquare className="size-4" />,
                  media: "pages · ask in context",
                },
              ]}
            />
          </Wrap>

          <Wrap className="grid gap-8 pt-10 sm:grid-cols-3">
            {pageGrouping.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <SubHeading className="text-[15px]">{col.title}</SubHeading>
                <p className="text-[14px] leading-[1.6] text-ink-500">
                  {col.body}
                </p>
                <MediaPlaceholder
                  label={col.title.toLowerCase()}
                  className="h-[70px] bg-surface"
                />
              </div>
            ))}
          </Wrap>
        </section>

        {/* ---------- Calendar & Todos ---------- */}
        <section className="py-16">
          <Wrap className="flex flex-col gap-5">
            <SectionEyebrow tone="orange">Calendar &amp; Todos</SectionEyebrow>
            <SectionTitle>Organize your day on autopilot</SectionTitle>
            <p className="text-[15px] text-ink-500">
              <span className="font-semibold text-ink-900">Replaces:</span>{" "}
              Gcal, Things 3, Motion
            </p>
            <Body className="pt-2">
              Combine action items from your calls with todos from eg Notion or
              Todoist in one place. From there, we use AI to schedule your day.
              Whenever your plans change, we shuffle around your schedule to
              keep you on track.
            </Body>

            <div className="grid gap-8 pt-6 sm:grid-cols-2">
              <div className="flex flex-col gap-3">
                <SubHeading className="text-[15px]">AI Scheduling</SubHeading>
                <p className="text-[14px] leading-[1.6] text-ink-500">
                  We&apos;ll put together your schedule on automatically.
                  You&apos;ll keep app deadlines, and will work on the highest
                  priority items first.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <SubHeading className="text-[15px]">AI Calendar</SubHeading>
                <p className="text-[14px] leading-[1.6] text-ink-500">
                  Ask the chat to create or update your events. Ask it how much
                  time you&apos;ve spent on demo calls last week. Or have it
                  prepare today&apos;s agendas.
                </p>
              </div>
            </div>
          </Wrap>

          <Wrap className="pt-8">
            <MediaPlaceholder
              label="calendar · todos scheduled by AI"
              className="h-[300px] bg-surface shadow-e1"
            />
          </Wrap>
        </section>

        {/* ---------- Social proof ---------- */}
        <section className="py-16">
          <Wrap className="grid gap-10 sm:grid-cols-3">
            {socialProof.map((item) => (
              <div key={item.name} className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <Stars />
                  <span className="flex size-5 items-center justify-center rounded-[5px] bg-ink-900 text-[11px] font-bold text-canvas">
                    𝕏
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-[18px] rounded-full bg-sunken" />
                  <span className="text-[13px]">
                    <span className="font-bold text-ink-900">{item.name},</span>{" "}
                    <span className="text-ink-500">{item.role}</span>
                  </span>
                </div>
                <p className="text-[14px] leading-[1.6] text-ink-500">
                  {item.text}
                </p>
              </div>
            ))}
          </Wrap>
        </section>

        {/* ---------- How it works ---------- */}
        <section id="how-it-works" className="py-16">
          <Wrap>
            <div className="relative overflow-hidden rounded-[16px] border border-line bg-surface px-8 py-16">
              <div className="pointer-events-none absolute -top-24 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-page" />
              <div className="relative flex flex-col items-center gap-3">
                <span className="font-mono text-[11px] tracking-[0.12em] text-sky-500 uppercase">
                  How it works
                </span>
                <h2 className="text-center text-[34px] leading-[1.1] font-extrabold tracking-[-0.03em]">
                  Ready to get started?
                </h2>
                <p className="text-center text-[28px] leading-[1.15] font-extrabold tracking-[-0.03em] text-ink-300">
                  Start recording in seconds.
                </p>
              </div>

              <div className="relative grid gap-8 pt-14 sm:grid-cols-3">
                {howItWorks.map((step, i) => (
                  <div
                    key={step.title}
                    className="flex flex-col items-center gap-3 text-center"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-sky-500 text-[13px] font-bold text-white">
                      {i + 1}
                    </span>
                    <h3 className="text-[17px] font-bold tracking-[-0.01em]">
                      {step.title}
                    </h3>
                    <p className="max-w-[220px] text-[14px] leading-[1.55] text-ink-500">
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="relative flex justify-center pt-12">
                <ActionButton href="/sign-up">Get started</ActionButton>
              </div>
            </div>
          </Wrap>
        </section>

        {/* ---------- FAQs ---------- */}
        <section className="py-16">
          <Wrap className="flex flex-col gap-4">
            <h2 className="text-center text-[34px] leading-[1.1] font-extrabold tracking-[-0.03em]">
              FAQs
            </h2>
            <p className="pb-4 text-center text-[14px] text-ink-500">
              If you can&apos;t find the answer to your question below, email us
              at{" "}
              <span className="font-semibold text-ink-900">care@bright.so</span>
            </p>
            <FaqList items={faqs} />
          </Wrap>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-line">
        <Wrap className="grid gap-10 py-12 sm:grid-cols-3">
          {footerColumns.map((column, i) => (
            <div key={i} className="flex flex-col gap-[10px]">
              {column.map((label) => (
                <Link
                  key={label}
                  href="#meeting-notes"
                  className="text-[14px] text-ink-900 no-underline hover:text-ink-500 hover:no-underline"
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </Wrap>
        <Wrap className="flex flex-wrap items-center justify-between gap-4 pb-12">
          <span className="text-[13px] text-ink-300 line-through">
            Designed by the beach
          </span>
          <div className="flex flex-wrap items-center gap-6 text-[13px] text-ink-300">
            <Link
              href="#"
              className="text-ink-300 no-underline hover:no-underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-ink-300 no-underline hover:no-underline"
            >
              Terms of use
            </Link>
            <Link
              href="#"
              className="text-ink-300 no-underline hover:no-underline"
            >
              Imprint
            </Link>
            <span>© Bright 2026</span>
          </div>
        </Wrap>
      </footer>
    </div>
  )
}
