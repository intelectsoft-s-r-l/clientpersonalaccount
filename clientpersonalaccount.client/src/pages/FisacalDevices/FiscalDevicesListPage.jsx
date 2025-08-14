import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import FiscalDevicePage from "./FiscalDevicePage";
import { Eye } from "lucide-react";
import { StatusEnum, FiscalDeviceTypeEnum } from "../../enums/Enums";
import { DataTable } from "../../components/DataTable"; // Импорт универсального DataTable
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiService from '../../services/apiService';
import FiscalDeviceModal from './FiscalDeviceModal';

export default function FiscalDevicesListPage() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { token } = useAuth();
    const navigate = useNavigate();
    const [selectedDevice, setSelectedDevice] = useState(null);
    const { t } = useTranslation();

    const fetchDevices = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await apiService.proxyRequest(`/FiscalCloudManagement/GetFiscalDevices?all=false&Filter=3`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "29",
                }
            })

            if (data?.errorMessage) {
                setError(`${data.errorName || "Ошибка"}: ${data.errorMessage}`);
            } else if (data?.fiscalDevices) {
                setDevices(data.fiscalDevices);
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
        fetchDevices();
    }, [token]);

    // Помощники для отображения статусa и типа с цветом и иконками
    const getStatusInfo = (statusCode) =>
        StatusEnum(t)[statusCode] || {
            label: "Неизвестно",
            colorClass: "bg-gray-100 text-gray-800 border-gray-200",
            icon: null,
        };

    const getDeviceTypeText = (value) => {
        const type = Object.values(FiscalDeviceTypeEnum).find((t) => t.value === value);
        return type?.label || "-";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("ru-RU");
    };

    // Подготовка данных для DataTable с кастомными ячейками
    const decoratedDevices = devices.map((device) => {
        const statusInfo = getStatusInfo(device.status);

        return {
            ...device,
            statusCode: String(device.status),
            typeCode: device.type
        };
    });

    // Описание колонок для DataTable
    const columns = [
        {
            key: "name",
            label: t("Name"),
            filterable: true,
            width: "14%",
            render: (value, row) => (
                <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-semibold text-gray-900">{value || "-"}</span>
                </div>
            ),
        },
        { key: "address", label: t("Address"), filterable: true, width: "20%" },
        { key: "model", label: t("Model"), filterable: true, width: "10%" },
        { key: "number", label: t("NumberSTS"), filterable: true, width: "12%" },
        {
            key: "typeCode",
            label: t("Type"),
            filterable: true,
            width: "14%",
            render: (value) => (
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-xs font-medium">
                    {getDeviceTypeText(value)}
                </span>
            ),
        },
        {
            key: "statusCode",
            label: t("Status"),
            filterable: true,
            width: "14%",
            sortable: true,
            filterOptions: [
                { value: "0", label: t("NotActivated") },
                { value: "1", label: t("Activated") },
                { value: "2", label: t("Disabled") },
                { value: "3", label: t("Erased") },
            ],
            render: (value) => {
                const statusInfo = getStatusInfo(value);
                return (
                    <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.colorClass}`}
                    >
                        {statusInfo.icon}
                        <span className="ml-2">{statusInfo.label}</span>
                    </span>
                );
            },
        },
        {
            key: "activated",
            label: t("IsActive"),
            filterable: true,
            sortable: true,
            width: "10%",
            render: (value) => formatDate(value),
        },
        {
            key: "actions",
            label: "",
            filterable: false,
            sortable: false,
            width: "6%",
            render: (_, row) => (
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/fiscalDevices/${row.id}`);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-full transition-all duration-200"
                        title="Просмотреть детали"
                    >
                        <img
                            src="/icons/Globe.svg"
                            className="w-6 h-6 text-black hover:scale-125"
                        />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDevice(row);  // Вызов модального окна с выбранным устройством
                        }}
                        className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-full transition-all duration-200"
                        title="Открыть модальное окно"
                    >
                        <img
                            src="/icons/Show.svg"
                            className="w-6 h-6 text-black hover:scale-125"
                        />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div id="FiscalDevices" className="min-h-screen bg-gradient-to-br to-indigo-100 p-0 m-0">
            <div className="w-full px-0">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#72b827] to-green-600 bg-clip-text text-transparent leading-normal">
                            {t("FiscalDevice")}
                        </h1>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 text-red-600 font-semibold text-center">{error}</div>
                )}

                <DataTable
                    title={`${t("FiscalDevice")} (${devices.length})`}
                    columns={columns}
                    data={decoratedDevices}
                    loading={loading}
                    editable={false}
                    onRowClick={(device) => setSelectedDevice(device)}
                    selectableRow={false}
                    onRefresh={fetchDevices }
                />
                <FiscalDeviceModal
                    deviceId={selectedDevice != null ? selectedDevice.id : null}
                    onClose={() => setSelectedDevice(null)}
                />
            </div>
        </div>
    );
}
