import { sendEmail, verifySmtpConnection } from "@/lib/email";
import { loadScriptEnv } from "./load-script-env";

loadScriptEnv();

async function main() {
  const recipient = process.argv[2];
  if (!recipient) {
    console.error("Usage: npm run email:test -- recipient@example.com");
    process.exitCode = 1;
    return;
  }

  const connection = await verifySmtpConnection();
  if (!connection.ok) {
    console.error("SMTP connection failed. Check the configured SMTP environment variables.");
    process.exitCode = 1;
  } else {
    const delivery = await sendEmail({
      to: recipient,
      subject: "تست ارسال ایمیل — قفسه",
      text: "این یک ایمیل آزمایشی از سامانه قفسه است.",
      html: '<!doctype html><html lang="fa" dir="rtl"><body><p>این یک ایمیل آزمایشی از سامانه قفسه است.</p></body></html>',
    });
    if (delivery.ok) console.info("Test email sent successfully.");
    else {
      console.error("Test email could not be delivered. Check SMTP configuration and server logs.");
      process.exitCode = 1;
    }
  }
}

void main();
