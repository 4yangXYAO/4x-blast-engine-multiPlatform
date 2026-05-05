#!/bin/bash
echo "🚀 Memulai Joki Blast Engine..."

# 1. Cek & Copy .env
if [ ! -f .env ]; then
    echo "📄 Membuat .env dari .env.example..."
    cp .env.example .env
    echo "⚠️ Silakan edit file .env nanti jika ada konfigurasi khusus (misal: API Keys)."
fi

# 2. Install dependensi Backend
if [ ! -d "node_modules" ]; then
    echo "📦 Menginstal dependensi Backend..."
    npm install
fi

# 3. Install dependensi Dashboard
if [ ! -d "dashboard/node_modules" ]; then
    echo "📦 Menginstal dependensi Dashboard..."
    cd dashboard && npm install && cd ..
fi

# 4. Inisialisasi Database SQLite
echo "🗄️ Menginisialisasi Database..."
npm run db:init

echo "======================================================="
echo "✅ Sistem siap dijalankan!"
echo "📡 API Server berjalan di http://localhost:3000"
echo "🖥️  Dashboard berjalan di http://localhost:3001"
echo "💡 Tekan Ctrl+C untuk menghentikan semua proses."
echo "======================================================="

# 5. Jalankan API dan Dashboard bersamaan
npm run dev:api &
API_PID=$!

cd dashboard && npm run dev &
DASH_PID=$!

# Trap agar saat Ctrl+C, kedua server mati
trap "echo 'Mematikan server...'; kill $API_PID $DASH_PID; exit 0" SIGINT EXIT
wait
