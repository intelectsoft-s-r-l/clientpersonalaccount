// LayoutWithSidebar.js
import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { usePageNavigation } from "../context/PageNavigationContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import ThemeToggle from "./ThemeToggle";


export default function LayoutWithSidebar({ children }) {
    const { user } = useAuth();
    const { setActivePage } = usePageNavigation();
    const { t } = useTranslation();

    return (
        <div className="d-flex" style={{ minHeight: '100vh' }}>
            <Sidebar onNavigate={setActivePage} />
            <main className="flex-grow-1 p-4 dark:bg-gray-700" style={{ overflowY: 'auto' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4></h4>
                    <div className="d-flex align-items-center gap-3">
                        <ThemeToggle />
                        <LanguageSwitcher />
                        <span className="dark:text-white">{user?.Email || 'User'}</span>
                    </div>
                </div>
                {children}
            </main>
        </div>
    );
}
