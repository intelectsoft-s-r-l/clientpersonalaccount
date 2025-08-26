import React, { useEffect, useState } from "react";
import apiService from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

function formatDate(dateStr) {
    if (!dateStr) return "-";

    // Разбираем строку по шаблону "DD.MM.YYYY HH:mm:ss"
    const dateTimeParts = dateStr.split(" ");
    if (dateTimeParts.length !== 2) return "-";

    const dateParts = dateTimeParts[0].split(".");
    const timeParts = dateTimeParts[1].split(":");

    if (
        dateParts.length !== 3 ||
        timeParts.length !== 3
    ) return "-";

    const [day, month, year] = dateParts.map(Number);
    const [hours, minutes, seconds] = timeParts.map(Number);

    // Создаем объект даты (месяцы в JS - 0-индексированные)
    const date = new Date(year, month - 1, day, hours, minutes, seconds);

    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU");
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
                    const jsonStr = atob(data.cashRegister.users);
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
                        <div className="text-gray-900">{license.battery}%</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg col-span-2">
                        <span className="font-semibold block text-gray-600">{t("LastUpdate") }:</span>
                        <div className="text-gray-900">{formatDate(license.lastDateUpdate)}</div>
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
                                <th className="text-left px-4 py-2">ID</th>
                                <th className="text-left px-4 py-2">{t("Name")}</th>
                                <th className="text-left px-4 py-2">PIN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr key={idx} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-2">{user.ID}</td>
                                    <td className="px-4 py-2">{user.Name}</td>
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
