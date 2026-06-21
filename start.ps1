Write-Host "🚀 Memulai Joki Blast Engine..." -ForegroundColor Cyan

# 1. Cek & Copy .env
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "📄 Membuat .env dari .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
    } else {
        Write-Host "⚠️ .env.example tidak ditemukan, silakan buat .env secara manual." -ForegroundColor Red
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
    Set-Location dashboard
    npm install
    Set-Location ..
}

# 4. InisialDatabase SQLite
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
