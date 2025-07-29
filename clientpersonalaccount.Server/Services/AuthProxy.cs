using System.Buffers.Text;
using System.Text;
using System.Text.Json;
using System.Web;

public class AuthProxy : BaseProxy
{
    private readonly AuthSettingsService _authSettingsService;
    private string? _token;
    private JsonElement? _user;

    private const string LoginPath = "/ISAuthService/json/AuthorizeUser";
    private const string RefreshPath = "/ISAuthService/json/RefreshToken";
    private const string ProfileInfoPath = "/ISAuthService/json/GetProfileInfo";
    private const string ForgotPasswordPath = "/ISAuthService/json/ResetPassword";

    public AuthProxy(IHttpClientFactory httpClientFactory, AuthSettingsService authSettingsService)
        : base("https://dev.edi.md", httpClientFactory)
    {
        _authSettingsService = authSettingsService;
    }

    public void SetToken(string? token)
    {
        _token = token;
    }

    public async Task<ProxyResponse> Login(string email, string password)
    {
        var result = await Post(LoginPath, new
        {
            Email = email,
            Password = password,
            info = ""
        });

        if (result.Ok && result.Data?.TryGetProperty("Token", out var tokenProp) == true)
        {
            var token = tokenProp.GetString();
            if (!string.IsNullOrEmpty(token))
            {
                SetToken(token);
            }
        }

        return result;
    }

    public async Task<ProxyResponse> ForgotPassword(string email)
    {
        var result = await Post(ForgotPasswordPath, new
        {
            Email = email
        });

        return result;
    }

    public async Task<ProxyResponse?> RefreshToken()
    {
        if (string.IsNullOrEmpty(_token))
            throw new Exception("Нет token");

        var url = $"{RefreshPath}?Token={HttpUtility.UrlEncode(_token)}";
        var result = await Get(url);

        if (result.Ok && result.Data?.TryGetProperty("Token", out var tokenProp) == true)
        {
            var newToken = tokenProp.GetString();
            if (!string.IsNullOrEmpty(newToken))
            {
                SetToken(newToken);
            }
        }

        return result;
    }

    public async Task<JsonElement?> GetProfileInfo()
    {
        if (string.IsNullOrEmpty(_token))
            throw new Exception("Нет token");

        var url = $"{ProfileInfoPath}?Token={HttpUtility.UrlEncode(_token)}";
        var result = await Get(url);

        if (result.Ok && result.Data?.TryGetProperty("User", out var userProp) == true)
        {
            _user = userProp;
            return _user;
        }

        _user = null;
        return null;
    }

    public async Task<ProxyResponse> Request(ProxyRequestParams parameters)
    {
        parameters.Headers ??= new Dictionary<string, string>();

        // Получаем учетные данные для сервиса
        var credentials = await _authSettingsService.GetCredentialsFromSettings("dev", parameters.ServiceId);
        var base64 = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{credentials.User}:{credentials.Password}"));
        parameters.Headers["Authorization"] = $"Basic {base64}";

        // Парсим URL и добавляем параметры
        var uri = new Uri(new Uri(BaseUrl), parameters.Path);
        var uriBuilder = new UriBuilder(uri);
        var query = HttpUtility.ParseQueryString(uriBuilder.Query);

        // Добавляем токен, если его нет в параметрах
        var token = _token;
        if (!query.AllKeys.Contains("Token") && !string.IsNullOrEmpty(token))
        {
            query["Token"] = token;
        }

        uriBuilder.Query = query.ToString();
        parameters.Path = uriBuilder.Uri.PathAndQuery;

        var response = await base.Request(parameters);

        // Если получили 401 и еще не пытались обновить токен
        if (response.Status == 401 && !parameters.IsRetry)
        {
            var refreshed = await RefreshToken();

            if (refreshed?.Ok == true && refreshed.Data?.TryGetProperty("Token", out var tokenProp) == true)
            {
                var newToken = tokenProp.GetString();
                if (!string.IsNullOrEmpty(newToken))
                {
                    SetToken(newToken);
                    parameters.IsRetry = true;

                    // Обновляем токен в URL
                    var retryUri = new Uri(new Uri(BaseUrl), parameters.Path);
                    var retryUriBuilder = new UriBuilder(retryUri);
                    var retryQuery = HttpUtility.ParseQueryString(retryUriBuilder.Query);
                    retryQuery["Token"] = _token;
                    retryUriBuilder.Query = retryQuery.ToString();
                    parameters.Path = retryUriBuilder.Uri.PathAndQuery;

                    response = await base.Request(parameters);
                }
            }
            else
            {
                throw new Exception("Не удалось обновить токен");
            }
        }

        return response;
    }
}

public class ProxyRequestParams
{
    public string Path { get; set; } = "";
    public string Method { get; set; } = "GET";
    public object? Body { get; set; }
    public Dictionary<string, string>? Headers { get; set; }
    public string? ServiceId { get; set; }
    public bool IsRetry { get; set; } = false;
}