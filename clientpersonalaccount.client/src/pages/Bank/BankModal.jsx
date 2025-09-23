import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import apiService from '../../services/apiService';
import { useTranslation } from "react-i18next";

export default function BankModal({ banks, bank, onClose, onSave, onSuccess, onError }) {
    const [formData, setFormData] = useState({
        bankOID: "",
        login: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { getTokenFromServer } = useAuth();
    const [token, setToken] = useState(null);
    const [availableBanks, setAvailableBanks] = useState([]);
    const { t } = useTranslation();

    const fetchToken = async () => {
        const result = await getTokenFromServer();
        setToken(result);
    };

    useEffect(() => {
        // Загрузка доступных банков
        const fetchAvailableBanks = async () => {
            try {

                const data = await apiService.proxyRequest(`/MobileCashRegister/web/GetBanks`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Service-Id": "16",
                    },
                })
                setAvailableBanks(data.banks);
            } catch (error) {
                console.error(t("InternalError"), error);
            }
        };

        fetchAvailableBanks();
    }, []);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    useEffect(() => {
        if (bank) {
            setFormData({
                bankOID: bank.bankOID || "",
                login: bank.login || "",
            });
        }

        fetchToken();
    }, [bank, getTokenFromServer]);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleBankSelect = (e) => {
        const selectedBankOID = e.target.value;
        const selectedBank = availableBanks.find(b => b.bankOid === selectedBankOID);

        setFormData(prev => ({
            ...prev,
            bankOID: selectedBankOID
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            console.warn("Токен не получен, сохранение невозможно");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Проверяем на дубликат
            const isDuplicate = banks.some(
                (item) => item.bankOID === Number(formData.bankOID)
            );
            if (isDuplicate) {
                onError();
                setLoading(false);
                return;
            }

            const payload = {
                token: token,
                oid: bank.oid,
                bankOID: formData.bankOID,
                login: formData.login
            };

            const responseData = await apiService.proxyRequest(`/MobileCashRegister/web/UpsertTapxphoneSetting`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "16",
                },
                body: JSON.stringify(payload),
            })

            if (onSave) onSave(responseData); // callback в родителе

            if (onSuccess) onSuccess();

            onClose();
        } catch (err) {
            console.error(t("InternalError"), err);
            setError(t("InternalError"));
        } finally {
            setLoading(false);
        }
    };

    if (!bank) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 pl-4 pr-4"
            onMouseDown={(e) => {
                // Закрываем только если клик по самому фону (а не дочерним элементам)
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl p-6 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-semibold text-indigo-700 mb-4">
                    {t("Contract_Bank")}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                    <div>
                        <label className="font-semibold block mb-1">{t("Contract_NameBanks")}</label>
                        <select
                            name="bankOID"
                            value={formData.bankOID}
                            onChange={handleBankSelect}
                            className="w-full border px-3 py-2 rounded"
                            required
                        >
                            <option value="">{t("ChooseBank")}</option>
                            {availableBanks.filter(b => b.oid && b.isActive).map((b, i) => (
                                    <option key={b.bankOid} value={b.oid}>
                                        {b.name}
                                    </option>
                                )
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">{t("Login") }</label>
                        <input
                            name="login"
                            value={formData.login}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded"
                            required
                        />
                    </div>

                    {error && <div className="text-red-500">{error}</div>}

                    <div className="flex justify-end space-x-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
                        >
                            {t("Cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            {t("Save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
