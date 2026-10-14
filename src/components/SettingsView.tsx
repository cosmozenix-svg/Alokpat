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
  Award,
  ExternalLink,
  X,
  Check,
  Users,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TermsModal } from './TermsModal';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { BadgeVariant } from '../types';
import { formatExactDateTime, formatRelativeTime } from '../utils/formatters';

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
    requestVerification,
  } = useApp();

  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [eligibilityNotice, setEligibilityNotice] = useState<string | null>(null);

  // Verification Application Form State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyCategory, setVerifyCategory] = useState('Content Creator');
  const [verifyPurpose, setVerifyPurpose] = useState('');
  const [verifyRealName, setVerifyRealName] = useState(currentUser?.name || '');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

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

  // Follower requirement count
  const followerCount = currentUser?.followers?.length || 0;
  const isEligibleForVerification = followerCount >= 100;

  const handleOpenVerification = () => {
    setVerifyError(null);
    setVerifySuccess(null);
    setVerifyRealName(currentUser?.name || '');
    setIsVerifyModalOpen(true);
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifySuccess(null);

    if (followerCount < 100) {
      setVerifyError(
        `Eligibility Requirement: A user must have at least 100 followers to apply for the verification badge. You currently have ${followerCount} follower${followerCount === 1 ? '' : 's'}.`
      );
      return;
    }

    if (!verifyPurpose.trim()) {
      setVerifyError('Please specify the purpose and justification for verification.');
      return;
    }

    if (!verifyRealName.trim()) {
      setVerifyError('Please provide your full real or legal entity name.');
      return;
    }

    setIsSubmittingVerify(true);

    const res = requestVerification({
      purpose: verifyPurpose.trim(),
      category: verifyCategory,
      realName: verifyRealName.trim(),
      notes: verifyNotes.trim(),
    });

    setIsSubmittingVerify(false);

    if (!res.success) {
      setVerifyError(res.message);
    } else {
      setVerifySuccess(res.message);
      setTimeout(() => {
        setIsVerifyModalOpen(false);
        setVerifySuccess(null);
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

      {/* Account Verification & Badge Section */}
      {currentUser && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Award size={16} />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                  Account Verification
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Official badge credentials & authenticity status
                </p>
              </div>
            </div>

            {currentUser.isVerified ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-1">
                <Check size={11} /> Verified
              </span>
            ) : currentUser.verificationStatus === 'pending' ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200/80 dark:border-amber-800/80 flex items-center gap-1 animate-pulse">
                Pending Review
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-medium">
                Unverified
              </span>
            )}
          </div>

          {/* Verification Status Card */}
          {currentUser.isVerified ? (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200/80 dark:border-blue-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <VerifiedBadge size="md" user={currentUser} />
                  <div>
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1">
                      <span>{currentUser.customBadgeLabel || 'Official Verified Member'}</span>
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Tier: {currentUser.badgeVariant?.toUpperCase() || 'BLUE'} • Shape: {currentUser.badgeShape || 'Starburst'}
                    </p>
                  </div>
                </div>
                {currentUser.verifiedAt && (
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {formatRelativeTime(currentUser.verifiedAt)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Your profile has an active Authenticity Certificate registered. You can inspect your digital verification certificate anytime by tapping your badge in the profile view.
              </p>
            </div>
          ) : currentUser.verificationStatus === 'pending' ? (
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <h4 className="font-bold text-xs text-amber-900 dark:text-amber-300">
                    Application Pending Admin Review
                  </h4>
                </div>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                  Under Official Review
                </span>
              </div>

              {currentUser.verificationApplication && (
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-neutral-850/80 border border-amber-200/60 dark:border-amber-900/40 text-[11px] space-y-1">
                  <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                    <span>Category:</span>
                    <span className="font-semibold text-neutral-800 dark:text-white">{currentUser.verificationApplication.category}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                    <span>Real Name:</span>
                    <span className="font-semibold text-neutral-800 dark:text-white">{currentUser.verificationApplication.realName}</span>
                  </div>
                  <div className="text-neutral-600 dark:text-neutral-300 pt-0.5 line-clamp-2">
                    <span className="font-medium text-neutral-500">Purpose: </span>
                    "{currentUser.verificationApplication.purpose}"
                  </div>
                </div>
              )}

              <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                Your application has been received by the Alokpat Administration team. An admin will verify the submitted information and confirm your badge tier.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-750 space-y-3">
              {/* Followers Condition Indicator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-800 dark:text-white flex items-center gap-1.5">
                    <Users size={13} className="text-purple-600 dark:text-purple-400" />
                    <span>Eligibility: 100 Organic Followers Required</span>
                  </span>
                  <span className={`font-bold font-mono text-[11px] ${isEligibleForVerification ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    {followerCount} / 100 Real Followers
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${isEligibleForVerification ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600'}`}
                    style={{ width: `${Math.min(100, Math.round((followerCount / 100) * 100))}%` }}
                  />
                </div>

                {!isEligibleForVerification ? (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed pt-0.5">
                    You need <strong className="text-purple-600 dark:text-purple-400">{100 - followerCount} more real followers</strong> to unlock verification. Users can only apply for verification when they have at least 100 organic followers.
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 pt-0.5">
                    <CheckCircle2 size={12} />
                    <span>Requirement Met! You have {followerCount} real followers and qualify to apply.</span>
                  </p>
                )}
              </div>

              {/* Action Button */}
              {isEligibleForVerification ? (
                <button
                  type="button"
                  onClick={handleOpenVerification}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:shadow-purple-500/25 active:scale-95 transition-all cursor-pointer border border-purple-500/30"
                >
                  <ShieldCheck size={15} />
                  <span>Apply for Verification</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEligibilityNotice(
                        `Verification Requirement: You need at least 100 real organic followers to apply. You currently have ${followerCount} follower${followerCount === 1 ? '' : 's'} (${100 - followerCount} more needed).`
                      );
                      setTimeout(() => setEligibilityNotice(null), 5000);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer border border-neutral-200 dark:border-neutral-750 opacity-80"
                  >
                    <Lock size={14} />
                    <span>Apply for Verification (100 Real Followers Required)</span>
                  </button>

                  {eligibilityNotice && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2 animate-in fade-in">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <span>{eligibilityNotice}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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

      {/* Apply for Verification Modal */}
      {isVerifyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsVerifyModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <ShieldCheck size={17} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    Apply for Verification Badge
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Official Authenticity Credentials Application
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleVerificationSubmit} className="p-4 overflow-y-auto space-y-3.5 text-xs">
              {/* Follower Requirement Confirmation Banner */}
              <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </div>
                  <div>
                    <p className="font-bold text-xs text-neutral-900 dark:text-white">
                      Follower Requirement Confirmed
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-300">
                      Eligible with {followerCount} followers (100+ required)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold">
                  PASS
                </span>
              </div>

              {verifyError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-rose-500" />
                  <span>{verifyError}</span>
                </div>
              )}

              {verifySuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                  <span>{verifySuccess}</span>
                </div>
              )}

              {/* Info Box 1: Category */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Creator / Account Category <span className="text-purple-600">*</span>
                </label>
                <select
                  value={verifyCategory}
                  onChange={e => setVerifyCategory(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                  required
                >
                  <option value="Content Creator">Content Creator & Influencer</option>
                  <option value="Artist / Musician">Artist / Musician / Designer</option>
                  <option value="Software Developer / Tech">Software Developer & Tech</option>
                  <option value="Business / Brand">Business / Brand / Organization</option>
                  <option value="Journalist / Media">Journalist / News & Media</option>
                  <option value="Public Figure">Public Figure / Speaker</option>
                  <option value="Gaming & Esports">Gaming & Esports</option>
                  <option value="Education">Education & Academic</option>
                  <option value="Other">Other Community Role</option>
                </select>
              </div>

              {/* Info Box 2: Purpose */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Purpose of Verification <span className="text-purple-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={verifyPurpose}
                  onChange={e => setVerifyPurpose(e.target.value)}
                  placeholder="Explain why your account should be verified (e.g. proof of authenticity, preventing clones or impersonators, community trust)..."
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white text-xs resize-none focus:outline-none focus:ring-1 focus:ring-purple-600"
                  required
                />
              </div>

              {/* Info Box 3: Full Legal / Real Name */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Full Real / Legal Entity Name <span className="text-purple-600">*</span>
                </label>
                <input
                  type="text"
                  value={verifyRealName}
                  onChange={e => setVerifyRealName(e.target.value)}
                  placeholder="e.g. Johnathan Doe or Acme Corporation"
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                  required
                />
              </div>

              {/* Additional Notes for Admin Review */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Additional Notes for Admin Review
                </label>
                <textarea
                  rows={2}
                  value={verifyNotes}
                  onChange={e => setVerifyNotes(e.target.value)}
                  placeholder="Any other details to help the administrators confirm your identity..."
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white text-xs resize-none focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-white font-semibold text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVerify}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck size={14} />
                  <span>{isSubmittingVerify ? 'Submitting Application...' : 'Submit Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};
