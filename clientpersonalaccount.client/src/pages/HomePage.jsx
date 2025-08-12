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
        const path = location.pathname.replace(/^\/Main\/?/, "").replace(/^\/+/, "");
        setActivePage(path || "dashboard");
    }, [location.pathname, setActivePage]);

    const renderPage = () => {
        if (activePage === "dashboard") return <DashboardPage />;
        if (activePage === "license") return <LicensePage />;
        if (activePage === "assortement") return <AssortementPage />;
        if (activePage === "fiscalDevices") return <FiscalDevicesListPage />;
        if (activePage.startsWith("fiscalDevices/")) {
            const id = activePage.split("/")[1];
            return <FiscalDevicePage id={id} />;
        }
        if (activePage === "banks") return <BankPage />;
        if (activePage === "transactionDkv") return <TransactionDKVPage />;
        return <DashboardPage />;
    }

    return (<div className="bg-gray-50"><LayoutWithSidebar>{renderPage()}</LayoutWithSidebar></div>);
}
