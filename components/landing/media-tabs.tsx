"use client"

import * as React from "react"

import { MediaPlaceholder } from "@/components/landing/primitives"
import { cn } from "@/lib/utils"

export type MediaTab = { label: string; icon: React.ReactNode; media: string }

const skins = {
  steel: "bg-[linear-gradient(120deg,#5C7FA8_0%,#6E86A6_50%,#C99A86_100%)]",
  violet: "bg-[linear-gradient(120deg,#B85C8E_0%,#7A5CD1_55%,#4F5BD5_100%)]",
  slate: "bg-[linear-gradient(120deg,#A9A9AE_0%,#BDBDC2_100%)]",
} as const

/* Gradient-headed panel with segmented tabs — used three times in the reference. */
function MediaTabs({
  tabs,
  skin = "steel",
}: {
  tabs: MediaTab[]
  skin?: keyof typeof skins
}) {
  const [active, setActive] = React.useState(0)

  return (
    <div className={cn("overflow-hidden rounded-[14px]", skins[skin])}>
      <div className="grid grid-cols-3">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            aria-pressed={active === i}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-2 border-r border-white/20 px-4 py-4 text-sm font-semibold transition-colors last:border-r-0",
              active === i
                ? "bg-white/10 text-white"
                : "text-white/70 hover:text-white"
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="px-6 pt-8 pb-0 sm:px-10 sm:pt-10">
        <MediaPlaceholder
          label={tabs[active].media}
          className="h-[340px] rounded-t-[10px] rounded-b-none border-b-0 bg-surface"
        />
      </div>
    </div>
  )
}

export { MediaTabs }
