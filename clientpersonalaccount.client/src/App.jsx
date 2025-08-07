import React from 'react';
import { SidebarProvider } from './context/SidebarContext';
import { PageNavigationProvider } from './context/PageNavigationContext';
import { Outlet } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
    return (
        <SidebarProvider>
            <PageNavigationProvider>
                {/* ����� ���������� �������� �������� */}
                <Outlet />
            </PageNavigationProvider>
        </SidebarProvider>
    );
}

export default App;
