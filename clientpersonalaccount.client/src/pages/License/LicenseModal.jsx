import React, { useEffect, useState } from "react";
import apiService from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

function formatDate(dateInput) {
    if (!dateInput) return "-";

    let date;

    // Если приходит строка
    if (typeof dateInput === "string") {
        // Если строка уже в формате "DD.MM.YYYY HH:mm:ss"
        if (dateInput.includes(" ")) {
            const [datePart, timePart] = dateInput.split(" ");
            const [day, month, year] = datePart.split(".").map(Number);
            const [hours, minutes, seconds] = timePart.split(":").map(Number);
            date = new Date(year, month - 1, day, hours, minutes, seconds);
        } else {
            // Попробуем создать дату напрямую из строки
            date = new Date(dateInput);
        }
    } else if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === "number") {
        date = new Date(dateInput);
    } else {
        return "-";
    }

    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU");
}

function base64DecodeUtf8(str) {
    // atob → Uint8Array → TextDecoder('utf-8')
    const bytes = Uint8Array.from(atob(str), c => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
}

export default function LicenseModal({ license, onClose }) {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [token, setToken] = useState(null);
    const { getTokenFromServer } = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        const fetchToken = async () => {
            const result = await getTokenFromServer();
            setToken(result);
        };

        fetchToken();
    }, [token]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    useEffect(() => {
        if (!license) return;

        const fetchUsers = async () => {
            try {
                setLoadingUsers(true);

                const data = await apiService.proxyRequest(`/MobileCashRegister/web/GetDevice?Token=${token}&Oid=${license.oid}`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Service-Id": "16",
                    }
                });
                
                if (data && data.cashRegister && data.cashRegister.users && data.cashRegister.users != "W10=" && data.cashRegister.users != "1") {
                    const jsonStr = base64DecodeUtf8(data.cashRegister.users);
                    const user = JSON.parse(jsonStr);
                    setUsers(user);
                } else {
                    setUsers([]);
                }
            } catch (err) {
                setUsers([]);
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [license]);

    if (!license) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
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

                <h2 className="text-2xl font-semibold text-indigo-700 mb-6">
                    {t("LicenseInfo") }
                </h2>

                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <span className="font-semibold block text-gray-600">{t("Name")}:</span>
                        <div className="text-gray-900">{license.name}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <span className="font-semibold block text-gray-600">{t("device") }:</span>
                        <div className="text-gray-900">{license.deviceName}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <span className="font-semibold block text-gray-600">{t("Contract_Adress") }:</span>
                        <div className="text-gray-900">{license.address}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <span className="font-semibold block text-gray-600">{t("Battery") }:</span>
                        <div className="text-gray-900">{license.batteryDisplay}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg col-span-2">
                        <span className="font-semibold block text-gray-600">{t("Status")}:</span>
                        <div className="text-gray-900">{license.licenseStatusDisplay}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg col-span-2">
                        <span className="font-semibold block text-gray-600">{t("LastUpdate") }:</span>
                        <div className="text-gray-900">{license.lastDateUpdateDisplay}</div>
                    </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-700 mb-2">{t("Users") }</h3>

                {loadingUsers ? (
                    <div className="text-gray-500 text-sm">{t("LoadingUsers")}</div>
                ) : users.length === 0 ? (
                        <div className="text-gray-500 text-sm">{t("NoUsers")}</div>
                ) : (
                            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="text-left px-4 py-2 border-r border-gray-300">ID</th>
                                        <th className="text-left px-4 py-2 border-r border-gray-300">{t("Name")}</th>
                                        <th className="text-left px-4 py-2">PIN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, idx) => (
                                        <tr key={idx} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-2 border-r border-gray-300">{user.ID}</td>
                                            <td className="px-4 py-2 border-r border-gray-300">{user.Name}</td>
                                            <td className="px-4 py-2">{user.PIN}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                )}
            </div>
        </div>
    );
}
