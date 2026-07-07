# نمونه فایل‌های ایمپورت پروفایل رفرنس‌ها

این پوشه نمونه‌های آماده برای ایمپورت پروفایل نویسنده، مترجم و ناشر در قفسه را نگه می‌دارد.

فایل‌های موجود:

- `author.sample.json`
- `translator.sample.json`
- `publisher.sample.json`
- `mixed.sample.json`

## 1. ساختار کلی

هر فایل JSON باید یک آرایه از پروفایل‌ها باشد. هر پروفایل می‌تواند این فیلدها را داشته باشد:

- `type`
- `name`
- `originalName`
- `slug`
- `country`
- `birthYear`
- `deathYear`
- `description`
- `shortDescription`
- `imageFilename`
- `imageUrl`
- `sourceName`
- `sourceUrl`
- `seoTitle`
- `seoDescription`
- `website`

نمونه‌ی ساده:

```json
[
  {
    "type": "AUTHOR",
    "name": "آلبر کامو",
    "originalName": "Albert Camus",
    "slug": "albert-camus",
    "imageFilename": "albert-camus.jpg",
    "imageUrl": null
  }
]
```

## 2. قوانین تطبیق

سیستم ایمپورت JSON رفرنس‌ها را به این ترتیب پیدا می‌کند:

1. `type + slug`
2. `type + normalized name`

اگر همان `slug` دوباره ایمپورت شود، رفرنس موجود به‌روزرسانی می‌شود و رفرنس تکراری ساخته نمی‌شود.

برای همین:

- `slug` باید پایدار باشد.
- `slug` باید در هر نوع (`AUTHOR`، `TRANSLATOR`، `PUBLISHER`) یکتا باشد.
- بهتر است `slug` همیشه انگلیسی و kebab-case باشد.

نمونه‌های خوب:

- `albert-camus`
- `reza-alizadeh`
- `roozaneh`

## 3. نام‌گذاری فایل تصویر

برای آپلود گروهی، `imageFilename` باید یکتا و روشن باشد.

پیشنهاد اصلی:

- `albert-camus.jpg`
- `reza-alizadeh.jpg`
- `roozaneh.jpg`

از نام‌های عمومی مثل `avatar.jpg` یا `logo.jpg` در فایل‌های mixed یا آپلود گروهی استفاده نکنید، چون ممکن است چند پروفایل با یک نام فایل تداخل پیدا کنند.

اگر از پوشه‌ی جدا برای هر پروفایل استفاده می‌کنید، `avatar.jpg` یا `logo.jpg` قابل قبول است، اما در آن حالت هم `imageFilename` باید دقیقاً با فایل واقعی هماهنگ باشد.

نکته:

- media uploader فایل‌ها را بر اساس `basename` تطبیق می‌دهد.
- `imageUrl` معمولاً قبل از آپلود باید `null` باشد.
- بعد از آپلود تصویر، قفسه `imageUrl` نهایی را خودش ثبت می‌کند.

## 4. نمونه نویسنده

فایل: `author.sample.json`

این نمونه برای نویسنده‌ای مثل آلبر کامو است و از `slug` و `imageFilename` یکتای انگلیسی استفاده می‌کند.

## 5. نمونه مترجم

فایل: `translator.sample.json`

این نمونه ساختار پیشنهادی برای مترجم را نشان می‌دهد و از نام فایل یکتای `reza-alizadeh.jpg` استفاده می‌کند.

## 6. نمونه ناشر

فایل: `publisher.sample.json`

این نمونه ساختار پیشنهادی برای ناشر را نشان می‌دهد و از فایل `roozaneh.jpg` استفاده می‌کند.

## 7. آپلود تصاویر

مسیر ادمین:

- `/admin/references/import`

روند پیشنهادی:

1. فایل JSON را انتخاب کنید.
2. روی `بررسی فایل` بزنید.
3. اگر نتیجه درست بود، `ثبت اطلاعات` را بزنید.
4. فایل‌های تصویر یا پوشه را انتخاب کنید.
5. روی `بررسی تصاویر` بزنید.
6. بعد از دیدن تطبیق دقیق، `آپلود و اتصال تصاویر` را اجرا کنید.

برای آپلود گروهی بهتر است نام فایل‌های واقعی دقیقاً همین‌ها باشند:

- `albert-camus.jpg`
- `reza-alizadeh.jpg`
- `roozaneh.jpg`

## 8. نکات مهم

- برای آپلود گروهی، `imageFilename` هر پروفایل را یکتا نگه دارید.
- `slug` را بعد از شروع استفاده، بی‌دلیل تغییر ندهید.
- `null` ها نباید روی داده‌های مفید موجود overwrite شوند مگر وقتی `overwrite` را فعال کرده باشید.
- اگر دوباره همان فایل با همان `slug` ایمپورت شود، سیستم باید رفرنس قبلی را تکمیل کند، نه اینکه رفرنس تکراری بسازد.
- اگر فایل‌ها را در پوشه‌های جدا نگه می‌دارید، ساختاری مثل این هم مناسب است:

```text
references/authors/albert-camus/albert-camus.jpg
references/translators/reza-alizadeh/reza-alizadeh.jpg
references/publishers/roozaneh/roozaneh.jpg
```
