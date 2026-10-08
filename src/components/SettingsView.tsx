import React, { useState } from 'react';
import {
  Sun,
  Moon,
  FileText,
  LogOut,
  Info,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TermsModal } from './TermsModal';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    isDarkMode,
    toggleTheme,
    logout,
    openUserProfile,
    setIsAuthModalOpen,
    setAuthMode,
  } = useApp();

  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <div className="pb-24 pt-2 space-y-3.5">
      {/* Current Account Profile Banner */}
      {currentUser ? (
        <div
          onClick={() => openUserProfile(currentUser.id)}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <UserAvatar user={currentUser} size="lg" showVerifiedCorner={true} />
            <div>
              <div className="flex items-center gap-1 font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                <span>{currentUser.name}</span>
                {currentUser.isVerified && <VerifiedBadge size="sm" user={currentUser} />}
              </div>
              <p className="text-xs text-neutral-400">
                @{currentUser.username} • ID: #{currentUser.id}
              </p>
              <p className="text-[11px] text-neutral-400">{currentUser.email}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-neutral-400" />
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 text-center space-y-2">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">You are browsing as a guest.</p>
          <button
            onClick={() => {
              setAuthMode('login');
              setIsAuthModalOpen(true);
            }}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Appearance Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Preferences
        </h3>

        <div className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center">
              {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Dark Mode</p>
              <p className="text-[10px] text-neutral-400">
                {isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition-colors"
          >
            {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
      </div>

      {/* Legal & About */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 border border-neutral-200 dark:border-neutral-800 space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
          About & Policies
        </h3>

        <button
          onClick={() => setIsTermsOpen(true)}
          className="w-full flex items-center justify-between py-1.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 px-1 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <FileText size={14} className="text-neutral-500" />
            <span className="text-xs text-neutral-800 dark:text-neutral-200">
              Terms & Services
            </span>
          </div>
          <ChevronRight size={14} className="text-neutral-400" />
        </button>

        <div className="flex items-center justify-between py-1.5 px-1 text-left">
          <div className="flex items-center gap-2.5">
            <img
              src="https://cdn.phototourl.com/member/2026-10-08-8ec4cdef-3d01-41f5-9311-bdd705d46a0e.jpg"
              alt="Alokpat Web Icon"
              className="w-7 h-7 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 shadow-2xs"
            />
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Alokpat Web</p>
              <p className="text-[10px] text-neutral-400">Minimal Mobile-First Social Media</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">v1.2</span>
        </div>
      </div>

      {/* Reset Data Option */}
      <div className="text-center pt-1">
        <button
          onClick={() => {
            if (window.confirm('Reset local storage and reload clean state?')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="text-[11px] text-neutral-400 hover:text-red-500 inline-flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={11} />
          <span>Reset App Data</span>
        </button>
      </div>

      {/* Logout button */}
      {currentUser && (
        <button
          onClick={logout}
          className="w-full py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <LogOut size={13} />
          <span>Sign Out of @{currentUser.username}</span>
        </button>
      )}

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};
