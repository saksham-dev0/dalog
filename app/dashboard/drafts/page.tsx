import { SpecLabel } from "@/components/bright/badge"
import { DraftList } from "@/components/dashboard/draft-list"

export const metadata = {
  title: "Drafts · dalog",
  description: "Posts written from your merged work.",
}

export default function DraftsPage() {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <SpecLabel>Drafts</SpecLabel>
        <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.025em]">
          Written from your merges
        </h1>
        <p className="text-[15px] leading-[1.6] text-ink-500">
          Gemini reads the diff, researches what each platform is rewarding
          right now, then writes five drafts. Nothing posts itself.
        </p>
      </div>

      <DraftList />
    </div>
  )
}
