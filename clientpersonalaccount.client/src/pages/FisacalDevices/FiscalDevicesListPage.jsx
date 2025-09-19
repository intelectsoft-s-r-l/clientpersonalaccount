import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import FiscalDevicePage from "./FiscalDevicePage";
import { Eye, Copy } from "lucide-react";
import { StatusEnum, FiscalDeviceTypeEnum, FiscalDeviceBusinessTypeEnum } from "../../enums/Enums";
import { DataTable } from "../../components/DataTable"; // Импорт универсального DataTable
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiService from '../../services/apiService';
import FiscalDeviceModal from './FiscalDeviceModal';
import Toast from "../../components/Toast";

export default function FiscalDevicesListPage() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { token } = useAuth();
    const navigate = useNavigate();
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(null);
    const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);
    const [showWarningMessage, setShowWarningMessage] = useState(null);
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
                setError(t("InternalError"));
            }
        } catch (err) {
            setError(err.message || t("InternalError"));
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
        const type = Object.values(FiscalDeviceTypeEnum(t)).find((t) => t.value === value);
        return type?.label || "-";
    };

    const getDeviceBusinessTypeText = (value) => {
        const type = Object.values(FiscalDeviceBusinessTypeEnum(t)).find((t) => t.value === value);
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
            typeCode: device.type,
            typeBusiness: device.bu
        };
    }).sort((a, b) => new Date(b.activated) - new Date(a.activated));;

    // Описание колонок для DataTable
    const columns = [
        {
            key: "name",
            label: t("Name"),
            filterable: true,
            width: "10%",
            render: (value, row) => (
                <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-semibold text-gray-900">{value || "-"}</span>
                </div>
            ),
        },
        { key: "address", label: t("Address"), filterable: true, width: "15%" },
        { key: "model", label: t("Model"), filterable: true, width: "8%" },
        { key: "factory", label: t("Factory"), filterable: true, width: "6%" },
        { key: "number", label: t("NumberSTS"), filterable: true, width: "10%" },
        {
            key: "typeCode",
            label: t("TypeDevice"),
            filterable: true,
            width: "13%",
            sortable: true,
            filterOptions: [
                { value: "0", label: t("NotFiscal") },
                { value: "1", label: "SI_DE_imprimante_fiscale" },
                { value: "2", label: "SI_DE_fara_imprimante_fiscale" },
                { value: "3", label: "SI_FDE_fara_imprimante_fiscale" },
                { value: "4", label: "Masina_de_casa_si_control" }
            ],
            render: (value) => (
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-xs font-medium">
                    {getDeviceTypeText(value)}
                </span>
            ),
        },
        {
            key: "businessType",
            label: t("TypeBusiness"),
            filterable: true,
            width: "6.5%",
            sortable: true,
            filterOptions: [
                { value: "0", label: t("NotFiscal") },
                { value: "1", label: "Petrol" },
                { value: "2", label: "Sales" },
                { value: "3", label: "PetrolAndSales" },
                { value: "4", label: "Taxi" },
                { value: "5", label: "Gambling" }
            ],
            render: (value) => (
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-xs font-medium">
                    {getDeviceBusinessTypeText(value)}
                </span>
            ),
        },
        {
            key: "statusCode",
            label: t("Status"),
            filterable: true,
            width: "10%",
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
            width: "5%",
            render: (value) => formatDate(value),
        },
        {
            key: "actions",
            label: "",
            filterable: false,
            sortable: false,
            width: "7%",
            render: (_, row) => (
                <div className="flex justify-center items-center gap-1 overflow-visible">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(row.activationCode);
                            if (row.activationCode) {
                                setShowSuccessMessage(t("Copy"));
                                setIsSuccessModalVisible(true);
                            }
                            else {
                                setShowWarningMessage(t("NoCopy"));
                                setIsWarningModalVisible(true);
                            }
                        }}
                        className="flex-shrink-0 text-dark-600 hover:text-dark-900 hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
                        title={t("ActivationCode")}
                    >
                        <Copy className="w-5 h-5 hover:scale-125" />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/FiscalDevices/${row.id}`);
                        }}
                        className="flex-shrink-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-full transition-all duration-200"
                        title={t("Details")}
                    >
                        <img
                            src="/icons/Globe.svg"
                            className="w-6 h-6 hover:scale-125"
                            alt="Details"
                        />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDevice(row);
                        }}
                        className="flex-shrink-0 text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-full transition-all duration-200"
                        title={t("OpenModal")}
                    >
                        <img
                            src="/icons/Show.svg"
                            className="w-6 h-6 hover:scale-125"
                            alt="Show"
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
                    onRefresh={fetchDevices}
                    tableClassName="min-w-[1600px]"
                />
                <FiscalDeviceModal
                    deviceId={selectedDevice != null ? selectedDevice.id : null}
                    onClose={() => setSelectedDevice(null)}
                />
                <Toast
                    visible={isSuccessModalVisible}
                    message={showSuccessMessage}
                    onClose={() => setIsSuccessModalVisible(false)}
                    type="success"
                />
                <Toast
                    visible={isWarningModalVisible}
                    message={showWarningMessage}
                    onClose={() => setIsWarningModalVisible(false)}
                    type="warning"
                />
            </div>
        </div>
    );
}
