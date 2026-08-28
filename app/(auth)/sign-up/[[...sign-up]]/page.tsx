import { SignUp } from "@clerk/nextjs"

export const metadata = {
  title: "Create your workspace · Bright",
  description: "Create your Bright workspace.",
}

export default function SignUpPage() {
  return <SignUp />
}
