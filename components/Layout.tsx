import React, { useState, useEffect, ReactNode, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { APP_NAME } from '../constants';
import type { View } from '../types';

// SVG Icons
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const ICONS: Record<View, React.FC<{className?: string}>> = {
  dashboard: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  calendar: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  customers: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  staff: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" /></svg>,
  resources: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  services: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  billing: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  analytics: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>,
  settings: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

const DigitalClock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    return <div className="font-mono text-xl sm:text-2xl">{time.toLocaleTimeString()}</div>;
};

const GlobalSearch: React.FC<{setActiveView: (view: View) => void}> = ({setActiveView}) => {
    const { state } = useAppContext();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const results = useMemo(() => {
        if (!query) return [];
        const lowerQuery = query.toLowerCase();
        const customerResults = state.customers
            .filter(c => c.name.toLowerCase().includes(lowerQuery) || c.email.toLowerCase().includes(lowerQuery))
            .map(c => ({ type: 'Customer', name: c.name, view: 'customers' as View }));
        const staffResults = state.staff
            .filter(s => s.name.toLowerCase().includes(lowerQuery))
            .map(s => ({ type: 'Staff', name: s.name, view: 'staff' as View }));
        return [...customerResults, ...staffResults].slice(0, 10);
    }, [query, state.customers, state.staff]);

    return (
        <div className="relative">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon />
                </div>
                <input
                    type="text"
                    placeholder="Search..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)} // delay to allow click
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-start focus:border-brand-start sm:text-sm"
                />
            </div>
            {isFocused && query && (
                <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg">
                    <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        {results.length > 0 ? results.map((result, index) => (
                            <li key={index} className="text-gray-900 dark:text-gray-200 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setActiveView(result.view)}>
                                <span className="font-normal block truncate">{result.name}</span>
                                <span className="text-gray-500 ml-2">{result.type}</span>
                            </li>
                        )) : <li className="text-gray-500 cursor-default select-none relative py-2 pl-3 pr-9">No results found</li>}
                    </ul>
                </div>
            )}
        </div>
    );
}

const Header: React.FC<{ onMenuClick: () => void; setActiveView: (view: View) => void; }> = ({ onMenuClick, setActiveView }) => {
    const { state, dispatch } = useAppContext();
    const toggleTheme = () => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: state.settings.theme === 'light' ? 'dark' : 'light' } });
    };

    return (
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <button onClick={onMenuClick} className="lg:hidden mr-4 text-gray-500 dark:text-gray-400">
                            <MenuIcon />
                        </button>
                        <h1 className="hidden sm:block font-mono text-2xl sm:text-3xl font-bold bg-gradient-to-r from-brand-start to-brand-end text-transparent bg-clip-text">
                            {APP_NAME}
                        </h1>
                    </div>
                     <div className="flex-1 max-w-sm ml-4">
                       <GlobalSearch setActiveView={setActiveView} />
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                        <DigitalClock />
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            {state.settings.theme === 'light' ? <MoonIcon /> : <SunIcon />}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

const NAV_ITEMS: { id: View, label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'customers', label: 'Customers' },
    { id: 'staff', label: 'Staff' },
    { id: 'resources', label: 'Resources' },
    { id: 'services', label: 'Services' },
    { id: 'billing', label: 'Billing' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
];

const Sidebar: React.FC<{ activeView: View; setActiveView: (view: View) => void; isOpen: boolean; setIsOpen: (isOpen: boolean) => void; }> = ({ activeView, setActiveView, isOpen, setIsOpen }) => {
    // FIX: Explicitly typed NavLink as React.FC to resolve an issue where TypeScript was incorrectly trying to pass the 'key' prop to the component.
    const NavLink: React.FC<{ item: {id: View, label: string} }> = ({ item }) => {
        const Icon = ICONS[item.id];
        return (
             <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    setActiveView(item.id);
                    setIsOpen(false);
                }}
                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeView === item.id 
                    ? 'bg-brand-start text-white shadow-lg' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
            </a>
        );
    }

    return (
        <>
            <aside className={`fixed z-40 lg:z-auto lg:static inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
                <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Menu</h2>
                    <nav className="space-y-2">
                        {NAV_ITEMS.map(item => <NavLink key={item.id} item={item} />)}
                    </nav>
                </div>
            </aside>
            {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsOpen(false)}></div>}
        </>
    );
};

const MobileNav: React.FC<{ activeView: View; setActiveView: (view: View) => void; }> = ({ activeView, setActiveView }) => {
    const mobileNavItems: View[] = ['dashboard', 'calendar', 'customers', 'billing'];
    
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-t-lg sm:hidden z-50">
            <div className="flex justify-around">
                {mobileNavItems.map(view => {
                    const Icon = ICONS[view];
                    const label = NAV_ITEMS.find(item => item.id === view)?.label;
                    return (
                        <button
                            key={view}
                            onClick={() => setActiveView(view)}
                            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs font-medium transition-colors ${
                                activeView === view
                                ? 'text-brand-start dark:text-accent'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            <Icon className="h-6 w-6 mb-1" />
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export const Layout: React.FC<{ children: ReactNode; activeView: View; setActiveView: (view: View) => void; }> = ({ children, activeView, setActiveView }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} setActiveView={setActiveView} />
            <div className="flex flex-1">
                <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
                <main className="flex-1 bg-gray-100 dark:bg-gray-900 pb-16 sm:pb-0">
                    {children}
                </main>
            </div>
            <MobileNav activeView={activeView} setActiveView={setActiveView} />
        </div>
    );
};