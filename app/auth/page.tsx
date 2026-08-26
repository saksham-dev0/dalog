import { Eyebrow } from "@/components/bright/badge"
import { Logo } from "@/components/bright/logo"
import { AuthPanel, type AuthMode } from "@/components/site/auth-panel"

export const metadata = {
  title: "Sign in · Bright",
  description: "Sign in or create your Bright workspace.",
}

const highlights = [
  "Recaps land in the channel before the call ends",
  "Owners and due dates pulled from what was said",
  "One summary, written back to every tool",
]

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const mode = (await searchParams).mode
  const initialMode: AuthMode = mode === "signup" ? "signup" : "signin"

  return (
    <div className="grid min-h-svh bg-canvas text-ink-900 lg:grid-cols-2">
      {/* Brand rail */}
      <aside className="hidden flex-col justify-between border-r border-line bg-surface p-12 lg:flex">
        <Logo size="lg" />

        <div className="flex flex-col gap-7">
          <Eyebrow>Meetings on autopilot</Eyebrow>
          <h2 className="max-w-[420px] text-[40px] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance">
            Every call, summarised and filed
          </h2>
          <div className="flex flex-col gap-3">
            {highlights.map((item) => (
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

          <div className="flex max-w-[420px] flex-col gap-[14px] rounded-[18px] border border-line bg-canvas p-[26px]">
            <div className="flex gap-[3px] text-[15px] text-attention">★★★★★</div>
            <p className="text-[15px] leading-[1.6] text-ink-700">
              “We stopped assigning a note-taker. The recap is in the channel
              before the call ends.”
            </p>
            <div className="flex items-center gap-[10px]">
              <div className="size-[34px] rounded-full border border-line bg-sunken" />
              <div className="flex flex-col">
                <span className="text-[13px] font-bold">Jane Mercer</span>
                <span className="text-xs text-ink-300">
                  Head of Revenue, Northwind
                </span>
              </div>
            </div>
          </div>
        </div>

        <span className="text-[13px] text-ink-300">
          SOC 2 Type II · Data encrypted at rest
        </span>
      </aside>

      {/* Form column */}
      <main className="flex flex-col items-center justify-center gap-8 px-6 py-16">
        <div className="lg:hidden">
          <Logo size="lg" />
        </div>
        <AuthPanel initialMode={initialMode} />
      </main>
    </div>
  )
}
