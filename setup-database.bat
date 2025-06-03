@echo off
echo 🚀 Setting up UDS RFQ Database...
echo.

:: Check if PostgreSQL is accessible
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: PostgreSQL psql command not found in PATH
    echo Please install PostgreSQL or add it to your system PATH
    pause
    exit /b 1
)

:: Set database connection from .env.local
for /f "tokens=2 delims==" %%a in ('findstr "DATABASE_URL" .env.local') do set DATABASE_URL=%%a

if "%DATABASE_URL%"=="" (
    echo ❌ Error: DATABASE_URL not found in .env.local
    echo Please make sure your .env.local file contains DATABASE_URL
    pause
    exit /b 1
)

echo 📡 Connecting to database...
echo Using DATABASE_URL from .env.local
echo.

echo 📝 Creating database schema...
psql "%DATABASE_URL%" -f database-setup-part1.sql
if %errorlevel% neq 0 (
    echo ❌ Error executing part 1
    pause
    exit /b 1
)

psql "%DATABASE_URL%" -f database-setup-part2.sql
if %errorlevel% neq 0 (
    echo ❌ Error executing part 2
    pause
    exit /b 1
)

psql "%DATABASE_URL%" -f database-setup-part3.sql
if %errorlevel% neq 0 (
    echo ❌ Error executing part 3
    pause
    exit /b 1
)

psql "%DATABASE_URL%" -f database-setup-part4.sql
if %errorlevel% neq 0 (
    echo ❌ Error executing part 4
    pause
    exit /b 1
)

psql "%DATABASE_URL%" -f database-setup-part5.sql
if %errorlevel% neq 0 (
    echo ❌ Error executing part 5
    pause
    exit /b 1
)

echo.
echo ✅ Database setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Run seed data: npm run db:seed
echo 2. Start development server: npm run dev
echo 3. Open http://localhost:3000
echo.
pause
