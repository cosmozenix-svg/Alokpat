import React, { useState } from 'react';
import { Flag, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReportReason } from '../types';

export const ReportModal: React.FC = () => {
  const { reportModalState, closeReportModal, submitReport, getUserById } = useApp();
  const [selectedReason, setSelectedReason] = useState<ReportReason>('Spam or Scam');
  const [details, setDetails] = useState('');
  const [successToast, setSuccessToast] = useState('');

  if (!reportModalState || !reportModalState.isOpen) return null;

  const reportedUser = getUserById(reportModalState.reportedUserId);

  const reasons: ReportReason[] = [
    'Spam or Scam',
    'Harassment or Hate Speech',
    'Inappropriate Content',
    'Misinformation',
    'Copyright Violation',
    'Other',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = submitReport(
      reportModalState.contentType,
      reportModalState.contentId,
      reportModalState.reportedUserId,
      selectedReason,
      details
    );

    if (res.success) {
      setSuccessToast(res.message);
      setTimeout(() => {
        setSuccessToast('');
        closeReportModal();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Flag size={14} />
            </div>
            <div>
              <h3 className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white">
                Report {reportModalState.contentType === 'post' ? 'Post' : 'Comment'}
              </h3>
              <p className="text-[10px] text-neutral-400">
                Author: {reportedUser ? `@${reportedUser.username}` : 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={closeReportModal}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {successToast ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 size={30} className="text-emerald-500 mx-auto" />
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{successToast}</p>
            <p className="text-[10px] text-neutral-400">Thank you for reporting.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Reason for report:
              </label>
              <div className="space-y-1">
                {reasons.map(r => (
                  <label
                    key={r}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedReason === r
                        ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 text-red-700 dark:text-red-300 font-medium'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span>{r}</span>
                    <input
                      type="radio"
                      name="reportReason"
                      checked={selectedReason === r}
                      onChange={() => setSelectedReason(r)}
                      className="text-red-600 focus:ring-red-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Details (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Additional notes for moderators..."
                value={details}
                onChange={e => setDetails(e.target.value)}
                className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldAlert size={13} />
              <span>Submit Report</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
