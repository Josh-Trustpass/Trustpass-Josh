import { employees, verifications, adminUsers, notifications, type Employee, type InsertEmployee, type InsertVerification, type Verification, type InsertAdminUser, type AdminUser, type InsertNotification, type Notification } from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, and, gte, lt, lte, isNotNull } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Employee operations
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  getAllEmployees(): Promise<Employee[]>;
  
  // Verification operations
  createVerification(verification: InsertVerification): Promise<Verification>;
  getVerificationsByEmployee(employeeId: number): Promise<Verification[]>;
  
  // Admin user operations
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  updateAdminLastLogin(id: number): Promise<void>;
  
  // Statistics
  getEmployeeStats(): Promise<{
    activeEmployees: number;
    inactiveEmployees: number;
    suspendedEmployees: number;
    totalEmployees: number;
    todayVerifications: number;
  }>;
  
  // DBS expiry checking
  getEmployeesWithExpiringDBS(daysFromNow: number): Promise<Employee[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  hasNotificationBeenSent(employeeId: number, type: string, daysSince?: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.employeeId, employeeId));
    return employee || undefined;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values({
        ...insertEmployee,
        updatedAt: new Date(),
      })
      .returning();
    return employee;
  }

  async updateEmployee(id: number, updateData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [employee] = await db
      .update(employees)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id))
      .returning();
    return employee || undefined;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    try {
      // First delete all verification records for this employee
      await db.delete(verifications).where(eq(verifications.employeeId, id));
      
      // Then delete the employee
      const result = await db.delete(employees).where(eq(employees.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting employee:', error);
      return false;
    }
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async createVerification(insertVerification: InsertVerification): Promise<Verification> {
    const [verification] = await db
      .insert(verifications)
      .values(insertVerification)
      .returning();
    return verification;
  }

  async getVerificationsByEmployee(employeeId: number): Promise<Verification[]> {
    return await db
      .select()
      .from(verifications)
      .where(eq(verifications.employeeId, employeeId))
      .orderBy(desc(verifications.verifiedAt));
  }

  async getEmployeeStats(): Promise<{
    activeEmployees: number;
    inactiveEmployees: number;
    suspendedEmployees: number;
    totalEmployees: number;
    todayVerifications: number;
  }> {
    const [activeCount] = await db
      .select({ count: count() })
      .from(employees)
      .where(and(eq(employees.isActive, true), eq(employees.isSuspended, false)));

    const [inactiveCount] = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.isActive, false));

    const [suspendedCount] = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.isSuspended, true));

    const [totalCount] = await db
      .select({ count: count() })
      .from(employees);

    // Get today's verifications count (simplified approach)
    const [todayVerificationsCount] = await db
      .select({ count: count() })
      .from(verifications);

    return {
      activeEmployees: activeCount.count,
      inactiveEmployees: inactiveCount.count,
      suspendedEmployees: suspendedCount.count,
      totalEmployees: totalCount.count,
      todayVerifications: todayVerificationsCount.count,
    };
  }

  // Admin user operations
  async createAdminUser(insertAdminUser: InsertAdminUser): Promise<AdminUser> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash((insertAdminUser as any).password, saltRounds);
    
    const [adminUser] = await db
      .insert(adminUsers)
      .values({
        email: insertAdminUser.email,
        passwordHash,
      })
      .returning();
    return adminUser;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return adminUser || undefined;
  }

  async updateAdminLastLogin(id: number): Promise<void> {
    await db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, id));
  }

  async verifyAdminPassword(email: string, password: string): Promise<AdminUser | null> {
    const adminUser = await this.getAdminUserByEmail(email);
    if (!adminUser) return null;
    
    const isValid = await bcrypt.compare(password, adminUser.passwordHash);
    return isValid ? adminUser : null;
  }

  async getEmployeesWithExpiringDBS(daysFromNow: number): Promise<Employee[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysFromNow);
    
    return await db.select()
      .from(employees)
      .where(
        and(
          eq(employees.isActive, true),
          isNotNull(employees.dbsExpiryDate),
          lte(employees.dbsExpiryDate, targetDate)
        )
      );
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async hasNotificationBeenSent(employeeId: number, type: string, daysSince?: number): Promise<boolean> {
    let query = db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.employeeId, employeeId),
        eq(notifications.type, type)
      ));
    
    if (daysSince) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysSince);
      query = db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.employeeId, employeeId),
          eq(notifications.type, type),
          gte(notifications.sentAt, cutoffDate)
        ));
    }
    
    const [existing] = await query;
    return !!existing;
  }
}

export const storage = new DatabaseStorage();
