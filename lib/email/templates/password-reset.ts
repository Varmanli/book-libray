function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]!);
}

export function passwordResetEmail(params: { resetUrl: string }) {
  const resetUrl = escapeHtml(params.resetUrl);
  return {
    subject: "بازیابی رمز عبور — قفسه",
    text: `سلام،\n\nبرای بازنشانی رمز عبور حساب خود در قفسه، لینک زیر را باز کنید:\n${params.resetUrl}\n\nاین لینک تا ۱۵ دقیقه معتبر است. اگر این درخواست را شما انجام نداده‌اید، این ایمیل را نادیده بگیرید.\n\nقفسه`,
    html: `<!doctype html><html lang="fa" dir="rtl"><body style="margin:0;background:#f8fafc;font-family:Tahoma,Arial,sans-serif;color:#1e293b"><main style="max-width:520px;margin:32px auto;padding:32px;background:#fff;border-radius:12px;text-align:right"><h1 style="font-size:22px;margin:0 0 20px">بازیابی رمز عبور</h1><p style="line-height:1.9">سلام،<br>برای بازنشانی رمز عبور حساب خود در قفسه، دکمه‌ی زیر را انتخاب کنید.</p><p style="margin:28px 0;text-align:center"><a href="${resetUrl}" style="display:inline-block;padding:13px 22px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none">بازنشانی رمز عبور</a></p><p style="line-height:1.9;color:#475569">این لینک تا ۱۵ دقیقه معتبر است. اگر این درخواست را شما انجام نداده‌اید، این ایمیل را نادیده بگیرید.</p><p style="margin:24px 0 0">قفسه</p></main></body></html>`,
  };
}
