"use client"

import * as React from "react"

import { BrightButton } from "@/components/bright/button"
import { BrightDialog } from "@/components/bright/dialog"

function DialogDemo() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <BrightButton
        variant="secondary"
        size="sm"
        className="px-[18px] py-[9px] text-sm"
        onClick={() => setOpen(true)}
      >
        Open dialog
      </BrightButton>
      <BrightDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export { DialogDemo }
