using System.Text;
using System.Text.Json;

public class BaseProxy
{
    protected readonly string BaseUrl;
    private readonly IHttpClientFactory _httpClientFactory;

    public BaseProxy(string baseUrl, IHttpClientFactory httpClientFactory)
    {
        BaseUrl = baseUrl;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<ProxyResponse> Request(ProxyRequestParams parameters)
    {
        var url = BaseUrl + parameters.Path;

        using var client = _httpClientFactory.CreateClient();

        // Настраиваем заголовки
        client.DefaultRequestHeaders.Clear();
        client.DefaultRequestHeaders.Add("Accept", "application/json");

        if (parameters.Headers != null)
        {
            foreach (var header in parameters.Headers)
            {
                if (header.Key.ToLower() == "content-type") continue; // Будет установлен отдельно
                try
                {
                    client.DefaultRequestHeaders.Add(header.Key, header.Value);
                }
                catch
                {
                    // Игнорируем проблемные заголовки
                }
            }
        }

        HttpResponseMessage response;

        try
        {
            var method = new HttpMethod(parameters.Method.ToUpper());
            var request = new HttpRequestMessage(method, url);

            if (parameters.Body != null && new[] { "POST", "PUT", "PATCH" }.Contains(parameters.Method.ToUpper()))
            {
                string jsonBody;
                if (parameters.Body is string strBody)
                {
                    jsonBody = strBody;
                }
                else
                {
                    jsonBody = JsonSerializer.Serialize(parameters.Body);
                }

                request.Content = new StringContent(jsonBody, Encoding.UTF8, "application/json");
            }

            response = await client.SendAsync(request);

            var responseText = await response.Content.ReadAsStringAsync();

            if (string.IsNullOrWhiteSpace(responseText))
            {
                Console.WriteLine("[BaseProxy] Пустой ответ от сервера");
                return new ProxyResponse
                {
                    Status = (int)response.StatusCode,
                    Ok = response.IsSuccessStatusCode,
                    Data = null
                };
            }

            JsonElement? data = null;
            try
            {
                data = JsonSerializer.Deserialize<JsonElement>(responseText);
            }
            catch (JsonException)
            {
                Console.WriteLine($"[BaseProxy] Невалидный JSON: {responseText}");
                // Возвращаем текст как есть, обернутый в объект
                data = JsonSerializer.Deserialize<JsonElement>($"{{\"text\": \"{responseText.Replace("\"", "\\\"")}\"}}");
            }

            return new ProxyResponse
            {
                Status = (int)response.StatusCode,
                Ok = response.IsSuccessStatusCode,
                Data = data
            };
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"[BaseProxy] HTTP ошибка: {ex.Message}");
            throw;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[BaseProxy] Ошибка запроса: {ex}");
            throw;
        }
    }

    public async Task<ProxyResponse> Get(string path, Dictionary<string, string>? headers = null)
    {
        return await Request(new ProxyRequestParams
        {
            Path = path,
            Method = "GET",
            Headers = headers
        });
    }

    public async Task<ProxyResponse> Post(string path, object? body = null, Dictionary<string, string>? headers = null)
    {
        return await Request(new ProxyRequestParams
        {
            Path = path,
            Method = "POST",
            Body = body,
            Headers = headers
        });
    }

    public async Task<ProxyResponse> Put(string path, object? body = null, Dictionary<string, string>? headers = null)
    {
        return await Request(new ProxyRequestParams
        {
            Path = path,
            Method = "PUT",
            Body = body,
            Headers = headers
        });
    }

    public async Task<ProxyResponse> Delete(string path, object? body = null, Dictionary<string, string>? headers = null)
    {
        return await Request(new ProxyRequestParams
        {
            Path = path,
            Method = "DELETE",
            Body = body,
            Headers = headers
        });
    }
}

public class ProxyResponse
{
    public int Status { get; set; }
    public bool Ok { get; set; }
    public JsonElement? Data { get; set; }
}