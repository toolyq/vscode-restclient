::npm install --save-dev webpack webpack-cli


@echo off
echo Building REST Client Extension...

cd /d "%~dp0"
echo Current directory: %cd%

:: Clean previous files
echo Cleaning previous build...
if exist "dist" (
    rmdir /s /q "dist"
    echo Removed dist directory
)
if exist "*.vsix" (
    del *.vsix
    echo Removed old .vsix files
)

:: Build with production mode
echo.
echo Building with webpack production mode...
call npm run vscode:prepublish
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo Build completed successfully!

:: Check if main file exists
if not exist "dist\extension.js" (
    echo ERROR: dist\extension.js not found!
    pause
    exit /b 1
)

echo Main extension file exists.

:: Package extension
echo.
echo Packaging extension with vsce...
call npx @vscode/vsce package
if %errorlevel% neq 0 (
    echo ERROR: Packaging failed!
    pause
    exit /b 1
)

echo.
echo Success! Extension packaged:
dir *.vsix
echo.
echo Build completed successfully!
pause
