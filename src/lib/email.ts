import nodemailer from "nodemailer";

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface BookingEmailData {
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  startTime: Date;
  endTime: Date;
  organizerName: string;
  organizerEmail: string;
  meetingUrl?: string;
  notes?: string;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const { attendeeName, attendeeEmail, eventTitle, startTime, endTime, organizerName, meetingUrl, notes } = data;

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(startTime);

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
  }).format(startTime);

  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
    .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-label { font-weight: bold; min-width: 120px; color: #6b7280; }
    .detail-value { color: #111827; }
    .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">📅 Booking Confirmed!</h1>
    </div>

    <div class="content">
      <p>Hi <strong>${attendeeName}</strong>,</p>

      <p>Your booking has been confirmed! Here are the details:</p>

      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Event:</span>
          <span class="detail-value">${eventTitle}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${formattedTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${duration} minutes</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">With:</span>
          <span class="detail-value">${organizerName}</span>
        </div>
        ${notes ? `
        <div class="detail-row">
          <span class="detail-label">Notes:</span>
          <span class="detail-value">${notes}</span>
        </div>
        ` : ''}
      </div>

      ${meetingUrl ? `
      <div style="text-align: center;">
        <a href="${meetingUrl}" class="button">Join Meeting</a>
      </div>
      ` : ''}

      <p>If you need to cancel or reschedule, please contact ${organizerName} directly.</p>

      <p>See you soon!</p>
    </div>

    <div class="footer">
      <p>This is an automated email from Cal Clone</p>
      <p>© 2024 Cal Clone - Scheduling made simple</p>
    </div>
  </div>
</body>
</html>
  `;

  const emailText = `
Booking Confirmed!

Hi ${attendeeName},

Your booking has been confirmed!

Event: ${eventTitle}
Date: ${formattedDate}
Time: ${formattedTime}
Duration: ${duration} minutes
With: ${organizerName}
${notes ? `Notes: ${notes}` : ''}
${meetingUrl ? `Meeting URL: ${meetingUrl}` : ''}

If you need to cancel or reschedule, please contact ${organizerName} directly.

See you soon!

---
This is an automated email from Cal Clone
  `;

  try {
    await transporter.sendMail({
      from: `"Cal Clone" <${process.env.EMAIL_FROM || "noreply@calclone.com"}>`,
      to: attendeeEmail,
      subject: `✅ Booking Confirmed: ${eventTitle} on ${formattedDate}`,
      text: emailText,
      html: emailHtml,
    });

    console.log(`✅ Booking confirmation email sent to ${attendeeEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error };
  }
}

export async function sendCancellationEmail(data: BookingEmailData & { cancelReason?: string }) {
  const { attendeeName, attendeeEmail, eventTitle, startTime, organizerName, cancelReason } = data;

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(startTime);

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
  }).format(startTime);

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">❌ Booking Cancelled</h1>
    </div>

    <div class="content">
      <p>Hi <strong>${attendeeName}</strong>,</p>

      <p>Your booking has been cancelled.</p>

      <div class="details">
        <p><strong>Event:</strong> ${eventTitle}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>With:</strong> ${organizerName}</p>
        ${cancelReason ? `<p><strong>Reason:</strong> ${cancelReason}</p>` : ''}
      </div>

      <p>If you would like to reschedule, please visit the booking page again.</p>
    </div>

    <div class="footer">
      <p>© 2024 Cal Clone</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"Cal Clone" <${process.env.EMAIL_FROM || "noreply@calclone.com"}>`,
      to: attendeeEmail,
      subject: `❌ Booking Cancelled: ${eventTitle}`,
      html: emailHtml,
    });

    console.log(`✅ Cancellation email sent to ${attendeeEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending cancellation email:", error);
    return { success: false, error };
  }
}
