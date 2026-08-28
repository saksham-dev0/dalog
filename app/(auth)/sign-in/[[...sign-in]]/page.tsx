import { SignIn } from "@clerk/nextjs"

export const metadata = {
  title: "Sign in · Bright",
  description: "Sign in to your Bright workspace.",
}

export default function SignInPage() {
  return <SignIn />
}
