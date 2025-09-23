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
            return `${fiscalDevice.name} (${fiscalDevice.fiscalCode})`;
        }

        // Для остальных — делаем заглавную первую букву
        const lower = text.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    };

    return (
        <div className="flex h-screen">
            <Sidebar onNavigate={setActivePage} />
            <main className="transition-[margin] duration-300 overflow-y-auto flex-1 min-w-0 p-4 dark:bg-gray-700">
                {/* Верхняя панель */}
                <div className="flex flex-col w-full mb-2 gap-2">
                    {/* Первая строка: компания + кнопка меню (слева), панель пользователя (справа) */}
                    <div className="flex flex-wrap justify-between items-center w-full">
                        {/* Левая часть */}
                        <div className="flex items-center text-gray-500 gap-2">
                            <span className="mb-3">{user.Company}</span>
                            <button
                                type="button"
                                onClick={() => setCollapsed(!collapsed)}
                                className="collapse-button"
                                aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
                                title={collapsed ? "Развернуть меню" : "Свернуть меню"}
                            >
                                <i className="bi bi-list" aria-hidden="true"></i>
                            </button>
                        </div>

                        {/* Правая часть: панель пользователя */}
                        <div className="flex flex-wrap items-center gap-3 xl:gap-2 ml-auto mb-3">
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

                    {/* Вторая строка: breadcrumbs */}
                    <div className="flex items-center text-gray-500 gap-2 flex-wrap">
                        <nav aria-label="Breadcrumb" className="flex-1">
                            <ol className="flex flex-wrap items-center space-x-1 md:space-x-2 pl-0">
                                <li className="inline-flex items-center">
                                    <Link
                                        to="/Dashboard"
                                        className="inline-flex items-center text-gray-600 dark:text-gray-300 flex-shrink-0"
                                    >
                                        <img src="/icons/House_01.svg" className="w-6 h-6" />
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
                                            <svg
                                                className="w-4 h-4 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                            {isLast ? (
                                                <span className="text-gray-600 dark:text-gray-300">{text}</span>
                                            ) : (
                                                <Link to={to} className="text-gray-600 dark:text-gray-300 no-underline">
                                                    {text}
                                                </Link>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </nav>

                        {fiscalDevice && (
                            <div className="flex items-center text-sm text-gray-500 gap-2 ml-auto flex-shrink-0 mb-3">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13 21.314l-4.657-4.657A8 8 0 1117.657 16.657z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                <span className="mt-1 text-gray-500 truncate max-w-xs">
                                    {fiscalDevice.address}
                                </span>
                            </div>
                        )}
                    </div>

                </div>

                {children}
            </main>

        </div>
    );
}
