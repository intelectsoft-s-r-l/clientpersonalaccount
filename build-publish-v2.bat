@echo off
setlocal

REM Настройки
set IMAGE=docker.edi.md/businessaccount:latest
set TAR=businessaccount.tar
set TEMP_IMAGE=businessaccount

REM Отключаем BuildKit
set DOCKER_BUILDKIT=0

echo == Сборка образа ==
docker build -t %TEMP_IMAGE% -f clientpersonalaccount.Server/Dockerfile .

if %errorlevel% neq 0 (
    echo ❌ Ошибка сборки
    exit /b 1
)

echo == Экспортируем как TAR ==
docker save %TEMP_IMAGE% -o %TAR%

echo == Импортируем обратно как image ==
docker load -i %TAR%

echo == Тегируем как конечный ==
docker tag %TEMP_IMAGE% %IMAGE%

echo == Push без oci ==
docker push %IMAGE%

echo ✅ Готово
