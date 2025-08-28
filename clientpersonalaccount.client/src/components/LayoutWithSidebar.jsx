import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { usePageNavigation } from "../context/PageNavigationContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import ThemeToggle from "./ThemeToggle";
import { useSidebar } from "../context/SidebarContext";
import { Link, useLocation } from "react-router-dom";
import apiService from "../services/apiService";

export default function LayoutWithSidebar({ children }) {
    const { user } = useAuth();
    const { setActivePage } = usePageNavigation();
    const { t } = useTranslation();
    const { collapsed, setCollapsed } = useSidebar();
    const location = useLocation();
    const [fiscalDevice, setFiscalDevice] = useState(null);
    const fullName = user?.FirstName || user?.LastName
        ? `${user?.FirstName ?? ""} ${user?.LastName ?? ""}`.trim()
        : "User";

    const getInitials = (firstName, lastName) => {
        return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
    };

    const initials = getInitials(user?.FirstName, user?.LastName);
    const userPhoto = user?.Picture;
    const hasPhoto = userPhoto && userPhoto !== "/assets/images/no-photo.jpg";

    // --- Генерация Breadcrumbs ---
    const pathnames = location.pathname.split("/").filter((x) => x);
    const currentDeviceId = pathnames[0] === "FiscalDevices" ? pathnames[1] : null;

    useEffect(() => {
        const fetchDevice = async () => {
            try {
                const result = await apiService.proxyRequest(`/FiscalCloudManagement/GetFiscalDevice?ID=${currentDeviceId}`,
                    {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Service-Id": "29",
                        }
                    }
                );

                if (result)
                    setFiscalDevice(result.fiscalDevice);
                else
                    setFiscalDevice(null);
            } catch (err) {
                setFiscalDevice(null);
            }
        };

        // Проверяем, находимся ли на странице fiscalDevices/:id
        if (pathnames[0] === "FiscalDevices" && pathnames[1]) {
            fetchDevice();
        } else {
            setFiscalDevice(null);
        }
    }, [currentDeviceId]);

    const breadcrumbNameMap = {
        "Dashboard": t("Dashboard"),
        "FiscalDevices": t("FiscalDevice"),
        "Assortement": t("Assortment"),
        "License": t("Licenses"),
        "Banks": t("Banks"),
        "TransactionDkv": t("TransactionDKV")
    };

    const formatBreadcrumb = (text, value) => {
        if (!text) return "";

        // Специально для fiscalDevices выводим имя + номер НГС
        if (value === "FiscalDevices" && fiscalDevice) {
            console.log(fiscalDevice);
            return `${fiscalDevice.name} (${fiscalDevice.fiscalCode})`;
        }

        // Для остальных — делаем заглавную первую букву
        const lower = text.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    };

    return (
        <div className="flex h-screen">
            <Sidebar onNavigate={setActivePage} />
            <main className={`transition-[margin] duration-300 overflow-y-auto flex-1 min-w-0l p-4 dark:bg-gray-700`}>
                {/* Верхняя панель */}
                <div className="flex justify-between items-center w-full mb-3">
                    {/* Левая часть: кнопка + breadcrumbs */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCollapsed(!collapsed)}
                            className="collapse-button"
                            aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
                            title={collapsed ? "Развернуть меню" : "Свернуть меню"}
                        >
                            <i className="bi bi-list" aria-hidden="true"></i>
                        </button>

                        <nav className="flex text-sm text-gray-600 dark:text-gray-300 ml-2" aria-label="Breadcrumb">
                            <ol className="inline-flex items-center space-x-1 md:space-x-2">
                                <li className="inline-flex items-center">
                                    <Link to="/Dashboard" className="inline-flex items-center text-cyan-600 hover:text-cyan-400">
                                        <img src="/icons/House_01.svg" className="w-6 h-6 hover:scale-125" />
                                    </Link>
                                </li>
                                {pathnames.map((value, index) => {
                                    const to = `/${pathnames.slice(0, index + 1).join("/")}`;
                                    const isLast = index === pathnames.length - 1;

                                    let text = breadcrumbNameMap[value] || decodeURIComponent(value);

                                    if (isLast && value === currentDeviceId && fiscalDevice) {
                                        text = `${fiscalDevice.name} (${fiscalDevice.number})`;
                                    }

                                    return (
                                        <li key={to} className="inline-flex items-center">
                                            <svg className="w-4 h-4 text-gray-400 mx-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                            {isLast ? <span>{text}</span> : <Link to={to} className="hover:text-blue-600">{text}</Link>}
                                        </li>
                                    );
                                })}
                            </ol>
                        </nav>

                        {/* Адрес устройства */}
                        {fiscalDevice && (
                            <div className="text-sm text-gray-500 ml-16 mb-3">{fiscalDevice.address}</div>
                        )}
                    </div>

                    {/* Панель пользователя */}
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        <div className="w-9 h-9 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                            {hasPhoto ? (
                                <img src={userPhoto} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                initials || "U"
                            )}
                        </div>
                        <span className="dark:text-white">{fullName}</span>
                    </div>
                </div>

                {children}
            </main>
        </div>
    );
}
