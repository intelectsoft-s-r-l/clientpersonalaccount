var builder = WebApplication.CreateBuilder(args);

// Добавляем сервисы для API
builder.Services.AddControllers();
builder.Services.AddHttpClient();

// CORS настройка для Docker/Production
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // <-- Укажи ТОЛЬКО нужный origin, не "*"
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // <-- ВАЖНО
    });
});

// Регистрируем наши прокси сервисы
builder.Services.AddSingleton<AuthProxy>();
builder.Services.AddSingleton<AuthSettingsService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("AllowFrontend");
// Добавляем поддержку статических файлов для React
app.UseStaticFiles();

// Middleware для установки токена из cookie
app.Use(async (context, next) =>
{
    var authProxy = context.RequestServices.GetRequiredService<AuthProxy>();
    var tokenFromCookie = context.Request.Cookies["auth_token"];

    if (!string.IsNullOrEmpty(tokenFromCookie))
    {
        authProxy.SetToken(tokenFromCookie);
    }

    await next();
});

app.MapControllers();

// Поддержка SPA для всех остальных маршрутов
app.MapFallbackToFile("index.html");

app.Run();