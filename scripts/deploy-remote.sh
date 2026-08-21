#!/bin/bash
set -e

SITE_DIR="/opt/sites/book-libray"

echo "=== 🚀 شروع عملیات Decompression و Restart روی سرور ==="

cd "$SITE_DIR"

if [ -f "standalone.tar.gz" ]; then
    echo "📦 استخراج فایل های Standalone..."
    tar -xzf standalone.tar.gz
    rm -f standalone.tar.gz
    echo "✅ استخراج پکیج Standalone با موفقیت انجام شد."
elif [ -f ".next.tar.gz" ]; then
    echo "📦 استخراج فایل .next.tar.gz..."
    tar -xzf .next.tar.gz
    rm -f .next.tar.gz
    echo "✅ استخراج با موفقیت انجام شد."
else
    echo "❌ خطا: فایل بیلد در مسیر $SITE_DIR پیدا نشد!"
    exit 1
fi

echo "🔄 ریلود/ریاستارت برنامه با PM2..."
if pm2 list | grep -q "qafasehman"; then
    pm2 restart qafasehman --update-env
else
    if [ -f "server.js" ]; then
        echo "🚀 شروع PM2 در حالت Standalone (server.js)..."
        pm2 start server.js --name "qafasehman"
    else
        pm2 start npm --name "qafasehman" -- start
    fi
fi

pm2 save

echo "🎉 فرآیند دپلوی روی سرور با موفقیت انجام گردید!"
