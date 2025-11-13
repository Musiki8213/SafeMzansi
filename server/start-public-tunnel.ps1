# Start localtunnel and display the public URL
Write-Host "Starting localtunnel for port 5000..." -ForegroundColor Green
Write-Host "Make sure your backend server is running on port 5000!" -ForegroundColor Yellow
Write-Host ""
Write-Host "The public URL will appear below. Share this URL with your lecturer:" -ForegroundColor Cyan
Write-Host "Format: https://xxxxx.loca.lt/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""

lt --port 5000

