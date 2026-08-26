"use client"

import * as React from "react"
import Link from "next/link"

import { SpecLabel } from "@/components/bright/badge"
import { BrightButton } from "@/components/bright/button"
import { Surface } from "@/components/bright/card"
import { cn } from "@/lib/utils"

export type AuthMode = "signin" | "signup"

const fieldClass =
  "rounded-[10px] border border-line bg-surface px-[14px] py-[11px] text-[15px] text-ink-900 outline-none placeholder:text-ink-300 focus:border-accent-500 focus:shadow-[0_0_0_3px_#E5EDFE]"

const providers = [
  { label: "Continue with Google", mark: "G" },
  { label: "Continue with Microsoft", mark: "M" },
]

type Errors = Partial<Record<"name" | "email" | "password", string>>

function validate(mode: AuthMode, form: FormData): Errors {
  const errors: Errors = {}
  const name = String(form.get("name") ?? "").trim()
  const email = String(form.get("email") ?? "").trim()
  const password = String(form.get("password") ?? "")

  if (mode === "signup" && name.length < 2) {
    errors.name = "Enter your full name."
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a complete email address."
  }
  if (password.length < 8) {
    errors.password = "Use at least 8 characters."
  }
  return errors
}

function Field({
  id,
  label,
  error,
  hint,
  ...props
}: React.ComponentProps<"input"> & {
  id: string
  label: string
  error?: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-[7px]">
      <label htmlFor={id} className="text-[13px] font-bold text-ink-900">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          fieldClass,
          error && "border-critical focus:border-critical focus:shadow-none"
        )}
        {...props}
      />
      {error ? (
        <span id={`${id}-error`} className="text-xs text-critical">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-ink-300">{hint}</span>
      ) : null}
    </div>
  )
}

function AuthPanel({ initialMode }: { initialMode: AuthMode }) {
  const [mode, setMode] = React.useState<AuthMode>(initialMode)
  const [errors, setErrors] = React.useState<Errors>({})
  const [submitted, setSubmitted] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const isSignup = mode === "signup"

  function switchMode(next: AuthMode) {
    setMode(next)
    setErrors({})
    setSubmitted(false)
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextErrors = validate(mode, form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    // No backend yet — this is where the auth call goes.
    setPending(true)
    window.setTimeout(() => {
      setPending(false)
      setSubmitted(true)
    }, 600)
  }

  return (
    <Surface elevation="e2" className="flex w-full max-w-[440px] flex-col gap-6 p-8">
      <div className="flex gap-1 rounded-full bg-sunken p-1">
        {(
          [
            { key: "signin", label: "Sign in" },
            { key: "signup", label: "Sign up" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchMode(tab.key)}
            aria-pressed={mode === tab.key}
            className={cn(
              "flex-1 cursor-pointer rounded-full px-5 py-2 text-sm font-bold transition-colors",
              mode === tab.key
                ? "bg-surface text-ink-900 shadow-[0_1px_2px_rgba(16,16,19,0.08)]"
                : "text-ink-500 hover:text-ink-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.025em]">
          {isSignup ? "Create your workspace" : "Welcome back"}
        </h1>
        <p className="text-[15px] leading-[1.6] text-ink-500">
          {isSignup
            ? "Start recording in seconds. No card required."
            : "Sign in to pick up where your last call left off."}
        </p>
      </div>

      {submitted ? (
        <div className="flex gap-[11px] rounded-xl bg-positive-tint px-[15px] py-[13px]">
          <span className="text-sm font-bold text-positive">✓</span>
          <span className="text-sm leading-[1.5] text-positive-ink">
            {isSignup
              ? "Workspace created. Check your inbox to confirm your email."
              : "Signed in. Redirecting to your dashboard…"}
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-[10px]">
        {providers.map((provider) => (
          <button
            key={provider.label}
            type="button"
            className="flex cursor-pointer items-center justify-center gap-[10px] rounded-full border border-line bg-surface px-[22px] py-[11px] text-[15px] font-bold text-ink-900 transition-colors hover:border-line-strong hover:bg-canvas"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-sunken font-mono text-[11px] text-ink-500">
              {provider.mark}
            </span>
            {provider.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <SpecLabel>or</SpecLabel>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
        {isSignup ? (
          <Field
            id="name"
            label="Full name"
            placeholder="Jane Mercer"
            autoComplete="name"
            error={errors.name}
          />
        ) : null}

        <Field
          id="email"
          label="Work email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          error={errors.email}
        />

        <Field
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete={isSignup ? "new-password" : "current-password"}
          error={errors.password}
          hint={isSignup ? "At least 8 characters." : undefined}
        />

        {isSignup ? null : (
          <div className="flex justify-end">
            <Link
              href="/auth?mode=signin"
              className="text-[13px] font-bold text-accent-500 no-underline hover:no-underline"
            >
              Forgot password?
            </Link>
          </div>
        )}

        <BrightButton type="submit" disabled={pending} className="w-full">
          {pending
            ? "Working…"
            : isSignup
              ? "Create workspace"
              : "Sign in"}
        </BrightButton>
      </form>

      <p className="text-center text-[13px] text-ink-500">
        {isSignup ? "Already have an account?" : "New to Bright?"}{" "}
        <button
          type="button"
          onClick={() => switchMode(isSignup ? "signin" : "signup")}
          className="cursor-pointer bg-transparent font-bold text-accent-500"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </button>
      </p>

      {isSignup ? (
        <p className="text-center text-xs leading-[1.5] text-ink-300">
          By creating a workspace you agree to the Terms and the Privacy Policy.
        </p>
      ) : null}
    </Surface>
  )
}

export { AuthPanel }
