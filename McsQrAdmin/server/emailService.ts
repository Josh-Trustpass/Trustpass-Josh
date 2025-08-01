import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - email notifications disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('Email sending skipped - no SENDGRID_API_KEY configured');
      return false;
    }

    // Send individual emails to each recipient
    for (const email of params.to) {
      const msg = {
        to: email,
        from: params.from,
        subject: params.subject,
        text: params.text,
        html: params.html,
      };

      await mailService.send(msg);
    }
    
    console.log(`Email sent successfully to ${params.to.join(', ')}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    if (error.response && error.response.body) {
      console.error('SendGrid error details:', JSON.stringify(error.response.body, null, 2));
    }
    return false;
  }
}

// Generic email notification function for different employee events
export async function sendEmployeeStatusNotification(
  employees: any[], 
  type: 'dbs_expiry' | 'dbs_expired' | 'employee_suspended' | 'employee_deactivated'
): Promise<boolean> {
  const adminEmails = [
    'joshua@mcsclean.co.uk',
    'amy@mcsclean.co.uk', 
    'kelly@mcsclean.co.uk'
  ];

  let subject: string;
  let title: string;
  let message: string;
  let color: string;

  switch (type) {
    case 'dbs_expiry':
      subject = `DBS Certificates Expiring Soon - ${employees.length} Employee(s)`;
      title = 'DBS Certificate Expiry Alert';
      message = 'This is an automated notification that the following employee(s) have DBS certificates expiring within the next 2 months:';
      color = '#16A34A';
      break;
    case 'dbs_expired':
      subject = `DBS Certificates EXPIRED - ${employees.length} Employee(s)`;
      title = 'DBS Certificate Expired Alert';
      message = 'URGENT: The following employee(s) have DBS certificates that have already expired:';
      color = '#dc2626';
      break;
    case 'employee_suspended':
      subject = `Employee(s) Suspended - ${employees.length} Employee(s)`;
      title = 'Employee Suspension Alert';
      message = 'This is an automated notification that the following employee(s) have been suspended:';
      color = '#ea580c';
      break;
    case 'employee_deactivated':
      subject = `Employee(s) Deactivated - ${employees.length} Employee(s)`;
      title = 'Employee Deactivation Alert';
      message = 'This is an automated notification that the following employee(s) have been deactivated:';
      color = '#6b7280';
      break;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${color}; color: white; padding: 20px; text-align: center;">
        <h1>${title}</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Dear Admin,</p>
        
        <p>${message}</p>
        
        <div style="background-color: #f9f9f9; border-left: 4px solid ${color}; padding: 15px; margin: 20px 0;">
          ${employees.map(emp => {
            let details = `<strong>${emp.fullName}</strong> (${emp.employeeId})<br>`;
            if (type.includes('dbs')) {
              details += `<span style="color: ${type === 'dbs_expired' ? '#dc2626' : '#16A34A'};">DBS Expiry: ${new Date(emp.dbsExpiryDate).toLocaleDateString('en-GB')}</span>`;
            }
            if (type === 'employee_suspended') {
              details += `<span style="color: #ea580c;">Status: Suspended</span>`;
            }
            if (type === 'employee_deactivated') {
              details += `<span style="color: #6b7280;">Status: Deactivated</span>`;
            }
            return `<div style="margin-bottom: 10px;">${details}</div>`;
          }).join('')}
        </div>
        
        <p>${type.includes('dbs') ? 'Please ensure these DBS certificates are renewed before they expire to maintain compliance.' : 'Please review these employee status changes.'}</p>
        
        <p>Best regards,<br>
        Trust Pass - Powered By MCS</p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>This is an automated message from Trust Pass - Powered By MCS.</p>
        <p>For support, contact: joshua@trustpass.uk | 01530 382006</p>
      </div>
    </div>
  `;

  const employeeList = employees.map(emp => {
    let line = `• ${emp.fullName} (${emp.employeeId})`;
    if (type.includes('dbs')) {
      line += ` - DBS expires: ${new Date(emp.dbsExpiryDate).toLocaleDateString('en-GB')}`;
    }
    return line;
  }).join('\n');

  const textContent = `
${title}

Dear Admin,

${message}

${employeeList}

${type.includes('dbs') ? 'Please ensure these DBS certificates are renewed before they expire to maintain compliance.' : 'Please review these employee status changes.'}

Best regards,
Trust Pass - Powered By MCS

---
This is an automated message from Trust Pass - Powered By MCS.
For support, contact: joshua@trustpass.uk | 01530 382006
  `;

  return await sendEmail({
    to: adminEmails,
    from: 'joshua@mcsclean.co.uk',
    subject,
    html: htmlContent,
    text: textContent
  });
}

export async function sendDBSExpiryNotification(employeesExpiring: any[]): Promise<boolean> {
  return await sendEmployeeStatusNotification(employeesExpiring, 'dbs_expiry');
}