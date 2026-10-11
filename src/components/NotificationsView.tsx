import React, { useState, useMemo } from 'react';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Shield,
  AlertTriangle,
  AlertCircle,
  Megaphone,
  CheckCheck,
  Check,
  Trash2,
  Settings,
  Search,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronRight,
  Flame,
  Laugh,
  Award,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { PostCard } from './PostCard';
import { AppNotification, Post, ReactionType } from '../types';
import { formatRelativeTime, formatExactDateTime } from '../utils/formatters';
import {
  playNotificationSound,
  isSoundEnabled,
  setSoundEnabled,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
} from '../utils/notificationAudio';

type NotificationFilterType = 'all' | 'unread' | 'comments' | 'reactions' | 'follows' | 'official';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    currentUser,
    getUserById,
    getPostById,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
    clearAllNotifications,
    clearReadNotifications,
    openUserProfile,
    toggleFollow,
    setIsAuthModalOpen,
    setAuthMode,
  } = useApp();

  // Filter & Search State
  const [activeFilter, setActiveFilter] = useState<NotificationFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundEnabled());
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Selected post for modal detail preview
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<{ post: Post; defaultComments: boolean } | null>(null);

  // Status feedback toast
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 2400);
  };

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) {
      playNotificationSound();
      showFeedback('Notification chime enabled');
    } else {
      showFeedback('Notification chime muted');
    }
  };

  const handleTestSound = () => {
    playNotificationSound();
    showFeedback('Playing preview chime');
  };

  const handleRequestBrowserPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPermission(res);
    if (res === 'granted') {
      sendBrowserNotification('Alokpat Notifications', 'Desktop notifications are now active!');
      showFeedback('Desktop notifications enabled');
    } else if (res === 'denied') {
      showFeedback('Permission blocked by browser settings');
    }
  };

  // Auth gate
  if (!currentUser) {
    return (
      <div className="pb-24 pt-8 text-center">
        <div className="text-box empty-state-box bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 space-y-4 max-w-sm mx-auto shadow-md">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/25">
            <Bell size={26} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              Stay Connected & Informed
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Sign in to keep track of reactions, comments, new followers, and official staff notices.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setAuthMode('register');
                setIsAuthModalOpen(true);
              }}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
            >
              Sign Up
            </button>
            <button
              onClick={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              className="flex-1 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold rounded-xl text-xs active:scale-95 transition-all cursor-pointer border border-neutral-200 dark:border-neutral-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter user's notifications
  const userNotifications = useMemo(() => {
    return notifications.filter(
      n => n.userId === currentUser.id || n.userId === 'all'
    );
  }, [notifications, currentUser.id]);

  const unreadCount = useMemo(() => {
    return userNotifications.filter(n => !n.isRead).length;
  }, [userNotifications]);

  // Specific counts for tab badges
  const commentsCount = useMemo(() => {
    return userNotifications.filter(n => n.type === 'comment').length;
  }, [userNotifications]);

  const reactionsCount = useMemo(() => {
    return userNotifications.filter(n => n.type === 'like' || n.type === 'reaction').length;
  }, [userNotifications]);

  const followsCount = useMemo(() => {
    return userNotifications.filter(n => n.type === 'follow').length;
  }, [userNotifications]);

  const officialCount = useMemo(() => {
    return userNotifications.filter(
      n => n.type === 'admin_notice' || n.type === 'admin_warning' || n.type === 'broadcast'
    ).length;
  }, [userNotifications]);

  // Apply category and search filter
  const filteredNotifications = useMemo(() => {
    return userNotifications.filter(n => {
      // Category filter
      if (activeFilter === 'unread' && n.isRead) return false;
      if (activeFilter === 'comments' && n.type !== 'comment') return false;
      if (activeFilter === 'reactions' && n.type !== 'like' && n.type !== 'reaction') return false;
      if (activeFilter === 'follows' && n.type !== 'follow') return false;
      if (
        activeFilter === 'official' &&
        n.type !== 'admin_notice' &&
        n.type !== 'admin_warning' &&
        n.type !== 'broadcast'
      )
        return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = n.title.toLowerCase().includes(query);
        const messageMatch = n.message.toLowerCase().includes(query);
        const actor = n.actorId ? getUserById(n.actorId) : undefined;
        const actorMatch =
          actor &&
          (actor.name.toLowerCase().includes(query) ||
            actor.username.toLowerCase().includes(query));

        if (!titleMatch && !messageMatch && !actorMatch) return false;
      }

      return true;
    });
  }, [userNotifications, activeFilter, searchQuery, getUserById]);

  // Handle clicking on a notification item
  const handleNotificationClick = (notification: AppNotification) => {
    // 1. Mark as read
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }

    // 2. If it references a post, preview the post
    if (notification.postId) {
      const post = getPostById(notification.postId);
      if (post) {
        setSelectedPostForDetail({
          post,
          defaultComments: notification.type === 'comment',
        });
      } else {
        showFeedback('Referenced post is no longer available');
      }
    } else if (notification.actorId) {
      // Open user profile
      openUserProfile(notification.actorId);
    }
  };

  // Helper reaction icon / badge
  const renderReactionBadge = (reactionType?: ReactionType) => {
    switch (reactionType) {
      case 'fire':
        return <span className="text-amber-500 text-xs">🔥</span>;
      case 'laugh':
        return <span className="text-yellow-500 text-xs">😂</span>;
      case 'clap':
        return <span className="text-emerald-500 text-xs">👏</span>;
      case 'wow':
        return <span className="text-cyan-500 text-xs">😮</span>;
      case 'sad':
        return <span className="text-blue-500 text-xs">😢</span>;
      case 'heart':
      default:
        return <Heart size={12} className="text-rose-500 fill-rose-500" />;
    }
  };

  return (
    <div className="pb-24 pt-2">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-neutral-900/95 dark:bg-white/95 text-white dark:text-neutral-900 text-xs font-semibold shadow-lg backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150">
          {feedbackMessage}
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 mb-3 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Bell size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                  Notifications
                </h2>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold tracking-tight animate-pop">
                    {unreadCount} unread
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] font-semibold">
                    All caught up
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Activity, interactions, and official updates
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  markAllNotificationsAsRead();
                  showFeedback('All marked as read');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer border border-neutral-200/70 dark:border-neutral-700"
                title="Mark all notifications as read"
              >
                <CheckCheck size={13} className="text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 transition-all active:scale-95 cursor-pointer border border-neutral-200/70 dark:border-neutral-700"
              title="Notification Settings & Preferences"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* Live In-App Search Bar */}
        <div className="relative mt-3.5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search notifications by keyword or name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-8 py-2 bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-750 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-purple-600 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
              activeFilter === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            <span>All ({userNotifications.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
              activeFilter === 'unread'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                unreadCount > 0 ? 'bg-purple-500 animate-pulse' : 'bg-neutral-400'
              }`}
            />
            <span>Unread ({unreadCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('comments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
              activeFilter === 'comments'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            <MessageCircle size={12} />
            <span>Comments ({commentsCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('reactions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
              activeFilter === 'reactions'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            <Heart size={12} />
            <span>Reactions ({reactionsCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('follows')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
              activeFilter === 'follows'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            <UserPlus size={12} />
            <span>Followers ({followsCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('official')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
              activeFilter === 'official'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            <Shield size={12} />
            <span>Official ({officialCount})</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-box empty-state-box bg-white dark:bg-neutral-900 rounded-2xl p-10 text-center border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-400 flex items-center justify-center mb-3">
            {activeFilter === 'official' ? (
              <Shield size={22} />
            ) : activeFilter === 'comments' ? (
              <MessageCircle size={22} />
            ) : activeFilter === 'reactions' ? (
              <Heart size={22} />
            ) : activeFilter === 'follows' ? (
              <UserPlus size={22} />
            ) : (
              <Bell size={22} />
            )}
          </div>
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
            {searchQuery
              ? 'No matching notifications'
              : activeFilter === 'unread'
              ? 'No unread notifications'
              : 'No notifications in this tab'}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
            {searchQuery
              ? `No notifications found matching "${searchQuery}".`
              : activeFilter === 'unread'
              ? "You've read all your recent notifications. Check back later for new activity!"
              : 'Recent updates, community reactions, and staff announcements will appear here.'}
          </p>
          {(searchQuery || activeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="mt-3.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Filter size={12} />
              <span>Reset filter</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map(n => {
            const actor = n.actorId ? getUserById(n.actorId) : undefined;
            const referencedPost = n.postId ? getPostById(n.postId) : undefined;
            const isWarning = n.type === 'admin_warning';
            const isNotice = n.type === 'admin_notice';
            const isBroadcast = n.type === 'broadcast';
            const isFollow = n.type === 'follow';
            const isComment = n.type === 'comment';
            const isReaction = n.type === 'like' || n.type === 'reaction';

            const isFollowingActor = actor ? currentUser.following.includes(actor.id) : false;
            const isSelf = actor ? currentUser.id === actor.id : false;

            return (
              <article
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`group relative rounded-2xl p-3.5 transition-all cursor-pointer border shadow-2xs hover:shadow-xs ${
                  !n.isRead
                    ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/70 hover:border-purple-300 dark:hover:border-purple-700'
                    : isWarning
                    ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 hover:border-red-300'
                    : isNotice
                    ? 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-900/50'
                    : isBroadcast
                    ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {/* Unread Indicator Dot */}
                {!n.isRead && (
                  <span
                    className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-purple-600 shadow-sm shadow-purple-600/50"
                    title="Unread notification"
                  />
                )}

                <div className="flex items-start gap-3">
                  {/* Left Avatar or Type Icon */}
                  <div className="relative flex-shrink-0">
                    {actor ? (
                      <div
                        onClick={e => {
                          e.stopPropagation();
                          openUserProfile(actor.id);
                        }}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <UserAvatar user={actor} size="md" />
                        {/* Reaction / Action Icon Corner Badge */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center shadow-xs border border-neutral-200 dark:border-neutral-800 text-[11px]">
                          {isReaction ? (
                            renderReactionBadge(n.reactionType)
                          ) : isComment ? (
                            <MessageCircle size={10} className="text-blue-500 fill-blue-500" />
                          ) : isFollow ? (
                            <UserPlus size={10} className="text-emerald-500" />
                          ) : (
                            <Bell size={10} className="text-purple-500" />
                          )}
                        </div>
                      </div>
                    ) : isWarning ? (
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white flex items-center justify-center shadow-sm">
                        <AlertTriangle size={18} />
                      </div>
                    ) : isNotice ? (
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                        <Shield size={18} />
                      </div>
                    ) : isBroadcast ? (
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-sm">
                        <Megaphone size={18} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center shadow-sm">
                        <Bell size={18} />
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    {/* Header Row: Title & Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {actor && (
                        <div
                          onClick={e => {
                            e.stopPropagation();
                            openUserProfile(actor.id);
                          }}
                          className="flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-50 truncate max-w-[150px]">
                            {actor.name}
                          </span>
                          {actor.isVerified && <VerifiedBadge size="xs" user={actor} />}
                        </div>
                      )}

                      {/* Official Staff or Notice Tag */}
                      {isBroadcast && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          Official Broadcast
                        </span>
                      )}
                      {isNotice && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          System Notice
                        </span>
                      )}
                      {isWarning && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                          Security Alert
                        </span>
                      )}

                      {!actor && (
                        <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-50">
                          {n.title}
                        </h4>
                      )}
                    </div>

                    {/* Message Body */}
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 leading-relaxed">
                      {n.message}
                    </p>

                    {/* Rich Post Preview Thumbnail if attached */}
                    {referencedPost && (
                      <div className="mt-2.5 p-2 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-750 flex items-center justify-between gap-2.5 group-hover:border-purple-300/80 dark:group-hover:border-purple-700/60 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          {referencedPost.images && referencedPost.images.length > 0 ? (
                            <img
                              src={referencedPost.images[0]}
                              alt="Post thumbnail"
                              className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-neutral-200 dark:border-neutral-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono">
                              Post
                            </div>
                          )}
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-1 italic font-normal">
                            "{referencedPost.caption || 'Photo post'}"
                          </p>
                        </div>

                        <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-0.5 flex-shrink-0">
                          <span>View</span>
                          <ChevronRight size={13} />
                        </span>
                      </div>
                    )}

                    {/* Follow Back Action Button (on Follow Notifications) */}
                    {isFollow && actor && !isSelf && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            toggleFollow(actor.id);
                          }}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer ${
                            isFollowingActor
                              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 border border-neutral-200/80 dark:border-neutral-700'
                              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs hover:shadow-md hover:shadow-purple-500/25 border border-purple-500/30'
                          }`}
                        >
                          {isFollowingActor ? 'Following' : 'Follow Back'}
                        </button>
                      </div>
                    )}

                    {/* Footer Row: Timestamp & Individual Delete */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-800/60">
                      <span title={formatExactDateTime(n.createdAt)}>
                        {formatRelativeTime(n.createdAt)}
                      </span>

                      <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        {/* Toggle Read/Unread Status */}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (!n.isRead) {
                              markNotificationAsRead(n.id);
                              showFeedback('Marked as read');
                            }
                          }}
                          className="hover:text-purple-600 dark:hover:text-purple-400 p-0.5"
                          title={n.isRead ? 'Already read' : 'Mark as read'}
                        >
                          {n.isRead ? <Check size={12} /> : <CheckCheck size={12} />}
                        </button>

                        {/* Individual Delete */}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            clearNotification(n.id);
                            showFeedback('Notification removed');
                          }}
                          className="hover:text-red-500 dark:hover:text-red-400 p-0.5"
                          title="Delete notification"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Post Detail Interactive Modal */}
      {selectedPostForDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedPostForDetail(null)}
        >
          <div
            className="relative w-full max-w-lg bg-neutral-50 dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-3.5 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  Notification Post Preview
                </span>
              </div>
              <button
                onClick={() => setSelectedPostForDetail(null)}
                className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-white active:scale-95 transition-all cursor-pointer"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-3 sm:p-4">
              <PostCard
                post={selectedPostForDetail.post}
                defaultShowComments={selectedPostForDetail.defaultComments}
              />
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings & Bulk Management Modal */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Settings size={16} />
                </div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Notification Preferences
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-white rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sound Notification Preference */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-750 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  {soundActive ? (
                    <Volume2 size={15} className="text-purple-600 dark:text-purple-400" />
                  ) : (
                    <VolumeX size={15} className="text-neutral-400" />
                  )}
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Sound Chimes
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Plays a subtle acoustic chime on interactions
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestSound}
                  className="px-2 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-650 text-neutral-700 dark:text-neutral-200 text-[11px] font-semibold active:scale-95 transition-all cursor-pointer"
                  title="Test audio chime"
                >
                  Test
                </button>
                <button
                  onClick={handleToggleSound}
                  className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    soundActive ? 'bg-purple-600 justify-end' : 'bg-neutral-300 dark:bg-neutral-700 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>

            {/* Browser Desktop Push Notifications */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-750 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Bell size={15} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Desktop Notifications
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Status: {browserPermission === 'granted' ? 'Enabled' : browserPermission === 'denied' ? 'Blocked' : 'Not requested'}
                </p>
              </div>

              {browserPermission === 'granted' ? (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check size={12} /> Active
                </span>
              ) : (
                <button
                  onClick={handleRequestBrowserPermission}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold active:scale-95 transition-all cursor-pointer"
                >
                  Enable
                </button>
              )}
            </div>

            {/* Bulk Actions Section */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Inbox Management
              </span>

              <button
                onClick={() => {
                  clearReadNotifications();
                  setIsSettingsOpen(false);
                  showFeedback('Cleared read notifications');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer active:scale-98"
              >
                <span>Clear Read Notifications</span>
                <Trash2 size={13} className="text-neutral-400" />
              </button>

              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsClearAllConfirmOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer active:scale-98 border border-red-200 dark:border-red-900/40"
              >
                <span>Clear All Notifications</span>
                <Trash2 size={13} className="text-red-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      {isClearAllConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsClearAllConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center">
              <AlertCircle size={20} />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                Clear all notifications?
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                This will permanently delete all {userNotifications.length} notifications from your inbox. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsClearAllConfirmOpen(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllNotifications();
                  setIsClearAllConfirmOpen(false);
                  showFeedback('All notifications cleared');
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-md shadow-red-600/20"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
