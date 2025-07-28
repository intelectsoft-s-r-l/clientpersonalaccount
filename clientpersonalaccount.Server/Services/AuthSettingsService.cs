using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

public class AuthSettingsService
{
    private readonly IHttpClientFactory _httpClientFactory;

    private static readonly AuthCredentials DevAuth = new("dev_config", "Mg4%22_q!~io3lL");
    private static readonly AuthCredentials ProdAuth = new("prodLogin", "prodPassword");

    public AuthSettingsService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    private static string GetAuthHeader(string env = "dev")
    {
        var creds = env == "prod" ? ProdAuth : DevAuth;
        var base64 = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{creds.Login}:{creds.Password}"));
        return $"Basic {base64}";
    }

    private static string Md5Hash(string payload)
    {
        using var md5 = MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLower();
    }

    private static ServiceCredentials DecodeApiCredential(string dataBase64, string uri)
    {
        var md5Uri = Md5Hash(uri);
        var reversed = md5Uri.Substring(0, 32);
        if (reversed.Length < 32)
            reversed = reversed.PadRight(32, '0');

        var keyIVHash = Md5Hash(reversed);
        var forivDecrypt = keyIVHash.Substring(0, 16);

        var key = Encoding.UTF8.GetBytes(reversed);
        var iv = Encoding.UTF8.GetBytes(forivDecrypt);
        var encrypted = Convert.FromBase64String(dataBase64);

        using var aes = Aes.Create();
        aes.Key = key;
        aes.IV = iv;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var decryptor = aes.CreateDecryptor();
        using var msDecrypt = new MemoryStream(encrypted);
        using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
        using var srDecrypt = new StreamReader(csDecrypt);

        var decrypted = srDecrypt.ReadToEnd();
        return JsonSerializer.Deserialize<ServiceCredentials>(decrypted)
               ?? throw new Exception("Failed to deserialize credentials");
    }

    public async Task<ServiceCredentials> GetCredentialsFromSettings(string env = "dev", string? serviceId = null)
    {
        serviceId ??= "29"; // Значение по умолчанию

        var url = $"https://dev.edi.md/ISConfigManagerServiceAPI/app/GetServiceURI?Service={serviceId}";

        using var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", GetAuthHeader(env));

        var response = await client.GetAsync(url);

        if (!response.IsSuccessStatusCode)
            throw new Exception("Не удалось получить settings");

        var json = await response.Content.ReadAsStringAsync();
        var settingsResponse = JsonSerializer.Deserialize<SettingsResponse>(json);

        if (string.IsNullOrEmpty(settingsResponse?.settings))
            throw new Exception("settings не найдены");

        // Декодируем зашифрованные настройки
        var decoded = DecodeApiCredential(settingsResponse.settings, settingsResponse.uri ?? url);

        return decoded;
    }
}

public record AuthCredentials(string Login, string Password);

public class ServiceCredentials
{
    public string User { get; set; } = "";
    public string Password { get; set; } = "";
}

public class SettingsResponse
{
    public string? settings { get; set; }
    public string? uri { get; set; }
}