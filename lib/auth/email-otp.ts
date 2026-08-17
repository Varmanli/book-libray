/**
 * Email OTP is intentionally opt-in while the email-code provider is offline.
 *
 * This value is public because the client uses it only to decide whether to
 * render OTP controls; it grants no access by itself. Set it to "true" to
 * restore the email-verification flow once the email-code provider recovers.
 */
export function isEmailOtpEnabled(
  env: { NEXT_PUBLIC_EMAIL_OTP_ENABLED?: string } = process.env as {
    NEXT_PUBLIC_EMAIL_OTP_ENABLED?: string;
  }
) {
  return env.NEXT_PUBLIC_EMAIL_OTP_ENABLED === "true";
}
