import * as authSchema from "./auth.schema";
import * as companiesSchema from "./companies.schema";

// Combine all schemas here for migrations
export const schema = {
    ...authSchema,
    ...companiesSchema,
} as const;