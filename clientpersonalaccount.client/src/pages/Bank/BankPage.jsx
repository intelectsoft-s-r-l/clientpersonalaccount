// src/pages/BankPage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { DataTable } from "../../components/DataTable";
import { Eye } from "lucide-react";
import BankModal from "./BankModal";
import { useTranslation } from "react-i18next";
import apiService from '../../services/apiService';
import Toast from "../../components/Toast";

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU");
}

function ConfirmDeleteBankModal({ isOpen, onClose, onConfirm, bank, t }) {
    const [inputLogin, setInputLogin] = useState("");

    useEffect(() => {
        if (!isOpen) setInputLogin("");
    }, [isOpen]);

    if (!isOpen || !bank) return null;

    return (
         <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onMouseDown={(e) => {
                // Закрываем только если клик по самому фону (а не дочерним элементам)
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 pl-4 pr-4"
                onClick={onClose}
            >
                <div
                    className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        &times;
                    </button>
                    <h3 className="font-semibold block mb-3">
                        {t("EnterLoginToConfirm")}: <strong>{bank.login}</strong>
                    </h3>
                    <div className="mb-3">
                        <input
                            name="login"
                            value={inputLogin}
                            onChange={(e) => setInputLogin(e.target.value)}
                            className="w-full border px-3 py-2 rounded"
                            required
                        />
                    </div>
                    
                    <div className="mb-4 text-gray-500 rounded dark:text-gray-300">
                        <input
                            name="nameFromApi"
                            value={bank.nameFromApi}
                            className="w-full border px-3 py-2 rounded"
                            required
                            disabled
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded border mr-auto">
                            {t("Cancel")}
                        </button>
                        <button
                            onClick={() => onConfirm(inputLogin)}
                            disabled={inputLogin !== bank.login}
                            className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
                        >
                            {t("Delete")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BankPage() {
    const [tapxphoneSettings, setTapxphoneSettings] = useState([]);
    const [bankNames, setBankNames] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { t } = useTranslation();
    const { token } = useAuth();
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(null);
    const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
    const [showErrorMessage, setShowErrorMessage] = useState(null);
    const [deleteBankModalOpen, setDeleteBankModalOpen] = useState(false);
    const [bankToDelete, setBankToDelete] = useState(null);
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

    const handleAddRow = () => {
        // Очищаем выбранный банк, чтобы модал открылся в режиме "создать новый"
        setSelectedTapxphoneSettings({});
    };

    useEffect(() => {
        fetchTapxphoneSettings();
        fetchBankNames();
    }, [token]);

    const handleDeleteBankClick = (bank) => {
        setBankToDelete(bank);
        setDeleteBankModalOpen(true);
    };

    const handleConfirmDeleteBank = async (enteredLogin) => {
        if (!bankToDelete) return;

        if (enteredLogin !== bankToDelete.login) {
            alert(t("LoginMismatch"));
            return;
        }

        try {
            await apiService.proxyRequest(`/MobileCashRegister/web/DeleteTapxphoneSettings?OID=${bankToDelete.oid}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "16",
                },
            });
            fetchTapxphoneSettings();
            setShowSuccessMessage(t("DeleteSuccess"));
            setIsSuccessModalVisible(true);
        } catch (err) {
            console.error(err);
            setShowErrorMessage(t("DeleteError"));
            setIsErrorModalVisible(true);
        } finally {
            setDeleteBankModalOpen(false);
            setBankToDelete(null);
        }
    };

    const decoratedTapxphoneSettings = tapxphoneSettings.map((tapxphoneSetting) => {
        return {
            ...tapxphoneSetting,
            nameFromApi: bankNames[tapxphoneSetting.bankOID] || "-",
            createdAtFormatted: formatDate(tapxphoneSetting.createdAt),
            updatedAtFormatted: formatDate(tapxphoneSetting.updatedAt),
        };
    });

    const columns = [
        { key: "nameFromApi", label: t("Name"), filterable: true, minWidth: 20 },
        { key: "login", label: t("Login"), filterable: true, minWidth: 20 },
        {
            key: "actions",
            label: "",
            minWidth: 1,
            render: (value, row) => (
                <div className="flex justify-center items-center gap-1 overflow-visible">
                    <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTapxphoneSettings(row); }}
                        className="flex-shrink-0 text-dark-600 hover:text-dark-900 hover:bg-gray-100 pl-5 pr-1 rounded-full transition-all duration-200"
                        title={t("ViewDetails")}
                    >
                        <img
                            src="/icons/Show.svg"
                            className="w-6 h-6 text-black hover:scale-125"
                        />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBankClick(row);
                        }}
                        className="flex-shrink-0 text-dark-600 hover:text-dark-900 hover:bg-gray-100 pr-5 rounded-full transition-all duration-200"
                        title={t("Delete")} /* Используем t() */
                    >
                        <img
                            src="/icons/Trash.svg"
                            className="w-5 h-5 hover:scale-125"
                            alt={t("Delete")} /* Добавлен alt */
                        />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br to-indigo-100 p-0 m-0">
            <div className="w-full px-0">
                <DataTable
                    title={`${t("Banks")} (${tapxphoneSettings.length})`}
                    columns={columns}
                    data={decoratedTapxphoneSettings}
                    loading={loading}
                    editable={false}
                    onRowDoubleClick={(tap) => setSelectedTapxphoneSettings(tap)}
                    selectableRow={false}
                    onRefresh={fetchTapxphoneSettings}
                    onAddRow={handleAddRow}
                    tableClassName="min-w-[60px]"
                />

                <BankModal
                    bank={selectedTapxphoneSettings}
                    banks={tapxphoneSettings}
                    onClose={() => setSelectedTapxphoneSettings(null)}
                    onSave={(updatedBank) => {
                        fetchTapxphoneSettings();
                    }}
                    onSuccess={() => {
                        setShowSuccessMessage(t("SaveSuccess"));
                        setIsSuccessModalVisible(true);
                    }}
                    onError={() => {
                        setShowErrorMessage(t("Duplicate"));
                        setIsErrorModalVisible(true);
                    }}
                />

                <Toast
                    visible={isSuccessModalVisible}
                    message={showSuccessMessage}
                    onClose={() => setIsSuccessModalVisible(false)}
                    type="success"
                />
                <Toast
                    visible={isErrorModalVisible}
                    message={showErrorMessage}
                    onClose={() => setIsErrorModalVisible(false)}
                    type="error"
                />
                <ConfirmDeleteBankModal
                    isOpen={deleteBankModalOpen}
                    onClose={() => setDeleteBankModalOpen(false)}
                    onConfirm={handleConfirmDeleteBank}
                    bank={bankToDelete}
                    t={t}
                />
            </div>
        </div>
    );
}