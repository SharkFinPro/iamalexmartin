"use server";
import FormData from "form-data";
import Mailgun from "mailgun.js";

// Server-side validation limits. The client validates too, but a Server Action
// is a public endpoint — it must not trust anything the browser sends.
const FIELD_LIMITS: Record<string, number> = {
  name: 100,
  email: 254,
  subject: 150,
  message: 5000
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SendMessageResult = { ok: true } | { ok: false; error: string };

/** Returns a visitor-facing error message, or null when the input is valid. */
function validateInput(fields: Record<string, unknown>): string | null {
  for (const [key, limit] of Object.entries(FIELD_LIMITS)) {
    const value = fields[key];
    if (typeof value !== "string" || !value.trim()) {
      return "All fields are required.";
    }
    if (value.length > limit) {
      return `The ${key} field is too long (limit ${limit} characters).`;
    }
  }
  if (!EMAIL_PATTERN.test((fields.email as string).trim())) {
    return "Please enter a valid email address.";
  }
  return null;
}

/** Strip CR/LF and other control characters so visitor input can never smuggle
 *  extra headers or recipients into the email envelope. */
function stripControlChars(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").trim();
}

/** Escape for interpolation into the HTML email body. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createEmailData(rawName : string, rawEmail : string, rawSubject : string, message : string) {
  // Header-bound values get control characters stripped; body-bound values are
  // additionally HTML-escaped so a visitor can't inject markup into an email
  // that goes out under this domain's name.
  const name = stripControlChars(rawName);
  const email = stripControlChars(rawEmail);
  const subject = stripControlChars(rawSubject);
  const htmlName = escapeHtml(name);
  const htmlEmail = escapeHtml(email);
  const htmlSubject = escapeHtml(subject);
  const htmlMessage = escapeHtml(message).replace(/\r?\n/g, "<br>");

  const date = new Date();

  const ptFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });

  const dateString = ptFormatter.format(date);

  return {
    from: "Alex Martin <no-reply@iamalexmartin.com>",
    // Bare address only — a visitor-typed display name stays out of the
    // address header entirely.
    to: [email],
    bcc: [`Alex Martin <${process.env.CONTACT_EMAIL}>`],
    subject: `Portfolio Message: ${subject}`,
    text: `Message Confirmation

          Dear ${name},
          
          Thank you for contacting me through my portfolio website. This email confirms that I have successfully received your message.
          
          Message Details
          From: ${name}
          Email: ${email}
          Date: ${dateString}
          Subject: ${subject}
          
          Your message:
          "${message}"
          
          I will review your message and respond within 1-2 business days. I appreciate your interest and look forward to connecting with you.
          
          For urgent matters, you may reach me directly at:
          Email: ${process.env.CONTACT_EMAIL}
          
          Best regards,
          
          Alex Martin
          Software Developer
          iamalexmartin.com
          
          This is an automated response confirming receipt of your contact form submission.
          Please do not reply to this email address.`,
    html: `<!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Message Received - Alex Martin</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.6; 
                  color: #333333; 
                  max-width: 600px; 
                  margin: 0 auto; 
                  padding: 20px;
                  background-color: #ffffff;
                }
                .container {
                  background-color: #ffffff;
                  border: 1px solid #e0e0e0;
                  border-radius: 4px;
                  padding: 30px;
                }
                .header { 
                  text-align: center;
                  margin-bottom: 30px;
                }
                .header h1 {
                  color: #2c3e50;
                  font-size: 24px;
                  margin: 0;
                  font-weight: normal;
                }
                .content {
                  margin-bottom: 25px;
                }
                .message-details { 
                  background-color: #f8f9fa; 
                  border: 1px solid #dee2e6;
                  border-radius: 4px;
                  padding: 20px; 
                  margin: 25px 0;
                }
                .message-details h3 {
                  margin-top: 0;
                  color: #495057;
                  font-size: 16px;
                }
                .message-text {
                  color: #6c757d;
                  font-style: italic;
                  margin: 10px 0;
                }
                .contact-info {
                  margin: 25px 0;
                  padding: 20px 0;
                  border-top: 1px solid #e9ecef;
                }
                .signature { 
                  margin: 25px 0;
                  color: #495057;
                }
                .footer { 
                  margin-top: 30px; 
                  padding-top: 20px; 
                  border-top: 1px solid #e9ecef; 
                  font-size: 14px; 
                  color: #6c757d;
                  text-align: center;
                }
                a { 
                  color: #007bff; 
                  text-decoration: none; 
                }
                a:hover { 
                  text-decoration: underline; 
                }
                .highlight {
                  color: #28a745;
                  font-weight: 500;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                }
                td {
                  padding: 8px 0;
                  vertical-align: top;
                }
                .label {
                  font-weight: 500;
                  color: #495057;
                  width: 120px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Message Confirmation</h1>
                </div>
                
                <div class="content">
                  <p>Dear ${htmlName},</p>
                  
                  <p>Thank you for contacting me through my portfolio website. This email confirms that I have successfully received your message.</p>
                  
                  <div class="message-details">
                    <h3>Message Details</h3>
                    <table>
                      <tr>
                        <td class="label">From:</td>
                        <td>${htmlName}</td>
                      </tr>
                      <tr>
                        <td class="label">Email:</td>
                        <td>${htmlEmail}</td>
                      </tr>
                      <tr>
                        <td class="label">Date:</td>
                        <td>${dateString}</td>
                      </tr>
                      <tr>
                        <td class="label">Subject:</td>
                        <td>${htmlSubject}</td>
                      </tr>
                    </table>
                    
                    <div class="message-text">
                      <strong>Your message:</strong><br>
                      "${htmlMessage}"
                    </div>
                  </div>
                  
                  <p>I will review your message and respond within <span class="highlight">1-2 business days</span>. I appreciate your interest and look forward to connecting with you.</p>
                  
                  <div class="contact-info">
                    <p>For urgent matters, you may reach me directly at:</p>
                    <p><strong>Email:</strong> <a href="mailto:${process.env.CONTACT_EMAIL}">${process.env.CONTACT_EMAIL}</a></p>
                  </div>
                </div>
                
                <div class="signature">
                  <p>Best regards,</p>
                  <p><strong>Alex Martin</strong><br>
                     Software Developer<br>
                     <a href="https://iamalexmartin.com">iamalexmartin.com</a></p>
                </div>
                
                <div class="footer">
                  <p>This is an automated response confirming receipt of your contact form submission.<br>
                     Please do not reply to this email address.</p>
                </div>
              </div>
            </body>
          </html>`
  }
}

export default async function sendMessage(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<SendMessageResult> {
  const validationError = validateInput({ name, email, subject, message });
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const emailData = createEmailData(name.trim(), email.trim(), subject.trim(), message.trim());

  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.EMAIL_KEY
  });

  try {
    await mg.messages.create("iamalexmartin.com", emailData);
  } catch {
    // Don't leak provider errors to the visitor; the details land in the
    // server logs via Mailgun's own SDK logging.
    return { ok: false, error: "Message failed to send. Please try again." };
  }

  return { ok: true };
}