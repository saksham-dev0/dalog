/**
 * A stable colour per repo, so a feed mixing several repos stays readable:
 * the same repo is always the same hue, on every page and across reloads.
 *
 * The ramp is mid-lightness oklch, which keeps every hue legible on both the
 * light and the dark surface. Tints are derived with `color-mix` against
 * `transparent`, so they pick up whatever surface they land on.
 */
const REPO_HUES = [
  "oklch(0.62 0.17 258)", // blue
  "oklch(0.64 0.16 162)", // green
  "oklch(0.66 0.16 45)", // orange
  "oklch(0.62 0.19 320)", // magenta
  "oklch(0.63 0.15 200)", // teal
  "oklch(0.62 0.18 20)", // red
  "oklch(0.62 0.17 288)", // violet
  "oklch(0.66 0.14 110)", // olive
] as const

/** Deterministic, order-independent: derived from the name, not the position. */
function hash(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0
  }

  return Math.abs(h)
}

export function repoColor(fullName: string) {
  return REPO_HUES[hash(fullName) % REPO_HUES.length]
}

/** `owner/name` → `name`, for the compact chip. */
export function repoShortName(fullName: string) {
  const slash = fullName.lastIndexOf("/")

  return slash === -1 ? fullName : fullName.slice(slash + 1)
}

export function repoOwner(fullName: string) {
  const slash = fullName.lastIndexOf("/")

  return slash === -1 ? "" : fullName.slice(0, slash)
}

/** Inline styles for a chip / dot / rail painted in the repo's colour. */
export function repoStyles(fullName: string) {
  const color = repoColor(fullName)

  return {
    color,
    dot: { background: color },
    rail: { background: color },
    chip: {
      color,
      background: `color-mix(in oklch, ${color} 14%, transparent)`,
      borderColor: `color-mix(in oklch, ${color} 30%, transparent)`,
    },
  }
}
