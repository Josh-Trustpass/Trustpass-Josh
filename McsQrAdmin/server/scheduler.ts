import { storage } from './storage';
import { sendEmployeeStatusNotification } from './emailService';

// Track the last check date to avoid duplicate notifications
let lastCheckDate: string | null = null;

export async function checkDBSExpiry(): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Only run once per day
    if (lastCheckDate === today) {
      return;
    }
    
    console.log('Running daily DBS expiry check...');
    
    // Check for certificates expiring in the next 60 days (2 months)
    const expiringEmployees = await storage.getEmployeesWithExpiringDBS(60);
    
    // Filter employees who haven't received an expiry notification in the last 7 days
    const employeesNeedingNotification = [];
    for (const employee of expiringEmployees) {
      const alreadyNotified = await storage.hasNotificationBeenSent(
        employee.id, 
        'dbs_expiry', 
        7 // Don't send again within 7 days
      );
      
      if (!alreadyNotified) {
        employeesNeedingNotification.push(employee);
      }
    }
    
    if (employeesNeedingNotification.length > 0) {
      console.log(`Found ${employeesNeedingNotification.length} employees with expiring DBS certificates:`, 
        employeesNeedingNotification.map(emp => `${emp.fullName} (${emp.employeeId}) - expires ${emp.dbsExpiryDate}`));
      
      const emailSent = await sendEmployeeStatusNotification(employeesNeedingNotification, 'dbs_expiry');
      
      if (emailSent) {
        // Record that notifications were sent
        for (const employee of employeesNeedingNotification) {
          await storage.createNotification({
            employeeId: employee.id,
            type: 'dbs_expiry',
            details: JSON.stringify({ expiryDate: employee.dbsExpiryDate })
          });
        }
        console.log('DBS expiry notification emails sent successfully');
      } else {
        console.log('Failed to send DBS expiry notification emails');
      }
    } else {
      console.log('No new DBS certificates needing expiry notifications');
    }
    
    // Check for already expired certificates
    const currentDate = new Date();
    const expiredEmployees = await storage.getEmployeesWithExpiringDBS(-1); // Get all with expiry dates
    const actuallyExpired = expiredEmployees.filter(emp => 
      emp.dbsExpiryDate && new Date(emp.dbsExpiryDate) < currentDate
    );
    
    const expiredNeedingNotification = [];
    for (const employee of actuallyExpired) {
      const alreadyNotified = await storage.hasNotificationBeenSent(
        employee.id, 
        'dbs_expired', 
        7 // Don't send again within 7 days
      );
      
      if (!alreadyNotified) {
        expiredNeedingNotification.push(employee);
      }
    }
    
    if (expiredNeedingNotification.length > 0) {
      console.log(`Found ${expiredNeedingNotification.length} employees with EXPIRED DBS certificates`);
      
      const emailSent = await sendEmployeeStatusNotification(expiredNeedingNotification, 'dbs_expired');
      
      if (emailSent) {
        // Record that notifications were sent
        for (const employee of expiredNeedingNotification) {
          await storage.createNotification({
            employeeId: employee.id,
            type: 'dbs_expired',
            details: JSON.stringify({ expiryDate: employee.dbsExpiryDate })
          });
        }
        console.log('DBS expired notification emails sent successfully');
      }
    }
    
    lastCheckDate = today;
  } catch (error) {
    console.error('Error in DBS expiry check:', error);
  }
}

export function startDBSExpiryScheduler(): void {
  console.log('Starting DBS expiry scheduler...');
  
  // Run immediately on startup
  checkDBSExpiry();
  
  // Run every hour (will only send emails once per day due to date check)
  setInterval(checkDBSExpiry, 60 * 60 * 1000); // 1 hour
  
  console.log('DBS expiry scheduler started - checking every hour for expiring certificates');
}