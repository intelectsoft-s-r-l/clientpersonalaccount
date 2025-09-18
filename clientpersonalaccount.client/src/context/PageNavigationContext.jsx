// PageNavigationContext.js
import React, { createContext, useContext, useState } from "react";

const PageNavigationContext = createContext();

export const usePageNavigation = () => useContext(PageNavigationContext);

export const PageNavigationProvider = ({ children }) => {
    const [activePage, setActivePage] = useState("Dashboard");

    return (
        <PageNavigationContext.Provider value={{ activePage, setActivePage }}>
            {children}
        </PageNavigationContext.Provider>
    );
};
