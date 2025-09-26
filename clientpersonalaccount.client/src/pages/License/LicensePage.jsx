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
    const [visibleCount, setVisibleCount] = useState(0);

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
                setError(t("InternalError"));
            }
        } catch (err) {
            setError(err.message || t("InternalError"));
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
        const date = new Date(lic.lastDateUpdate);

        return {
            ...lic,
            oid: lic.oid,
            statusCode: String(lic.licenseStatus),
            licenseStatusDisplay: (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.colorClass}`}><span className="ml-2">{statusInfo.label}</span></span>
            ),
            lastDateUpdateDisplay: formatDate(date),
            lastDateUpdate: date,
            batteryDisplay: `${lic.battery} %`
        };
    }).sort((a, b) => b.oid - a.oid);

    const columns = [
        { key: "oid", label: t("ID"), filterable: true, minWidth: 80, width: 80 },
        { key: "deviceName", label: t("DeviceName"), filterable: true, minWidth: 140, },
        { key: "address", label: t("Address"), filterable: true, minWidth: 140, },
        { key: "batteryDisplay", label: t("Battery"), filterable: true, sortable: true, minWidth: 40, },
        {
            key: "licenseStatus", label: t("Status"), filterable: true, minWidth: 160, sortable: true,
            filterOptions: [
                { value: "0", label: t("NotActivated") },
                { value: "1", label: t("Activated") },
                { value: "2", label: t("Disabled") },
                { value: "3", label: t("Erased") },
            ],
            render: (value, row) => row.licenseStatusDisplay
        },
        { key: "lastDateUpdateDisplay", label: t("LicenseActivationDate"), filterable: true, sortable: true, minWidth: 140, sortField: "lastDateUpdate" }
    ];

    columns.push({
        key: "actions",
        label: "", // или t("Actions")
        filterable: false,
        sortable: false,
        minWidth: 40,
        width: 40,
        render: (value, row) => (
            <div className="flex justify-center items-center gap-1 overflow-visible">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLicense(row);
                    }}
                    className="flex-shrink-0 text-green-600 hover:text-green-800 hover:bg-green-50 pr-1 pl-1 rounded-full transition-all duration-200"
                >
                    <img
                        src="/icons/Show.svg"
                        className="w-6 h-6 text-black hover:scale-125"
                    />
                </button>
            </div>
        ),
    });

    return (
        <div className="min-h-screen bg-gradient-to-br to-indigo-100 p-0 m-0">
            <DataTable
                title={`${t("Licenses")} (${visibleCount ?? (licenses.length || 0)})`}
                columns={columns}
                data={decoratedLicenses}
                loading={loading}
                editable={false}
                onRowDoubleClick={(lic) => setSelectedLicense(lic)}
                selectableRow={false}
                onRefresh={fetchLicenses}
                tableClassName="min-w-[100px]"
                onVisibleRowsChange={(count) => setVisibleCount(count)}
            />

            <LicenseModal
                license={selectedLicense}
                onClose={() => setSelectedLicense(null)}
            />
        </div>
    );
}
