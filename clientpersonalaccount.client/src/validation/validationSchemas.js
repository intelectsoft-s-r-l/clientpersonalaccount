import * as yup from "yup";

export const commonValidation = {
  username: yup.string().required("Имя пользователя обязательно"),
  password: yup
    .string()
    .min(6, "Минимум 6 символов")
    .required("Пароль обязателен"),
};

export const loginSchema = yup.object({
  ...commonValidation,
});

export const registerSchema = yup.object({
  ...commonValidation,
  email: yup.string().email("Неверный email").required("Email обязателен"),
});
