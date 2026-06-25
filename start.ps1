$ErrorActionPreference = "Stop"

Write-Host "🚀 Memulai 4x-Blast Engine..." -ForegroundColor Cyan

# Function to check command existence
function Test-CommandExists($Command) {
    return (Get-Command $Command -ErrorAction SilentlyContinue) -ne $null
}

# 0. Cek Node.js & NPM
if (-not (Test-CommandExists "node")) {
    Write-Host "❌ Error: Node.js belum terinstall." -ForegroundColor Red
    exit 1
}

if (-not (Test-CommandExists "npm")) {
    Write-Host "❌ Error: NPM belum terinstall." -ForegroundColor Red
    exit 1
}

# 1. Cek & Copy .env
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "📄 Membuat .env dari .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "⚠️ Silakan edit file .env nanti jika ada konfigurasi khusus (misal: API Keys)." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error: .env.example tidak ditemukan, silakan buat .env secara manual." -ForegroundColor Red
        exit 1
    }
}

# 2. Install dependensi Backend
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Menginstal dependensi Backend..." -ForegroundColor Cyan
    npm install
}

# 3. Install dependensi Dashboard
if (-not (Test-Path "dashboard/node_modules")) {
    Write-Host "📦 Menginstal dependensi Dashboard..." -ForegroundColor Cyan
    npm install --prefix dashboard
}

# 4. Inisialisasi Database SQLite
Write-Host "🗄️ Menginisialisasi Database..." -ForegroundColor Cyan
npm run db:init

Write-Host "=======================================================" -ForegroundColor Green
Write-Host "✅ Sistem siap dijalankan!" -ForegroundColor Green
Write-Host "📡 API Server berjalan di http://localhost:3000" -ForegroundColor Green
Write-Host "🖥️ Dashboard berjalan di http://localhost:3001" -ForegroundColor Green
Write-Host "💡 Tekan Ctrl+C untuk menghentikan semua proses." -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Green

# 5. Jalankan API dan Dashboard bersamaan
npm run dev
