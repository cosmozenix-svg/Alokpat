import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  AtSign,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TermsModal } from './TermsModal';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    login,
    register,
    checkUsernameAvailable,
  } = useApp();

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Validation feedback
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');
  }, [authMode, isAuthModalOpen]);

  // Live username availability check
  useEffect(() => {
    const clean = regUsername.trim().toLowerCase();
    if (!clean) {
      setUsernameStatus('idle');
      return;
    }
    if (clean.length < 3) {
      setUsernameStatus('invalid');
      return;
    }
    const isAvailable = checkUsernameAvailable(clean);
    setUsernameStatus(isAvailable ? 'valid' : 'invalid');
  }, [regUsername, checkUsernameAvailable]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your Email or Phone Number.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    const res = login(loginIdentifier, loginPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Login failed.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regName.trim()) {
      setErrorMessage('Please enter your Name.');
      return;
    }
    if (!regUsername.trim()) {
      setErrorMessage('Please enter a unique Username.');
      return;
    }
    if (usernameStatus !== 'valid') {
      setErrorMessage('This username is already taken or invalid. Please pick another.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('Please enter your Email.');
      return;
    }
    if (!regPhone.trim()) {
      setErrorMessage('Please enter your Phone number.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('Please acknowledge the Terms & Services to create an account.');
      return;
    }

    const res = register({
      name: regName,
      username: regUsername,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Registration failed.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="https://cdn.phototourl.com/member/2026-10-08-8ec4cdef-3d01-41f5-9311-bdd705d46a0e.jpg"
                alt="Alokpat Icon"
                className="w-7 h-7 rounded-lg object-cover shadow-xs border border-neutral-200 dark:border-neutral-700"
              />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                {authMode === 'login' ? 'Sign In to Alokpat' : 'Create an Account'}
              </h3>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-90 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-neutral-100 dark:border-neutral-800 bg-neutral-100/90 dark:bg-neutral-850 p-1 m-3 mb-0 rounded-xl">
            <button
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-bold border border-neutral-200/50 dark:border-neutral-700/50'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-bold border border-neutral-200/50 dark:border-neutral-700/50'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Log In
            </button>
          </div>

          {/* Form Body */}
          <div className="p-5 overflow-y-auto space-y-3.5 text-xs">
            {errorMessage && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-lg flex items-start gap-2 text-red-600 dark:text-red-400">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Email, Phone Number or Username
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="user@example.com or phone"
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showLoginPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 hover:shadow-lg hover:shadow-purple-600/30 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Log In</span>
                  <ArrowRight size={14} />
                </button>

                {/* Quick Demo Accounts */}
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="text-[11px] text-neutral-400 text-center mb-2">Quick Demo Accounts (1-Tap):</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier('sarah@design.io');
                        setLoginPassword('password123');
                        login('sarah@design.io', 'password123');
                      }}
                      className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-750 border border-neutral-200/70 dark:border-neutral-700 text-left active:scale-95 transition-all cursor-pointer"
                    >
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">Sarah Jenkins</div>
                      <div className="text-[10px] text-neutral-400">@sarah_design</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier('alex@techcorp.dev');
                        setLoginPassword('password123');
                        login('alex@techcorp.dev', 'password123');
                      }}
                      className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-750 border border-neutral-200/70 dark:border-neutral-700 text-left active:scale-95 transition-all cursor-pointer"
                    >
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">Alex Rivera</div>
                      <div className="text-[10px] text-neutral-400">@alex_tech</div>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Your name"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>
                </div>

                {/* Unique Username */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      Username (Unique) <span className="text-red-500">*</span>
                    </label>
                    {regUsername && (
                      <span
                        className={`text-[10px] font-medium flex items-center gap-0.5 ${
                          usernameStatus === 'valid'
                            ? 'text-emerald-600'
                            : 'text-red-500'
                        }`}
                      >
                        {usernameStatus === 'valid' ? (
                          <>
                            <Check size={11} /> Available
                          </>
                        ) : (
                          <>
                            <AlertCircle size={11} /> Taken
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="e.g. jessica"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className={`w-full pl-8 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 ${
                        usernameStatus === 'valid'
                          ? 'border-emerald-500 focus:ring-emerald-500'
                          : usernameStatus === 'invalid'
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-neutral-200 dark:border-neutral-700 focus:ring-purple-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="••••••"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Confirm <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="••••••"
                        value={regConfirmPassword}
                        onChange={e => setRegConfirmPassword(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Services Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-[11px] text-neutral-600 dark:text-neutral-400">
                      I have acknowledged the{' '}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setIsTermsModalOpen(true);
                        }}
                        className="text-purple-600 dark:text-purple-400 font-semibold underline inline"
                      >
                        Terms & Services
                      </button>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-purple-600/20 hover:shadow-lg hover:shadow-purple-600/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Create Account</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={() => setTermsAccepted(true)}
      />
    </>
  );
};
