import React, { useState, useMemo } from 'react';
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
  BarChart3,
  Activity,
  TrendingUp,
  Users,
  Clock,
  MapPin,
  Globe,
  Edit,
  Key,
  RefreshCw,
  Copy,
  Heart,
  Image as ImageIcon,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  User as UserIcon,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User, Post, ContentReport, ReportContentType, BadgeVariant, BadgeShape } from '../types';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { formatExactDateTime, formatRelativeTime } from '../utils/formatters';

interface AdminAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  target?: string;
  type: 'ban' | 'verify' | 'warning' | 'notice' | 'delete' | 'broadcast' | 'edit';
}

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
    adminUpdateUser,
    adminDeleteUser,
    openUserProfile,
  } = useApp();

  // Admin Login Form
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  // Admin Navigation Tabs
  const [activeAdminTab, setActiveAdminTab] = useState<
    'moderation' | 'users' | 'posts' | 'analytics' | 'broadcast' | 'audit'
  >('moderation');

  // Admin User Search & Filter & Sort
  const [adminSearch, setAdminSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'verified' | 'pending' | 'banned' | 'warned' | 'private'>('all');
  const [userSortBy, setUserSortBy] = useState<'newest' | 'oldest' | 'followers' | 'posts' | 'warnings' | 'name'>('newest');

  // Reports Filter
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved' | 'posts' | 'comments'>('pending');

  // Posts Filter & Search
  const [postSearch, setPostSearch] = useState('');
  const [postFilter, setPostFilter] = useState<'all' | 'media' | 'text' | 'popular'>('all');

  // Password visibility map for quick user cards
  const [showPasswordMap, setShowPasswordMap] = useState<Record<number, boolean>>({});

  // Modals inside admin
  const [selectedUserForAction, setSelectedUserForAction] = useState<User | null>(null);
  const [actionModalType, setActionModalType] = useState<'notice' | 'warning' | 'verify' | null>(null);

  // DETAILED PROFILE INSPECTOR MODAL STATE
  const [detailedUser, setDetailedUser] = useState<User | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'posts' | 'comments' | 'network' | 'moderation'>('overview');
  const [detailPasswordVisible, setDetailPasswordVisible] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // EDIT USER MODAL STATE
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormName, setEditFormName] = useState('');
  const [editFormUsername, setEditFormUsername] = useState('');
  const [editFormBio, setEditFormBio] = useState('');
  const [editFormEmail, setEditFormEmail] = useState('');
  const [editFormPhone, setEditFormPhone] = useState('');
  const [editFormWebsite, setEditFormWebsite] = useState('');
  const [editFormLocation, setEditFormLocation] = useState('');
  const [editFormIsPrivate, setEditFormIsPrivate] = useState(false);
  const [editFormIsVerified, setEditFormIsVerified] = useState(false);
  const [editFormBadgeVariant, setEditFormBadgeVariant] = useState<BadgeVariant>('blue');
  const [editFormBadgeShape, setEditFormBadgeShape] = useState<BadgeShape>('starburst');
  const [editFormCustomLabel, setEditFormCustomLabel] = useState('');

  // RESET PASSWORD MODAL STATE
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [resetPassSuccess, setResetPassSuccess] = useState(false);

  // DELETE ACCOUNT MODAL STATE
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deletePurgeContent, setDeletePurgeContent] = useState<boolean>(true);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string>('');

  // Form states for Verification Badge Customization
  const [badgeTierChoice, setBadgeTierChoice] = useState<BadgeVariant>('blue');
  const [badgeShapeChoice, setBadgeShapeChoice] = useState<BadgeShape>('starburst');
  const [badgeCustomLabel, setBadgeCustomLabel] = useState<string>('');
  const [badgeSuccessMessage, setBadgeSuccessMessage] = useState<string>('');

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

  // Admin Audit Log
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>([
    {
      id: 'log-init-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      action: 'System Initialized',
      details: 'Admin session started and moderation monitoring active',
      type: 'verify',
    },
  ]);

  const addAuditLog = (action: string, details: string, type: AdminAuditEntry['type'], target?: string) => {
    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        action,
        details,
        type,
        target,
      },
      ...prev,
    ]);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  if (!isAdminPanelOpen) return null;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = adminLogin(adminUser, adminPass);
    if (!res.success) {
      setLoginError(res.error || 'Authentication failed.');
    } else {
      addAuditLog('Admin Logged In', `User '${adminUser}' logged into Admin Panel`, 'verify');
    }
  };

  const togglePasswordVisibility = (userId: number) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Open Detailed Profile Inspector
  const openDetailedProfile = (targetUser: User) => {
    // Refresh user object from latest state if available
    const freshUser = users.find(u => u.id === targetUser.id) || targetUser;
    setDetailedUser(freshUser);
    setDetailTab('overview');
    setDetailPasswordVisible(false);
  };

  // Open Edit Profile Modal
  const openEditModal = (targetUser: User) => {
    setEditingUser(targetUser);
    setEditFormName(targetUser.name || '');
    setEditFormUsername(targetUser.username || '');
    setEditFormBio(targetUser.bio || '');
    setEditFormEmail(targetUser.email || '');
    setEditFormPhone(targetUser.phone || '');
    setEditFormWebsite(targetUser.website || '');
    setEditFormLocation(targetUser.location || '');
    setEditFormIsPrivate(!!targetUser.isPrivate);
    setEditFormIsVerified(!!targetUser.isVerified);
    setEditFormBadgeVariant(
      targetUser.badgeVariant || (targetUser.username === 'admin' || targetUser.email === 'cosmozenix@gmail.com' ? 'gold' : 'blue')
    );
    setEditFormBadgeShape(targetUser.badgeShape || 'starburst');
    setEditFormCustomLabel(targetUser.customBadgeLabel || '');
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const isNowVerified = editFormIsVerified;
    adminUpdateUser(editingUser.id, {
      name: editFormName.trim(),
      username: editFormUsername.trim().toLowerCase(),
      bio: editFormBio.trim(),
      email: editFormEmail.trim(),
      phone: editFormPhone.trim(),
      website: editFormWebsite.trim(),
      location: editFormLocation.trim(),
      isPrivate: editFormIsPrivate,
      isVerified: isNowVerified,
      verificationStatus: isNowVerified ? 'verified' : 'unverified',
      verifiedAt: isNowVerified ? (editingUser.verifiedAt || new Date().toISOString()) : undefined,
      badgeVariant: editFormBadgeVariant,
      badgeShape: editFormBadgeShape,
      customBadgeLabel: editFormCustomLabel.trim() || undefined,
    });

    addAuditLog(
      'Updated User Profile',
      `Admin edited profile fields & tier (${editFormBadgeVariant}) for @${editingUser.username} (ID: #${editingUser.id})`,
      'edit',
      `@${editingUser.username}`
    );

    // Update detailed user if open
    if (detailedUser && Number(detailedUser.id) === Number(editingUser.id)) {
      setDetailedUser(prev =>
        prev
          ? {
              ...prev,
              name: editFormName.trim(),
              username: editFormUsername.trim().toLowerCase(),
              bio: editFormBio.trim(),
              email: editFormEmail.trim(),
              phone: editFormPhone.trim(),
              website: editFormWebsite.trim(),
              location: editFormLocation.trim(),
              isPrivate: editFormIsPrivate,
              isVerified: isNowVerified,
              verificationStatus: isNowVerified ? 'verified' : 'unverified',
              verifiedAt: isNowVerified ? (editingUser.verifiedAt || new Date().toISOString()) : undefined,
              badgeVariant: editFormBadgeVariant,
              badgeShape: editFormBadgeShape,
              customBadgeLabel: editFormCustomLabel.trim() || undefined,
            }
          : null
      );
    }

    setEditingUser(null);
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser || !newPasswordVal.trim()) return;

    adminUpdateUser(resetPassUser.id, {
      password: newPasswordVal.trim(),
    });

    addAuditLog(
      'Reset User Password',
      `Admin reset password for user @${resetPassUser.username} (#${resetPassUser.id})`,
      'edit',
      `@${resetPassUser.username}`
    );

    // Update detailed view if matching
    if (detailedUser && detailedUser.id === resetPassUser.id) {
      setDetailedUser(prev => (prev ? { ...prev, password: newPasswordVal.trim() } : null));
    }

    setResetPassSuccess(true);
    setTimeout(() => {
      setResetPassSuccess(false);
      setResetPassUser(null);
      setNewPasswordVal('');
    }, 1200);
  };

  // Badge Modal
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

    addAuditLog(
      'Updated Verification Badge',
      `Set badge tier: ${badgeTierChoice}, shape: ${badgeShapeChoice} for @${selectedUserForAction.username}`,
      'verify',
      `@${selectedUserForAction.username}`
    );

    if (detailedUser && Number(detailedUser.id) === Number(selectedUserForAction.id)) {
      setDetailedUser(prev =>
        prev
          ? {
              ...prev,
              isVerified: true,
              verificationStatus: 'verified',
              badgeVariant: badgeTierChoice,
              badgeShape: badgeShapeChoice,
              customBadgeLabel: badgeCustomLabel.trim() || undefined,
            }
          : null
      );
    }

    setBadgeSuccessMessage(`Saved! Badge tier set to ${badgeTierChoice.toUpperCase()}`);
    setTimeout(() => {
      setBadgeSuccessMessage('');
      setActionModalType(null);
    }, 800);
  };

  // Handle Account Deletion
  const handleConfirmDeleteUser = () => {
    if (!deletingUser) return;
    const target = deletingUser;
    const result = adminDeleteUser(target.id, deletePurgeContent);

    addAuditLog(
      'Deleted User Account',
      `Permanently deleted @${target.username} (ID: #${target.id}) with purgeContent=${deletePurgeContent}`,
      'delete',
      `@${target.username}`
    );

    if (detailedUser && Number(detailedUser.id) === Number(target.id)) {
      setDetailedUser(null);
    }
    if (editingUser && Number(editingUser.id) === Number(target.id)) {
      setEditingUser(null);
    }

    setDeleteSuccessMessage(result.message);
    setTimeout(() => {
      setDeleteSuccessMessage('');
      setDeletingUser(null);
      setDeleteConfirmText('');
    }, 1200);
  };

  // Notice & Warning Handlers
  const handleSendNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction || !noticeMessage.trim()) return;

    adminSendNotice(
      selectedUserForAction.id,
      noticeTitle || 'Moderation Notification',
      noticeMessage,
      noticeUrgency
    );

    addAuditLog(
      'Issued Direct Notice',
      `Sent notice "${noticeTitle || 'Notice'}" to @${selectedUserForAction.username} (Urgency: ${noticeUrgency})`,
      'notice',
      `@${selectedUserForAction.username}`
    );

    setActionModalType(null);
    setNoticeTitle('');
    setNoticeMessage('');
  };

  const handleIssueWarningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction || !warningMessage.trim()) return;

    adminIssueWarning(selectedUserForAction.id, warningMessage, warningSeverity);

    addAuditLog(
      'Issued Community Warning',
      `Warned @${selectedUserForAction.username} (Severity: ${warningSeverity}): "${warningMessage}"`,
      'warning',
      `@${selectedUserForAction.username}`
    );

    if (detailedUser && detailedUser.id === selectedUserForAction.id) {
      setDetailedUser(prev =>
        prev
          ? {
              ...prev,
              warningCount: (prev.warningCount || 0) + 1,
              warnings: [
                ...(prev.warnings || []),
                {
                  id: `warn-${Date.now()}`,
                  date: new Date().toISOString(),
                  message: warningMessage,
                  issuedBy: 'admin',
                  severity: warningSeverity,
                },
              ],
            }
          : null
      );
    }

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

    addAuditLog(
      'Dispatched Global Broadcast',
      `Announcement "${broadcastTitle || 'Broadcast'}" sent to all users`,
      'broadcast'
    );

    setBroadcastSuccess(true);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  // Filter & Sort Users
  const filteredUsers = useMemo(() => {
    let result = users.filter(u => {
      const query = adminSearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        u.id.toString().includes(query.replace(/^#/, '')) ||
        u.name.toLowerCase().includes(query) ||
        u.username.toLowerCase().includes(query.replace(/^@/, '')) ||
        u.email.toLowerCase().includes(query) ||
        (u.phone && u.phone.toLowerCase().includes(query)) ||
        (u.bio && u.bio.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (userFilter === 'verified') return u.isVerified;
      if (userFilter === 'pending') return u.verificationStatus === 'pending';
      if (userFilter === 'banned') return u.isBanned;
      if (userFilter === 'warned') return u.warningCount > 0;
      if (userFilter === 'private') return !!u.isPrivate;
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (userSortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (userSortBy === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (userSortBy === 'followers') {
        return (b.followers?.length || 0) - (a.followers?.length || 0);
      }
      if (userSortBy === 'posts') {
        const postsA = posts.filter(p => p.userId === a.id).length;
        const postsB = posts.filter(p => p.userId === b.id).length;
        return postsB - postsA;
      }
      if (userSortBy === 'warnings') {
        return (b.warningCount || 0) - (a.warningCount || 0);
      }
      if (userSortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [users, adminSearch, userFilter, userSortBy, posts]);

  // Filtered Reports
  const filteredReports = reports.filter(r => {
    if (reportFilter === 'pending') return r.status === 'pending';
    if (reportFilter === 'resolved') return r.status === 'resolved' || r.status === 'dismissed';
    if (reportFilter === 'posts') return r.contentType === 'post';
    if (reportFilter === 'comments') return r.contentType === 'comment';
    return true;
  });

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  // Filtered Posts for Posts Tab
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const q = postSearch.trim().toLowerCase();
      const author = users.find(u => u.id === p.userId);
      const matchesQuery =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.caption.toLowerCase().includes(q) ||
        (author && (author.username.toLowerCase().includes(q) || author.name.toLowerCase().includes(q)));

      if (!matchesQuery) return false;

      if (postFilter === 'media') return p.images && p.images.length > 0;
      if (postFilter === 'text') return !p.images || p.images.length === 0;
      if (postFilter === 'popular') return (p.likes?.length || 0) > 0 || (p.reactions?.heart?.length || 0) > 0;
      return true;
    });
  }, [posts, postSearch, postFilter, users]);

  // Platform Analytics Calculations
  const platformStats = useMemo(() => {
    const totalLikes = posts.reduce((acc, p) => acc + (p.likes?.length || 0) + (p.reactions?.heart?.length || 0), 0);
    const totalMediaPosts = posts.filter(p => p.images && p.images.length > 0).length;
    const verifiedUsersCount = users.filter(u => u.isVerified).length;
    const bannedUsersCount = users.filter(u => u.isBanned).length;
    const warnedUsersCount = users.filter(u => u.warningCount > 0).length;
    const resolvedReportsCount = reports.filter(r => r.status === 'resolved' || r.status === 'dismissed').length;

    return {
      totalUsers: users.length,
      verifiedUsersCount,
      bannedUsersCount,
      warnedUsersCount,
      totalPosts: posts.length,
      totalMediaPosts,
      totalComments: comments.length,
      totalLikes,
      pendingReportsCount,
      resolvedReportsCount,
    };
  }, [users, posts, comments, reports]);

  // User detail helpers
  const detailedUserPosts = useMemo(() => {
    if (!detailedUser) return [];
    return posts.filter(p => p.userId === detailedUser.id);
  }, [posts, detailedUser]);

  const detailedUserComments = useMemo(() => {
    if (!detailedUser) return [];
    return comments.filter(c => c.userId === detailedUser.id);
  }, [comments, detailedUser]);

  const detailedUserFollowers = useMemo(() => {
    if (!detailedUser || !detailedUser.followers) return [];
    return users.filter(u => detailedUser.followers.includes(u.id));
  }, [users, detailedUser]);

  const detailedUserFollowing = useMemo(() => {
    if (!detailedUser || !detailedUser.following) return [];
    return users.filter(u => detailedUser.following.includes(u.id));
  }, [users, detailedUser]);

  const detailedUserTotalLikes = useMemo(() => {
    return detailedUserPosts.reduce(
      (acc, p) => acc + (p.likes?.length || 0) + (p.reactions?.heart?.length || 0),
      0
    );
  }, [detailedUserPosts]);

  const reportsAgainstDetailedUser = useMemo(() => {
    if (!detailedUser) return [];
    return reports.filter(r => r.reportedUserId === detailedUser.id);
  }, [reports, detailedUser]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-white/20 overflow-hidden flex flex-col max-h-[96vh]">
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
                <h2 className="font-bold text-sm tracking-tight text-white">Alokpat Super Admin</h2>
                <span className="px-1.5 py-0.2 rounded bg-purple-950 text-[10px] font-bold text-purple-300 border border-purple-800/60">
                  Moderation HQ
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                User Management, Detailed Profiling & Content Oversight
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={adminLogout}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white flex items-center gap-1 transition-colors border border-white/20 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            )}
            <button
              onClick={() => setIsAdminPanelOpen(false)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Close Admin Panel"
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
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
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
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                  placeholder="admin123"
                />
              </div>

              <div className="notice-box p-2 bg-neutral-100 dark:bg-neutral-700/80 border border-neutral-200 dark:border-white/30 rounded-lg text-[11px] text-neutral-600 dark:text-white">
                Default: <strong>Username: admin</strong> | <strong>Password: admin123</strong>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Log In as Admin
              </button>
            </form>
          </div>
        ) : (
          /* Logged In Admin Dashboard */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <div className="bg-neutral-50 dark:bg-neutral-800/70 p-3 rounded-xl border border-neutral-200 dark:border-white/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-300">Users</p>
                <p className="text-base font-bold text-neutral-900 dark:text-white">{platformStats.totalUsers}</p>
                <p className="text-[10px] text-neutral-400">Registered</p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/70 p-3 rounded-xl border border-neutral-200 dark:border-white/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-300">Queue</p>
                <p className={`text-base font-bold ${pendingReportsCount > 0 ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>
                  {pendingReportsCount}
                </p>
                <p className="text-[10px] text-neutral-400">Pending</p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/70 p-3 rounded-xl border border-neutral-200 dark:border-white/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-300">Verified</p>
                <p className="text-base font-bold text-blue-500 dark:text-blue-400">
                  {platformStats.verifiedUsersCount}
                </p>
                <p className="text-[10px] text-neutral-400">Badged</p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/70 p-3 rounded-xl border border-neutral-200 dark:border-white/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-300">Banned</p>
                <p className="text-base font-bold text-red-500">
                  {platformStats.bannedUsersCount}
                </p>
                <p className="text-[10px] text-neutral-400">Suspended</p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/70 p-3 rounded-xl border border-neutral-200 dark:border-white/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-300">Posts</p>
                <p className="text-base font-bold text-neutral-900 dark:text-white">{platformStats.totalPosts}</p>
                <p className="text-[10px] text-neutral-400">Published</p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/70 p-3 rounded-xl border border-neutral-200 dark:border-white/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-300">Total Likes</p>
                <p className="text-base font-bold text-rose-500">
                  {platformStats.totalLikes}
                </p>
                <p className="text-[10px] text-neutral-400">Engagements</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto scrollbar-none text-xs">
              <button
                onClick={() => setActiveAdminTab('moderation')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeAdminTab === 'moderation'
                    ? 'bg-neutral-900 dark:bg-neutral-700 text-white border border-transparent dark:border-white/30'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
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
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeAdminTab === 'users'
                    ? 'bg-neutral-900 dark:bg-neutral-700 text-white border border-transparent dark:border-white/30'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <UserCheck size={13} />
                <span>Users & Profiles ({users.length})</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('posts')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeAdminTab === 'posts'
                    ? 'bg-neutral-900 dark:bg-neutral-700 text-white border border-transparent dark:border-white/30'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <FileText size={13} />
                <span>Posts Directory ({posts.length})</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('analytics')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeAdminTab === 'analytics'
                    ? 'bg-neutral-900 dark:bg-neutral-700 text-white border border-transparent dark:border-white/30'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 size={13} />
                <span>System Analytics</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('broadcast')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeAdminTab === 'broadcast'
                    ? 'bg-neutral-900 dark:bg-neutral-700 text-white border border-transparent dark:border-white/30'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Megaphone size={13} />
                <span>Broadcast</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('audit')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  activeAdminTab === 'audit'
                    ? 'bg-neutral-900 dark:bg-neutral-700 text-white border border-transparent dark:border-white/30'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Clock size={13} />
                <span>Audit Logs ({auditLogs.length})</span>
              </button>
            </div>

            {/* TAB 1: Content Moderation Dashboard */}
            {activeAdminTab === 'moderation' && (
              <div className="space-y-3">
                {/* Moderation Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setReportFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                      reportFilter === 'pending'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-transparent dark:border-white/20'
                    }`}
                  >
                    Pending ({reports.filter(r => r.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setReportFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                      reportFilter === 'all'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-transparent dark:border-white/20'
                    }`}
                  >
                    All ({reports.length})
                  </button>
                  <button
                    onClick={() => setReportFilter('posts')}
                    className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                      reportFilter === 'posts'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-transparent dark:border-white/20'
                    }`}
                  >
                    Posts
                  </button>
                  <button
                    onClick={() => setReportFilter('comments')}
                    className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                      reportFilter === 'comments'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-transparent dark:border-white/20'
                    }`}
                  >
                    Comments
                  </button>
                  <button
                    onClick={() => setReportFilter('resolved')}
                    className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                      reportFilter === 'resolved'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-transparent dark:border-white/20'
                    }`}
                  >
                    Resolved
                  </button>
                </div>

                {/* Reports List */}
                <div className="space-y-2.5">
                  {filteredReports.length === 0 ? (
                    <div className="bg-neutral-50 dark:bg-neutral-800/40 p-6 rounded-xl text-center border border-neutral-200 dark:border-white/20">
                      <ShieldCheck size={28} className="text-emerald-500 mx-auto mb-1.5" />
                      <h4 className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">
                        No reports in this queue
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Clean moderation queue. All clear!
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
                              ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-white/20'
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
                                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                  {report.reason}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  {formatRelativeTime(report.createdAt)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                                <span>Reported User:</span>
                                {reportedUser ? (
                                  <button
                                    onClick={() => openDetailedProfile(reportedUser)}
                                    className="font-bold text-neutral-900 dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>@{reportedUser.username}</span>
                                    <span className="text-[10px] text-neutral-400">(#{reportedUser.id})</span>
                                    <Eye size={11} className="text-purple-500" />
                                  </button>
                                ) : (
                                  <strong className="text-neutral-900 dark:text-white">#{report.reportedUserId}</strong>
                                )}
                              </div>

                              {/* Preview of flagged content */}
                              <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-white/20">
                                {report.contentType === 'post' && postTarget && (
                                  <div>
                                    <p className="line-clamp-2">{postTarget.caption || '[No text caption]'}</p>
                                    {postTarget.images && postTarget.images.length > 0 && (
                                      <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                                        <ImageIcon size={11} />
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
                                  onClick={() => {
                                    adminResolveReport(report.id, 'deleted_content');
                                    addAuditLog('Resolved Report', `Deleted content for report #${report.id}`, 'delete');
                                  }}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg cursor-pointer transition-colors"
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
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg cursor-pointer transition-colors"
                                >
                                  Issue Warning
                                </button>
                                {reportedUser && (
                                  <button
                                    onClick={() => openDetailedProfile(reportedUser)}
                                    className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white font-medium rounded-lg border border-neutral-200 dark:border-white/20 cursor-pointer transition-colors flex items-center gap-1 justify-center"
                                  >
                                    <Eye size={11} />
                                    <span>Inspect User</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    adminDismissReport(report.id);
                                    addAuditLog('Dismissed Report', `Dismissed report #${report.id}`, 'notice');
                                  }}
                                  className="px-2.5 py-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg cursor-pointer transition-colors"
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

            {/* TAB 2: Users Management with Detailed Profile Viewer */}
            {activeAdminTab === 'users' && (
              <div className="space-y-3">
                {/* Search, Filter & Sort Controls */}
                <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200 dark:border-white/20 space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search ID, name, username, email, phone, bio..."
                        value={adminSearch}
                        onChange={e => setAdminSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400"
                      />
                    </div>

                    {/* Sorting selector */}
                    <div className="flex items-center gap-1 text-xs">
                      <ArrowUpDown size={13} className="text-neutral-400" />
                      <select
                        value={userSortBy}
                        onChange={e => setUserSortBy(e.target.value as any)}
                        className="p-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white"
                      >
                        <option value="newest">Sort: Newest Joined</option>
                        <option value="oldest">Sort: Oldest Joined</option>
                        <option value="followers">Sort: Most Followers</option>
                        <option value="posts">Sort: Most Posts</option>
                        <option value="warnings">Sort: Most Warnings</option>
                        <option value="name">Sort: Name (A-Z)</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                    <Filter size={12} className="text-neutral-400 mr-0.5 flex-shrink-0" />
                    {(['all', 'verified', 'pending', 'banned', 'warned', 'private'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setUserFilter(f)}
                        className={`px-2.5 py-1 rounded-lg font-medium capitalize cursor-pointer transition-colors ${
                          userFilter === f
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-white/20'
                        }`}
                      >
                        {f === 'private' ? 'Private Accounts' : f === 'pending' ? 'Verification Pending' : f}
                      </button>
                    ))}
                    <span className="text-[11px] text-neutral-400 ml-auto flex-shrink-0">
                      Showing {filteredUsers.length} of {users.length}
                    </span>
                  </div>
                </div>

                {/* Users List */}
                <div className="space-y-2">
                  {filteredUsers.length === 0 ? (
                    <div className="bg-neutral-50 dark:bg-neutral-800/40 p-6 rounded-xl text-center border border-neutral-200 dark:border-white/20">
                      <p className="text-xs text-neutral-400">No users match your search criteria.</p>
                    </div>
                  ) : (
                    filteredUsers.map(user => {
                      const isPwdVisible = !!showPasswordMap[user.id];
                      const userPostsCount = posts.filter(p => p.userId === user.id).length;

                      return (
                        <div
                          key={user.id}
                          className="bg-white dark:bg-neutral-900 p-3.5 rounded-xl border border-neutral-200 dark:border-white/20 space-y-2.5 text-xs shadow-2xs hover:border-neutral-300 dark:hover:border-white/40 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatar user={user} size="md" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
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
                                  {user.warningCount > 0 && (
                                    <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-1 py-0.2 rounded font-semibold">
                                      {user.warningCount} warn
                                    </span>
                                  )}
                                  {user.isPrivate && (
                                    <span className="text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-1 py-0.2 rounded flex items-center gap-0.5">
                                      <Lock size={9} /> Private
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                                  <span>@{user.username}</span>
                                  <span>•</span>
                                  <span>ID: #{user.id}</span>
                                  <span>•</span>
                                  <span>{userPostsCount} posts</span>
                                  <span>•</span>
                                  <span>{(user.followers || []).length} followers</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons: Prominent "View Profile" + Moderation */}
                            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                              {/* PRIMARY FULL PROFILE DETAIL BUTTON */}
                              <button
                                onClick={() => openDetailedProfile(user)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                                title="Open full comprehensive profile with all posts, comments, contacts and history"
                              >
                                <Eye size={13} />
                                <span>Full Profile</span>
                              </button>

                              {/* Edit Profile button */}
                              <button
                                onClick={() => openEditModal(user)}
                                className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white font-medium rounded-lg text-xs border border-neutral-200 dark:border-white/20 flex items-center gap-1 cursor-pointer transition-colors"
                                title="Edit user profile details"
                              >
                                <Edit size={12} />
                                <span>Edit</span>
                              </button>

                              {/* Verify Toggle */}
                              <button
                                onClick={() => {
                                  adminToggleVerify(user.id);
                                  addAuditLog('Toggled Verify', `Toggled verification for @${user.username}`, 'verify');
                                }}
                                className={`px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                                  user.isVerified
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-white/20'
                                }`}
                              >
                                {user.isVerified ? 'Verified ✓' : 'Verify'}
                              </button>

                              {/* Customize Tier & Badge Button */}
                              <button
                                onClick={() => openBadgeModal(user)}
                                title="Configure Verification Tier & Badge Credentials"
                                className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border cursor-pointer ${
                                  user.isVerified
                                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60'
                                    : 'bg-neutral-50 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-750 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                              >
                                <Sparkles size={11} />
                                <span>{user.isVerified ? (user.badgeVariant ? `${user.badgeVariant.toUpperCase()} Tier` : 'Tier') : 'Set Tier'}</span>
                              </button>

                              {/* Warn Button */}
                              <button
                                onClick={() => {
                                  setSelectedUserForAction(user);
                                  setActionModalType('warning');
                                }}
                                className="px-2 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-xs cursor-pointer transition-colors"
                              >
                                Warn
                              </button>

                              {/* Ban / Unban Button */}
                              <button
                                onClick={() => {
                                  adminToggleBan(user.id);
                                  addAuditLog(
                                    user.isBanned ? 'Unbanned User' : 'Banned User',
                                    `${user.isBanned ? 'Unbanned' : 'Banned'} @${user.username} (#${user.id})`,
                                    'ban',
                                    `@${user.username}`
                                  );
                                }}
                                className={`px-2 py-1.5 rounded-lg font-semibold text-xs cursor-pointer transition-colors ${
                                  user.isBanned
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                              >
                                {user.isBanned ? 'Unban' : 'Ban'}
                              </button>

                              {/* Delete Account Button */}
                              <button
                                onClick={() => {
                                  setDeletingUser(user);
                                  setDeleteConfirmText('');
                                  setDeletePurgeContent(true);
                                }}
                                className="px-2 py-1.5 rounded-lg font-semibold text-xs bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/70 dark:hover:bg-red-900/80 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1 cursor-pointer transition-colors"
                                title="Permanently delete user account"
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>

                          {/* Quick Credentials Strip */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400">
                            <div className="truncate">
                              Email: <strong className="text-neutral-800 dark:text-neutral-200">{user.email}</strong>
                            </div>
                            <div className="truncate">
                              Phone: <strong className="text-neutral-800 dark:text-neutral-200">{user.phone || 'N/A'}</strong>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Password:</span>
                              <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                {isPwdVisible ? user.password : '••••••••'}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(user.id)}
                                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-0.5 cursor-pointer"
                                title="Toggle password visibility"
                              >
                                {isPwdVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                              </button>
                              <button
                                onClick={() => {
                                  setResetPassUser(user);
                                  setNewPasswordVal('');
                                }}
                                className="text-purple-600 dark:text-purple-400 hover:underline text-[10px] ml-1 font-semibold cursor-pointer"
                              >
                                Reset
                              </button>
                            </div>
                            <div className="text-right sm:text-right">
                              <button
                                onClick={() => openDetailedProfile(user)}
                                className="text-purple-600 dark:text-purple-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>Inspect full profile details</span>
                                <ChevronRight size={12} />
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

            {/* TAB 3: Posts Directory */}
            {activeAdminTab === 'posts' && (
              <div className="space-y-3 text-xs">
                {/* Search & Filters */}
                <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200 dark:border-white/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search post caption, author username, post ID..."
                      value={postSearch}
                      onChange={e => setPostSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto">
                    {(['all', 'media', 'text', 'popular'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setPostFilter(f)}
                        className={`px-2.5 py-1 rounded-lg font-medium capitalize cursor-pointer transition-colors ${
                          postFilter === f
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-white/20'
                        }`}
                      >
                        {f === 'media' ? 'Photos Only' : f === 'popular' ? 'Liked Posts' : f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredPosts.length === 0 ? (
                    <div className="p-6 text-center text-neutral-400 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-white/20">
                      No posts found matching filter.
                    </div>
                  ) : (
                    filteredPosts.map(p => {
                      const author = users.find(u => u.id === p.userId);
                      const postLikesCount = (p.likes?.length || 0) + (p.reactions?.heart?.length || 0);

                      return (
                        <div
                          key={p.id}
                          className="bg-white dark:bg-neutral-900 p-3.5 rounded-xl border border-neutral-200 dark:border-white/20 flex flex-col sm:flex-row items-start justify-between gap-3 text-xs shadow-2xs"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <UserAvatar
                              user={author}
                              size="sm"
                              onClick={() => author && openDetailedProfile(author)}
                            />
                            <div className="min-w-0 space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => author && openDetailedProfile(author)}
                                  className="font-bold text-neutral-900 dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <span>{author?.name || 'User'}</span>
                                  <span className="text-neutral-400 font-normal">@{author?.username}</span>
                                  {author?.isVerified && <VerifiedBadge size="sm" user={author} />}
                                </button>
                                <span className="text-[10px] text-neutral-400">
                                  {formatRelativeTime(p.createdAt)}
                                </span>
                                <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.2 rounded font-mono">
                                  #{p.id}
                                </span>
                              </div>

                              <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                                {p.caption || <span className="italic text-neutral-400">[No caption]</span>}
                              </p>

                              {/* Images preview thumbnails */}
                              {p.images && p.images.length > 0 && (
                                <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                                  {p.images.map((img, i) => (
                                    <img
                                      key={i}
                                      src={img}
                                      alt="Post attachment"
                                      className="w-14 h-14 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                                    />
                                  ))}
                                  <span className="text-[10px] text-neutral-400">
                                    ({p.images.length} image{p.images.length > 1 ? 's' : ''})
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
                                <span className="flex items-center gap-1">
                                  <Heart size={12} className="text-rose-500 fill-rose-500" />
                                  <span>{postLikesCount} likes</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle size={12} className="text-blue-500" />
                                  <span>{p.commentsCount || 0} comments</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:flex-col gap-1.5 flex-shrink-0 self-end sm:self-auto">
                            {author && (
                              <button
                                onClick={() => openDetailedProfile(author)}
                                className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white font-medium rounded-lg flex items-center gap-1 border border-neutral-200 dark:border-white/20 cursor-pointer transition-colors"
                              >
                                <Eye size={12} />
                                <span>Author</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                adminDeletePost(p.id);
                                addAuditLog('Deleted Post', `Admin deleted post #${p.id} by @${author?.username}`, 'delete');
                              }}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition-colors border border-red-200 dark:border-red-900/40"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Analytics & System Health */}
            {activeAdminTab === 'analytics' && (
              <div className="space-y-4 text-xs">
                <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-4 rounded-2xl border border-purple-500/20 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                      <Activity size={16} className="text-purple-500" />
                      Platform Health & Key Performance Indicators
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Live aggregate telemetry across user accounts, content generation, and community safety.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                    STATUS: OPERATIONAL
                  </span>
                </div>

                {/* Analytical Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-white/20 space-y-2">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">User Base</span>
                      <Users size={16} />
                    </div>
                    <p className="text-2xl font-black text-neutral-900 dark:text-white">{platformStats.totalUsers}</p>
                    <div className="space-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <div className="flex justify-between">
                        <span>Verified Creators:</span>
                        <strong className="text-blue-500">{platformStats.verifiedUsersCount}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Warned Accounts:</span>
                        <strong className="text-amber-500">{platformStats.warnedUsersCount}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Suspended / Banned:</span>
                        <strong className="text-red-500">{platformStats.bannedUsersCount}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-white/20 space-y-2">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">Content Volume</span>
                      <FileText size={16} />
                    </div>
                    <p className="text-2xl font-black text-neutral-900 dark:text-white">{platformStats.totalPosts}</p>
                    <div className="space-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <div className="flex justify-between">
                        <span>Media/Photo Posts:</span>
                        <strong className="text-purple-500">{platformStats.totalMediaPosts}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Text Posts:</span>
                        <strong className="text-neutral-700 dark:text-neutral-300">
                          {platformStats.totalPosts - platformStats.totalMediaPosts}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Comments:</span>
                        <strong className="text-indigo-500">{platformStats.totalComments}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-white/20 space-y-2">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">Community Safety</span>
                      <ShieldCheck size={16} />
                    </div>
                    <p className="text-2xl font-black text-emerald-500">
                      {reports.length === 0 ? '100%' : `${Math.round((platformStats.resolvedReportsCount / reports.length) * 100)}%`}
                    </p>
                    <div className="space-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <div className="flex justify-between">
                        <span>Pending Queue:</span>
                        <strong className="text-red-500">{platformStats.pendingReportsCount}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Resolved Cases:</span>
                        <strong className="text-emerald-500">{platformStats.resolvedReportsCount}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Reports:</span>
                        <strong className="text-neutral-700 dark:text-neutral-300">{reports.length}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Moderation Shortcuts */}
                <div className="bg-neutral-50 dark:bg-neutral-850 p-4 rounded-xl border border-neutral-200 dark:border-white/20">
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-white mb-2">
                    Quick Operational Actions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setActiveAdminTab('broadcast');
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <Megaphone size={13} />
                      <span>Send Broadcast Notice</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveAdminTab('users');
                        setUserFilter('banned');
                      }}
                      className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white rounded-lg font-medium border border-neutral-300 dark:border-white/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Ban size={13} />
                      <span>Review Suspended Accounts</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveAdminTab('moderation');
                        setReportFilter('pending');
                      }}
                      className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white rounded-lg font-medium border border-neutral-300 dark:border-white/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Flag size={13} />
                      <span>Process Reports Queue</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Broadcast */}
            {activeAdminTab === 'broadcast' && (
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-white/20 space-y-3.5 max-w-xl mx-auto text-xs shadow-sm">
                <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-950/60 rounded-xl text-purple-600">
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                      Global Announcement Dispatcher
                    </h3>
                    <p className="text-neutral-400 text-[11px]">
                      Broadcast a highlighted banner notification directly to every registered user on Alokpat.
                    </p>
                  </div>
                </div>

                {broadcastSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Broadcast announcement dispatched to all users successfully!</span>
                  </div>
                )}

                <form onSubmit={handleSendBroadcastSubmit} className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Announcement Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Scheduled Maintenance, Community Update, Feature Launch"
                      value={broadcastTitle}
                      onChange={e => setBroadcastTitle(e.target.value)}
                      className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Urgency / Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'info' as const, label: 'Informational', color: 'border-blue-500' },
                        { id: 'warning' as const, label: 'Warning / Policy', color: 'border-amber-500' },
                        { id: 'alert' as const, label: 'Critical Alert', color: 'border-red-500' },
                      ].map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setBroadcastUrgency(u.id)}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            broadcastUrgency === u.id
                              ? `${u.color} bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-white ring-1 ring-purple-600`
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {u.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Announcement Body
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Enter announcement text to be received by all users..."
                      value={broadcastMessage}
                      onChange={e => setBroadcastMessage(e.target.value)}
                      className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-purple-600"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-md shadow-purple-600/20 active:scale-98"
                  >
                    Broadcast to All Users
                  </button>
                </form>
              </div>
            )}

            {/* TAB 6: Audit Logs */}
            {activeAdminTab === 'audit' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Clock size={15} />
                    <span>Moderation & Security Activity Trail</span>
                  </h3>
                  <button
                    onClick={() => {
                      setAuditLogs([
                        {
                          id: `log-${Date.now()}`,
                          timestamp: new Date().toISOString(),
                          action: 'Audit Log Cleared',
                          details: 'Moderator cleared historical audit entries for current session',
                          type: 'notice',
                        },
                      ]);
                    }}
                    className="px-2 py-1 text-neutral-400 hover:text-red-500 text-[11px] cursor-pointer"
                  >
                    Clear Current Session Log
                  </button>
                </div>

                <div className="space-y-2">
                  {auditLogs.map(log => (
                    <div
                      key={log.id}
                      className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-white/20 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            log.type === 'ban'
                              ? 'bg-red-500'
                              : log.type === 'warning'
                              ? 'bg-amber-500'
                              : log.type === 'verify'
                              ? 'bg-blue-500'
                              : log.type === 'delete'
                              ? 'bg-rose-500'
                              : 'bg-purple-500'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-900 dark:text-white">{log.action}</span>
                            {log.target && (
                              <span className="text-purple-600 dark:text-purple-400 font-semibold">{log.target}</span>
                            )}
                          </div>
                          <p className="text-neutral-600 dark:text-neutral-300 mt-0.5">{log.details}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-neutral-400 flex-shrink-0">
                        {formatExactDateTime(log.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🚀 COMPREHENSIVE DETAILED USER PROFILE INSPECTOR MODAL */}
      {/* ========================================================================= */}
      {detailedUser && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-white/20 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 text-xs">
            {/* Inspector Header / Banner */}
            <div className="relative bg-gradient-to-r from-neutral-800 via-neutral-900 to-purple-950 p-5 text-white flex-shrink-0 border-b border-neutral-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <UserAvatar user={detailedUser} size="lg" showVerifiedCorner={false} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {detailedUser.name}
                      </h2>
                      {detailedUser.isVerified && (
                        <button
                          onClick={() => openBadgeModal(detailedUser)}
                          title="Click to edit badge credentials"
                          className="cursor-pointer hover:scale-110 transition-transform"
                        >
                          <VerifiedBadge size="md" user={detailedUser} interactive={false} />
                        </button>
                      )}
                      {detailedUser.isBanned && (
                        <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px] tracking-wider uppercase">
                          Banned
                        </span>
                      )}
                      {detailedUser.warningCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                          {detailedUser.warningCount} Warning{detailedUser.warningCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {detailedUser.isPrivate && (
                        <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 font-semibold text-[10px] flex items-center gap-1">
                          <Lock size={10} /> Private
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-300 font-medium mt-0.5">
                      @{detailedUser.username} • Account ID: <span className="font-mono text-purple-300">#{detailedUser.id}</span>
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
                      <Calendar size={12} />
                      Member since {formatExactDateTime(detailedUser.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      openUserProfile(detailedUser.id);
                      setDetailedUser(null);
                      setIsAdminPanelOpen(false);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="View user public profile in the app"
                  >
                    <ExternalLink size={12} />
                    <span className="hidden sm:inline">Open in App</span>
                  </button>
                  <button
                    onClick={() => setDetailedUser(null)}
                    className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer border border-neutral-700"
                    title="Close Inspector"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Quick Action Toolbar inside Header */}
              <div className="flex items-center gap-1.5 mt-3.5 pt-3 border-t border-neutral-800/80 overflow-x-auto text-xs">
                <button
                  onClick={() => openEditModal(detailedUser)}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium border border-neutral-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Edit size={12} />
                  <span>Edit Info</span>
                </button>

                <button
                  onClick={() => {
                    setResetPassUser(detailedUser);
                    setNewPasswordVal('');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium border border-neutral-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Key size={12} />
                  <span>Reset Password</span>
                </button>

                <button
                  onClick={() => openBadgeModal(detailedUser)}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-blue-300 font-medium border border-neutral-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Award size={12} />
                  <span>Badge & Tier</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedUserForAction(detailedUser);
                    setActionModalType('notice');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-purple-300 font-medium border border-neutral-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Mail size={12} />
                  <span>Send Notice</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedUserForAction(detailedUser);
                    setActionModalType('warning');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-300 font-medium border border-amber-700/60 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <AlertTriangle size={12} />
                  <span>Issue Warning</span>
                </button>

                <button
                  onClick={() => {
                    adminToggleBan(detailedUser.id);
                    setDetailedUser(prev => (prev ? { ...prev, isBanned: !prev.isBanned } : null));
                    addAuditLog(
                      detailedUser.isBanned ? 'Unbanned User' : 'Banned User',
                      `${detailedUser.isBanned ? 'Unbanned' : 'Banned'} @${detailedUser.username} from profile inspector`,
                      'ban',
                      `@${detailedUser.username}`
                    );
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                    detailedUser.isBanned
                      ? 'bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 border-emerald-700'
                      : 'bg-red-900/60 hover:bg-red-800 text-red-200 border-red-700'
                  }`}
                >
                  <Ban size={12} />
                  <span>{detailedUser.isBanned ? 'Unban Account' : 'Ban Account'}</span>
                </button>

                <button
                  onClick={() => {
                    setDeletingUser(detailedUser);
                    setDeleteConfirmText('');
                    setDeletePurgeContent(true);
                  }}
                  className="px-2.5 py-1 rounded-lg font-semibold bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Permanently delete this account from database"
                >
                  <Trash2 size={12} />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex items-center gap-1 px-5 pt-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 overflow-x-auto text-xs">
              <button
                onClick={() => setDetailTab('overview')}
                className={`px-3 py-2 rounded-t-xl font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  detailTab === 'overview'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}
              >
                <UserIcon size={13} />
                <span>Account Overview</span>
              </button>

              <button
                onClick={() => setDetailTab('posts')}
                className={`px-3 py-2 rounded-t-xl font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  detailTab === 'posts'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}
              >
                <FileText size={13} />
                <span>Posts & Media ({detailedUserPosts.length})</span>
              </button>

              <button
                onClick={() => setDetailTab('comments')}
                className={`px-3 py-2 rounded-t-xl font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  detailTab === 'comments'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}
              >
                <MessageSquare size={13} />
                <span>Comments ({detailedUserComments.length})</span>
              </button>

              <button
                onClick={() => setDetailTab('network')}
                className={`px-3 py-2 rounded-t-xl font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  detailTab === 'network'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}
              >
                <Users size={13} />
                <span>Social Network ({(detailedUser.followers || []).length} / {(detailedUser.following || []).length})</span>
              </button>

              <button
                onClick={() => setDetailTab('moderation')}
                className={`px-3 py-2 rounded-t-xl font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  detailTab === 'moderation'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                }`}
              >
                <ShieldAlert size={13} />
                <span>Compliance & History</span>
                {(detailedUser.warningCount > 0 || reportsAgainstDetailedUser.length > 0) && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold text-[9px]">
                    {detailedUser.warningCount + reportsAgainstDetailedUser.length}
                  </span>
                )}
              </button>
            </div>

            {/* Inspector Body Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* TAB A: OVERVIEW & CREDENTIAL VAULT */}
              {detailTab === 'overview' && (
                <div className="space-y-4">
                  {/* Stats Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="bg-neutral-50 dark:bg-neutral-800/70 p-3 rounded-2xl border border-neutral-200 dark:border-white/20 text-center">
                      <p className="text-lg font-black text-neutral-900 dark:text-white">{detailedUserPosts.length}</p>
                      <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Total Posts</p>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/70 p-3 rounded-2xl border border-neutral-200 dark:border-white/20 text-center">
                      <p className="text-lg font-black text-neutral-900 dark:text-white">{(detailedUser.followers || []).length}</p>
                      <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Followers</p>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/70 p-3 rounded-2xl border border-neutral-200 dark:border-white/20 text-center">
                      <p className="text-lg font-black text-neutral-900 dark:text-white">{(detailedUser.following || []).length}</p>
                      <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Following</p>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/70 p-3 rounded-2xl border border-neutral-200 dark:border-white/20 text-center">
                      <p className="text-lg font-black text-rose-500">{detailedUserTotalLikes}</p>
                      <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Likes Received</p>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/70 p-3 rounded-2xl border border-neutral-200 dark:border-white/20 text-center col-span-2 sm:col-span-1">
                      <p className="text-lg font-black text-blue-500">{detailedUserComments.length}</p>
                      <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Comments Made</p>
                    </div>
                  </div>

                  {/* Profile Bio & Attributes */}
                  <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-2xl border border-neutral-200 dark:border-white/20 space-y-2.5">
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                      Biography & Profile Intro
                    </h4>
                    <p className="text-neutral-700 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed text-xs bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-750">
                      {detailedUser.bio || <span className="italic text-neutral-400">No biography provided.</span>}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                        <MapPin size={14} className="text-neutral-400" />
                        <span>Location:</span>
                        <strong className="text-neutral-900 dark:text-white">
                          {detailedUser.location || 'Not specified'}
                        </strong>
                      </div>

                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                        <Globe size={14} className="text-neutral-400" />
                        <span>Website:</span>
                        {detailedUser.website ? (
                          <a
                            href={detailedUser.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 dark:text-purple-400 underline font-semibold truncate"
                          >
                            {detailedUser.website}
                          </a>
                        ) : (
                          <span className="text-neutral-400 italic">None</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Security, Credentials & Privacy Vault */}
                  <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-2xl border border-neutral-200 dark:border-white/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Lock size={13} className="text-purple-500" />
                        Account Credentials & Security Vault
                      </h4>
                      <button
                        onClick={() => {
                          setResetPassUser(detailedUser);
                          setNewPasswordVal('');
                        }}
                        className="text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                      >
                        Reset / Override Password
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Email Card */}
                      <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-750 space-y-1">
                        <span className="text-[10px] text-neutral-400 font-semibold uppercase flex items-center gap-1">
                          <Mail size={11} /> Email Address
                        </span>
                        <p className="font-bold text-neutral-900 dark:text-white truncate">{detailedUser.email}</p>
                        <button
                          onClick={() => copyToClipboard(detailedUser.email, 'email')}
                          className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === 'email' ? <Check size={10} /> : <Copy size={10} />}
                          <span>{copiedField === 'email' ? 'Copied!' : 'Copy Email'}</span>
                        </button>
                      </div>

                      {/* Phone Card */}
                      <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-750 space-y-1">
                        <span className="text-[10px] text-neutral-400 font-semibold uppercase flex items-center gap-1">
                          <Phone size={11} /> Phone Number
                        </span>
                        <p className="font-bold text-neutral-900 dark:text-white truncate">
                          {detailedUser.phone || 'N/A'}
                        </p>
                        {detailedUser.phone && (
                          <button
                            onClick={() => copyToClipboard(detailedUser.phone, 'phone')}
                            className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedField === 'phone' ? <Check size={10} /> : <Copy size={10} />}
                            <span>{copiedField === 'phone' ? 'Copied!' : 'Copy Phone'}</span>
                          </button>
                        )}
                      </div>

                      {/* Password Card */}
                      <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-750 space-y-1">
                        <span className="text-[10px] text-neutral-400 font-semibold uppercase flex items-center gap-1">
                          <Key size={11} /> Account Password
                        </span>
                        <div className="flex items-center gap-1">
                          <p className="font-mono font-bold text-neutral-900 dark:text-white truncate">
                            {detailPasswordVisible ? detailedUser.password : '••••••••••••'}
                          </p>
                          <button
                            onClick={() => setDetailPasswordVisible(!detailPasswordVisible)}
                            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                            title="Toggle reveal"
                          >
                            {detailPasswordVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>
                        <button
                          onClick={() => copyToClipboard(detailedUser.password, 'password')}
                          className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === 'password' ? <Check size={10} /> : <Copy size={10} />}
                          <span>{copiedField === 'password' ? 'Copied Password!' : 'Copy Password'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Verification Badge Details Card */}
                  <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-2xl border border-neutral-200 dark:border-white/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Award size={13} className="text-blue-500" />
                        Verification Credentials & Tier Configuration
                      </h4>
                      <button
                        onClick={() => openBadgeModal(detailedUser)}
                        className="text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles size={11} />
                        <span>Configure Badge</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-750">
                        <span className="text-[10px] text-neutral-400 block">Status:</span>
                        <span className={`font-bold ${detailedUser.isVerified ? 'text-blue-500' : 'text-neutral-400'}`}>
                          {detailedUser.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-750">
                        <span className="text-[10px] text-neutral-400 block">Tier Variant:</span>
                        <span className="font-bold text-neutral-900 dark:text-white capitalize">
                          {detailedUser.badgeVariant || (detailedUser.isVerified ? 'blue' : 'none')}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-750">
                        <span className="text-[10px] text-neutral-400 block">Emblem Shape:</span>
                        <span className="font-bold text-neutral-900 dark:text-white capitalize">
                          {detailedUser.badgeShape || (detailedUser.isVerified ? 'starburst' : 'standard')}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-750">
                        <span className="text-[10px] text-neutral-400 block">Custom Title:</span>
                        <span className="font-bold text-neutral-900 dark:text-white truncate block">
                          {detailedUser.customBadgeLabel || 'Default'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB B: POSTS & MEDIA GALLERY */}
              {detailTab === 'posts' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-white">
                      All Posts Authored by @{detailedUser.username} ({detailedUserPosts.length})
                    </h4>
                  </div>

                  {detailedUserPosts.length === 0 ? (
                    <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-white/20 text-neutral-400">
                      No posts published by this user yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {detailedUserPosts.map(p => {
                        const likesCount = (p.likes?.length || 0) + (p.reactions?.heart?.length || 0);

                        return (
                          <div
                            key={p.id}
                            className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-200 dark:border-white/20 flex flex-col sm:flex-row items-start justify-between gap-3"
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.2 rounded text-neutral-700 dark:text-neutral-300">
                                  #{p.id}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  {formatExactDateTime(p.createdAt)}
                                </span>
                              </div>

                              <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                                {p.caption || <span className="italic text-neutral-400">[No caption]</span>}
                              </p>

                              {/* Media gallery preview */}
                              {p.images && p.images.length > 0 && (
                                <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                                  {p.images.map((img, i) => (
                                    <img
                                      key={i}
                                      src={img}
                                      alt="Post thumbnail"
                                      className="w-16 h-16 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                                    />
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
                                <span className="flex items-center gap-1 font-semibold text-rose-500">
                                  <Heart size={12} className="fill-rose-500" />
                                  <span>{likesCount} Likes</span>
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-blue-500">
                                  <MessageCircle size={12} />
                                  <span>{p.commentsCount || 0} Comments</span>
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                adminDeletePost(p.id);
                                addAuditLog('Deleted Post', `Deleted post #${p.id} authored by @${detailedUser.username}`, 'delete');
                              }}
                              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Trash2 size={12} />
                              <span>Delete Post</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB C: COMMENTS HISTORY */}
              {detailTab === 'comments' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-white">
                    Comments Authored by @{detailedUser.username} ({detailedUserComments.length})
                  </h4>

                  {detailedUserComments.length === 0 ? (
                    <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-white/20 text-neutral-400">
                      No comments written by this user.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detailedUserComments.map(c => (
                        <div
                          key={c.id}
                          className="bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200 dark:border-white/20 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-neutral-400">
                                On post #{c.postId} • {formatRelativeTime(c.createdAt)}
                              </span>
                            </div>
                            <p className="text-neutral-900 dark:text-white whitespace-pre-wrap">
                              "{c.text}"
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              adminDeleteComment(c.id);
                              addAuditLog('Deleted Comment', `Deleted comment #${c.id} by @${detailedUser.username}`, 'delete');
                            }}
                            className="p-1.5 text-neutral-400 hover:text-red-500 cursor-pointer"
                            title="Delete this comment"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB D: SOCIAL NETWORK (FOLLOWERS & FOLLOWING) */}
              {detailTab === 'network' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Followers list */}
                    <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-200 dark:border-white/20 space-y-2.5">
                      <h4 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center justify-between">
                        <span>Followers</span>
                        <span className="text-purple-600 dark:text-purple-400">{detailedUserFollowers.length}</span>
                      </h4>

                      {detailedUserFollowers.length === 0 ? (
                        <p className="text-neutral-400 py-3 text-center">No followers yet.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                          {detailedUserFollowers.map(f => (
                            <div
                              key={f.id}
                              onClick={() => openDetailedProfile(f)}
                              className="p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-750 flex items-center justify-between hover:border-purple-500 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <UserAvatar user={f} size="xs" />
                                <div className="truncate">
                                  <div className="font-bold text-neutral-900 dark:text-white truncate flex items-center gap-1">
                                    <span>{f.name}</span>
                                    {f.isVerified && <VerifiedBadge size="xs" user={f} />}
                                  </div>
                                  <span className="text-[10px] text-neutral-400">@{f.username}</span>
                                </div>
                              </div>
                              <Eye size={12} className="text-neutral-400" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Following list */}
                    <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-200 dark:border-white/20 space-y-2.5">
                      <h4 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center justify-between">
                        <span>Following</span>
                        <span className="text-purple-600 dark:text-purple-400">{detailedUserFollowing.length}</span>
                      </h4>

                      {detailedUserFollowing.length === 0 ? (
                        <p className="text-neutral-400 py-3 text-center">Not following anyone yet.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                          {detailedUserFollowing.map(f => (
                            <div
                              key={f.id}
                              onClick={() => openDetailedProfile(f)}
                              className="p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-750 flex items-center justify-between hover:border-purple-500 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <UserAvatar user={f} size="xs" />
                                <div className="truncate">
                                  <div className="font-bold text-neutral-900 dark:text-white truncate flex items-center gap-1">
                                    <span>{f.name}</span>
                                    {f.isVerified && <VerifiedBadge size="xs" user={f} />}
                                  </div>
                                  <span className="text-[10px] text-neutral-400">@{f.username}</span>
                                </div>
                              </div>
                              <Eye size={12} className="text-neutral-400" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB E: COMPLIANCE, WARNINGS & REPORTS HISTORY */}
              {detailTab === 'moderation' && (
                <div className="space-y-4">
                  {/* Warning Log */}
                  <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-2xl border border-neutral-200 dark:border-white/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-amber-500" />
                        <span>Issued Warning Records ({detailedUser.warnings?.length || detailedUser.warningCount || 0})</span>
                      </h4>
                      <button
                        onClick={() => {
                          setSelectedUserForAction(detailedUser);
                          setActionModalType('warning');
                        }}
                        className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                      >
                        + Issue New Warning
                      </button>
                    </div>

                    {(!detailedUser.warnings || detailedUser.warnings.length === 0) && detailedUser.warningCount === 0 ? (
                      <p className="text-neutral-400 italic py-2">
                        Clean moderation record. Zero warnings issued against this account.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(detailedUser.warnings || []).map((w, i) => (
                          <div
                            key={w.id || i}
                            className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-1"
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Severity: {w.severity || 'Moderate'}
                              </span>
                              <span className="text-neutral-400">{formatExactDateTime(w.date)}</span>
                            </div>
                            <p className="text-neutral-800 dark:text-neutral-200 text-xs">
                              {w.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reports Involving This User */}
                  <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 rounded-2xl border border-neutral-200 dark:border-white/20 space-y-3">
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Flag size={14} className="text-red-500" />
                      <span>Community Reports Filed Against User ({reportsAgainstDetailedUser.length})</span>
                    </h4>

                    {reportsAgainstDetailedUser.length === 0 ? (
                      <p className="text-neutral-400 italic py-2">
                        No community reports filed against this user's content.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {reportsAgainstDetailedUser.map(r => (
                          <div
                            key={r.id}
                            className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-750 flex items-start justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-red-600 dark:text-red-400 text-xs">
                                  {r.reason}
                                </span>
                                <span className="text-[10px] uppercase font-semibold text-neutral-400">
                                  ({r.contentType})
                                </span>
                              </div>
                              <span className="text-[10px] text-neutral-400">
                                Status: <strong className="capitalize">{r.status}</strong> • {formatRelativeTime(r.createdAt)}
                              </span>
                            </div>

                            {r.status === 'pending' && (
                              <button
                                onClick={() => {
                                  adminResolveReport(r.id, 'dismissed');
                                  addAuditLog('Dismissed Report', `Dismissed report against @${detailedUser.username}`, 'notice');
                                }}
                                className="px-2 py-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-[10px] font-semibold cursor-pointer"
                              >
                                Dismiss
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✏️ ADMIN EDIT USER MODAL */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 max-w-md w-full border border-neutral-200 dark:border-white/20 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600">
                  <Edit size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    Edit Profile: @{editingUser.username}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Administrator profile override for #{editingUser.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editFormName}
                    onChange={e => setEditFormName(e.target.value)}
                    className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Username handle
                  </label>
                  <input
                    type="text"
                    value={editFormUsername}
                    onChange={e => setEditFormUsername(e.target.value)}
                    className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Bio
                </label>
                <textarea
                  rows={2}
                  value={editFormBio}
                  onChange={e => setEditFormBio(e.target.value)}
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormEmail}
                    onChange={e => setEditFormEmail(e.target.value)}
                    className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editFormPhone}
                    onChange={e => setEditFormPhone(e.target.value)}
                    className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={editFormWebsite}
                    onChange={e => setEditFormWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editFormLocation}
                    onChange={e => setEditFormLocation(e.target.value)}
                    placeholder="City, Country"
                    className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Verification & Tier Controls */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-white block text-xs">
                      Verified Account Status
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Grant official authenticity badge & verified credentials
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editFormIsVerified}
                    onChange={e => setEditFormIsVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </div>

                {editFormIsVerified && (
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                    <div>
                      <label className="block font-semibold text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                        Select Verification Tier
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'blue' as BadgeVariant, name: 'Verified (Blue)', color: 'bg-blue-500' },
                          { id: 'gold' as BadgeVariant, name: 'Staff / Org (Gold)', color: 'bg-amber-500' },
                          { id: 'purple' as BadgeVariant, name: 'VIP Creator (Purple)', color: 'bg-purple-600' },
                          { id: 'green' as BadgeVariant, name: 'Real ID (Green)', color: 'bg-emerald-500' },
                          { id: 'ruby' as BadgeVariant, name: 'Partner (Ruby)', color: 'bg-rose-500' },
                        ].map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setEditFormBadgeVariant(t.id)}
                            className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 text-[11px] font-medium cursor-pointer transition-all ${
                              editFormBadgeVariant === t.id
                                ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold ring-1 ring-purple-600'
                                : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-750'
                            }`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${t.color} flex-shrink-0`} />
                            <span className="truncate">{t.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                        Emblem Shape
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {(['starburst', 'shield', 'circle', 'gem'] as const).map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setEditFormBadgeShape(s)}
                            className={`py-1 px-1 rounded-lg border text-center text-[10px] capitalize cursor-pointer transition-all ${
                              editFormBadgeShape === s
                                ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold ring-1 ring-purple-600'
                                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-750'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                        Custom Badge Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={editFormCustomLabel}
                        onChange={e => setEditFormCustomLabel(e.target.value)}
                        placeholder="e.g. Lead Moderator, Official Partner"
                        className="w-full p-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Private account toggle */}
              <label className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                <div>
                  <span className="font-semibold text-neutral-900 dark:text-white block">Private Account</span>
                  <span className="text-[10px] text-neutral-400">Require approval for followers to view content</span>
                </div>
                <input
                  type="checkbox"
                  checked={editFormIsPrivate}
                  onChange={e => setEditFormIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
              </label>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const u = editingUser;
                    setEditingUser(null);
                    setDeletingUser(u);
                    setDeleteConfirmText('');
                    setDeletePurgeContent(true);
                  }}
                  className="py-2.5 px-3 rounded-xl border border-red-200 dark:border-red-900/80 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Delete this user account"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="py-2.5 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-colors"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔑 RESET PASSWORD MODAL */}
      {/* ========================================================================= */}
      {resetPassUser && (
        <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 max-w-sm w-full border border-neutral-200 dark:border-white/20 space-y-3.5 shadow-2xl text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Key size={15} className="text-purple-600" />
                Reset Password for @{resetPassUser.username}
              </h3>
              <button onClick={() => setResetPassUser(null)} className="cursor-pointer text-neutral-400">
                <X size={16} />
              </button>
            </div>

            {resetPassSuccess && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl font-medium flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>Password updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  New Password
                </label>
                <input
                  type="text"
                  placeholder="Enter new secure password..."
                  value={newPasswordVal}
                  onChange={e => setNewPasswordVal(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-mono"
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const randomPass = 'Pass_' + Math.random().toString(36).slice(-8) + '!';
                  setNewPasswordVal(randomPass);
                }}
                className="text-purple-600 dark:text-purple-400 hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={11} />
                <span>Generate Random Password</span>
              </button>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer transition-colors"
              >
                Confirm Password Reset
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Direct Notice Modal */}
      {actionModalType === 'notice' && selectedUserForAction && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 max-w-sm w-full border border-neutral-200 dark:border-white/20 space-y-3 shadow-xl text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
                Notice to @{selectedUserForAction.username}
              </h3>
              <button onClick={() => setActionModalType(null)} className="cursor-pointer">
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
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-750 rounded-lg text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Message</label>
                <textarea
                  rows={3}
                  placeholder="Enter notice text..."
                  value={noticeMessage}
                  onChange={e => setNoticeMessage(e.target.value)}
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-750 rounded-lg text-neutral-900 dark:text-white resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg cursor-pointer"
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
              <button onClick={() => setActionModalType(null)} className="cursor-pointer">
                <X size={16} className="text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleIssueWarningSubmit} className="space-y-3">
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Severity</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['mild', 'moderate', 'severe'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setWarningSeverity(s)}
                      className={`py-1 rounded-lg border text-center capitalize cursor-pointer ${
                        warningSeverity === s
                          ? 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-600 font-bold'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Reason</label>
                <textarea
                  rows={3}
                  placeholder="Specify violation (e.g. harassment, spam)..."
                  value={warningMessage}
                  onChange={e => setWarningMessage(e.target.value)}
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-750 rounded-lg text-neutral-900 dark:text-white resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg cursor-pointer"
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
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 max-w-md w-full border border-neutral-200 dark:border-white/20 space-y-4 shadow-2xl text-xs animate-in zoom-in-95 duration-150">
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
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Success notification banner */}
            {badgeSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-bold text-xs animate-in fade-in duration-150">
                <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-500" />
                <span>{badgeSuccessMessage}</span>
              </div>
            )}

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

      {/* ========================================================================= */}
      {/* 🗑️ ACCOUNT DELETION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-70 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 max-w-md w-full border border-red-300 dark:border-red-900/70 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/80">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    Delete User Account
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Permanent administrative removal
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setDeletingUser(null);
                  setDeleteSuccessMessage('');
                  setDeleteConfirmText('');
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {deleteSuccessMessage ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-center space-y-2">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500" />
                <p className="font-bold text-emerald-800 dark:text-emerald-200 text-xs">
                  {deleteSuccessMessage}
                </p>
              </div>
            ) : (
              <>
                {/* Target User Summary Card */}
                <div className="notice-box p-3 bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-white/20 rounded-2xl flex items-center gap-3">
                  <UserAvatar user={deletingUser} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 font-bold text-neutral-900 dark:text-white truncate">
                      <span>{deletingUser.name}</span>
                      {deletingUser.isVerified && <VerifiedBadge size="xs" user={deletingUser} interactive={false} />}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      @{deletingUser.username} • Account ID: <span className="font-mono text-purple-600 dark:text-purple-300">#{deletingUser.id}</span>
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate">
                      {deletingUser.email || 'No email registered'}
                    </p>
                  </div>
                </div>

                {/* Warning Banner */}
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-start gap-2.5 text-red-700 dark:text-red-300">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
                  <div className="space-y-1">
                    <p className="font-bold text-[11px]">Warning: This action is permanent!</p>
                    <p className="text-[11px] text-red-600 dark:text-red-300/90 leading-relaxed">
                      The user document will be deleted from the database and storage. The user will be immediately logged out and will no longer be able to sign in.
                    </p>
                  </div>
                </div>

                {/* Purge Posts & Comments Checkbox */}
                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-white/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deletePurgeContent}
                    onChange={e => setDeletePurgeContent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      Purge all user posts & comments
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Also remove all feed publications, attached photos, and discussion comments authored by this user.
                    </p>
                  </div>
                </label>

                {/* Safety Confirmation Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    To confirm, type <span className="font-mono text-red-600 dark:text-red-400 font-bold">DELETE</span> or <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">@{deletingUser.username}</span> below:
                  </label>
                  <input
                    type="text"
                    placeholder={`DELETE or @${deletingUser.username}`}
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingUser(null);
                      setDeleteConfirmText('');
                    }}
                    className="py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      deleteConfirmText.trim().toUpperCase() !== 'DELETE' &&
                      deleteConfirmText.trim().toLowerCase() !== `@${deletingUser.username.toLowerCase()}` &&
                      deleteConfirmText.trim().toLowerCase() !== deletingUser.username.toLowerCase()
                    }
                    onClick={handleConfirmDeleteUser}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Permanently Delete Account</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
