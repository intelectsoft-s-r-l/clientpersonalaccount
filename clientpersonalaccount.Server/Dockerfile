# 1. Сборка клиента
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY ./clientpersonalaccount.client/package*.json ./
RUN npm install
COPY ./clientpersonalaccount.client ./
RUN npm run build

# 2. Сборка сервера
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ./clientpersonalaccount.Server/clientpersonalaccount.Server.csproj ./clientpersonalaccount.Server/
RUN dotnet restore ./clientpersonalaccount.Server/clientpersonalaccount.Server.csproj
COPY ./clientpersonalaccount.Server ./clientpersonalaccount.Server
COPY --from=client-build /app/client/dist ./clientpersonalaccount.Server/wwwroot
WORKDIR /src/clientpersonalaccount.Server
RUN dotnet publish -c Release -o /app/publish

# 3. Финальный образ
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 80
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "clientpersonalaccount.Server.dll"]
