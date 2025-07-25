// src/pages/BankPage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { DataTable } from "../../components/DataTable";
import { Eye } from "lucide-react";
import BankModal from "./BankModal";
import { useTranslation } from "react-i18next";

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU");
}

export default function BankPage() {
    const [tapxphoneSettings, setTapxphoneSettings] = useState([]);
    const [bankNames, setBankNames] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { token } = useAuth();
    const { t } = useTranslation();

    const [selectedTapxphoneSettings, setSelectedTapxphoneSettings] = useState(null);

    const fetchBankNames = async () => {
        try {
            const res = await fetch(`http://localhost:5001/api/proxy/MobileCashRegister/web/GetBanks`, {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "16"
                },
            });

            const data = await res.json();
            if (Array.isArray(data.banks)) {
                const map = {};
                data.banks.forEach((item) => {
                    map[item.oid] = item.name;
                });
                setBankNames(map);
            }
        } catch (err) {
            console.error("Ошибка при получении названий банков", err);
        }
    };

    const fetchTapxphoneSettings = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await fetch(
                `http://localhost:5001/api/proxy/MobileCashRegister/web/GetTapxphoneSettings`,
                {
                    method: "GET",
                    credentials: 'include',
                    headers: {
                        "Content-Type": "application/json",
                        "X-Service-Id": "16"
                    },
                }
            );

            const data = await res.json();
            if (data?.errorMessage) {
                setError(`${data.errorName || "Ошибка"}: ${data.errorMessage}`);
            } else if (Array.isArray(data.tapxphoneSettings)) {
                setTapxphoneSettings(data.tapxphoneSettings);
                setError("");
            } else {
                setError("Неожиданная структура ответа");
            }
        } catch (err) {
            setError(err.message || "Ошибка получения данных");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTapxphoneSettings();
        fetchBankNames();
    }, [token]);

    const decoratedTapxphoneSettings = tapxphoneSettings.map((tapxphoneSetting) => {
        return {
            ...tapxphoneSetting,
            nameFromApi: bankNames[tapxphoneSetting.bankOID] || "-",
            createdAtFormatted: formatDate(tapxphoneSetting.createdAt),
            updatedAtFormatted: formatDate(tapxphoneSetting.updatedAt),
            actions: (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTapxphoneSettings(tapxphoneSetting);
                    }}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-full transition-all duration-200"
                    title="Просмотреть детали"
                >
                    <Eye className="w-4 h-4" />
                </button>
            ),
        };
    });

    const columns = [
        { key: "nameFromApi", label: t("Name"), filterable: true, width: "45%" },
        { key: "login", label: t("Login"), filterable: true }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br to-indigo-100 p-0 m-0">
            <div className="w-full px-0">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#72b827] to-green-600 bg-clip-text text-transparent">
                            {t("Banks")}
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={fetchTapxphoneSettings}
                            disabled={loading}
                            className="px-4 py-2 bg-gradient-to-r from-[#72b827] to-green-600 text-white rounded-xl transition"
                            title="Обновить список"
                        >
                            {t("Reload")}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-4 text-red-600 font-semibold text-center">{error}</div>
            )}

            <DataTable
                title={`${t("Banks")} (${tapxphoneSettings.length})`}
                columns={columns}
                data={decoratedTapxphoneSettings}
                loading={loading}
                editable={false}
                onRowDoubleClick={(tap) => setSelectedTapxphoneSettings(tap)}
                selectableRow={false}
            />

            <BankModal
                bank={selectedTapxphoneSettings}
                onClose={() => setSelectedTapxphoneSettings(null)}
                onSave={(updatedBank) => {
                    fetchTapxphoneSettings();
                }}
            />
        </div>
    );
}