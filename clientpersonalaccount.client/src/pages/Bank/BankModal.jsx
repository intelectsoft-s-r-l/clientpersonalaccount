import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import apiService from '../../services/apiService';

export default function BankModal({ bank, onClose, onSave }) {
    const [formData, setFormData] = useState({
        bankOID: "",
        login: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { getTokenFromServer } = useAuth();
    const [token, setToken] = useState(null);
    const [availableBanks, setAvailableBanks] = useState([]);
    const [successMessage, setSuccessMessage] = useState("");

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
                console.error("Ошибка при загрузке списка банков", error);
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
            setSuccessMessage("Банк успешно сохранён ✅");

            // Скрыть через 3 секунды
            setTimeout(() => setSuccessMessage(""), 3000);

            // Закрытие модалки через 1 секунду
            setTimeout(onClose, 1000);

            onClose();
        } catch (err) {
            console.error("Ошибка при сохранении:", err);
            setError("Не удалось сохранить банк.");
        } finally {
            setLoading(false);
        }
    };

    if (!bank) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
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
                    Редактировать банк
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                    <div>
                        <label className="font-semibold block mb-1">Название банка</label>
                        <select
                            name="bankOID"
                            value={formData.bankOID}
                            onChange={handleBankSelect}
                            className="w-full border px-3 py-2 rounded"
                            required
                        >
                            <option value="">Выберите банк</option>
                            {availableBanks.map((b, i) => {
                                if (!b.oid) return null; // пропустить без OID
                                return (
                                    <option key={b.bankOid} value={b.oid}>
                                        {b.name}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">Логин</label>
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
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            {loading ? "Сохранение..." : "Сохранить"}
                        </button>
                    </div>
                </form>
            </div>
            {successMessage && (
                <div className="fixed top-5 right-5 bg-green-100 text-green-800 px-4 py-2 rounded shadow-lg z-50 animate-fadeIn">
                    {successMessage}
                </div>
            )}
        </div>
    );
}
