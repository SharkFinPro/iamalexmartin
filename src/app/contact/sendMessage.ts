"use server";
import FormData from "form-data";
import Mailgun from "mailgun.js";

function createEmailData(name : string, email : string, subject : string, message : string) {
  return {
    from: "Alex Martin <no-reply@iamalexmartin.com>",
    to: [`${name} <${email}>`],
    bcc: [`Alex Martin <${process.env.CONTACT_EMAIL}>`],
    subject: `Portfolio Message: ${subject}`,
    text: `Hello ${name},

          Thank you for reaching out through my portfolio website. I have received your message and will review it shortly.
          
          Your message:
          "${message}"
          
          I aim to respond to all inquiries within 24-48 hours. If your matter is urgent, please feel free to reach out directly at ${process.env.CONTACT_EMAIL}.
          
          Best regards,
          Alex Martin
          Portfolio: https://iamalexmartin.com
          Email: ${process.env.CONTACT_EMAIL}
          
          ---
          This is an automated confirmation of your contact form submission.`,

    html: `<!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Contact Form Confirmation</title>
              <style>
                body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  line-height: 1.6; 
                  color: #333; 
                  max-width: 600px; 
                  margin: 0 auto; 
                  padding: 20px;
                }
                .header { 
                  border-bottom: 2px solid #007acc; 
                  padding-bottom: 15px; 
                  margin-bottom: 20px; 
                }
                .message-box { 
                  background-color: #f8f9fa; 
                  border-left: 4px solid #007acc; 
                  padding: 15px; 
                  margin: 20px 0; 
                  font-style: italic;
                }
                .footer { 
                  margin-top: 30px; 
                  padding-top: 15px; 
                  border-top: 1px solid #eee; 
                  font-size: 0.9em; 
                  color: #666; 
                }
                .signature { 
                  margin: 20px 0; 
                }
                a { 
                  color: #007acc; 
                  text-decoration: none; 
                }
                a:hover { 
                  text-decoration: underline; 
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>Thank you for your message</h2>
              </div>
              
              <p>Hello ${name},</p>
              
              <p>Thank you for reaching out through my portfolio website. I have received your message and will review it shortly.</p>
              
              <div class="message-box">
                <strong>Your message:</strong><br>
                "${message}"
              </div>
              
              <p>I aim to respond to all inquiries within 24-48 hours. If your matter is urgent, please feel free to reach out directly at <a href="mailto:${process.env.CONTACT_EMAIL}">${process.env.CONTACT_EMAIL}</a>.</p>
              
              <div class="signature">
                <p>Best regards,<br>
                <strong>Alex Martin</strong><br>
                Portfolio: <a href="https://iamalexmartin.com">iamalexmartin.com</a><br>
                Email: <a href="mailto:${process.env.CONTACT_EMAIL}">${process.env.CONTACT_EMAIL}</a></p>
              </div>
              
              <div class="footer">
                <p><em>This is an automated confirmation of your contact form submission.</em></p>
              </div>
            </body>
          </html>`
  }
}

export default async function sendMessage(name : string, email : string, subject : string, message : string) {
  return new Promise((resolve, reject) => {
    const emailData = createEmailData(name, email, subject, message);

    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: "api",
      key: process.env.EMAIL_KEY
    });

    mg.messages.create("iamalexmartin.com", emailData)
      .then((message) => resolve(true))
      .catch((err) => reject(err));
  });
}