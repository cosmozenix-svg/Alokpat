import React, { useState } from 'react';
import {
  Shield,
  Search,
  CheckCircle2,
  Ban,
  AlertTriangle,
  Megaphone,
  Mail,
  Phone,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  X,
  Lock,
  Calendar,
  Layers,
  Trash2,
  LogOut,
  ChevronRight,
  Send,
  Check,
  Flag,
  MessageCircle,
  FileText,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User, Post, ContentReport, ReportContentType, BadgeVariant, BadgeShape } from '../types';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { formatExactDateTime, formatRelativeTime } from '../utils/formatters';

export const AdminPanel: React.FC = () => {
  const {
    isAdminLoggedIn,
    isAdminPanelOpen,
    setIsAdminPanelOpen,
    adminLogin,
    adminLogout,
    users,
    posts,
    comments,
    reports,
    adminToggleVerify,
    adminUpdateVerificationBadge,
    adminToggleBan,
    adminIssueWarning,
    adminSendNotice,
    adminSendBroadcast,
    adminDeletePost,
    adminDeleteComment,
    adminResolveReport,
    adminDismissReport,
    openUserProfile,
  } = useApp();

  // Admin Login Form
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  // Admin Navigation Tabs
  const [activeAdminTab, setActiveAdminTab] = useState<'moderation' | 'users' | 'broadcast' | 'posts'>('moderation');

  // Admin User Search & Filter
  const [adminSearch, setAdminSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'verified' | 'banned' | 'warned'>('all');

  // Reports Filter
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved' | 'posts' | 'comments'>('pending');

  // Password visibility map
  const [showPasswordMap, setShowPasswordMap] = useState<Record<number, boolean>>({});

  // Modals inside admin
  const [selectedUserForAction, setSelectedUserForAction] = useState<User | null>(null);
  const [actionModalType, setActionModalType] = useState<'notice' | 'warning' | 'details' | 'verify' | null>(null);

  // Form states for Verification Badge Customization
  const [badgeTierChoice, setBadgeTierChoice] = useState<BadgeVariant>('blue');
  const [badgeShapeChoice, setBadgeShapeChoice] = useState<BadgeShape>('starburst');
  const [badgeCustomLabel, setBadgeCustomLabel] = useState<string>('');

  const openBadgeModal = (user: User) => {
    setSelectedUserForAction(user);
    setBadgeTierChoice(
      user.badgeVariant || (user.username === 'admin' || user.email === 'cosmozenix@gmail.com' ? 'gold' : 'blue')
    );
    setBadgeShapeChoice(user.badgeShape || 'starburst');
    setBadgeCustomLabel(user.customBadgeLabel || '');
    setActionModalType('verify');
  };

  const handleSaveBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction) return;
    adminUpdateVerificationBadge(
      selectedUserForAction.id,
      badgeTierChoice,
      badgeShapeChoice,
      badgeCustomLabel.trim() || undefined
    );
    setActionModalType(null);
  };

  // Form states for Direct Notice
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeUrgency, setNoticeUrgency] = useState<'info' | 'warning' | 'alert'>('info');

  // Form states for Warning
  const [warningMessage, setWarningMessage] = useState('');
  const [warningSeverity, setWarningSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');

  // Form states for Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastUrgency, setBroadcastUrgency] = useState<'info' | 'warning' | 'alert'>('info');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  if (!isAdminPanelOpen) return null;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = adminLogin(adminUser, adminPass);
    if (!res.success) {
      setLoginError(res.error || 'Authentication failed.');
    }
  };

  const togglePasswordVisibility = (userId: number) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Filtered users list
  const filteredUsers = users.filter(u => {
    const query = adminSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      u.id.toString().includes(query.replace(/^#/, '')) ||
      u.name.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query.replace(/^@/, '')) ||
      u.email.toLowerCase().includes(query) ||
      u.phone.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (userFilter === 'verified') return u.isVerified;
    if (userFilter === 'banned') return u.isBanned;
    if (userFilter === 'warned') return u.warningCount > 0;
    return true;
  });

  // Filtered reports list
  const filteredReports = reports.filter(r => {
    if (reportFilter === 'pending') return r.status === 'pending';
    if (reportFilter === 'resolved') return r.status === 'resolved' || r.status === 'dismissed';
    if (reportFilter === 'posts') return r.contentType === 'post';
    if (reportFilter === 'comments') return r.contentType === 'comment';
    return true;
  });

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  const handleSendNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction || !noticeMessage.trim()) return;

    adminSendNotice(
      selectedUserForAction.id,
      noticeTitle || 'Moderation Notification',
      noticeMessage,
      noticeUrgency
    );

    setActionModalType(null);
    setNoticeTitle('');
    setNoticeMessage('');
  };

  const handleIssueWarningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction || !warningMessage.trim()) return;

    adminIssueWarning(selectedUserForAction.id, warningMessage, warningSeverity);
    setActionModalType(null);
    setWarningMessage('');
  };

  const handleSendBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    adminSendBroadcast(
      broadcastTitle || 'Official Announcement',
      broadcastMessage,
      broadcastUrgency
    );

    setBroadcastSuccess(true);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Admin Header */}
        <div className="px-5 py-3.5 bg-neutral-900 text-white flex items-center justify-between flex-shrink-0 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src="https://cdn.phototourl.com/member/2026-10-08-8ec4cdef-3d01-41f5-9311-bdd705d46a0e.jpg"
                alt="Alokpat Web Icon"
                className="w-8 h-8 rounded-xl object-cover shadow-sm border border-neutral-700"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] ring-2 ring-neutral-900 shadow-xs">
                <Shield size={9} />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm tracking-tight">Alokpat Admin Panel</h2>
                <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-[10px] font-medium text-neutral-300">
                  Moderator
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                User Management & Content Moderation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={adminLogout}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            )}
            <button
              onClick={() => setIsAdminPanelOpen(false)}
              className="p-1 rounded-md text-neutral-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Not Logged In View */}
        {!isAdminLoggedIn ? (
          <div className="p-8 max-w-sm mx-auto my-auto w-full text-center space-y-3.5">
            <div className="relative w-14 h-14 mx-auto mb-1">
              <img
                src="https://cdn.phototourl.com/member/2026-10-08-8ec4cdef-3d01-41f5-9311-bdd705d46a0e.jpg"
                alt="Alokpat Web Icon"
                className="w-14 h-14 rounded-2xl object-cover shadow-md border border-neutral-200 dark:border-neutral-700"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] ring-2 ring-white dark:ring-neutral-900 shadow-xs">
                <Shield size={11} />
              </span>
            </div>
            <h3 className="font-semibold text-base text-neutral-900 dark:text-white">Admin Authentication</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Enter admin credentials to manage accounts and moderate reported content.
            </p>

            {loginError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs rounded-lg text-left">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Admin Username
                </label>
                <input
                  type="text"
                  value={adminUser}
                  onChange={e => setAdminUser(e.target.value)}
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                  placeholder="admin"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={adminPass}
                  onChange={e => setAdminPass(e.target.value)}
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                  placeholder="admin123"
                />
              </div>

              <div className="p-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[11px] text-neutral-600 dark:text-neutral-400">
                Default: <strong>Username: admin</strong> | <strong>Password: admin123</strong>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Log In as Admin
              </button>
            </form>
          </div>
        ) : (
          /* Logged In Admin Dashboard */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Users</p>
                <p className="text-base font-bold text-neutral-900 dark:text-white">{users.length}</p>
                <p className="text-[10px] text-neutral-400">Registered</p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Pending Reports</p>
                <p className={`text-base font-bold ${pendingReportsCount > 0 ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>
                  {pendingReportsCount}
                </p>
                <p className="text-[10px] text-neutral-400">Queue</p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Verified</p>
                <p className="text-base font-bold text-blue-500">
                  {users.filter(u => u.isVerified).length}
                </p>
                <p className="text-[10px] text-neutral-400">Badges</p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Banned</p>
                <p className="text-base font-bold text-red-500">
                  {users.filter(u => u.isBanned).length}
                </p>
                <p className="text-[10px] text-neutral-400">Suspended</p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 col-span-2 sm:col-span-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Posts</p>
                <p className="text-base font-bold text-neutral-900 dark:text-white">{posts.length}</p>
                <p className="text-[10px] text-neutral-400">Active</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto scrollbar-none text-xs">
              <button
                onClick={() => setActiveAdminTab('moderation')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                  activeAdminTab === 'moderation'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Flag size={13} />
                <span>Moderation Queue</span>
                {pendingReportsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[9px] font-bold">
                    {pendingReportsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveAdminTab('users')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                  activeAdminTab === 'users'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <UserCheck size={13} />
                <span>Users ({users.length})</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('broadcast')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                  activeAdminTab === 'broadcast'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Megaphone size={13} />
                <span>Broadcast</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('posts')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                  activeAdminTab === 'posts'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <FileText size={13} />
                <span>Posts ({posts.length})</span>
              </button>
            </div>

            {/* TAB 1: Content Moderation Dashboard */}
            {activeAdminTab === 'moderation' && (
              <div className="space-y-3">
                {/* Moderation Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setReportFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg font-medium ${
                      reportFilter === 'pending'
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Pending ({reports.filter(r => r.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setReportFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium ${
                      reportFilter === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    All ({reports.length})
                  </button>
                  <button
                    onClick={() => setReportFilter('posts')}
                    className={`px-2.5 py-1 rounded-lg font-medium ${
                      reportFilter === 'posts'
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Posts
                  </button>
                  <button
                    onClick={() => setReportFilter('comments')}
                    className={`px-2.5 py-1 rounded-lg font-medium ${
                      reportFilter === 'comments'
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Comments
                  </button>
                  <button
                    onClick={() => setReportFilter('resolved')}
                    className={`px-2.5 py-1 rounded-lg font-medium ${
                      reportFilter === 'resolved'
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Resolved
                  </button>
                </div>

                {/* Reports List */}
                <div className="space-y-2.5">
                  {filteredReports.length === 0 ? (
                    <div className="bg-neutral-50 dark:bg-neutral-800/40 p-6 rounded-xl text-center border border-neutral-200 dark:border-neutral-700">
                      <ShieldCheck size={28} className="text-emerald-500 mx-auto mb-1.5" />
                      <h4 className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">
                        No reports in this queue
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Clean moderation queue.
                      </p>
                    </div>
                  ) : (
                    filteredReports.map(report => {
                      const reportedUser = users.find(u => u.id === report.reportedUserId);
                      const postTarget = report.contentType === 'post' ? posts.find(p => p.id === report.contentId) : null;
                      const commentTarget = report.contentType === 'comment' ? comments.find(c => c.id === report.contentId) : null;

                      return (
                        <div
                          key={report.id}
                          className={`p-3.5 rounded-xl border transition-colors ${
                            report.status === 'pending'
                              ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'
                              : 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    report.contentType === 'post'
                                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  }`}
                                >
                                  {report.contentType.toUpperCase()}
                                </span>
                                <span className="text-xs font-semibold text-red-600">
                                  {report.reason}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  {formatRelativeTime(report.createdAt)}
                                </span>
                              </div>

                              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                                Reported User:{' '}
                                <strong className="text-neutral-900 dark:text-white">
                                  {reportedUser ? `@${reportedUser.username} (#${reportedUser.id})` : `#${report.reportedUserId}`}
                                </strong>
                              </p>

                              {/* Preview of flagged content */}
                              <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                {report.contentType === 'post' && postTarget && (
                                  <div>
                                    <p className="line-clamp-2">{postTarget.caption || '[No text caption]'}</p>
                                    {postTarget.images && postTarget.images.length > 0 && (
                                      <p className="text-[10px] text-neutral-400 mt-1">
                                        Includes {postTarget.images.length} photo(s)
                                      </p>
                                    )}
                                  </div>
                                )}
                                {report.contentType === 'comment' && commentTarget && (
                                  <p>"{commentTarget.text}"</p>
                                )}
                                {!postTarget && !commentTarget && (
                                  <p className="italic text-neutral-400">Content already deleted.</p>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            {report.status === 'pending' && (
                              <div className="flex flex-col gap-1 flex-shrink-0 text-xs">
                                <button
                                  onClick={() => adminResolveReport(report.id, 'deleted_content')}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
                                >
                                  Delete Content
                                </button>
                                <button
                                  onClick={() => {
                                    if (reportedUser) {
                                      setSelectedUserForAction(reportedUser);
                                      setActionModalType('warning');
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg"
                                >
                                  Issue Warning
                                </button>
                                <button
                                  onClick={() => adminDismissReport(report.id)}
                                  className="px-2.5 py-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg"
                                >
                                  Dismiss
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Users Management */}
            {activeAdminTab === 'users' && (
              <div className="space-y-3">
                {/* Search & Filters */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search ID, name, username, email, phone..."
                      value={adminSearch}
                      onChange={e => setAdminSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {(['all', 'verified', 'banned', 'warned'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setUserFilter(f)}
                        className={`px-2.5 py-1 rounded-lg font-medium capitalize ${
                          userFilter === f
                            ? 'bg-purple-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Users List */}
                <div className="space-y-2">
                  {filteredUsers.length === 0 ? (
                    <div className="bg-neutral-50 dark:bg-neutral-800/40 p-6 rounded-xl text-center border border-neutral-200 dark:border-neutral-700">
                      <p className="text-xs text-neutral-400">No users found.</p>
                    </div>
                  ) : (
                    filteredUsers.map(user => {
                      const isPwdVisible = !!showPasswordMap[user.id];

                      return (
                        <div
                          key={user.id}
                          className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatar user={user} size="md" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1 font-semibold text-neutral-900 dark:text-white">
                                  <span>{user.name}</span>
                                  {user.isVerified && (
                                    <button
                                      type="button"
                                      onClick={() => openBadgeModal(user)}
                                      title="Edit badge tier & credentials"
                                      className="inline-flex cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                    >
                                      <VerifiedBadge size="sm" user={user} interactive={false} />
                                    </button>
                                  )}
                                  {user.isBanned && (
                                    <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">
                                      BANNED
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-neutral-400">
                                  @{user.username} • ID: #{user.id}
                                </p>
                              </div>
                            </div>

                            {/* Fast Action Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => adminToggleVerify(user.id)}
                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  user.isVerified
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                }`}
                              >
                                {user.isVerified ? 'Verified ✓' : 'Verify'}
                              </button>
                              {user.isVerified && (
                                <button
                                  onClick={() => openBadgeModal(user)}
                                  title="Customize Badge Tier & Shape"
                                  className="px-2 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
                                >
                                  <Sparkles size={11} />
                                  <span>Tier</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedUserForAction(user);
                                  setActionModalType('notice');
                                }}
                                className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg"
                              >
                                Notice
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUserForAction(user);
                                  setActionModalType('warning');
                                }}
                                className="px-2 py-1 bg-amber-500 text-white rounded-lg font-medium"
                              >
                                Warn ({user.warningCount})
                              </button>
                              <button
                                onClick={() => adminToggleBan(user.id)}
                                className={`px-2 py-1 rounded-lg font-medium ${
                                  user.isBanned
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-red-600 text-white'
                                }`}
                              >
                                {user.isBanned ? 'Unban' : 'Ban'}
                              </button>
                            </div>
                          </div>

                          {/* Credentials Details Bar */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500">
                            <div>Email: <strong className="text-neutral-800 dark:text-neutral-200">{user.email}</strong></div>
                            <div>Phone: <strong className="text-neutral-800 dark:text-neutral-200">{user.phone}</strong></div>
                            <div className="flex items-center gap-1">
                              <span>Password:</span>
                              <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                {isPwdVisible ? user.password : '••••••••'}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(user.id)}
                                className="text-neutral-400 hover:text-neutral-600 p-0.5"
                              >
                                {isPwdVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Broadcast */}
            {activeAdminTab === 'broadcast' && (
              <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3 max-w-lg mx-auto text-xs">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Megaphone size={15} />
                  Send Global Announcement
                </h3>
                <p className="text-neutral-400 text-[11px]">
                  Broadcast a highlighted notification to all registered users on Alokpat.
                </p>

                {broadcastSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    Broadcast announcement dispatched successfully!
                  </div>
                )}

                <form onSubmit={handleSendBroadcastSubmit} className="space-y-3">
                  <div>
                    <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. System Update or Community Notice"
                      value={broadcastTitle}
                      onChange={e => setBroadcastTitle(e.target.value)}
                      className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Enter announcement text..."
                      value={broadcastMessage}
                      onChange={e => setBroadcastMessage(e.target.value)}
                      className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg"
                  >
                    Broadcast to All Users
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: Post Directory */}
            {activeAdminTab === 'posts' && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Posts ({posts.length})
                </h3>

                <div className="space-y-2">
                  {posts.map(p => {
                    const author = users.find(u => u.id === p.userId);
                    return (
                      <div
                        key={p.id}
                        className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <UserAvatar user={author} size="sm" />
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1 font-semibold text-neutral-900 dark:text-white">
                              <span>{author?.name || 'User'}</span>
                              <span className="text-neutral-400 font-normal">@{author?.username}</span>
                              {author?.isVerified && <VerifiedBadge size="sm" user={author} />}
                            </div>
                            <p className="text-neutral-700 dark:text-neutral-300 line-clamp-2">
                              {p.caption}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => adminDeletePost(p.id)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg font-medium flex items-center gap-1 flex-shrink-0"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Direct Notice Modal */}
      {actionModalType === 'notice' && selectedUserForAction && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 max-w-sm w-full border border-neutral-200 dark:border-neutral-800 space-y-3 shadow-xl text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
                Notice to @{selectedUserForAction.username}
              </h3>
              <button onClick={() => setActionModalType(null)}>
                <X size={16} className="text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleSendNoticeSubmit} className="space-y-3">
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Account Security Update"
                  value={noticeTitle}
                  onChange={e => setNoticeTitle(e.target.value)}
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Message</label>
                <textarea
                  rows={3}
                  placeholder="Enter notice text..."
                  value={noticeMessage}
                  onChange={e => setNoticeMessage(e.target.value)}
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-neutral-900 dark:text-white resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg"
              >
                Send Notice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {actionModalType === 'warning' && selectedUserForAction && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 max-w-sm w-full border border-red-200 dark:border-red-900/60 space-y-3 shadow-xl text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-red-600 flex items-center gap-1.5">
                <AlertTriangle size={15} />
                Warning for @{selectedUserForAction.username}
              </h3>
              <button onClick={() => setActionModalType(null)}>
                <X size={16} className="text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleIssueWarningSubmit} className="space-y-3">
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Reason</label>
                <textarea
                  rows={3}
                  placeholder="Specify violation (e.g. harassment, spam)..."
                  value={warningMessage}
                  onChange={e => setWarningMessage(e.target.value)}
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-neutral-900 dark:text-white resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
              >
                Issue Warning
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Verification Badge Editor Modal */}
      {actionModalType === 'verify' && selectedUserForAction && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 max-w-md w-full border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xl text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600">
                  <Award size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    Verification Badge Editor
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Configure tier, shape & custom title for @{selectedUserForAction.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionModalType(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Live Interactive Preview Card */}
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-neutral-200/80 dark:border-neutral-750 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <UserAvatar
                    user={{
                      ...selectedUserForAction,
                      badgeVariant: badgeTierChoice,
                      badgeShape: badgeShapeChoice,
                      customBadgeLabel: badgeCustomLabel || undefined,
                      isVerified: true,
                    }}
                    size="md"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-900 dark:text-white">
                    <span>{selectedUserForAction.name}</span>
                    <VerifiedBadge
                      size="sm"
                      variant={badgeTierChoice}
                      shape={badgeShapeChoice}
                      user={{
                        ...selectedUserForAction,
                        badgeVariant: badgeTierChoice,
                        badgeShape: badgeShapeChoice,
                        customBadgeLabel: badgeCustomLabel || undefined,
                        isVerified: true,
                      }}
                      interactive={false}
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    @{selectedUserForAction.username} • #{selectedUserForAction.id}
                  </p>
                </div>
              </div>

              {/* Pill Preview */}
              <VerifiedBadge
                size="xs"
                variant={badgeTierChoice}
                shape={badgeShapeChoice}
                showPill={true}
                pillText={badgeCustomLabel || undefined}
                user={{
                  ...selectedUserForAction,
                  badgeVariant: badgeTierChoice,
                  badgeShape: badgeShapeChoice,
                  customBadgeLabel: badgeCustomLabel || undefined,
                  isVerified: true,
                }}
                interactive={false}
              />
            </div>

            <form onSubmit={handleSaveBadge} className="space-y-3.5">
              {/* Badge Tier Selector */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 text-[11px] uppercase tracking-wider">
                  Badge Tier & Color
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'blue' as BadgeVariant, name: 'Verified Account', desc: 'Standard Public', color: 'bg-blue-500' },
                    { id: 'gold' as BadgeVariant, name: 'Official Staff / Org', desc: 'Enterprise & Gov', color: 'bg-amber-500' },
                    { id: 'purple' as BadgeVariant, name: 'VIP Founding Creator', desc: 'Elite Ecosystem', color: 'bg-purple-600' },
                    { id: 'green' as BadgeVariant, name: 'Certified Real Identity', desc: 'Real Human ID', color: 'bg-emerald-500' },
                    { id: 'ruby' as BadgeVariant, name: 'Featured Partner', desc: 'Trending Influencer', color: 'bg-rose-500' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBadgeTierChoice(t.id)}
                      className={`p-2 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                        badgeTierChoice === t.id
                          ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 ring-1 ring-purple-600'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${t.color} flex-shrink-0 mt-0.5 shadow-xs`} />
                      <div className="min-w-0">
                        <div className="font-semibold text-neutral-900 dark:text-white text-[11px] truncate">
                          {t.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Badge Shape Selector */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 text-[11px] uppercase tracking-wider">
                  Badge Emblem Shape
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'starburst' as BadgeShape, name: 'Starburst' },
                    { id: 'shield' as BadgeShape, name: 'Shield' },
                    { id: 'circle' as BadgeShape, name: 'Circle' },
                    { id: 'gem' as BadgeShape, name: 'Gem' },
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setBadgeShapeChoice(s.id)}
                      className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                        badgeShapeChoice === s.id
                          ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <div className="w-5 h-5 mx-auto mb-1">
                        <VerifiedBadge
                          size="sm"
                          variant={badgeTierChoice}
                          shape={s.id}
                          interactive={false}
                        />
                      </div>
                      <span className="text-[10px] block">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Badge Label (optional) */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1 text-[11px] uppercase tracking-wider">
                  Custom Badge Title / Subtitle <span className="text-neutral-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Moderator, Official Partner, Founding Creator"
                  value={badgeCustomLabel}
                  onChange={e => setBadgeCustomLabel(e.target.value)}
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600 text-xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    adminToggleVerify(selectedUserForAction.id);
                    setActionModalType(null);
                  }}
                  className="py-2.5 px-3 rounded-xl border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Revoke Verification
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  Save Badge Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
