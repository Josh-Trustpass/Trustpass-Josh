import { pgTable, text, serial, boolean, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: varchar("email"),
  dbsNumber: varchar("dbs_number").notNull(),
  dbsExpiryDate: timestamp("dbs_expiry_date"),
  position: text("position"),
  startDate: timestamp("start_date").notNull(),
  employmentType: varchar("employment_type").default("permanent"), // "permanent" or "temporary"
  validUntilDate: timestamp("valid_until_date"), // For temporary staff
  photoUrl: text("photo_url"),
  isActive: boolean("is_active").default(true),
  isSuspended: boolean("is_suspended").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  employeeId: serial("employee_id").references(() => employees.id),
  verifiedAt: timestamp("verified_at").defaultNow(),
  verifierIp: varchar("verifier_ip"),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id),
  type: varchar("type", { length: 50 }).notNull(), // 'dbs_expiry', 'dbs_expired', 'employee_suspended', 'employee_deactivated'
  sentAt: timestamp("sent_at").defaultNow(),
  details: text("details"), // JSON string with additional details
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.coerce.date(),
  dbsExpiryDate: z.coerce.date().optional(),
  validUntilDate: z.coerce.date().optional(),
  employmentType: z.enum(["permanent", "temporary"]).default("permanent"),
  isActive: z.coerce.boolean().default(true),
  isSuspended: z.coerce.boolean().default(false),
});

export const insertVerificationSchema = createInsertSchema(verifications).omit({
  id: true,
  verifiedAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
}).extend({
  password: z.string().min(8),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  sentAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type Verification = typeof verifications.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;
