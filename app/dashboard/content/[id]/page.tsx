import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { SpecLabel } from "@/components/bright/badge"
import { ContentEditor } from "@/components/dashboard/content-editor"
import { GenerationPill } from "@/components/dashboard/status-pill"
import { pushes } from "@/lib/mock-data"

export const metadata = {
  title: "Push detail · dalog",
  description: "Edit the drafts generated from one push.",
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const push = pushes.find((p) => p.id === id)

  if (!push) notFound()

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-7">
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard"
          className="flex w-fit items-center gap-1.5 text-[13px] font-bold text-ink-500 no-underline hover:text-ink-900 hover:no-underline"
        >
          <ArrowLeft className="size-[14px]" />
          Back to activity
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <SpecLabel>{push.repo}</SpecLabel>
            <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.025em]">
              {push.summary}
            </h1>
            <p className="text-[15px] leading-[1.6] text-ink-500">
              Pushed to {push.branch} · {push.when}
            </p>
          </div>
          <GenerationPill status={push.status} />
        </div>
      </div>

      <ContentEditor push={push} />
    </div>
  )
}
