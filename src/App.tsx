import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeFeed } from './components/HomeFeed';
import { SearchView } from './components/SearchView';
import { AddPostView } from './components/AddPostView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { NotificationsView } from './components/NotificationsView';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { ReportModal } from './components/ReportModal';

/**
 * Checks whether the current URL represents an admin route
 * Supports both path routing (/admin) and hash routing (#/admin or #admin)
 */
function checkIsAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const p = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    const h = window.location.hash.toLowerCase().replace(/\/+$/, '');
    const s = window.location.search.toLowerCase();
    const stored =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('alokpat_open_admin') === 'true';

    return (
      stored ||
      p === '/admin' ||
      p.endsWith('/admin') ||
      p.startsWith('/admin/') ||
      h === '#admin' ||
      h === '#/admin' ||
      h.startsWith('#admin') ||
      h.startsWith('#/admin') ||
      s === '?admin' ||
      s.includes('view=admin') ||
      s.includes('admin=true')
    );
  } catch {
    return false;
  }
}

const MainLayout: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    viewingUserId,
    setViewingUserId,
    isDarkMode,
    isAdminPanelOpen,
    setIsAdminPanelOpen,
  } = useApp();

  const [currentRoute, setCurrentRoute] = useState<'main' | 'admin'>(() => {
    return checkIsAdminRoute() ? 'admin' : 'main';
  });

  // Client-side route handling: popstate, hashchange, and custom navigation
  useEffect(() => {
    const handleRouteChange = () => {
      const isAdmin = checkIsAdminRoute();

      if (isAdmin) {
        setCurrentRoute('admin');
        setIsAdminPanelOpen(true);

        // Clear one-time redirect flag if present
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('alokpat_open_admin');
          }
        } catch {}

        // Ensure hash is synchronized for static-host immunity against 404
        if (typeof window !== 'undefined' && !window.location.hash.includes('admin')) {
          try {
            window.history.replaceState(null, '', '/#/admin');
          } catch {}
        }
      } else {
        setCurrentRoute('main');

        // Handle other hash routes if specified
        if (typeof window !== 'undefined') {
          const h = window.location.hash.toLowerCase().replace(/\/+$/, '');
          if (h === '#/search' || h === '#search') {
            setActiveTab('search');
          } else if (h === '#/notifications' || h === '#notifications') {
            setActiveTab('notifications');
          } else if (h === '#/settings' || h === '#settings') {
            setActiveTab('settings');
          } else if (h === '#/add' || h === '#add') {
            setActiveTab('add');
          } else if (h === '#/' || h === '#' || h === '') {
            // home route
          } else if (h.startsWith('#/profile/') || h.startsWith('#profile/')) {
            const parts = h.split('/');
            const id = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(id)) {
              setViewingUserId(id);
              setActiveTab('profile');
            }
          }
        }
      }
    };

    // Immediate initial check on mount
    handleRouteChange();

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, [setIsAdminPanelOpen, setActiveTab, setViewingUserId]);

  // Synchronize internal state changes (e.g. clicking Admin Panel in Settings or closing Admin Panel)
  useEffect(() => {
    if (isAdminPanelOpen && currentRoute !== 'admin') {
      setCurrentRoute('admin');
      if (typeof window !== 'undefined' && !window.location.hash.includes('admin')) {
        try {
          window.history.pushState(null, '', '/#/admin');
        } catch {}
      }
    } else if (!isAdminPanelOpen && currentRoute === 'admin') {
      setCurrentRoute('main');
      if (typeof window !== 'undefined' && window.location.hash.includes('admin')) {
        try {
          window.history.pushState(null, '', '/');
        } catch {}
      }
    }
  }, [isAdminPanelOpen, currentRoute]);

  return (
    <div
      className={`${
        isDarkMode ? 'dark' : ''
      } min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex justify-center selection:bg-purple-600 selection:text-white transition-colors duration-150`}
    >
      {/* Mobile-Oriented Clean Minimal Container */}
      <div className="w-full max-w-md min-h-screen bg-white dark:bg-neutral-900 shadow-xl relative flex flex-col border-x border-neutral-200/80 dark:border-neutral-800/80">
        <Header />

        <main className="flex-1 px-4">
          {activeTab === 'home' && <HomeFeed />}
          {activeTab === 'search' && <SearchView />}
          {activeTab === 'add' && <AddPostView />}
          {activeTab === 'profile' && <ProfileView userId={viewingUserId} />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'notifications' && <NotificationsView />}
        </main>

        <BottomNav />
        <AuthModal />
        <AdminPanel />
        <ReportModal />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
