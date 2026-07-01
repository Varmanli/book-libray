/**
 * لایه‌ی ارسال ایمیل.
 *
 * در حال حاضر هیچ سرویس ایمیلی متصل نیست؛ بنابراین در محیط توسعه فقط در کنسول
 * لاگ می‌شود. ساختار به‌گونه‌ای است که بعداً می‌توان به‌سادگی یک ارائه‌دهنده‌ی
 * واقعی (Resend / SendGrid / SMTP و ...) را داخل `sendEmail` وصل کرد بدون اینکه
 * کد فراخواننده تغییر کند.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const isDev = process.env.NODE_ENV !== "production";
export const isEmailDevMode =
  process.env.NODE_ENV !== "production" &&
  (process.env.EMAIL_DEV_MODE === "true" || process.env.EMAIL_MODE === "dev");

export function canExposeResetTokenInDev() {
  return process.env.NODE_ENV !== "production" && isEmailDevMode;
}

export type VerificationCodePurpose =
  | "email_verification"
  | "login"
  | "password_reset";

async function sendEmail(message: EmailMessage): Promise<void> {
  // TODO(production): اینجا ارائه‌دهنده‌ی واقعی ایمیل را وصل کنید. مثال:
  //   await resend.emails.send({ from, to: message.to, subject, html });
  // و متغیرهای محیطی مربوطه (EMAIL_FROM, RESEND_API_KEY و ...) را اضافه کنید.

  if (isDev) {
    console.info(
      `\n📧 [DEV EMAIL] هیچ سرویس ایمیلی متصل نیست؛ محتوای ایمیل:\n` +
        `  to:      ${message.to}\n` +
        `  subject: ${message.subject}\n` +
        `  body:\n${message.text}\n`
    );
    return;
  }

  // در تولید اگر ارائه‌دهنده‌ای وصل نشده باشد، با خطای واضح متوقف می‌شویم.
  throw new Error(
    "[email] هیچ ارائه‌دهنده‌ی ایمیلی پیکربندی نشده است. lib/email.ts را تکمیل کنید."
  );
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  const { to, resetUrl } = params;
  await sendEmail({
    to,
    subject: "بازیابی رمز عبور — قفسه",
    text:
      `سلام،\n\nبرای بازنشانی رمز عبور حساب خود در قفسه روی لینک زیر کلیک کنید:\n` +
      `${resetUrl}\n\nاین لینک تا یک ساعت معتبر است. اگر شما این درخواست را نداده‌اید، ` +
      `این ایمیل را نادیده بگیرید.\n\nقفسه`,
    html:
      `<p>سلام،</p><p>برای بازنشانی رمز عبور حساب خود در «قفسه» روی دکمه‌ی زیر کلیک کنید:</p>` +
      `<p><a href="${resetUrl}">بازنشانی رمز عبور</a></p>` +
      `<p>این لینک تا یک ساعت معتبر است. اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.</p><p>قفسه</p>`,
  });
}

export async function sendVerificationCodeEmail(params: {
  to: string;
  code: string;
  purpose: VerificationCodePurpose;
}): Promise<void> {
  const { to, code, purpose } = params;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[email] ارسال ایمیل واقعی برای verification code هنوز پیکربندی نشده است."
    );
  }

  console.info(
    `[DEV EMAIL] Verification code for ${to}: ${code}\n` +
      `Purpose: ${purpose}\n` +
      `Expires in: 10 minutes\n`
  );
}
