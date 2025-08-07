using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Web;

[ApiController]
[Route("api/proxy")]
public class ProxyController : ControllerBase
{
    private readonly AuthProxy _authProxy;

    public ProxyController(AuthProxy authProxy)
    {
        _authProxy = authProxy;
    }

    [HttpGet("{**path}")]
    [HttpPost("{**path}")]
    [HttpPut("{**path}")]
    [HttpDelete("{**path}")]
    [HttpPatch("{**path}")]
    public async Task<IActionResult> ProxyRequest(string path)
    {
        try
        {
            // Получаем полный путь с query параметрами
            var rawPathWithQuery = "/" + path;
            if (!string.IsNullOrEmpty(Request.QueryString.Value))
            {
                rawPathWithQuery += Request.QueryString.Value;
            }

            rawPathWithQuery = HttpUtility.UrlDecode(rawPathWithQuery);

            var method = Request.Method;

            // Читаем body для POST, PUT, PATCH запросов
            object? body = null;
            if (new[] { "POST", "PUT", "PATCH" }.Contains(method.ToUpper()))
            {
                if (Request.ContentLength > 0)
                {
                    using var reader = new StreamReader(Request.Body);
                    var bodyString = await reader.ReadToEndAsync();
                    if (!string.IsNullOrEmpty(bodyString))
                    {
                        body = bodyString;
                    }
                }
            }

            // Копируем заголовки, исключая системные
            var headers = new Dictionary<string, string>();
            foreach (var header in Request.Headers)
            {
                if (!new[] { "host", "connection" }.Contains(header.Key.ToLower()))
                {
                    headers[header.Key] = header.Value.ToString();
                }
            }

            // Извлекаем serviceId из заголовков
            string? serviceId = null;
            if (headers.ContainsKey("X-Service-Id"))
            {
                serviceId = headers["X-Service-Id"];
                headers.Remove("X-Service-Id");
            }

            var result = await _authProxy.Request(new ProxyRequestParams
            {
                Path = rawPathWithQuery,
                Method = method,
                Body = body,
                Headers = headers,
                ServiceId = serviceId
            });

            return StatusCode(result.Status, result.Data);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Proxy Error] {ex}");
            return StatusCode(500, new { message = "Ошибка прокси", error = ex.Message });
        }
    }
}