import React from 'react';
import { SidebarProvider } from './context/SidebarContext';
import { PageNavigationProvider } from './context/PageNavigationContext';
import { Outlet } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import LayoutWithSidebar from "./components/LayoutWithSidebar";

function App() {
    return (
        <SidebarProvider>
            <PageNavigationProvider>
                <div className="bg-gray-50">
                    <LayoutWithSidebar>
                        {/* Здесь рендерятся дочерние маршруты */}
                        <Outlet />
                    </LayoutWithSidebar>
                </div>
            </PageNavigationProvider>
        </SidebarProvider>
    );
}

export default App;
