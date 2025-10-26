import { createAuthClient } from "better-auth/react"
import { anonymousClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787", // The base URL of your auth server
    plugins: [
        anonymousClient()
    ]
})