// components/FormWrapper.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useValidatedForm } from "../hooks/useValidatedForm";

export function FormWrapper({ schema, defaultValues = {}, onSubmit, children }) {
    const { t } = useTranslation();

    // Если schema — функция, передаем t
    const validationSchema = typeof schema === "function" ? schema(t) : schema;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useValidatedForm(validationSchema, defaultValues);

    return children({ register, handleSubmit, errors });
}
