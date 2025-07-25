var builder = WebApplication.CreateBuilder(args);

// Добавляем сервисы для API
builder.Services.AddControllers();
builder.Services.AddHttpClient();

// CORS настройка для Docker/Production
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            // В production разрешаем только необходимые источники
            policy.WithOrigins("http://localhost:8080", "http://localhost")
                  .AllowCredentials()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
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

// Добавляем поддержку статических файлов для React
app.UseStaticFiles();

app.UseRouting();
app.UseCors();

// Middleware для установки токена из cookie
app.Use(async (context, next) =>
{
    var authProxy = context.RequestServices.GetRequiredService<AuthProxy>();
    var tokenFromCookie = context.Request.Cookies["auth_token"];

    if (!string.IsNullOrEmpty(tokenFromCookie))
    {
        authProxy.SetToken(tokenFromCookie);
    }
    else
    {
        authProxy.SetToken(null);
    }

    await next();
});

app.MapControllers();

// Поддержка SPA для всех остальных маршрутов
app.MapFallbackToFile("index.html");

app.Run();