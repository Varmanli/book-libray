import assert from "node:assert/strict";
import test from "node:test";

import { isEmailOtpEnabled } from "@/lib/auth/email-otp";

test("email OTP is disabled unless explicitly enabled", () => {
  assert.equal(isEmailOtpEnabled({}), false);
  assert.equal(isEmailOtpEnabled({ NEXT_PUBLIC_EMAIL_OTP_ENABLED: "false" }), false);
  assert.equal(isEmailOtpEnabled({ NEXT_PUBLIC_EMAIL_OTP_ENABLED: "true" }), true);
});
