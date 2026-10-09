import React, { useState } from 'react';
import {
  Sun,
  Moon,
  FileText,
  LogOut,
  Info,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
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
    changePassword,
  } = useApp();

  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Change Password State
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword) {
      setPasswordError('Please provide your current old password.');
      return;
    }
    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (oldPassword === newPassword) {
      setPasswordError('New password cannot be the same as your old password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setIsSubmittingPassword(true);
    const res = changePassword(oldPassword, newPassword);
    setIsSubmittingPassword(false);

    if (!res.success) {
      setPasswordError(res.error || 'Failed to update password.');
    } else {
      setPasswordSuccess('Password changed successfully! Keep it safe.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess(null);
        setIsPasswordSectionOpen(false);
      }, 2500);
    }
  };

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
            className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-200 dark:border-white/30 rounded-lg text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-2xs"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Security & Password Section (for logged-in user) */}
      {currentUser && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Security & Credentials
            </h3>
            <span className="text-[10px] text-neutral-400 flex items-center gap-1">
              <ShieldCheck size={12} className="text-purple-600 dark:text-purple-400" />
              Protected
            </span>
          </div>

          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsPasswordSectionOpen(prev => !prev)}
              className="w-full p-3 flex items-center justify-between text-left bg-neutral-50/70 hover:bg-neutral-100 dark:bg-neutral-850 dark:hover:bg-neutral-800 transition-colors cursor-pointer border-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-white flex items-center justify-center border border-neutral-200/60 dark:border-white/20">
                  <KeyRound size={14} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">Change Password</p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Verify old password first, then set new password
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-400">
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium hidden sm:inline">
                  {isPasswordSectionOpen ? 'Hide' : 'Update'}
                </span>
                {isPasswordSectionOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </div>
            </button>

            {isPasswordSectionOpen && (
              <form onSubmit={handlePasswordSubmit} className="p-3.5 pt-3 space-y-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 animate-in fade-in duration-150">
                {passwordError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-rose-500" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {/* Old Password Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Current (Old) Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full pl-3 pr-9 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-purple-600 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 border-none bg-transparent"
                      title={showOldPassword ? 'Hide password' : 'Show password'}
                    >
                      {showOldPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Required to confirm identity before applying any change.
                  </p>
                </div>

                {/* New Password Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-3 pr-9 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-purple-600 transition-colors"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 border-none bg-transparent"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-3 pr-9 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-purple-600 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 border-none bg-transparent"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordSectionOpen(false);
                      setPasswordError(null);
                      setPasswordSuccess(null);
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-white border border-neutral-200 dark:border-white/30 text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="px-4 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/40 text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Lock size={12} />
                    <span>{isSubmittingPassword ? 'Verifying...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Appearance Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Preferences
        </h3>

        <div className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-white flex items-center justify-center border border-neutral-200/60 dark:border-white/20">
              {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-900 dark:text-white">Dark Mode</p>
              <p className="text-[10px] text-neutral-400">
                {isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white border border-neutral-200 dark:border-white/30 font-semibold text-xs active:scale-95 transition-all cursor-pointer shadow-2xs"
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
          className="w-full flex items-center justify-between py-2 text-left bg-neutral-50/60 hover:bg-neutral-100 dark:bg-neutral-800/80 dark:hover:bg-neutral-750 px-2.5 rounded-xl border border-neutral-200/60 dark:border-white/20 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <FileText size={14} className="text-neutral-500 dark:text-neutral-300" />
            <span className="text-xs font-medium text-neutral-800 dark:text-white">
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
              <p className="text-xs font-semibold text-neutral-800 dark:text-white">Alokpat Web</p>
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
          className="text-[11px] text-neutral-400 hover:text-red-500 inline-flex items-center gap-1 transition-colors bg-transparent border-none"
        >
          <RotateCcw size={11} />
          <span>Reset App Data</span>
        </button>
      </div>

      {/* Logout button */}
      {currentUser && (
        <button
          onClick={logout}
          className="w-full py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-800 dark:text-white hover:text-rose-600 dark:hover:text-rose-300 border border-neutral-200 dark:border-white/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-2xs"
        >
          <LogOut size={13} />
          <span>Sign Out of @{currentUser.username}</span>
        </button>
      )}

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};
