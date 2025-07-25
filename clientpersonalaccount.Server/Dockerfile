# Этот этап используется при запуске из VS в быстром режиме (по умолчанию для конфигурации отладки)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Этап для установки Node.js
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS with-node
RUN apt-get update
RUN apt-get install curl -y
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash
RUN apt-get -y install nodejs

# Этап сборки
FROM with-node AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Копируем файлы проекта для восстановления зависимостей
COPY ["clientpersonalaccount.Server/clientpersonalaccount.Server.csproj", "clientpersonalaccount.Server/"]
COPY ["clientpersonalaccount.client/clientpersonalaccount.client.esproj", "clientpersonalaccount.client/"]

# Восстанавливаем зависимости .NET
RUN dotnet restore "./clientpersonalaccount.Server/clientpersonalaccount.Server.csproj"

# Копируем все исходные файлы
COPY . .

# Устанавливаем зависимости Node.js для клиентского приложения
WORKDIR "/src/clientpersonalaccount.client"
RUN npm install

# Собираем React приложение
RUN npm run build

# Переходим в папку серверного проекта
WORKDIR "/src/clientpersonalaccount.Server"

# Копируем собранное React приложение в wwwroot
RUN mkdir -p wwwroot
RUN cp -r ../clientpersonalaccount.client/dist/* wwwroot/ || cp -r ../clientpersonalaccount.client/build/* wwwroot/ || echo "React build not found, continuing..."

# Собираем .NET приложение
RUN dotnet build "./clientpersonalaccount.Server.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Этап публикации
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
WORKDIR "/src/clientpersonalaccount.Server"

# Публикуем .NET приложение
RUN dotnet publish "./clientpersonalaccount.Server.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Копируем React файлы в папку публикации
RUN mkdir -p /app/publish/wwwroot
RUN cp -r wwwroot/* /app/publish/wwwroot/ 2>/dev/null || echo "No wwwroot files to copy"

# Финальный этап
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Настройка переменных окружения для правильной работы в контейнере
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "clientpersonalaccount.Server.dll"]