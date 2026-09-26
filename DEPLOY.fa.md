# از پوشهٔ بازی تا GitHub و Vercel

پروژه برای انتشار ایستا آماده است. Vercel فایل‌های بازی را می‌سازد و منتشر می‌کند؛ سرور Node دائمی، پایگاه داده و کلید API لازم نیست.

## ۱. مخزن GitHub را بساز

در GitHub یک مخزن خالی، مثلاً `press-buy-button`، بساز. هنگام ساخت مخزن، README و gitignore جدید اضافه نکن؛ این فایل‌ها در پروژه وجود دارند. آدرس مخزن را از دکمهٔ Code کپی کن.

## ۲. اولین push

ترمینال را در پوشهٔ همین پروژه، کنار `package.json`، باز کن. پوشهٔ فعلی هنوز Git ندارد؛ این دستورات برای اولین بار هستند:

```powershell
git init -b main
git add .
git status --short
git commit -m "Initial game release"
git remote add origin "YOUR_REPOSITORY_URL"
git push -u origin main
```

پیش از اجرا، `YOUR_REPOSITORY_URL` را با آدرس واقعی مخزن جایگزین کن. اگر GitHub ورود خواست، با حساب خودت وارد شو. اگر Git نام و ایمیل نویسنده خواست، مشخصات حساب خودت را برای همین مخزن تنظیم کن و commit را دوباره اجرا کن.

فایل‌های `.gitignore`، `.gitattributes`، `vercel.json`، `package-lock.json` و پوشهٔ `.github` باید همراه پروژه باشند. `.gitignore` پوشه‌های `node_modules`، `dist`، `artifacts` و فایل‌های محیطی را از commit کنار می‌گذارد. فقط پوشهٔ dist را push نکن؛ Vercel سورس و دستور ساخت را لازم دارد.

## ۳. مخزن را به Vercel وصل کن

در Vercel مسیر **Add New → Project** را باز کن، GitHub را متصل کن و مخزن بازی را **Import** کن. تنظیم‌ها:

| مورد | مقدار |
|---|---|
| Framework Preset | Other |
| Root Directory | ریشهٔ مخزن؛ پوشهٔ دارای package.json |
| Install Command | npm ci --include=dev |
| Build Command | npm run build |
| Output Directory | dist |
| Node.js | 24.x |
| Environment Variables | خالی |
| Production Branch | main |

دستور نصب، ساخت و خروجی در `vercel.json` و نسخهٔ Node در `package.json` ثبت شده‌اند؛ نیازی به واردکردن دوبارهٔ آن‌ها نیست. اگر در داشبورد تنظیم قدیمی وجود دارد، مقدارهای بالا را بررسی کن. سپس **Deploy** را بزن. بعد از پایان موفق ساخت، نشانی منتشرشدهٔ بازی را باز کن.

## ۴. انتشار تغییرات بعدی

```powershell
git add .
git commit -m "Update game"
git push
```

پس از اتصال GitHub، push به شاخهٔ Production باعث ساخت و انتشار نسخهٔ جدید می‌شود. شاخهٔ main را برای نسخهٔ عمومی نگه دار؛ شاخه‌های دیگر برای Preview قابل استفاده‌اند. استقرار Git به توکن Vercel داخل مخزن یا گردش‌کار اختصاصی Deploy نیاز ندارد.

## بررسی محلی پیش از push

با Node.js 24:

```powershell
npm ci --include=dev
npm run check
npm test
npm run build
```

برای دیدن خروجی ساخته‌شده، `npm run preview` را اجرا کن و `http://localhost:4173` را باز کن. اگر سرور توسعه از این پورت استفاده می‌کند، ابتدا آن را متوقف کن. آزمون مرورگر اختیاریِ خروجی انتشار با `npm run test:release` اجرا می‌شود و به Microsoft Edge نصب‌شده نیاز دارد؛ نصب مرورگر برای ساخت روی Vercel لازم نیست.

اگر build در Vercel شکست خورد، Build Logs را ببین. خطای نبودن package.json معمولاً با انتخاب پوشهٔ ریشهٔ درست رفع می‌شود. اگر فایل قفل جا افتاده، package-lock.json را همراه پروژه push کن. برای تغییر وابستگی‌ها، package.json و package-lock.json را با هم به‌روز کن.

ذخیرهٔ بازی و تست دستگاه روی مرورگر بازیکن می‌ماند. دامنهٔ localhost، Preview و Production ذخیره‌های جدا دارند. تعویض نسخه روی همان دامنه با نام‌های hashدارِ دارایی‌ها انجام می‌شود.

این راهنما تنظیم و مسیر انتشار را آماده می‌کند؛ اتصال حساب، push و Deploy هنوز توسط این جلسه انجام نشده‌اند.

مستندات رسمی بررسی‌شده در ۲۶ سپتامبر ۲۰۲۶:

- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/git
- https://vercel.com/docs/git/vercel-for-github
