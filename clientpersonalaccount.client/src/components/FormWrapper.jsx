// components/FormWrapper.jsx
import React from "react";
import { useValidatedForm } from "../hooks/useValidatedForm";

export function FormWrapper({ schema, defaultValues = {}, onSubmit, children }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useValidatedForm(schema, defaultValues);

  return children({ register, handleSubmit, errors });
}
