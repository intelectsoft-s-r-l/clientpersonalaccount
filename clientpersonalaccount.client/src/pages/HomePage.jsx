import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageNavigation } from "../context/PageNavigationContext";
import { useSyncPageFromQuery } from "../hooks/useSyncPageFromQuery";
import LayoutWithSidebar from "../components/LayoutWithSidebar";

import MonitorPage from "../pages/MonitorPage";
import AssortementPage from "./Assortement/AssortementPage";
import FiscalDevicesListPage from "./FisacalDevices/FiscalDevicesListPage";
import LicensePage from "./License/LicensePage";
import BankPage from "./Bank/BankPage";
import TransactionDKVPage from "./TransactionDKV/TransactionDKVPage";

export default function HomePage() {
    const { user } = useAuth();
    const { activePage } = usePageNavigation();
    const navigate = useNavigate();

    useSyncPageFromQuery();

    useEffect(() => {
        if (!user) {
            navigate("/login");
        }
    }, [user, navigate]);

    const renderPage = () => {
        switch (activePage) {
            case "monitor":
                return <MonitorPage />;
            case "license":
                return <LicensePage />;
            case "assortement":
                return <AssortementPage />;
            case "fiscal-devices":
                return <FiscalDevicesListPage />;
            case "banks":
                return <BankPage />;
            case "transactionDkv":
                return <TransactionDKVPage />;
            default:
                return <MonitorPage />;
        }
    };

    return <LayoutWithSidebar>{renderPage()}</LayoutWithSidebar>;
}
