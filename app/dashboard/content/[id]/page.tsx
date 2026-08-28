import { DraftWorkspace } from "@/components/dashboard/draft-workspace"
import type { Id } from "@/convex/_generated/dataModel"

export const metadata = {
  title: "Draft · dalog",
  description: "The five drafts generated from one slice of repo activity.",
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-7">
      <DraftWorkspace draftId={id as Id<"contentDrafts">} />
    </div>
  )
}
