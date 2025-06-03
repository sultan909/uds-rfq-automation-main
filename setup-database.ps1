# PowerShell script to setup UDS RFQ Database
Write-Host "🚀 Setting up UDS RFQ Database..." -ForegroundColor Green
Write-Host ""

# Check if PostgreSQL is accessible
try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Host "✅ PostgreSQL found" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: PostgreSQL psql command not found in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL or add it to your system PATH" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Read DATABASE_URL from .env.local
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local"
    $databaseUrl = ($envContent | Where-Object { $_ -match "^DATABASE_URL=" }) -replace "DATABASE_URL=", ""
    
    if ($databaseUrl) {
        Write-Host "📡 Using DATABASE_URL from .env.local" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "❌ Error: DATABASE_URL not found in .env.local" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "❌ Error: .env.local file not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "📝 Creating database schema..." -ForegroundColor Blue

# Execute SQL files in order
$sqlFiles = @(
    "database-setup-part1.sql",
    "database-setup-part2.sql", 
    "database-setup-part3.sql",
    "database-setup-part4.sql",
    "database-setup-part5.sql"
)

foreach ($file in $sqlFiles) {
    Write-Host "Executing $file..." -ForegroundColor Yellow
    & psql $databaseUrl -f $file
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error executing $file" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Run seed data: npm run db:seed" -ForegroundColor White
Write-Host "2. Start development server: npm run dev" -ForegroundColor White
Write-Host "3. Open http://localhost:3000" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"
