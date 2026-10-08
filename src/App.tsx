import React from 'react';
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

const MainLayout: React.FC = () => {
  const { activeTab, viewingUserId, isDarkMode } = useApp();

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex justify-center selection:bg-purple-600 selection:text-white transition-colors duration-150`}>
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
