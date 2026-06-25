#!/bin/bash

# exit on error
set -e

echo "🚀 Memulai 4x-Blast Engine..."

# Function to check command existence
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 0. Cek Node.js & NPM
if ! command_exists node; then
    echo "❌ Error: Node.js belum terinstall."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ Error: NPM belum terinstall."
    exit 1
fi

# 1. Cek & Copy .env
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "📄 Membuat .env dari .env.example..."
        cp .env.example .env
        echo "⚠️ Silakan edit file .env nanti jika ada konfigurasi khusus (misal: API Keys)."
    else
        echo "❌ Error: .env.example tidak ditemukan. Silakan buat .env secara manual."
        exit 1
    fi
fi

# 2. Install dependensi Backend
if [ ! -d "node_modules" ]; then
    echo "📦 Menginstal dependensi Backend..."
    npm install
fi

# 3. Install dependensi Dashboard
if [ ! -d "dashboard/node_modules" ]; then
    echo "📦 Menginstal dependensi Dashboard..."
    npm install --prefix dashboard
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
npm run dev
