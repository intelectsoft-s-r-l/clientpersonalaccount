import React, { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiService from '../services/apiService';
import { CashRegisterTypes } from "../enums/Enums";

const defaultSettings = {
    PriceModify: false,
    VisualInterface: "default",
    ChangeDiscount: false,
    ChangeAdaos: false,
    MultiplePayment: false,
    ChangeCount: false,
    MaxInvoiceAmount: 0,
    MaxServiceAmount: 0,
    MIA: "",
    EnableSMS: false,
    CheckedFiscalizationCardOffline: false
};

const GlobalSettingsForm = forwardRef(({ initialSettings }, ref) => {
    const [settings, setSettings] = useState({ ...defaultSettings, ...initialSettings });
    const [options, setOptions] = useState([]);
    const [cashRegisterTypes, setCashRegisterTypes] = useState([]);
    const { t } = useTranslation();

    useEffect(() => {
        async function fetchOptions() {
            try {
                const data = await apiService.proxyRequest(`/PaymentAggregator/Management/pos`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Service-Id": "46",
                    },
                })
                setOptions(data.items);
            } catch (error) {
                console.error("Ошибка при загрузке опций", error);
            }
        }

        const typesArray = Array.isArray(CashRegisterTypes)
            ? CashRegisterTypes
            : Object.values(CashRegisterTypes);

        setCashRegisterTypes(typesArray);
        fetchOptions();
        setSettings({ ...defaultSettings, ...initialSettings });
    }, [initialSettings]);

    useImperativeHandle(ref, () => ({
        getGlobalSettings: () => settings,
    }));

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setSettings((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : type === "number" ? +value || 0 : value || "",
        }));
    };

    return (
        <div className="p-6 bg-gray-50 rounded-xl shadow-md w-full max-w-full mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                    ["PriceModify", "checkbox", t("PriceModify")],
                    ["ChangeDiscount", "checkbox", t("Discount")],
                    ["ChangeAdaos", "checkbox", t("Adaos")],
                    ["MultiplePayment", "checkbox", t("MultiplePayment")],
                    ["ChangeCount", "checkbox", t("ChangeCountAssortment")],
                    ["EnableSMS", "checkbox", t("MCR_SMSService")],
                    ["DisconnectISPayment", "checkbox", t("DisconnectISPayment")]
                ].map(([key, type, label]) => (
                    <label
                        key={key}
                        className="flex items-center space-x-3 cursor-pointer select-none text-gray-700"
                    >
                        <input
                            type={type}
                            name={key}
                            checked={!!settings[key]}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-base">{label}</span>
                    </label>
                ))}

                <label className="flex flex-col space-y-1 text-gray-700">
                    <span>{t("Type")}</span>
                    <select
                        name="Type"
                        value={settings.Type || ""}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">{t("PlaceholderVisualInterface")}</option>
                        {cashRegisterTypes.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col space-y-1 text-gray-700">
                    <span>{t("SistemPaymentSmart")}</span>
                    <select
                        name="VisualInterface"
                        value={settings.VisualInterface || ""}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">{t("PlaceholderVisualInterface")}</option>
                        {options.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.posID + `(${opt.address})`}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col space-y-1 text-gray-700">
                    <span>{t("MaxInvoiceAmount")}</span>
                    <input
                        type="number"
                        name="MaxInvoiceAmount"
                        value={settings.MaxInvoiceAmount ?? 0}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        min={0}
                    />
                </label>

                <label className="flex flex-col space-y-1 text-gray-700">
                    <span>{t("MaxServiceAmount")}</span>
                    <input
                        type="number"
                        name="MaxServiceAmount"
                        value={settings.MaxServiceAmount ?? 0}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        min={0}
                    />
                </label>

                <label className="flex flex-col space-y-1 text-gray-700">
                    <span>{t("MIA")}</span>
                    <input
                        type="text"
                        name="MIA"
                        value={settings.MIA || ""}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder={t("PlaceholderMIA")}
                    />
                </label>
            </div>
        </div>
    );
});

export default GlobalSettingsForm;
