import { useAuth } from "../../context/AuthContext";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import Logo from "../../styles/LOGO.png";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [form, setForm] = useState({ username: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await forgotPassword(form.username);

    if (!result.success) {
      setError(result.error);
    } else {
      setSuccessMessage("Пароль успешно сброшен. Сейчас вы будете перенаправлены...");
      setTimeout(() => {
        navigate("/login"); // переход через 2 секунды
      }, 2000);
    }

    setLoading(false);
  };

  return (
      <div id="forgot-password" className="position-relative min-h-screen" style={{ backgroundColor: "#d2eff2" }}>
      <div className="position-absolute top-0 end-0 p-3 z-50">
        <LanguageSwitcher />
      </div>
      <div className="container d-flex flex-column align-items-center justify-content-center min-vh-100 gap-4">
        <div className="brand-logo">
          <img src={Logo} alt="Logo" className="w-[120px] h-auto object-contain" />
        </div>
        <div className="card p-4 shadow" style={{ maxWidth: "400px", maxHeight: "500px", width: "100%" }}>
          <h3 className="mb-4 text-center">{t("ResetPassword")}</h3>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">{t("Login")}</label>
              <input
                type="text"
                name="username"
                className="form-control"
                value={form.username}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder={t("ResetPasswordHeader")}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? t("ResetPassword") : t("ResetPassword")}
            </button>
            {error && <div className="alert alert-danger">{error}</div>}
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
