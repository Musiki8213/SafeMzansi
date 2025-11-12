# SafeMzansi APK Installation Script
# This script installs the APK directly to your connected Android device via ADB

$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"

if (-not (Test-Path $adbPath)) {
    Write-Host "❌ ADB not found. Please install Android SDK Platform Tools." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $apkPath)) {
    Write-Host "❌ APK not found. Please build the APK first with: npm run android:build" -ForegroundColor Red
    exit 1
}

Write-Host "`n📱 Checking for connected devices...`n" -ForegroundColor Cyan
& $adbPath devices

Write-Host "`n📦 Installing APK to device...`n" -ForegroundColor Cyan
& $adbPath install -r $apkPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ APK installed successfully!" -ForegroundColor Green
    Write-Host "You can now open the SafeMzansi app on your device.`n" -ForegroundColor Green
} else {
    Write-Host "`n❌ Installation failed. Make sure:" -ForegroundColor Red
    Write-Host "   1. Your phone is connected via USB" -ForegroundColor Yellow
    Write-Host "   2. USB Debugging is enabled on your phone" -ForegroundColor Yellow
    Write-Host "   3. You've authorized the computer on your phone`n" -ForegroundColor Yellow
}

