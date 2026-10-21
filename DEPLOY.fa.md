# از پوشهٔ بازی تا GitHub و Vercel

این راهنما برای انتشار بازی و توابع سرور پژواک روی Vercel است. راه‌اندازی سرور مستقل، گزینهٔ جایگزین در [راهنمای Node و Redis](NETWORK-SETUP.fa.md) است.

Vercel فایل‌های بازی را می‌سازد و منتشر می‌کند. بازی انفرادی به پایگاه داده نیاز ندارد؛ سرور پژواک با دو تابع داخل api و یک Redis خارجی اجرا می‌شود.

## رفع خطای Production در ۲۱ اکتبر ۲۰۲۶

خطای `Production size budget exceeded ... initial scripts 238.4 KiB` در همین پروژه بازتولید و اصلاح شد. ابزار Speed Insights فقط در Production اضافه می‌شود؛ حجم تقریباً ۱ KiB آن اکنون سقف مستقل ۱٫۵ KiB دارد. سقف خود بازی ۲۳۸ KiB و سقف کل خروجی ۵۹۰ KiB همچنان بررسی می‌شوند. `npm run test:vercel` هر سه حالت محلی، Preview و Production را می‌سازد و دارایی‌ها و ورودی‌های API را بررسی می‌کند؛ CI نیز این دستور را اجرا می‌کند.

برای انتشار اصلاح: سورس تازه شامل tools/build.mjs، tools/verify-vercel.mjs، tests/vercel-adapters.test.mjs، package.json و vercel.json را در مخزن متصل قرار بده و Deploy جدید بگیر. Redeploy یک commit قدیمی شامل اصلاحات محلی نمی‌شود. تنظیم‌های جدول پایین را حفظ کن؛ Build Command همان `npm run build` است. بدون لاگ یا URL حساب شما، موفقیت Deploy ابری در این جلسه تأیید نشده است.

## ۱. مخزن GitHub را بساز

در GitHub یک مخزن خالی، مثلاً `press-buy-button`، بساز. هنگام ساخت مخزن، README و gitignore جدید اضافه نکن؛ این فایل‌ها در پروژه وجود دارند. آدرس مخزن را از دکمهٔ Code کپی کن.

## ۲. اولین push

ترمینال را در پوشهٔ همین پروژه، کنار `package.json`، باز کن. این دستورات فقط برای پوشه‌ای هستند که هنوز مخزن و remote ندارد؛ اگر قبلاً Git را تنظیم کرده‌ای، وضعیت فعلی را بررسی کن و به مرحلهٔ انتشار تغییرات بعدی برو:

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
| Environment Variables | انفرادی: خالی؛ پژواک: REDIS_URL و GHOST_NAMESPACE |
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
npm run test:vercel
```

برای دیدن خروجی ساخته‌شده، `npm run preview` را اجرا کن و `http://localhost:4173` را باز کن. اگر سرور توسعه از این پورت استفاده می‌کند، ابتدا آن را متوقف کن. آزمون مرورگر اختیاریِ خروجی انتشار با `npm run test:release` اجرا می‌شود و به Microsoft Edge نصب‌شده نیاز دارد؛ نصب مرورگر برای ساخت روی Vercel لازم نیست.

اگر build در Vercel شکست خورد، Build Logs را ببین. خطای نبودن package.json معمولاً با انتخاب پوشهٔ ریشهٔ درست رفع می‌شود. اگر فایل قفل جا افتاده، package-lock.json را همراه پروژه push کن. برای تغییر وابستگی‌ها، package.json و package-lock.json را با هم به‌روز کن.

ذخیرهٔ بازی و گزارش تست دستگاه روی مرورگر بازیکن می‌ماند. دامنهٔ localhost، Preview و Production ذخیره‌های جدا دارند. تعویض نسخه روی همان دامنه با نام‌های hashدارِ دارایی‌ها انجام می‌شود.

## سرور پژواک روی Vercel

پشتیبانی WebSocket طبق اعلام رسمی Vercel در ۲۰ اکتبر ۲۰۲۶ عمومی شده است. api/ghost-socket.js سرور HTTP را بدون listen صادر می‌کند؛ این همان قرارداد مستند فعلی است. Fluid compute در vercel.json صریحاً روشن است.

۱. در Environment Variables پروژه، مقدار REDIS_URL را برای محیط موردنظر قرار بده. این مقدار باید آدرس اتصال TCP از نوع redis:// یا rediss:// باشد؛ REST URL به تنهایی کافی نیست. Redis باید Lua و Pub/Sub را پشتیبانی کند.
۲. GHOST_NAMESPACE را برای Production برابر production و برای هر Preview یک نام جدا مانند preview-branch قرار بده تا اتاق‌های آزمایش و عمومی مخلوط نشوند. Deploy تازه بگیر تا متغیرها به توابع برسند. برای بازی انفرادی، این متغیر لازم نیست.
۳. روی دامنهٔ منتشرشده مسیر /api/ghost-room را باز کن: enabled:true یعنی اتاق آماده است؛ reason:not_configured یعنی متغیر تنظیم نشده و unavailable یعنی اتصال Redis برقرار نشده است. این وضعیت‌ها از خطای Build جدا هستند.
۴. از دو مرورگر «سرور پژواک» را باز کن و متصل شو. تعداد هم‌بازی‌ها و حرکت را بررسی کن. آدرس /api/ghost-socket برای WebSocket است؛ باز کردن عادی آن پاسخ 426 می‌دهد و این پاسخ به تنهایی نشانهٔ خرابی نیست.

منابع رسمی بررسی‌شده در ۲۱ اکتبر ۲۰۲۶:

- https://vercel.com/docs/functions/websockets
- https://vercel.com/changelog/websocket-support-is-now-generally-available
- https://vercel.com/docs/project-configuration/vercel-json#fluid

## Speed Insights

بستهٔ رسمی `@vercel/speed-insights@2.0.0` نصب و در `package-lock.json` قفل شده است. بازی Vanilla JavaScript است؛ اتصال با `injectSpeedInsights` انجام می‌شود و کامپوننت Next.js لازم ندارد.

ساخت Vercel با مقدار استاندارد `VERCEL_ENV=production` یک فایل کوچکِ نسخه‌دار به HTML اضافه می‌کند. ساخت محلی و Preview این فایل را ندارند. حتی اگر خروجی Production روی localhost باز شود، جمع‌آوری داده شروع نمی‌شود. متغیر محیطی دستی، API key یا DSN لازم نیست؛ متغیرهای سیستمی معمول Vercel باید در ساخت در دسترس باشند.

برای دیدن آمار واقعی:

1. در پروژهٔ مربوط در Vercel، بخش **Speed Insights** را باز کن. اگر دکمهٔ **Enable** وجود دارد، قابلیت را فعال کن؛ وضعیت پلن و هزینهٔ احتمالی را همان‌جا بررسی کن.
2. فایل‌های تغییرکردهٔ پروژه، شامل `package.json`، `package-lock.json`، `tools/build.mjs` و `src/speed-insights.js` را همراه نسخهٔ بازی push کن و ساخت Production تازه بگیر. نسخهٔ قبلاً منتشرشده خودکار با تغییر فایل محلی عوض نمی‌شود.
3. در Build Logs باید `Vercel Speed Insights: enabled for Production` دیده شود. سایت Production را باز کن و با صفحه تعامل داشته باش. داشبورد پس از دریافت نمونه‌های واقعی پر می‌شود؛ انتظار دادهٔ آزمایشی از localhost یا Preview نداشته باش.

اسکریپت از `/_vercel/speed-insights/script.js` و ارسال سنجه‌ها به `/_vercel/speed-insights/vitals` روی همان دامنه انجام می‌شود؛ سیاست CSP فعلی نیازی به بازترشدن ندارد. بخش `beforeSend` پارامترهای query، fragment و اطلاعات ورود احتمالی URL را حذف می‌کند. این اتصال، ذخیرهٔ بازی، گزارش بنچمارک، پایان‌ها یا تصمیم‌های بازیکن را به عنوان رویداد ارسال نمی‌کند. خود Speed Insights سنجه‌های کارایی وب را جمع می‌کند و جای سنجش FPS گیم‌پلی را نمی‌گیرد.

راه‌انداز بسته حدود ۱ KiB gzip به دانلود اولیهٔ Production اضافه می‌کند؛ اسکریپت سنجش که Vercel در زمان اجرا ارائه می‌کند جداست و در گزارش حجم `dist` حساب نمی‌شود. بازی با مسدودبودن ابزار سنجش نیز قابل اجراست.

اگر داده نیامد، ابتدا Production بودن ساخت، وضعیت Enable در داشبورد و مسدودنبودن دو مسیر بالا توسط افزونه‌ها را بررسی کن. برای آزمایش محلی نیاز نیست سیاست امنیتی مرورگر را تغییر بدهی.

کد و سه حالت ساخت محلی، Preview و Production در ۱۴ اکتبر ۲۰۲۶ بررسی شدند؛ فعال‌بودن قابلیت در حساب Vercel و دریافت رویداد روی دامنهٔ منتشرشده در این جلسه تأیید نشد.

این راهنما تنظیم و مسیر انتشار را آماده می‌کند؛ اتصال حساب، push و Deploy هنوز توسط این جلسه انجام نشده‌اند.

مستندات رسمی بررسی‌شده در ۲۶ سپتامبر ۲۰۲۶:

- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/git
- https://vercel.com/docs/git/vercel-for-github
