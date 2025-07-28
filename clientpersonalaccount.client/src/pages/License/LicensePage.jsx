import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { DataTable } from "../../components/DataTable"; // универсальная таблица
import LicenseModal from "./LicenseModal";
import { StatusEnum } from "../../enums/Enums";
import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import apiService from '../../services/apiService';

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU");
}

export default function LicensePage() {
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { getTokenFromServer } = useAuth();
    const [token, setToken] = useState(null);
    const { t } = useTranslation();
    const [selectedLicense, setSelectedLicense] = useState(null);

    const fetchToken = async () => {
        const result = await getTokenFromServer();
        setToken(result);
    };

    const fetchLicenses = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await apiService.proxyRequest(`/MobileCashRegister/web/GetDevices?Token=${token}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "16",
                }
            })

            if (data?.errorMessage) {
                setError(`${data.errorName || "Ошибка"}: ${data.errorMessage}`);
            } else if (Array.isArray(data.cashRegisters)) {
                setLicenses(data.cashRegisters);
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
        fetchToken()
        fetchLicenses();
    }, [token, getTokenFromServer]);

    // Декорируем данные для отображения в таблице
    const decoratedLicenses = licenses.map((lic) => {
        const statusInfo = StatusEnum(t)[lic.licenseStatus] || {
            label: "Неизвестно",
            colorClass: "bg-gray-100 text-gray-800",
        };

        return {
            ...lic,
            statusCode: String(lic.licenseStatus),
            licenseStatusDisplay: (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.colorClass}`}><span className="ml-2">{statusInfo.label}</span></span>
            ),
            lastDateUpdate: formatDate(lic.lastDateUpdate),
            batteryDisplay: `${lic.battery} %`,
            actions: (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLicense(lic);
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
        { key: "deviceName", label: t("DeviceName"), filterable: true, width: "25%" },
        { key: "address", label: t("Address"), filterable: true, width: "36%" },
        { key: "batteryDisplay", label: t("Battery"), filterable: true, sortable: true, width: "6%" },
        {
            key: "licenseStatus", label: t("Status"), filterable: true, width: "12%", sortable: true,
            filterOptions: [
                { value: "0", label: t("NotActivated") },
                { value: "1", label: t("Activated") },
                { value: "2", label: t("Disabled") },
                { value: "3", label: t("Erased") },
            ],
            render: (value, row) => row.licenseStatusDisplay
        },
        { key: "lastDateUpdate", label: t("LicenseActivationDate"), filterable: true, sortable: true, width: "15%" }
    ];

    return (
        <div  className="min-h-screen bg-gradient-to-br to-indigo-100 p-0 m-0">
            <div className="w-full px-0">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#72b827] to-green-600 bg-clip-text text-transparent">
                            {t("Licenses")}
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={fetchLicenses}
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
                title={`${t("Licenses")} (${licenses.length})`}
                columns={columns}
                data={decoratedLicenses}
                loading={loading}
                editable={false}
                onRowDoubleClick={(lic) => setSelectedLicense(lic)}
                selectableRow={false}
            />

            <LicenseModal
                license={selectedLicense}
                onClose={() => setSelectedLicense(null)}
            />
        </div>
    );
}
