import React, { useEffect } from "react";
import { useNavigate, matchPath } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageNavigation } from "../context/PageNavigationContext";
import { useSyncPageFromQuery } from "../hooks/useSyncPageFromQuery";
import LayoutWithSidebar from "../components/LayoutWithSidebar";

import DashboardPage from "../pages/DashboardPage";
import AssortementPage from "./Assortement/AssortementPage";
import FiscalDevicesListPage from "./FisacalDevices/FiscalDevicesListPage";
import LicensePage from "./License/LicensePage";
import BankPage from "./Bank/BankPage";
import TransactionDKVPage from "./TransactionDKV/TransactionDKVPage";
import FiscalDevicePage from "./FisacalDevices/FiscalDevicePage";

export default function HomePage() {
    const { user } = useAuth();
    const { setActivePage, activePage } = usePageNavigation();
    const navigate = useNavigate();

    useSyncPageFromQuery();

    useEffect(() => {
        if (!user) {
            navigate("/login");
        }
    }, [user, navigate]);

    // Синхронизируем activePage с URL
    useEffect(() => {
        const path = location.pathname.replace(/^\/+/, ""); // убираем ведущий /

        // Если путь пустой, оставляем Dashboard
        setActivePage(path || "Dashboard");
    }, [location.pathname, setActivePage]);

    const renderPage = () => {
        if (activePage === "Dashboard") return <DashboardPage />;
        if (activePage === "License") return <LicensePage />;
        if (activePage === "Assortement") return <AssortementPage />;
        if (activePage === "FiscalDevices") return <FiscalDevicesListPage />;
        if (activePage.startsWith("FiscalDevices/")) {
            const id = activePage.split("/")[1];
            console.log(id);
            return <FiscalDevicePage id={id} />;
        }
        if (activePage === "Banks") return <BankPage />;
        if (activePage === "TransactionDkv") return <TransactionDKVPage />;
        return <DashboardPage />;
    }

    return (<div className="bg-gray-50"><LayoutWithSidebar>{renderPage()}</LayoutWithSidebar></div>);
}
