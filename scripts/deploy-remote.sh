#!/bin/bash
set -e

SITE_DIR="/opt/sites/book-libray"

echo "=== 🚀 شروع عملیات Decompression و Restart روی سرور ==="

cd "$SITE_DIR"

# بررسی وجود فایل‌های بیلد
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

echo "🔄 ریلود/ری‌استارت برنامه با PM2..."

# استفاده از مسیر کامل برای اطمینان از پیدا شدن PM2 در SSH
PM2_PATH=$(command -v pm2 || echo "/usr/local/bin/pm2")
NODE_PATH=$(command -v node || echo "/usr/bin/node")

if $PM2_PATH list | grep -q "qafasehman"; then
    $PM2_PATH restart qafasehman --update-env
else
    if [ -f "server.js" ]; then
        echo "🚀 شروع PM2 در حالت Standalone (server.js)..."
        # در حالت standalone نیازی به npm نیست و مستقیم با node اجرا می‌شود
        $PM2_PATH start $NODE_PATH server.js --name "qafasehman"
    else
        echo "🚀 شروع PM2 با دستور npm start..."
        $PM2_PATH start npm --name "qafasehman" -- start
    fi
fi

$PM2_PATH save

echo "🎉 فرآیند دپلوی روی سرور با موفقیت انجام گردید!"