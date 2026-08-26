import * as React from "react"

import { cn } from "@/lib/utils"

/** White elevated surface — the base container for every Bright component. */
function Surface({
  className,
  elevation = "e1",
  ...props
}: React.ComponentProps<"div"> & { elevation?: "none" | "e1" | "e2" | "e3" }) {
  return (
    <div
      data-slot="bright-surface"
      className={cn(
        "rounded-[18px] border border-line bg-surface",
        elevation === "e1" && "shadow-e1",
        elevation === "e2" && "shadow-e2",
        elevation === "e3" && "shadow-e3",
        className
      )}
      {...props}
    />
  )
}

export { Surface }
