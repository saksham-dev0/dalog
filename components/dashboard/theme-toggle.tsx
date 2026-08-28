"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const options = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const

/** Dashboard-only theme control. Nothing else flips the theme on its own. */
function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // next-themes only knows the real theme on the client; render a stable
  // placeholder until then so SSR and hydration agree.
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // The trigger shows what you're actually looking at, so "system" reads as
  // sun or moon; the menu shows which of the three is selected.
  const TriggerIcon = mounted && resolvedTheme === "dark" ? Moon : Sun
  const selected = mounted ? (theme ?? "system") : "light"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Change theme"
          title="Theme"
          className="flex size-9 cursor-pointer items-center justify-center rounded-[10px] text-ink-500 transition-colors hover:bg-sunken hover:text-ink-900"
        >
          <TriggerIcon className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-[10px]">
        <DropdownMenuRadioGroup value={selected} onValueChange={setTheme}>
          {options.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="size-4" /> {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ThemeToggle }
