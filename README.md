# TUOBA Ultimate All-in-One Multilingual Enterprise

نظام تشغيل مطاعم متعدد العلامات والفروع: POS + KDS + Pickup + Call Center + CRM + مصروفات + ريسيبي + Geidea + مالية (Branch/Brand P&L + Cash Flow) + حضور/انصراف + مدفوعات + سجلات أمان — بواجهة PWA متعددة اللغات.

## اللغات
- العربية (RTL افتراضي)
- English
- Français
- Español
- Türkçe

## التشغيل محلياً
الملفات في **جذر المستودع** (ليست داخل `app/`):

```bash
# أي خادم ثابت يكفي — مثال:
python3 -m http.server 8000
# ثم افتح: http://localhost:8000/index.html
```

> ملاحظة: Service Worker و Geolocation يتطلبان HTTPS أو `localhost`.

## الاختبارات والفحص
```bash
npm test     # node --test tests/ (finance, csv, attendance, escape, validation, ids)
npm run check  # فحص صياغة JS
```

## البنية
```
index.html          # الهيكل + CSP (بدون inline handlers)
app.js              # الواجهة والمنطق (ES Module)
lib/                # دوال نقية قابلة للاختبار
  escape.js         # منع XSS
  ids.js            # توليد IDs فريدة
  finance.js        # P&L / هامش
  csv.js            # استيراد Geidea
  attendance.js     # حساب ساعات العمل
  validation.js     # تحقق من المدخلات
style.css
sw.js               # Service Worker (كاش مُصدَّر + تحديث)
manifest.webmanifest
icons/              # أيقونات PWA
docs/               # أدلة التشغيل والمالية والأمان والموارد البشرية
tests/              # اختبارات الوحدات
```

## حدود النسخة الحالية (Prototype)
- البيانات في `localStorage` فقط — لا مزامنة بين الأجهزة بعد. المرحلة التالية: Supabase (Postgres + Auth + Realtime).
- Passkey/Biometric **محاكاة** وليست مصادقة حقيقية.
- المدفوعات سجلات محلية — ليست تكاملاً بنكياً مباشراً.
- الطباعة إعدادات فقط — لا طباعة فعلية بعد.

## الوثائق
- `docs/MASTER_GUIDE_AR.md` — الدليل الرئيسي
- `docs/architecture/` — المعمارية
- `docs/operations/` — التشغيل
- `docs/finance/` — المالية
- `docs/security/` — الأمان
- `docs/hr/` — الموارد البشرية
- `MULTILINGUAL_MODEL_AR.md` — نموذج تعدد اللغات

## النشر
- **Vercel:** استضافة ثابتة (Static) — ارفع جذر المستودع كما هو.
- **Supabase (قريباً):** قاعدة بيانات + مصادقة + Realtime لـ KDS/Pickup.
