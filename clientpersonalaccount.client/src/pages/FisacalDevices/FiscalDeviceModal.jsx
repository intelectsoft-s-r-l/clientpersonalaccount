// FiscalDeviceModal.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import apiService from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import FiscalDeviceModalTab from "../../components/FiscalDeviceModalTab";
import { validateDevice } from "../../validation/validationSchemas";
import ValidationModal from "../../components/ValidationModal";
import SuccessModal from "../../components/SuccessModal";
import { FiscalDeviceBusinessTypeEnum, FiscalDeviceTypeEnum } from "../../enums/Enums";

function decodeBase64Json(base64) {
    try {
        const parsed = JSON.parse(atob(base64));
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
        console.error("Failed to decode base64:", e);
        return {};
    }
}

function encodeBase64Json(obj) {
    return btoa(JSON.stringify(obj));
}

function toCamelCaseKeys(obj) {
    if (Array.isArray(obj)) {
        return obj.map(toCamelCaseKeys);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => {
                const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
                return [camelKey, toCamelCaseKeys(value)];
            })
        );
    }
    return obj;
}

function toPascalCaseKeys(obj) {
    if (Array.isArray(obj)) {
        return obj.map(toPascalCaseKeys);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => {
                const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
                return [pascalKey, toPascalCaseKeys(value)];
            })
        );
    }
    return obj;
}

const tableKeys = ["device", "vatRates", "vatHistory", "taxiTariffs"];

export default function FiscalDeviceModal({ deviceId, onClose, onSuccess }) {

    const { t } = useTranslation();
    const { getTokenFromServer } = useAuth();
    const [activeTab, setActiveTab] = useState("device");
    const [device, setDevice] = useState(null);
    const [tableData, setTableData] = useState({
        device: null,
        vatHistory: [],
        vatRates: [],
        taxiTariffs: [],
    });
    const [token, setToken] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [showErrors, setShowErrors] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(null);
    const tabsRefs = useRef({});
    const isDeviceTab = activeTab === "device";

    useEffect(() => {
        const fetchToken = async () => {
            const result = await getTokenFromServer();
            setToken(result);
        };
        fetchToken();
    }, [getTokenFromServer]);

    useEffect(() => {
        if (!token || !deviceId) return;

        const fetchDevice = async () => {
            try {
                const result = await apiService.proxyRequest(`/FiscalCloudManagement/GetFiscalDevice?ID=${deviceId}`,
                    {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Service-Id": "29",
                        }
                    }
                );

                if (result && result.fiscalDevice) {
                    setDevice(result.fiscalDevice);
                } else {
                    const serverErrors = { _global: result.errorMessage || "Ошибка сервера" };
                    setValidationErrors(serverErrors);
                    setShowErrors(true);
                }
            } catch (err) {
                const serverErrors = { _global: result.err || "Ошибка сервера" };
                setValidationErrors(serverErrors);
                setShowErrors(true);
            }
        };

        fetchDevice();
    }, [token, deviceId]);

    useEffect(() => {
        if (!device) {
            setTableData({
                device: null,
                vatHistory: [],
                vatRates: [],
                taxiTariffs: [],
            });
            return;
        }

        const vatRatesObj = device.vatRates ? decodeBase64Json(device.vatRates) : {};
        const taxiTariffsObj = device.taxiTariffs ? decodeBase64Json(device.taxiTariffs) : {};
        const vatHistoryObj = device.vatHistory ? decodeBase64Json(device.vatHistory) : {};

        setTableData({
            device: device,
            vatHistory: (vatHistoryObj.VatChanges || []).map((item, index) => ({
                ...item,
                ID: index + 1,
            })),
            vatRates: (vatRatesObj.VATRates || []).map((item, index) => ({
                ...item,
                ID: index + 1,
            })),
            taxiTariffs: (taxiTariffsObj.Tariffs || taxiTariffsObj.tariffs  || []).map((item, index) => ({
                ...item,
                ID: index + 1,
            })),
        });
    }, [device]);

    const handleTableDataUpdate = useCallback((key, updatedData) => {
        setTableData((prevData) => ({
            ...prevData,
            [key]: updatedData,
        }));
    }, []);

    function cleanRows(rows) {
        return rows.map(({ ID, isNew, ...rest }) => rest);
    }

    const saveVatRates = async () => {
        if (!token) return null;

        const errors = validateDevice(tableData.vatRates || [], activeTab, t);
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setShowErrors(true);
            return;
        } else {
            setValidationErrors({});
            setShowErrors(false);
        }

        const payload = {
            token: token,
            id: deviceId,
            vatRates: encodeBase64Json({ VatRates: cleanRows(tableData.vatRates || []) }),
        };

        const resp = await apiService.proxyRequest(`/FiscalCloudManagement/UpsertVATRatesFiscalDevice`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-Service-Id": "29",
            },
            body: JSON.stringify(payload),
        });

        if (resp.errorCode !== 0) {
            const serverErrors = { _global: resp.errorMessage || "Ошибка сервера" };
            setValidationErrors(serverErrors);
            setShowErrors(true);
        } else {
            if (onSuccess) onSuccess();


            onClose();
        }
    };

    const saveTaxiTariffs = async () => {
        if (!token) return null;

        const payload = {
            token: token,
            id: deviceId,
            tariffs: encodeBase64Json({ Tariffs: cleanRows(tableData.taxiTariffs || [])}),
        };

        const resp = await apiService.proxyRequest(`/FiscalCloudManagement/UpsertTariffsFiscalDevice`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-Service-Id": "29",
            },
            body: JSON.stringify(payload),
        });

        if (resp.errorCode !== 0) {
            const serverErrors = { _global: resp.errorMessage || "Ошибка сервера" };
            setValidationErrors(serverErrors);
            setShowErrors(true);
        } else {
            if (onSuccess) onSuccess();


            onClose();
        }
    };

    const handleSave = () => {
        if (activeTab === "vatRates") {
            saveVatRates();
        } else if (activeTab === "taxiTariffs") {
            saveTaxiTariffs();
        } else {
            if (onError) onError();
        }
    };


    const renderDeviceFields = () => {
        if (!tableData.device) return null;
        const d = tableData.device;

        // Форматируем дату красиво
        const formatDate = (dateStr) => {
            if (!dateStr) return "-";
            const dt = new Date(dateStr);
            return dt.toLocaleDateString("ru-RU");
        };

        const getDeviceTypeText = (value) => {
            const type = Object.values(FiscalDeviceTypeEnum(t)).find((t) => t.value === value);
            return type?.label || "-";
        };

        const getDeviceBusinessTypeText = (value) => {
            const type = Object.values(FiscalDeviceBusinessTypeEnum(t)).find((t) => t.value === value);
            return type?.label || "-";
        };

        const fields = [
            { label: t("Name"), value: d.name },
            { label: t("ActivationCode"), value: d.activationCode },
            { label: t("Factory"), value: d.factory ?? "-" },
            { label: t("Model"), value: d.model },
            {
                label: t("Type"),
                value: getDeviceTypeText(d.type)
            },
            { label: t("Address"), value: d.address },
            {
                label: t("BusinessType"),
                value: getDeviceBusinessTypeText(d.businessType)
            },
            ...(d.businessType === 4
                ? [
                    { label: t("Coefficient"), value: d.coefficient },
                    { label: t("OperatorPhone"), value: d.operatorPhone },
                    { label: t("OperatorFax"), value: d.operatorFax },
                    { label: t("AuthorizationNumber"), value: d.authorizationNumber },
                    { label: t("AuthorizationDate"), value: formatDate(d.authorizationDate) },
                    { label: t("CarNumber"), value: d.carNumber },
                    { label: t("CarModel"), value: d.carModel },
                ]
                : []
            ),
        ];

        return (
            <table className="w-full text-sm border border-gray-300 rounded-md">
                <tbody>
                    {fields.map(({ label, value }) => (
                        <tr key={label} className="border-b last:border-b-0">
                            <td className="font-medium text-gray-700 bg-gray-100 px-4 py-2 w-1/3">
                                {label}:
                            </td>
                            <td className="px-4 py-2 text-gray-900">
                                {value ?? <span className="text-gray-400">–</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    if (!deviceId) return <></>;

    const filteredTabs = tableKeys.filter((tab) => {
        if (tab === "taxiTariffs") return device?.businessType === 4;
        return true; // остальные вкладки показываем всегда
    });

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-lg p-6 w-full max-w-full md:max-w-4xl max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex space-x-4 mb-6 border-b">
                    {filteredTabs.map((tab) => (
                        <button
                            key={tab}
                            className={`pb-2 border-b-2 font-semibold ${activeTab === tab
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-gray-600"
                                }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {t(tab)}
                        </button>
                    ))}
                </div>

                <div>
                    {activeTab === "device" && renderDeviceFields()}

                    {!isDeviceTab && (
                        <FiscalDeviceModalTab
                            tableKey={activeTab}
                            data={tableData[activeTab]}
                            onDataChange={(updated) => handleTableDataUpdate(activeTab, updated)}
                        />
                    )}
                    <ValidationModal
                        errors={validationErrors}
                        visible={showErrors}
                        onClose={() => setShowErrors(false)}
                    />
                    <SuccessModal
                        visible={isSuccessModalVisible}
                        message={showSuccessMessage}
                        onClose={() => setIsSuccessModalVisible(false)}
                    />
                </div>

                <div className="flex justify-end mt-4">
                    {!isDeviceTab && activeTab != "vatHistory" && (
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            {t("Save")}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="ml-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                        {t("Close")}
                    </button>
                </div>
            </div>
        </div>
    );
}
