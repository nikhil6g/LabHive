import nodemailer from "nodemailer";
import dotenv from "dotenv";
import schedule from "node-schedule";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Disable SSL certificate validation and should not be done in production mode as it promotes man-in-the-middle attacks
  }, // This is done to avoid the error: self signed certificate in certificate chain
});

// 1. Low stock notification
export async function sendLowStockEmail(item) {
  const mailOptions = {
    from: process.env.EMAIL_ID,
    to: process.env.ADMIN_EMAIL,
    subject: `Low Stock Alert: ${item.name}`,
    html: `
      <h2>Low Stock Alert!</h2>
      <p>Item ${item.name} (ID: ${item._id}) is below the low stock threshold.</p>
      <p>Current stock: ${item.availableQuantity}</p>
      <p>Threshold: ${item.lowStockThreshold}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Low stock email sent for item ${item.name}`);
  } catch (error) {
    console.error("Error sending low stock email:", error);
  }
}

// 2. Return reminder
export async function scheduleReturnReminder(log, user) {
  if (log.action === "borrowed" && log.expectedReturnDate) {
    const reminderDate = new Date(log.expectedReturnDate);
    reminderDate.setDate(reminderDate.getDate() - 1); // 1 day before return

    const mailOptions = {
      from: process.env.EMAIL_ID,
      to: user.email,
      subject: `Reminder: Return ${log.item.name}`,
      html: `
        <h2>Friendly Reminder</h2>
        <p>Please remember to return ${
          log.item.name
        } (Serial: ${log.serialNumbers.join(
        ", "
      )}) by ${log.expectedReturnDate.toLocaleDateString()}.</p>
        <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
          <em>If you've already returned this item, please disregard this message.</em>
        </p>
      `,
    };

    // Schedule email using node-schedule

    schedule.scheduleJob(reminderDate, async () => {
      try {
        await transporter.sendMail(mailOptions);
        console.log(`Reminder sent to ${user.email}`);
      } catch (error) {
        console.error("Error sending reminder email:", error);
      }
    });
  }
}
