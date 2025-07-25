// components/PasswordField.jsx
import React, { useState } from "react";

export function PasswordField({ label, error, register, disabled, name }) {
  const [showPassword, setShowPassword] = useState(false);
  const toggleShow = () => setShowPassword((prev) => !prev);

  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <div className="input-group">
        <input
          type={showPassword ? "text" : "password"}
          className={`form-control ${error ? "is-invalid" : ""}`}
          {...register(name)}
          disabled={disabled}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={toggleShow}
          tabIndex={-1}
        >
          <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} />
        </button>
        {error && <div className="invalid-feedback d-block">{error.message}</div>}
      </div>
    </div>
  );
}
