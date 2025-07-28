// pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { FormWrapper } from "../../components/FormWrapper";
import { PasswordField } from "../../components/PasswordField";
import { loginSchema } from "../../validation/validationSchemas";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import Logo from "../../styles/LOGO.png";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (data) => {
    setLoading(true);
    setError("");

    const result = await login(data.username, data.password);
    if (!result.success) setError(result.error);

    setLoading(false);
  };

  return (
    <div id="login" className="position-relative min-h-screen" style={{ backgroundColor: "#d2eff2" }}>
      <div className="position-absolute top-0 end-0 p-3 z-50">
        <LanguageSwitcher />
      </div>

      <div className="container d-flex flex-column align-items-center justify-content-center min-vh-100 gap-4">
        <div className="brand-logo">
          <img src={Logo} alt="Logo" className="w-[120px] h-auto object-contain" />
        </div>

        <div className="card p-4 shadow" style={{ maxWidth: "400px", width: "100%" }}>
          <h3 className="mb-3 text-center">{t("SignIn")}</h3>
          {error && <div className="alert alert-danger">{error}</div>}

          <FormWrapper schema={loginSchema} onSubmit={handleLogin}>
            {({ register, handleSubmit, errors }) => (
              <form onSubmit={handleSubmit(handleLogin)}>
                <div className="mb-3">
                  <label className="form-label">{t("Login")}</label>
                  <input
                    {...register("username")}
                    autoFocus
                    className={`form-control ${errors.username ? "is-invalid" : ""}`}
                    disabled={loading}
                  />
                  {errors.username && (
                    <div className="invalid-feedback">{errors.username.message}</div>
                  )}
                </div>

                <PasswordField
                  label={t("Password")}
                  name="password"
                  register={register}
                  error={errors.password}
                  disabled={loading}
                />

                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? t("LogInProcess") : t("LoginButton")}
                </button>
              </form>
            )}
          </FormWrapper>

          <div className="text-center mt-3">
            <button
              type="button"
              className="btn btn-link text-decoration-none"
              onClick={() => navigate("/forgot-password")}
              disabled={loading}
            >
              {t("ForgotPassword")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
