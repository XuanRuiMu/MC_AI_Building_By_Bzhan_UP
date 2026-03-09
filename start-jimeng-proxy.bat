@echo off
echo ===================================
echo  即梦AI 代理服务器启动脚本
echo ===================================
echo.

cd /d "%~dp0server"

if not exist "node_modules" (
    echo 正在安装依赖...
    npm install
    echo.
)

echo 启动即梦AI代理服务器...
echo 访问地址: http://localhost:3002
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm start

pause
