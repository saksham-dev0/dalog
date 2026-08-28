"use client"

import * as React from "react"

import { BrightButton } from "@/components/bright/button"

function BrightDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,16,19,0.42)] p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[440px] flex-col gap-[14px] rounded-[18px] bg-surface p-7 shadow-e3"
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-[20px] font-extrabold tracking-[-0.02em]">
            One more step
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer border-none bg-transparent text-lg leading-none text-ink-300 hover:text-ink-900"
          >
            ×
          </button>
        </div>
        <p className="text-[15px] leading-[1.6] text-ink-500">
          Connect a calendar so Bright knows which events to record. You can
          change this later in workspace settings.
        </p>
        <div className="flex justify-end gap-[10px] pt-1.5">
          <BrightButton
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="px-[18px] py-[9px] text-sm"
          >
            Later
          </BrightButton>
          <BrightButton
            size="sm"
            onClick={onClose}
            className="px-[18px] py-[9px] text-sm"
          >
            Connect calendar
          </BrightButton>
        </div>
      </div>
    </div>
  )
}

export { BrightDialog }
