
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DashboardView } from './features/Dashboard';
import { CalendarView } from './features/Calendar';
import { CustomersView } from './features/Customers';
import { StaffView } from './features/Staff';
import { ResourcesView } from './features/Resources';
import { ServicesView } from './features/Services';
import { BillingView } from './features/Billing';
import { AnalyticsView } from './features/Analytics';
import { SettingsView } from './features/Settings';
import { useAppContext } from './hooks/useAppContext';
import type { View } from './types';

const App: React.FC = () => {
  const { state } = useAppContext();
  const [activeView, setActiveView] = useState<View>('dashboard');

  useEffect(() => {
    const root = window.document.documentElement;
    if (state.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.settings.theme]);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'calendar':
        return <CalendarView />;
      case 'customers':
        return <CustomersView />;
      case 'staff':
        return <StaffView />;
      case 'resources':
        return <ResourcesView />;
      case 'services':
        return <ServicesView />;
      case 'billing':
        return <BillingView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="font-sans text-gray-800 dark:text-gray-200">
      <Layout activeView={activeView} setActiveView={setActiveView}>
        <div className="p-4 sm:p-6 lg:p-8">
            {renderView()}
        </div>
      </Layout>
    </div>
  );
};

export default App;
