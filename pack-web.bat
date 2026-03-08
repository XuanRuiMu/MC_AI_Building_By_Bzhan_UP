@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 生成时间戳
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set BUILD_NAME=%datetime:~0,8%-%datetime:~8,4%

echo ========================================
echo   MC AI Builder Web 打包脚本
echo ========================================
echo.

:: 检查 pkg 是否安装
where pkg >nul 2>nul
if errorlevel 1 (
    echo [1/4] 安装 pkg...
    call npm install -g pkg
)

:: 构建前端
echo [2/4] 构建前端...
call npm run build
if errorlevel 1 (
    echo 前端构建失败！
    pause
    exit /b 1
)

:: 创建输出目录
set OUTPUT_DIR=builds-web\%BUILD_NAME%
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

:: 打包服务器 (使用 CommonJS 版本)
echo [3/4] 打包服务器...
call pkg server-pkg.cjs --targets node18-win-x64 --output "%OUTPUT_DIR%\MC-AI-Builder.exe"
if errorlevel 1 (
    echo 服务器打包失败！
    pause
    exit /b 1
)

:: 复制必要文件
echo [4/4] 复制资源文件...
xcopy /E /I /Y "dist" "%OUTPUT_DIR%\dist" >nul
xcopy /E /I /Y "src\skills" "%OUTPUT_DIR%\src\skills" >nul
xcopy /E /I /Y "src\versions" "%OUTPUT_DIR%\src\versions" >nul
xcopy /E /I /Y "src\structures" "%OUTPUT_DIR%\src\structures" >nul
if not exist "%OUTPUT_DIR%\output" mkdir "%OUTPUT_DIR%\output"

:: 复制协议和说明文件
copy /Y "LICENSE" "%OUTPUT_DIR%\LICENSE" >nul
copy /Y "README.md" "%OUTPUT_DIR%\README.md" >nul 2>nul

:: 创建启动脚本
echo @echo off > "%OUTPUT_DIR%\启动.bat"
echo chcp 65001 ^>nul >> "%OUTPUT_DIR%\启动.bat"
echo echo 正在启动 MC AI Builder... >> "%OUTPUT_DIR%\启动.bat"
echo echo 浏览器将自动打开 http://localhost:3001 >> "%OUTPUT_DIR%\启动.bat"
echo start http://localhost:3001 >> "%OUTPUT_DIR%\启动.bat"
echo "MC-AI-Builder.exe" >> "%OUTPUT_DIR%\启动.bat"

echo.
echo ========================================
echo   打包完成！
echo   位置: %OUTPUT_DIR%
echo   运行: %OUTPUT_DIR%\启动.bat
echo ========================================
echo.

explorer "%OUTPUT_DIR%"
pause
