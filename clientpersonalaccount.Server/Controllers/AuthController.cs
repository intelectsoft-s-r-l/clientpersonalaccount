using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthProxy _authProxy;

    public AuthController(AuthProxy authProxy)
    {
        _authProxy = authProxy;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var result = await _authProxy.Login(request.Email, request.Password);

            if (result.Ok && result.Data?.GetProperty("Token").GetString() != null)
            {
                var token = result.Data.Value.GetProperty("Token").GetString();

                Response.Cookies.Append("auth_token", token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    MaxAge = TimeSpan.FromHours(2)
                });

                return Ok(new { message = "Успешный вход" });
            }
            else
            {
                return StatusCode(result.Status, result.Data);
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Ошибка авторизации", error = ex.Message });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        try
        {
            var token = Request.Cookies["auth_token"];
            if (string.IsNullOrEmpty(token))
                return Unauthorized(new { message = "Отсутствует token" });

            _authProxy.SetToken(token);
            var response = await _authProxy.RefreshToken();

            if (response?.Ok == true && response.Data?.GetProperty("Token").GetString() != null)
            {
                var newToken = response.Data.Value.GetProperty("Token").GetString();

                Response.Cookies.Append("auth_token", newToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    MaxAge = TimeSpan.FromHours(2)
                });

                return Ok(new { message = "Обновление успешно" });
            }

            return Unauthorized(new { message = "Не удалось обновить токен" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Ошибка обновления токена", error = ex.Message });
        }
    }

    [HttpPost("GetProfileInfo")]
    public async Task<IActionResult> GetProfileInfo()
    {
        try
        {
            var token = Request.Cookies["auth_token"];
            if (string.IsNullOrEmpty(token))
                return Unauthorized(new { message = "Нет токена" });

            _authProxy.SetToken(token);
            var user = await _authProxy.GetProfileInfo();

            if (user != null)
                return Ok(new { user });

            return Unauthorized(new { message = "Не удалось получить пользователя" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Ошибка получения пользователя", error = ex.Message });
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("auth_token", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax
        });

        _authProxy.SetToken(null);
        return Ok(new { message = "Выход выполнен" });
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        var token = Request.Cookies["auth_token"];
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(new { message = "Token отсутствует" });
        }

        return Ok(new { token });
    }
}

public class LoginRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}