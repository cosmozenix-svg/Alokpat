import React from 'react';
import { X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-purple-100 dark:border-purple-950/60 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/20">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src="https://cdn.phototourl.com/member/2026-10-08-8ec4cdef-3d01-41f5-9311-bdd705d46a0e.jpg"
                alt="Alokpat Icon"
                className="w-8 h-8 rounded-xl object-cover shadow-sm border border-purple-200/50 dark:border-purple-800"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] ring-2 ring-white dark:ring-slate-900 shadow-xs">
                <ShieldCheck size={9} />
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Alokpat Terms & Services</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Community Safety & Platform Policies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200/50 dark:border-purple-900/30 flex items-start gap-2.5 text-xs text-purple-900 dark:text-purple-200">
            <CheckCircle2 size={16} className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <p>
              By joining Alokpat, you agree to foster a creative, respectful, and safe community for creators and explorers worldwide.
            </p>
          </div>

          <section>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1 text-sm">1. Account & Unique ID</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Each user is assigned a unique sequential ID (e.g., #10001) and a unique username handle. Usernames may only be modified once every 30 days to maintain integrity.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1 text-sm">2. Content & Keyword Tags</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Users are encouraged to use descriptive keywords separated by commas (e.g., [natural scene], [nature]) to facilitate community search discovery. Content violating human dignity or local laws will be moderated.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1 text-sm">3. Verification & Badges</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The verified circle tick badge is awarded by Alokpat administration for recognized contributors, authentic profiles, and high quality creators.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1 text-sm">4. Moderation & Warnings</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Administrators reserve the authority to issue official warning notices and suspend (ban) accounts that repeatedly violate community standards.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
          {onAccept && (
            <button
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20 transition-all"
            >
              I Acknowledge & Agree
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
