import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TermsModal } from './TermsModal';
import { PhoneInput } from './PhoneInput';
import { Country, DEFAULT_COUNTRY } from '../data/countries';
import {
  validatePhoneNumber,
  validateRealEmail,
} from '../utils/validators';

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
  const [regCountry, setRegCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Validation feedback
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Real email validation result
  const emailResult = useMemo(() => {
    if (!regEmail.trim()) return null;
    return validateRealEmail(regEmail);
  }, [regEmail]);

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
    if (regUsername.trim().length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }
    if (usernameStatus !== 'valid') {
      setErrorMessage('This username is already in use. Please pick another.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('Please enter your Email address.');
      return;
    }
    const emailValidation = validateRealEmail(regEmail);
    if (!emailValidation.isValid) {
      setErrorMessage(
        emailValidation.error ||
          'Please enter a real email address (e.g. something@gmail.com, yahoo.com, outlook.com).'
      );
      return;
    }
    if (!regPhone.trim()) {
      setErrorMessage('Please enter your phone number.');
      return;
    }
    const phoneValidation = validatePhoneNumber(regPhone, regCountry.code);
    if (!phoneValidation.isValid) {
      setErrorMessage(phoneValidation.error || 'Please enter a valid phone number.');
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

    const fullPhoneNumber = `${regCountry.code} ${regPhone.trim()}`;
    const res = register({
      name: regName,
      username: regUsername,
      email: regEmail,
      phone: fullPhoneNumber,
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
                        className={`text-[10px] font-semibold flex items-center gap-1 ${
                          usernameStatus === 'valid'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {usernameStatus === 'valid' ? (
                          <>
                            <Check size={12} className="stroke-[2.5]" /> Available
                          </>
                        ) : (
                          <>
                            <X size={12} className="stroke-[2.5]" /> In Use
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
                          ? 'border-green-500 focus:ring-green-500'
                          : usernameStatus === 'invalid'
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-neutral-200 dark:border-neutral-700 focus:ring-purple-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    {regEmail && emailResult && (
                      <span
                        className={`text-[10px] font-semibold flex items-center gap-1 ${
                          emailResult.isValid
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {emailResult.isValid ? (
                          <>
                            <Check size={12} className="stroke-[2.5]" /> Valid Email
                          </>
                        ) : (
                          <>
                            <X size={12} className="stroke-[2.5]" /> Invalid Email
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="email"
                      placeholder="user@gmail.com, yahoo.com, outlook.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className={`w-full pl-8 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 ${
                        regEmail && emailResult
                          ? emailResult.isValid
                            ? 'border-green-500 focus:ring-green-500'
                            : 'border-red-500 focus:ring-red-500'
                          : 'border-neutral-200 dark:border-neutral-700 focus:ring-purple-600'
                      }`}
                    />
                  </div>
                  {regEmail && emailResult && !emailResult.isValid ? (
                    <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={10} className="flex-shrink-0" />
                      <span>{emailResult.error}</span>
                    </p>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-neutral-400">
                      <span>Quick domain:</span>
                      {['gmail.com', 'yahoo.com', 'outlook.com'].map(dom => (
                        <button
                          key={dom}
                          type="button"
                          onClick={() => {
                            const prefix = regEmail.includes('@') ? regEmail.split('@')[0] : regEmail.trim();
                            setRegEmail(prefix ? `${prefix}@${dom}` : `@${dom}`);
                          }}
                          className="px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono transition-colors cursor-pointer"
                        >
                          @{dom}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone Number Input with Custom Country Code Dropdown */}
                <PhoneInput
                  label="Phone Number"
                  required
                  value={regPhone}
                  selectedCountry={regCountry}
                  onCountryChange={setRegCountry}
                  onChange={(val, _full, c) => {
                    setRegPhone(val);
                    setRegCountry(c);
                  }}
                  placeholder="Enter phone number"
                  helperText="Select country code and enter your phone number (any number of digits)"
                />

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
