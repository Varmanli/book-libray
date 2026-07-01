// ثابت‌های احراز هویت بدون هیچ وابستگی به Node،
// تا بتوان آن‌ها را در رانتایم edge (middleware) هم وارد کرد.

export const AUTH_COOKIE = "token";

// توکن یک هفته اعتبار دارد
export const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
