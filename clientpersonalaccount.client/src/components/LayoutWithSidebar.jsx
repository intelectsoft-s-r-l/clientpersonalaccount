import React from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { usePageNavigation } from "../context/PageNavigationContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import ThemeToggle from "./ThemeToggle";
import { useSidebar } from "../context/SidebarContext";
import { Link, useLocation } from "react-router-dom";

export default function LayoutWithSidebar({ children }) {
    const { user } = useAuth();
    const { setActivePage } = usePageNavigation();
    const { t } = useTranslation();
    const { collapsed, setCollapsed } = useSidebar();
    const location = useLocation();

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

    const breadcrumbNameMap = {
        "Dashboard": t("Dashboard"),
        "fiscalDevices": t("FiscalDevice"),
        "Assortement": t("Assortment"),
        "License": t("Licenses"),
        "Banks": t("Banks"),
        "TransactionDkv": t("TransactionDKV")
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar onNavigate={setActivePage}/>
            <main className={`transition-[margin] duration-300 overflow-y-auto w-full p-4 dark:bg-gray-700`}>
                {/* Верхняя панель */}
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="collapse-button"
                            aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
                            title={collapsed ? "Развернуть меню" : "Свернуть меню"}
                        >
                            <i className="bi bi-list"></i>
                        </button>

                        {/* Breadcrumbs */}
                        <nav
                            className="flex text-sm text-gray-600 dark:text-gray-300 mb-1"
                            aria-label="Breadcrumb"
                        >
                            <ol className="inline-flex items-center space-x-1 md:space-x-2">
                                <li className="inline-flex items-center">
                                    <Link
                                        to="/Dashboard"
                                        className="inline-flex items-center text-cyan-600 hover:text-cyan-400"
                                    >
                                        <svg
                                            className="w-4 h-4 mr-1"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M10.707 1.293a1 1 0 00-1.414 0L2 8.586V18a2 2 0 002 2h4a1 1 0 001-1v-4h2v4a1 1 0 001 1h4a2 2 0 002-2V8.586l-7.293-7.293z" />
                                        </svg>
                                        {t("Home")}
                                    </Link>
                                </li>
                                {pathnames.map((value, index) => {
                                    const to = `/${pathnames
                                        .slice(0, index + 1)
                                        .join("/")}`;
                                    const isLast =
                                        index === pathnames.length - 1;
                                    return (
                                        <li
                                            key={to}
                                            className="inline-flex items-center"
                                        >
                                            <svg
                                                className="w-4 h-4 text-gray-400 mx-1"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                            {isLast ? (
                                                <span className="capitalize">
                                                    {breadcrumbNameMap[value] || decodeURIComponent(value)}
                                                </span>
                                            ) : (
                                                <Link
                                                    to={to}
                                                    className="capitalize hover:text-blue-600"
                                                >
                                                    {breadcrumbNameMap[value] || decodeURIComponent(value)}
                                                </Link>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </nav>
                    </div>

                    {/* Панель пользователя */}
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        <div className="w-9 h-9 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                            {hasPhoto ? (
                                <img
                                    src={userPhoto}
                                    alt="Avatar"
                                    className="w-full h-full object-cover rounded-full"
                                />
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
