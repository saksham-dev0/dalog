"use client"

import * as React from "react"

import { BrightButton } from "@/components/bright/button"
import { SpecLabel } from "@/components/bright/badge"
import { Surface } from "@/components/bright/card"
import { BrightDialog } from "@/components/bright/dialog"
import { cn } from "@/lib/utils"

const fieldClass =
  "rounded-[10px] border border-line bg-surface px-[14px] py-[11px] text-[15px] text-ink-900 outline-none placeholder:text-ink-300 focus:border-accent-500 focus:shadow-[0_0_0_3px_#E5EDFE]"

const radioLabels = ["All events", "Only external"]

function WorkspaceForm() {
  const [checked, setChecked] = React.useState(true)
  const [radio, setRadio] = React.useState(0)
  const [switchOn, setSwitchOn] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <>
      <Surface
        elevation="none"
        className="flex max-w-[620px] flex-col gap-[22px] p-[30px]"
      >
        <div className="grid gap-[18px] sm:grid-cols-2">
          <div className="flex flex-col gap-[7px]">
            <label
              htmlFor="full-name"
              className="text-[13px] font-bold text-ink-900"
            >
              Full name
            </label>
            <input
              id="full-name"
              placeholder="Jane Mercer"
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-[7px]">
            <label
              htmlFor="work-email"
              className="text-[13px] font-bold text-ink-900"
            >
              Work email
            </label>
            <input
              id="work-email"
              defaultValue="jane@"
              aria-invalid
              className={cn(
                fieldClass,
                "border-critical focus:border-critical focus:shadow-none"
              )}
            />
            <span className="text-xs text-critical">
              Enter a complete email address.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-[7px]">
          <label
            htmlFor="team-size"
            className="text-[13px] font-bold text-ink-900"
          >
            Team size
          </label>
          <select id="team-size" className={cn(fieldClass, "appearance-none")}>
            <option>1–10</option>
            <option>11–50</option>
            <option>51–200</option>
            <option>200+</option>
          </select>
        </div>

        <div className="flex flex-col gap-[7px]">
          <label
            htmlFor="automate"
            className="text-[13px] font-bold text-ink-900"
          >
            What are you hoping to automate?
          </label>
          <textarea
            id="automate"
            rows={3}
            placeholder="Weekly client calls, handover notes…"
            className={cn(fieldClass, "resize-y leading-[1.55]")}
          />
          <span className="text-xs text-ink-300">
            Optional. Helps us set up your workspace.
          </span>
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <SpecLabel>Selection controls</SpecLabel>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => setChecked((v) => !v)}
              className="flex cursor-pointer items-center gap-[9px] bg-transparent"
            >
              <span
                className={cn(
                  "flex size-[18px] items-center justify-center rounded-[5px] border text-xs text-white",
                  checked
                    ? "border-accent-500 bg-accent-500"
                    : "border-line-strong bg-surface"
                )}
              >
                {checked ? "✓" : ""}
              </span>
              <span className="text-sm text-ink-700">
                Email me the weekly digest
              </span>
            </button>

            <div className="flex gap-4">
              {radioLabels.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setRadio(i)}
                  className="flex cursor-pointer items-center gap-2 bg-transparent"
                >
                  <span
                    className={cn(
                      "flex size-[18px] items-center justify-center rounded-full border",
                      radio === i ? "border-accent-500" : "border-line-strong"
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        radio === i ? "bg-accent-500" : "bg-transparent"
                      )}
                    />
                  </span>
                  <span className="text-sm text-ink-700">{label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSwitchOn((v) => !v)}
              role="switch"
              aria-checked={switchOn}
              className="flex cursor-pointer items-center gap-[9px] bg-transparent"
            >
              <span
                className={cn(
                  "flex h-[23px] w-10 rounded-full p-[3px] transition-colors duration-150",
                  switchOn
                    ? "justify-end bg-accent-500"
                    : "justify-start bg-line-strong"
                )}
              >
                <span className="size-[17px] rounded-full bg-white shadow-[0_1px_2px_rgba(16,16,19,0.2)]" />
              </span>
              <span className="text-sm text-ink-700">
                Auto-join calendar events
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-sunken pt-[18px]">
          <BrightButton type="button" onClick={() => setDialogOpen(true)}>
            Create workspace
          </BrightButton>
          <BrightButton type="button" variant="ghost">
            Cancel
          </BrightButton>
        </div>
      </Surface>

      <BrightDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}

export { WorkspaceForm }
