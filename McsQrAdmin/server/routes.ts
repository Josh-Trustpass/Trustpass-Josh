import type { Express, Request } from "express";
import express from "express";
import session from "express-session";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertVerificationSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendEmployeeStatusNotification } from './emailService';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Function to verify file exists and clean up invalid database entries
async function cleanupInvalidPhotoUrls() {
  try {
    const employees = await storage.getAllEmployees();
    for (const employee of employees) {
      if (employee.photoUrl) {
        const filePath = path.join(process.cwd(), employee.photoUrl);
        if (!fs.existsSync(filePath)) {
          console.log(`Cleaning up invalid photo URL for ${employee.fullName}: ${employee.photoUrl}`);
          await storage.updateEmployee(employee.id, { photoUrl: null });
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up invalid photo URLs:', error);
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'employee-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Completely private - NO public domain access allowed
const PRIVATE_SYSTEM_ENABLED = true;

// Network access restriction - COMPLETELY PRIVATE
const requireCompanyAccess = (req: any, res: any, next: any) => {
  // If private system is enabled, block ALL external access
  if (PRIVATE_SYSTEM_ENABLED) {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    // Only allow localhost and private network ranges
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1';
    const isPrivateNetwork = 
      clientIP?.startsWith('192.168.') ||  // Private Class C
      clientIP?.startsWith('10.') ||       // Private Class A
      clientIP?.startsWith('172.') ||      // Private Class B
      clientIP?.includes('localhost');
    
    if (!isLocalhost && !isPrivateNetwork && process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        message: 'System is private and not accessible from public internet.' 
      });
    }
  }
  
  next();
};

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (req.session?.adminId) {
    return next();
  }
  return res.status(401).json({ message: 'Authentication required' });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Network access control with QR verification exception
  app.use((req: any, res: any, next: any) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    // Allow public access to QR verification routes
    if (req.path.startsWith('/verify/') || req.path.startsWith('/api/employees/verify/')) {
      return next();
    }
    
    // For admin areas, restrict to private networks only
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1';
    const isPrivateNetwork = 
      clientIP?.startsWith('192.168.') ||  // Private Class C
      clientIP?.startsWith('10.') ||       // Private Class A  
      clientIP?.startsWith('172.') ||      // Private Class B
      clientIP?.includes('localhost') ||
      clientIP?.includes('replit.dev') ||   // Allow Replit internal
      clientIP?.includes('replit.com');     // Allow Replit internal
    
    // Block public access to admin areas
    if (!isLocalhost && !isPrivateNetwork && process.env.NODE_ENV !== 'development') {
      return res.status(403).send(`
        <html>
          <head><title>Admin Access Restricted</title></head>
          <body style="font-family:Arial;text-align:center;margin-top:100px;">
            <h1>Admin Access Restricted</h1>
            <p>Administrative access is only available from authorized company networks.</p>
            <p>Contact: joshua@trustpass.uk</p>
          </body>
        </html>
      `);
    }
    
    next();
  });

  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'mcs-cleaning-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware with QR code exception
  app.use((req: any, res: any, next: any) => {
    // Allow public access to QR verification endpoints and essential resources
    const publicRoutes = [
      '/api/auth/login',
      '/api/create-admin', 
      '/api/auth/me',
      '/login',
      '/uploads/',
      '/attached_assets/',
      '/src/',
      '/@',
      '.js',
      '.css',
      '.png',
      '.jpg',
      '.svg'
    ];
    
    // Allow QR code verification routes (public access for scanning)
    if (req.path.startsWith('/verify/') || req.path.startsWith('/api/employees/verify/')) {
      return next();
    }
    
    // Allow public routes
    if (publicRoutes.some(route => 
      req.path === route || 
      req.path.startsWith(route) || 
      req.path.endsWith(route)
    )) {
      return next();
    }
    
    // For all other routes, require authentication
    if (!req.session?.adminId) {
      // For API routes, return JSON error
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      // For web pages, let the frontend handle redirects
      return next();
    }
    
    next();
  });

  // Serve uploaded files statically (now protected by global auth)
  app.use('/uploads', express.static(uploadDir));
  
  // Serve attached assets (logos, etc.)
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

  // Authentication routes
  app.post('/api/auth/login', requireCompanyAccess, async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const adminUser = await storage.verifyAdminPassword(email, password);
      
      if (!adminUser) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      (req.session as any).adminId = adminUser.id;
      await storage.updateAdminLastLogin(adminUser.id);
      
      res.json({ 
        message: 'Login successful',
        user: { id: adminUser.id, email: adminUser.email }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: 'Invalid login data' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/auth/me', requireCompanyAccess, (req, res) => {
    if ((req.session as any)?.adminId) {
      res.json({ authenticated: true, adminId: (req.session as any).adminId });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Create admin user (for initial setup)
  app.post('/api/create-admin', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check if admin already exists
      const existingAdmin = await storage.getAdminUserByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin user already exists' });
      }

      const adminUser = await storage.createAdminUser({ 
        email, 
        password,
        passwordHash: '' // Will be hashed in storage
      });
      res.json({ message: 'Admin user created successfully', id: adminUser.id });
    } catch (error) {
      console.error('Create admin error:', error);
      res.status(500).json({ message: 'Failed to create admin user' });
    }
  });

  // Get all employees (protected)
  app.get('/api/employees', requireCompanyAccess, requireAuth, async (req, res) => {
    try {
      // Clean up invalid photo URLs before returning employees
      await cleanupInvalidPhotoUrls();
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ message: 'Failed to fetch employees' });
    }
  });

  // Get employee by employee ID for verification (public for QR scanning)
  app.get('/api/employees/verify/:employeeId', async (req, res) => {
    try {
      const { employeeId } = req.params;
      const employee = await storage.getEmployeeByEmployeeId(employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      // Log verification
      await storage.createVerification({
        employeeId: employee.id,
        verifierIp: req.ip,
      });

      res.json(employee);
    } catch (error) {
      console.error('Error verifying employee:', error);
      res.status(500).json({ message: 'Failed to verify employee' });
    }
  });

  // Create new employee (protected)
  app.post('/api/employees', requireCompanyAccess, requireAuth, upload.single('photo'), async (req, res) => {
    try {
      console.log('Received employee data:', req.body);
      console.log('Received file:', req.file);
      
      // Verify file was uploaded and saved
      if (req.file) {
        const filePath = path.join(uploadDir, req.file.filename);
        if (!fs.existsSync(filePath)) {
          console.error('File upload failed - file not found:', filePath);
          return res.status(500).json({ message: 'File upload failed - file not saved to disk' });
        }
        console.log('File successfully saved:', filePath);
        
        // Verify file size and readability
        try {
          const stats = fs.statSync(filePath);
          if (stats.size === 0) {
            console.error('File upload failed - file is empty:', filePath);
            fs.unlinkSync(filePath); // Remove empty file
            return res.status(500).json({ message: 'File upload failed - empty file' });
          }
        } catch (error) {
          console.error('File verification failed:', error);
          return res.status(500).json({ message: 'File upload failed - unable to verify file' });
        }
      }
      
      const employeeData = insertEmployeeSchema.parse({
        fullName: req.body.fullName,
        employeeId: req.body.employeeId,
        dbsNumber: req.body.dbsNumber,
        dbsExpiryDate: req.body.dbsExpiryDate || null,
        position: req.body.position || null,
        startDate: req.body.startDate,
        employmentType: req.body.employmentType || 'permanent',
        validUntilDate: req.body.validUntilDate || null,
        isActive: req.body.isActive,
        isSuspended: req.body.isSuspended || false,
        photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
      });

      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
        return res.status(400).json({ message: 'Invalid employee data', errors: error.errors });
      }
      console.error('Error creating employee:', error);
      res.status(500).json({ message: 'Failed to create employee' });
    }
  });

  // Update employee (protected)
  app.patch('/api/employees/:id', requireCompanyAccess, requireAuth, upload.single('photo'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('Update request for employee:', id, 'with data:', req.body);
      const updateData: any = { ...req.body };

      if (req.body.startDate) {
        updateData.startDate = new Date(req.body.startDate);
      }
      
      if (req.body.dbsExpiryDate) {
        updateData.dbsExpiryDate = new Date(req.body.dbsExpiryDate);
      }

      if (req.body.validUntilDate) {
        updateData.validUntilDate = new Date(req.body.validUntilDate);
      }
      
      if (req.body.isActive !== undefined) {
        updateData.isActive = req.body.isActive === 'true' || req.body.isActive === true;
      }

      if (req.body.isSuspended !== undefined) {
        updateData.isSuspended = req.body.isSuspended === 'true' || req.body.isSuspended === true;
        console.log('Processing suspension update:', req.body.isSuspended, '-> converted to:', updateData.isSuspended);
      }

      if (req.file) {
        const filePath = path.join(uploadDir, req.file.filename);
        if (!fs.existsSync(filePath)) {
          console.error('File update failed - file not found:', filePath);
          return res.status(500).json({ message: 'File upload failed - file not saved to disk' });
        }
        
        // Verify file size and readability
        try {
          const stats = fs.statSync(filePath);
          if (stats.size === 0) {
            console.error('File update failed - file is empty:', filePath);
            fs.unlinkSync(filePath); // Remove empty file
            return res.status(500).json({ message: 'File upload failed - empty file' });
          }
        } catch (error) {
          console.error('File verification failed during update:', error);
          return res.status(500).json({ message: 'File upload failed - unable to verify file' });
        }
        
        updateData.photoUrl = `/uploads/${req.file.filename}`;
        console.log('File successfully updated:', filePath);
      }

      // Get the original employee data to compare changes
      const originalEmployee = await storage.getEmployee(id);
      if (!originalEmployee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const employee = await storage.updateEmployee(id, updateData);
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      // Check for status changes that need notifications
      const statusChanged = {
        suspended: originalEmployee.isSuspended !== employee.isSuspended,
        deactivated: originalEmployee.isActive !== employee.isActive
      };

      // Send notifications for status changes (but not during initial creation)
      if (statusChanged.suspended && employee.isSuspended) {
        // Employee was just suspended
        const alreadyNotified = await storage.hasNotificationBeenSent(employee.id, 'employee_suspended', 1);
        if (!alreadyNotified) {
          sendEmployeeStatusNotification([employee], 'employee_suspended').then(success => {
            if (success) {
              storage.createNotification({
                employeeId: employee.id,
                type: 'employee_suspended',
                details: JSON.stringify({ suspendedAt: new Date() })
              });
              console.log(`Suspension notification sent for ${employee.fullName}`);
            }
          });
        }
      }

      if (statusChanged.deactivated && !employee.isActive) {
        // Employee was just deactivated
        const alreadyNotified = await storage.hasNotificationBeenSent(employee.id, 'employee_deactivated', 1);
        if (!alreadyNotified) {
          sendEmployeeStatusNotification([employee], 'employee_deactivated').then(success => {
            if (success) {
              storage.createNotification({
                employeeId: employee.id,
                type: 'employee_deactivated',
                details: JSON.stringify({ deactivatedAt: new Date() })
              });
              console.log(`Deactivation notification sent for ${employee.fullName}`);
            }
          });
        }
      }

      res.json(employee);
    } catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({ message: 'Failed to update employee' });
    }
  });

  // Delete employee (protected)
  app.delete('/api/employees/:id', requireCompanyAccess, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployee(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
      console.error('Error deleting employee:', error);
      res.status(500).json({ message: 'Failed to delete employee' });
    }
  });

  // Get employee statistics (protected)
  app.get('/api/stats', requireCompanyAccess, requireAuth, async (req, res) => {
    try {
      const stats = await storage.getEmployeeStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  // Generate QR code URL for employee (protected)
  app.get('/api/employees/:id/qr-url', requireCompanyAccess, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000';
      
      const verificationUrl = `${baseUrl}/verify/${employee.employeeId}`;
      
      res.json({ verificationUrl });
    } catch (error) {
      console.error('Error generating QR URL:', error);
      res.status(500).json({ message: 'Failed to generate QR URL' });
    }
  });

  // Check for expiring DBS certificates and send notifications (protected)
  app.post('/api/check-dbs-expiry', requireCompanyAccess, requireAuth, async (req, res) => {
    try {
      // Check for certificates expiring in the next 30 days
      const expiringEmployees = await storage.getEmployeesWithExpiringDBS(30);
      
      if (expiringEmployees.length > 0) {
        console.log(`Found ${expiringEmployees.length} employees with expiring DBS certificates`);
        
        const emailSent = await sendDBSExpiryNotification(expiringEmployees);
        
        res.json({ 
          message: `Found ${expiringEmployees.length} expiring DBS certificate(s)`,
          emailSent,
          employees: expiringEmployees.map(emp => ({
            name: emp.fullName,
            employeeId: emp.employeeId,
            expiryDate: emp.dbsExpiryDate
          }))
        });
      } else {
        res.json({ 
          message: 'No DBS certificates expiring in the next 30 days',
          emailSent: false,
          employees: []
        });
      }
    } catch (error) {
      console.error('Error checking DBS expiry:', error);
      res.status(500).json({ message: 'Failed to check DBS expiry' });
    }
  });

  // Test email endpoint (protected)
  app.post('/api/test-email', requireCompanyAccess, requireAuth, async (req, res) => {
    try {
      const { sendEmail } = await import('./emailService');
      
      const testResult = await sendEmail({
        to: ['joshua@mcsclean.co.uk'],
        from: 'joshua@mcsclean.co.uk', // Use verified sender
        subject: 'MCS Email System Test',
        text: 'This is a test email from your MCS Employee Verification System.',
        html: '<p>This is a test email from your <strong>MCS Employee Verification System</strong>.</p>'
      });
      
      res.json({ 
        success: testResult,
        message: testResult ? 'Test email sent successfully!' : 'Test email failed to send'
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to send test email: ' + error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
