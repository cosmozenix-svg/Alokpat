import React, { useState } from 'react';
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';

export const Header: React.FC = () => {
  const {
    currentUser,
    isDarkMode,
    toggleTheme,
    unreadNotificationCount,
    setActiveTab,
    activeTab,
    setIsAuthModalOpen,
    setAuthMode,
    logout,
    openUserProfile,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-200/80 dark:border-neutral-800 transition-colors">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          onClick={() => {
            setActiveTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const mainEl = document.querySelector('main');
            if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img
            src="https://cdn.phototourl.com/member/2026-10-08-8ec4cdef-3d01-41f5-9311-bdd705d46a0e.jpg"
            alt="Alokpat Icon"
            className="w-8 h-8 rounded-xl object-cover shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform duration-150 border border-neutral-200/80 dark:border-neutral-800"
          />
          <span className="font-bold text-lg tracking-tight text-neutral-900 dark:text-white">
            Alokpat
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-90 hover:rotate-12 transition-all duration-200 cursor-pointer"
          >
            {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => {
              if (!currentUser) {
                setAuthMode('login');
                setIsAuthModalOpen(true);
                return;
              }
              setActiveTab('notifications');
            }}
            title="Notifications"
            className={`relative p-2 rounded-xl transition-all active:scale-90 cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Bell size={18} />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-0.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs animate-pop">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Profile / Sign In */}
          {currentUser ? (
            <div className="relative ml-1">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1 p-0.5 rounded-full hover:ring-2 hover:ring-purple-400/50 dark:hover:ring-purple-600/50 active:scale-95 transition-all cursor-pointer"
              >
                <UserAvatar user={currentUser} size="xs" showVerifiedCorner={false} />
                <ChevronDown size={12} className="text-neutral-400" />
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                    <div
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                      onClick={() => {
                        openUserProfile(currentUser.id);
                        setIsUserMenuOpen(false);
                      }}
                    >
                      <UserAvatar user={currentUser} size="xs" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 font-semibold text-neutral-900 dark:text-white truncate">
                          <span>{currentUser.name}</span>
                          {currentUser.isVerified && <VerifiedBadge size="sm" user={currentUser} />}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-300 font-medium truncate">
                          @{currentUser.username}
                        </p>
                      </div>
                    </div>

                    <hr className="my-1 border-neutral-100 dark:border-neutral-800" />

                    <button
                      onClick={() => {
                        openUserProfile(currentUser.id);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer text-left active:scale-[0.98]"
                    >
                      <UserIcon size={14} />
                      Profile
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors font-medium cursor-pointer text-left mt-0.5 active:scale-[0.98]"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-200/80 dark:hover:border-neutral-700/80 active:scale-95 transition-all cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setAuthMode('register');
                  setIsAuthModalOpen(true);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs hover:shadow-md hover:shadow-purple-500/25 active:scale-95 transition-all cursor-pointer border border-purple-500/30"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
