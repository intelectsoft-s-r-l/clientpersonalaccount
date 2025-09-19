import React, { useState, useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import Logo from "../styles/LOGO.png";
import LongLogo from "../styles/IS_LOGO_LONG.png";
import { usePageNavigation } from "../context/PageNavigationContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { useLocation } from "react-router-dom";
import DashboardIcon from "../../public/sideBarIcons/dashboard.svg";
import AssortmentIcon from "../../public/sideBarIcons/Asortiment.svg";
import LicensesIcon from "../../public/sideBarIcons/Licente.svg";
import FiscalDeviceIcon from "../../public/sideBarIcons/AparateFiscale.svg";
import BanksIcon from "../../public/sideBarIcons/Banca.svg";
import TransactionDKVIcon from "../../public/sideBarIcons/Tranzactii.svg";

const menuSections = [
    {
        items: [
            { id: "dashboard", key: "Dashboard", icon: DashboardIcon },
        ],
    },
    {
        items: [
            { id: "assortement", key: "Assortment", icon: AssortmentIcon },
        ],
    },
    {
        items: [
            { id: "license", key: "Licenses", icon: LicensesIcon },
        ],
    },
    {
        items: [
            { id: "fiscalDevices", key: "FiscalDevice", icon: FiscalDeviceIcon },
        ],
    },
    {
        items: [
            { id: "banks", key: "Banks", icon: BanksIcon },
        ],
    },
    {
        items: [
            { id: "transactionDkv", key: "TransactionDKV", icon: TransactionDKVIcon },
        ],
    },
];

const pageRoutes = {
    dashboard: "/Dashboard",
    assortement: "/Assortement",
    license: "/License",
    fiscalDevices: "/FiscalDevices",
    banks: "/Banks",
    transactionDkv: "/TransactionDkv"
};

export default function Sidebar() {
    const { activePage, setActivePage } = usePageNavigation();
    const { logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { collapsed, setCollapsed } = useSidebar();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [collapsed]);

    function handleClick(id, e) {
        e.preventDefault();
        if (pageRoutes[id]) {
            setActivePage(id);
            navigate(pageRoutes[id]);
        }
    }

    const location = useLocation();

    useEffect(() => {
        const currentRoute = Object.keys(pageRoutes).find(
            key => pageRoutes[key] === location.pathname
        );
        if (currentRoute) {
            setActivePage(currentRoute);
        }
    }, [location.pathname]);


    const isCollapsed = isMobile ? collapsed : !collapsed;
    return (
        <>
            <style>{`
        .sidebar {
          width: ${collapsed ? "86px" : "280px"};
          flex-shrink: 0;
          min-height: 100vh;
          background-color: #fff;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          position: static;
          transition: width 0.3s ease;
        }
        .sidebar-content {
          padding: 1rem;
          overflow-y: auto;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 1.25rem;
          color: #111827;
          margin-bottom: 1rem;
          user-select: text;
          justify-content: center; /* убрали space-between */
        }
        .brand-text {
          display: ${collapsed ? "none" : "block"};
        }
        .collapse-button {
          cursor: pointer;
          border: none;
          background: transparent;
          font-size: 1.5rem;
          color: #6b7280;
          padding: 0.25rem 0;
          border-radius: 0.375rem;
          transition: background-color 0.2s ease;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .collapse-button:hover {
          background-color: #f3f4f6;
          color: #111827;
        }
        .sidebar-section-title {
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: #6b7280;
          letter-spacing: 0.05em;
          user-select: text;
          display: ${collapsed ? "none" : "block"};
        }
        .nav-column {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .nav-link {
          display: flex;
          align-items: center;
          padding: 0.5rem 0.75rem;
          color: #374151;
          text-decoration: none;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease, color 0.2s ease;
          white-space: nowrap;
          overflow: hidden;
          justify-content: ${collapsed ? "center" : "flex-start"}; /* центрируем иконки при свёрнутом меню */
          outline: none;
        }
        .nav-link:focus {
        outline: none;         /* убрать фокус-стили */
        box-shadow: none;      /* на случай, если есть ring от Tailwind */
        }
        .nav-link i {
          font-size: 1.25rem;
          margin-right: ${collapsed ? "0" : "0.25rem"};
          flex-shrink: 0;
          text-align: center;
          width: 24px;
        }
        .nav-link span {
          display: ${collapsed ? "none" : "inline"};
        }
        .nav-link:hover {
          background-color: #f3f4f6;
          color: #111827;
        }
        .nav-link:focus,
        .nav-link:focus-visible,
        .nav-link.active,
        .nav-link.active:hover {
          background-image: linear-gradient(to right, #72b827, #22c55e);
          color: white;
          font-weight: 600;
          outline: none;
          box-shadow: none;
        }
        .nav-link.disabled {
          cursor: default;
          user-select: text;
          pointer-events: none;
          font-weight: 600;
          outline: none;
          box-shadow: none;
        }
          .sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%; // Сайдбар должен занимать всю доступную высоту
  padding: 15px; // Добавьте ваш padding
  box-sizing: border-box; // Учитывать padding в высоте
}

.sidebar-menu-sections {
  flex-grow: 1; // Заставляет этот блок занимать все доступное пространство
  overflow-y: auto; // Добавляет прокрутку, если меню слишком длинное
}

.logout-button {
  margin-top: auto; // Прижимает кнопку к низу
  width: 100%; // Кнопка занимает всю ширину
  display: flex;
  align-items: center;
  justify-content: center; // Выравнивание по центру, если только иконка
  padding: 10px 15px;
  border: none;
  background-color: #f8d7da; // Светло-красный фон (например, Bootstrap danger-light)
  color: #dc3545; // Красный текст (Bootstrap danger)
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.logout-button:hover {
  background-color: #dc3545; // Темнее при наведении
  color: #fff; // Белый текст при наведении
}

.logout-button i {
  margin-right: 0; // Для кнопки только с иконкой не нужен отступ
  font-size: 1.4rem; // Размер иконки
}
// Если кнопка все же будет с текстом, то:
// .logout-button span {
//   margin-left: 8px; // Отступ между иконкой и текстом
// }
*/
      `}</style>
            {/* Оверлей для мобильных */}
            {isMobile && !collapsed && (
                <div
                    className="fixed inset-0 z-30 duration-300"
                    onClick={() => setCollapsed(true)}
                />
            )}
            <aside
                className={`bg-white shadow-lg z-40 transition-transform duration-300
  ${isMobile
                        ? `fixed top-0 left-0 h-full transform ${collapsed ? "-translate-x-full" : "translate-x-0 w-21"}`
                        : `sticky top-0 h-screen transition-width ${collapsed ? "w-21" : "w-64"}`
                    }`}
            >
                <div className="sidebar-content flex flex-col h-full justify-between">
                    <div className="sidebar-menu-sections overflow-y-auto">
                        {menuSections.map(({ title, items }, idx) => (
                            <section key={idx} className={isCollapsed ? "mb-[10px]" : ""}>
                                {isCollapsed && title && <div className="sidebar-section-title">{t(title)}</div>}
                                <nav className="nav-column" aria-label={title || t(`Section ${idx + 1}`)}>
                                    {items.map(({ id, key, icon, disabled }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            className={`hover:scale-110 nav-link${activePage === id ? " active" : ""}${disabled ? " disabled" : ""}`}
                                            onClick={disabled ? undefined : (e) => handleClick(id, e)}
                                            disabled={disabled}
                                            title={t(key)}
                                        >
                                            <img src={icon} className="w-6 h-6 text-black" />
                                            {isCollapsed && <span>{t(key)}</span>}
                                        </button>
                                    ))}
                                </nav>
                            </section>
                        ))}
                    </div>

                    <div className="flex flex-col items-center mb-1 space-y-1">
                        <div className="brand-logo">
                            {isCollapsed ? (
                                <img src={LongLogo} alt="Fiscal Cloud Logo" className="w-32 h-8" />
                            ) : (
                                <img src={Logo} alt="Fiscal Cloud Logo" className="w-10 h-10" />
                            )}
                        </div>

                        <button
                            onClick={logout}
                            aria-label={t("Logout")}
                            title={t("Logout")}
                            className={`flex items-center justify-center w-full ${isCollapsed ? "h-12" : "h-10"} px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-transform hover:scale-105 ${isCollapsed ? "justify-start gap-2" : "justify-center"}`}
                        >
                            <img src="/icons/Log_Out.svg" className="w-6 h-6" alt={t("Logout")} />
                            {isCollapsed && <span className="text-sm font-medium text-black">{t("Logout")}</span>}
                        </button>
                    </div>
                </div>
            </aside>



        </>
    );
}
