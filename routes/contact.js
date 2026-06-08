import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// POST /api/contact
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const subjectLine = subject
    ? `[HealthyBite Contact] ${subject} — from ${name}`
    : `[HealthyBite Contact] New message from ${name}`;

  const mailOptions = {
    from: `"HealthyBite Contact" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_TO || process.env.MAIL_USER,
    replyTo: email,
    subject: subjectLine,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #6b8f3f; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 20px;">New Contact Form Submission</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">HealthyBite Website</p>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px 32px; border-radius: 0 0 12px 12px; background: #fff;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 100px; vertical-align: top;">Name</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Email</td>
              <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #6b8f3f;">${email}</a></td>
            </tr>
            ${subject ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Subject</td>
              <td style="padding: 8px 0; color: #111827;">${subject}</td>
            </tr>` : ""}
            <tr>
              <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Message</td>
              <td style="padding: 8px 0; color: #111827; line-height: 1.6;">${message.replace(/\n/g, "<br>")}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #f3f4f6;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              Reply directly to this email to respond to ${name}.
            </p>
          </div>
        </div>
      </div>
    `,
  };


  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Message sent successfully." });
  } catch (err) {
    console.error("Contact email error:", err);
    return res.status(500).json({ error: "Failed to send message. Please try again." });
  }
});

export default router;