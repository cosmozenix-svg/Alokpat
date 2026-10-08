import React from 'react';
import { Home, Search, PlusSquare, User as UserIcon, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setViewingUserId, currentUser, setIsAuthModalOpen, setAuthMode } = useApp();

  const handleTabClick = (tab: TabType) => {
    if (tab === 'add' && !currentUser) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    if (tab === 'profile') {
      if (!currentUser) {
        setAuthMode('login');
        setIsAuthModalOpen(true);
        return;
      }
      setViewingUserId(currentUser.id);
    }

    if (tab === activeTab) {
      // Re-tapping current tab smoothly scrolls to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setActiveTab(tab);
      window.scrollTo({ top: 0, behavior: 'auto' });
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800 pb-safe">
      <div className="max-w-xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Home */}
        <button
          onClick={() => handleTabClick('home')}
          className={`relative p-2.5 rounded-2xl transition-all duration-150 active:scale-90 cursor-pointer flex flex-col items-center justify-center ${
            activeTab === 'home'
              ? 'text-purple-600 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-950/60 shadow-2xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70'
          }`}
          title="Home"
        >
          <Home size={21} strokeWidth={activeTab === 'home' ? 2.5 : 1.8} className={activeTab === 'home' ? 'scale-105' : ''} />
          {activeTab === 'home' && (
            <span className="w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400 mt-0.5 animate-pop" />
          )}
        </button>

        {/* Search */}
        <button
          onClick={() => handleTabClick('search')}
          className={`relative p-2.5 rounded-2xl transition-all duration-150 active:scale-90 cursor-pointer flex flex-col items-center justify-center ${
            activeTab === 'search'
              ? 'text-purple-600 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-950/60 shadow-2xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70'
          }`}
          title="Search"
        >
          <Search size={21} strokeWidth={activeTab === 'search' ? 2.5 : 1.8} className={activeTab === 'search' ? 'scale-105' : ''} />
          {activeTab === 'search' && (
            <span className="w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400 mt-0.5 animate-pop" />
          )}
        </button>

        {/* Add Post (Prominent Center CTA) */}
        <button
          onClick={() => handleTabClick('add')}
          className={`p-2.5 rounded-2xl transition-all duration-150 active:scale-90 hover:scale-105 cursor-pointer shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 border border-purple-400/30 ${
            activeTab === 'add'
              ? 'bg-gradient-to-tr from-purple-700 to-indigo-700 text-white ring-2 ring-purple-400/60'
              : 'bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
          }`}
          title="Add Post"
        >
          <PlusSquare size={21} strokeWidth={2.4} />
        </button>

        {/* Profile */}
        <button
          onClick={() => handleTabClick('profile')}
          className={`relative p-2.5 rounded-2xl transition-all duration-150 active:scale-90 cursor-pointer flex flex-col items-center justify-center ${
            activeTab === 'profile'
              ? 'text-purple-600 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-950/60 shadow-2xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70'
          }`}
          title="Profile"
        >
          <UserIcon size={21} strokeWidth={activeTab === 'profile' ? 2.5 : 1.8} className={activeTab === 'profile' ? 'scale-105' : ''} />
          {activeTab === 'profile' && (
            <span className="w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400 mt-0.5 animate-pop" />
          )}
        </button>

        {/* Settings */}
        <button
          onClick={() => handleTabClick('settings')}
          className={`relative p-2.5 rounded-2xl transition-all duration-150 active:scale-90 cursor-pointer flex flex-col items-center justify-center ${
            activeTab === 'settings'
              ? 'text-purple-600 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-950/60 shadow-2xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70'
          }`}
          title="Settings"
        >
          <Settings size={21} strokeWidth={activeTab === 'settings' ? 2.5 : 1.8} className={activeTab === 'settings' ? 'scale-105' : ''} />
          {activeTab === 'settings' && (
            <span className="w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400 mt-0.5 animate-pop" />
          )}
        </button>
      </div>
    </nav>
  );
};
