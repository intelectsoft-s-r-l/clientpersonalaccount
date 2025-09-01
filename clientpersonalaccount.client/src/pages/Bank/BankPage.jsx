// src/pages/BankPage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { DataTable } from "../../components/DataTable";
import { Eye } from "lucide-react";
import BankModal from "./BankModal";
import { useTranslation } from "react-i18next";
import apiService from '../../services/apiService';

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
    const { t } = useTranslation();
    const { token } = useAuth();

    const [selectedTapxphoneSettings, setSelectedTapxphoneSettings] = useState(null);

    const fetchBankNames = async () => {
        try {

            const data = await apiService.proxyRequest(`/MobileCashRegister/web/GetBanks`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "16",
                }
            })

            if (Array.isArray(data.banks)) {
                const map = {};
                data.banks.forEach((item) => {
                    map[item.oid] = item.name;
                });
                setBankNames(map);
            }
        } catch (err) {
            console.error(t("InternalError"), err);
        }
    };

    const fetchTapxphoneSettings = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await apiService.proxyRequest(`/MobileCashRegister/web/GetTapxphoneSettings`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "16",
                }
            })

            if (data?.errorMessage) {
                setError(`${data.errorName || "Ошибка"}: ${data.errorMessage}`);
            } else if (Array.isArray(data.tapxphoneSettings)) {
                setTapxphoneSettings(data.tapxphoneSettings);
                setError("");
            } else {
                setError(t("InternalError"));
            }
        } catch (err) {
            setError(err.message || t("InternalError"));
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
        { key: "nameFromApi", label: t("Name"), filterable: true, width: "50%" },
        { key: "login", label: t("Login"), filterable: true, width: "50%" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br to-indigo-100 p-0 m-0">
            <div className="w-full px-0">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#72b827] to-green-600 bg-clip-text text-transparent leading-normal">
                            {t("Banks")}
                        </h1>
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
                onRefresh={fetchTapxphoneSettings }
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