import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  companyName: text("company_name").notNull(),
  website: text("website"),
  employeeName: text("employee_name").notNull(),
  employeeTitle: text("employee_title").notNull(),
  email: text("email").notNull().unique(),
});

