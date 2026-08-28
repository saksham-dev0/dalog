export default {
  providers: [
    {
      // Clerk Frontend API URL, e.g. https://your-app.clerk.accounts.dev
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
}
