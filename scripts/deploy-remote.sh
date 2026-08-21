#!/bin/bash
set -e

SITE_DIR="/opt/sites/book-libray"

echo "=== 🚀 شروع عملیات Decompression و Restart روی سرور ==="

cd "$SITE_DIR"

if [ -f ".next.tar.gz" ]; then
    echo "📦 استخراج فایل .next.tar.gz..."
    tar -xzf .next.tar.gz
    rm -f .next.tar.gz
    echo "✅ استخراج با موفقیت انجام شد."
else
    echo "❌ خطا: فایل .next.tar.gz در مسیر $SITE_DIR پیدا نشد!"
    exit 1
fi

echo "🔄 ریلود/ریاستارت برنامه با PM2..."
if pm2 list | grep -q "qafasehman"; then
    pm2 restart qafasehman --update-env
else
    pm2 start npm --name "qafasehman" -- start
fi

pm2 save

echo "🎉 فرآیند دپلوی روی سرور با موفقیت انجام گردید!"
