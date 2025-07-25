import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

export function useValidatedForm(schema, defaultValues = {}) {
  return useForm({
    resolver: yupResolver(schema),
    defaultValues,
    mode: "onTouched", // Можно настроить: "onSubmit", "onChange"
  });
}
