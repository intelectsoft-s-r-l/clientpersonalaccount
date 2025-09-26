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
    CheckedFiscalizationCardOffline: false,
    SistemPaymentSmart: null,
};

const GlobalSettingsForm = forwardRef(({ initialSettings, onChange }, ref) => {
    const [settings, setSettings] = useState({ ...defaultSettings, ...initialSettings });
    const [options, setOptions] = useState([]);
    const [cashRegisterTypes, setCashRegisterTypes] = useState([]);
    const { t } = useTranslation();
    const maxPrice = process.env.NODE_ENV === "development" ? 3000000 : 100000;

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

    useEffect(() => {
        // После загрузки options
        if (settings.MIA && options.length) {
            const opt = options.find((o) => o.apyKey === settings.MIA);
            if (opt) {
                setSettings((prev) => ({ ...prev, SistemPaymentSmart: opt.id }));
            }
        }
    }, [settings.MIA, options]);

    useImperativeHandle(ref, () => ({
        getGlobalSettings: () => settings,
    }));

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;

        if (name === "SistemPaymentSmart") {
            const selectedOpt = options.find((opt) => opt.id === value);

            setSettings((prev) => {
                const updated = {
                    ...prev,
                    SistemPaymentSmart: value,       // сохраняем выбранный posID
                    MIA: selectedOpt?.apyKey || "00000000-0000-0000-0000-000000000000", // ставим apiKey в MIA
                };
                onChange?.(updated);
                return updated;
            });
            return;
        }

        // дефолтное поведение
        setSettings((prev) => {
            let newValue;

            if (type === "checkbox") {
                newValue = checked;
            } else {
                newValue = value;
            }

            const updated = {
                ...prev,
                [name]: newValue,
            };
            onChange?.(updated);
            return updated;
        });
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
                        name="VisualInterface"
                        value={settings.VisualInterface || ""}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
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
                        name="SistemPaymentSmart"
                        value={settings.SistemPaymentSmart || ""}
                        onChange={handleChange}
                        onClick={handleChange}
                        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        {options.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.posID + ` (${opt.address})`}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col space-y-1 text-gray-700">
                    <span>{t("MaxInvoiceAmount")}</span>
                    <input
                        type="number"
                        name="MaxInvoiceAmount"
                        value={settings.MaxInvoiceAmount}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            const maxPrice = process.env.NODE_ENV === "development" ? 3000000 : 100000;

                            const numericValue = Number(newValue);
                            if (!isNaN(numericValue) && numericValue > maxPrice) return;

                            handleChange(e);
                        }}
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
                        readOnly={true}
                        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder={t("MIA")}
                    />
                </label>

                <label className="flex flex-col space-y-1 text-gray-700">
                    <span>{t("MaxServiceAmount")}</span>
                    <input
                        type="number"
                        name="MaxServiceAmount"
                        value={settings.MaxServiceAmount}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            const maxPrice = process.env.NODE_ENV === "development" ? 3000000 : 100000;

                            const numericValue = Number(newValue);
                            if (!isNaN(numericValue) && numericValue > maxPrice) return;

                            handleChange(e);
                        }}
                        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        min={0}
                    />
                </label>
            </div>
        </div>
    );
});

export default GlobalSettingsForm;
