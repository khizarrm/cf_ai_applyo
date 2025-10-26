import { createAuthClient } from "better-auth/react"
import { anonymousClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "https://applyo-worker.applyo.workers.dev", // The base URL of your auth server
    plugins: [
        anonymousClient()
    ]
})