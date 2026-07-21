import type { VerificationCodePurpose } from "@/lib/email";

const purposeCopy: Record<
  VerificationCodePurpose,
  { subject: string; heading: string; description: string }
> = {
  email_verification: {
    subject: "کد تایید ایمیل — قفسه",
    heading: "تایید ایمیل",
    description: "برای تایید ایمیل و فعال‌سازی حساب قفسه، کد زیر را وارد کنید.",
  },
  login: {
    subject: "کد ورود — قفسه",
    heading: "ورود به قفسه",
    description: "برای ورود به حساب قفسه، کد زیر را وارد کنید.",
  },
  password_reset: {
    subject: "کد بازیابی رمز عبور — قفسه",
    heading: "بازیابی رمز عبور",
    description:
      "برای ادامه‌ی بازیابی رمز عبور حساب قفسه، کد زیر را وارد کنید.",
  },
};

export function verificationCodeEmail(params: {
  code: string;
  purpose: VerificationCodePurpose;
}) {
  const copy = purposeCopy[params.purpose];

  return {
    subject: copy.subject,

    text: `سلام،

${copy.description}

کد تایید: ${params.code}

این کد تا ۱۰ دقیقه معتبر است.
اگر این درخواست را شما انجام نداده‌اید، این ایمیل را نادیده بگیرید.

قفسه`,

    html: `
<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${copy.subject}</title>
</head>

<body style="
margin:0;
padding:0;
background:#f8fafc;
direction:rtl;
font-family:Vazirmatn,Tahoma,Arial,sans-serif;
color:#0f172a;
">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0" style="
max-width:520px;
background:#ffffff;
border-radius:24px;
overflow:hidden;
box-shadow:0 10px 30px rgba(15,23,42,.08);
">

<!-- Header -->
<tr>
<td style="
background:#0f766e;
padding:32px;
text-align:center;
">

<div style="
font-size:32px;
font-weight:800;
color:#ffffff;
letter-spacing:-1px;
">
قفسه
</div>

<div style="
margin-top:8px;
font-size:14px;
color:#ccfbf1;
">
کتابخانه دیجیتال شما
</div>

</td>
</tr>


<!-- Content -->
<tr>
<td style="
padding:36px 32px;
text-align:right;
">

<h1 style="
margin:0 0 20px;
font-size:24px;
font-weight:800;
color:#0f172a;
">
${copy.heading}
</h1>


<p style="
margin:0;
font-size:15px;
line-height:2;
color:#475569;
">
سلام،
<br>
${copy.description}
</p>


<!-- Code Box -->
<div style="
margin:32px 0;
background:#f0fdfa;
border:1px solid #99f6e4;
border-radius:16px;
padding:24px;
text-align:center;
">

<div style="
font-size:13px;
color:#64748b;
margin-bottom:12px;
">
کد تایید شما
</div>

<div style="
display:inline-block;
direction:ltr;
font-family:Vazirmatn,Tahoma,Arial,sans-serif;
font-size:34px;
font-weight:900;
letter-spacing:10px;
color:#115e59;
background:#ffffff;
border-radius:12px;
padding:14px 20px;
border:1px solid #ccfbf1;
">
${params.code}
</div>

</div>


<p style="
margin:0;
font-size:14px;
line-height:2;
color:#64748b;
">
این کد تا <strong style="color:#0f766e">۱۰ دقیقه</strong> معتبر است.
<br>
اگر این درخواست را شما انجام نداده‌اید، این ایمیل را نادیده بگیرید.
</p>


</td>
</tr>


<!-- Footer -->
<tr>
<td style="
padding:24px 32px;
background:#f8fafc;
text-align:center;
">

<p style="
margin:0;
font-size:13px;
color:#64748b;
">
ارسال شده توسط
<strong style="color:#0f766e">
قفسه
</strong>
</p>

</td>
</tr>


</table>

</td>
</tr>
</table>

</body>
</html>
`,
  };
}
