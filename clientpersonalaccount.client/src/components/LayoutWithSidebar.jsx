import React from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { usePageNavigation } from "../context/PageNavigationContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import ThemeToggle from "./ThemeToggle";
import { useSidebar } from "../context/SidebarContext";

export default function LayoutWithSidebar({ children }) {
    const { user } = useAuth();
    const { setActivePage } = usePageNavigation();
    const { t } = useTranslation();
    const { collapsed } = useSidebar(); // получаем collapsed

    const fullName = user?.FirstName || user?.LastName
        ? `${user?.FirstName ?? ""} ${user?.LastName ?? ""}`.trim()
        : "User";

    const getInitials = (firstName, lastName) => {
        return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
    };

    const initials = getInitials(user?.FirstName, user?.LastName);

    const userPhoto = user?.Picture;
    const hasPhoto = userPhoto && userPhoto !== "/assets/images/no-photo.jpg";

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar onNavigate={setActivePage} />
            <main
                className={`transition-[margin] duration-300 overflow-y-auto w-full p-4 dark:bg-gray-700 ${collapsed ? "ml-[72px]" : "ml-[280px]"
                    }`}
            >
                <div className="flex justify-between items-center mb-3">
                    <h4></h4>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <LanguageSwitcher />
                        <div className="w-9 h-9 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                            {hasPhoto ? (
                                <img
                                    src={photo}
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
