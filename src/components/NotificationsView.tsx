import React, { useState } from 'react';
import {
  Bell,
  Heart,
  Shield,
  AlertTriangle,
  Megaphone,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { formatRelativeTime } from '../utils/formatters';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    currentUser,
    getUserById,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
    openUserProfile,
    setIsAuthModalOpen,
    setAuthMode,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'admin' | 'social'>('all');

  if (!currentUser) {
    return (
      <div className="pb-24 pt-8 text-center">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 space-y-3 max-w-sm mx-auto">
          <div className="w-12 h-12 mx-auto rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Bell size={22} />
          </div>
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
            Sign in for notifications
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Keep track of reactions, comments, followers, and official notices.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setAuthMode('register');
                setIsAuthModalOpen(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs transition-colors"
            >
              Sign Up
            </button>
            <button
              onClick={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg text-xs transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userNotifications = notifications.filter(
    n => !currentUser || n.userId === currentUser.id || n.userId === 'all'
  );

  const filteredNotifications = userNotifications.filter(n => {
    if (filter === 'admin') {
      return n.type === 'admin_notice' || n.type === 'admin_warning' || n.type === 'broadcast';
    }
    if (filter === 'social') {
      return n.type === 'like' || n.type === 'comment' || n.type === 'follow';
    }
    return true;
  });

  return (
    <div className="pb-24 pt-2">
      {/* Header Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 border border-neutral-200 dark:border-neutral-800 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-neutral-900 dark:text-white">Notifications</h2>
            <p className="text-[11px] text-neutral-400">Activity and official updates</p>
          </div>

          <button
            onClick={markAllNotificationsAsRead}
            className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <CheckCheck size={13} />
            <span>Mark all read</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
            }`}
          >
            All ({userNotifications.length})
          </button>
          <button
            onClick={() => setFilter('admin')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              filter === 'admin'
                ? 'bg-purple-600 text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
            }`}
          >
            <Shield size={11} />
            <span>Admin Notices</span>
          </button>
          <button
            onClick={() => setFilter('social')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              filter === 'social'
                ? 'bg-purple-600 text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
            }`}
          >
            <Heart size={11} />
            <span>Interactions</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-200 dark:border-neutral-800">
          <Bell size={24} className="mx-auto text-neutral-400 mb-2" />
          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">No notifications yet</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map(n => {
            const actor = n.actorId ? getUserById(n.actorId) : undefined;
            const isWarning = n.type === 'admin_warning';
            const isNotice = n.type === 'admin_notice';
            const isBroadcast = n.type === 'broadcast';

            return (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`relative rounded-xl p-3 transition-colors cursor-pointer border ${
                  isWarning
                    ? 'bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-900/60'
                    : isNotice
                    ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/60'
                    : isBroadcast
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                    : n.isRead
                    ? 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800'
                    : 'bg-neutral-50 dark:bg-neutral-800/80 border-purple-300 dark:border-purple-800'
                }`}
              >
                {!n.isRead && (
                  <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-purple-600" />
                )}

                <div className="flex items-start gap-2.5">
                  {/* Icon or Actor Avatar */}
                  {isWarning ? (
                    <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={15} />
                    </div>
                  ) : isNotice ? (
                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                      <Shield size={15} />
                    </div>
                  ) : isBroadcast ? (
                    <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center flex-shrink-0">
                      <Megaphone size={15} />
                    </div>
                  ) : actor ? (
                    <UserAvatar
                      user={actor}
                      size="sm"
                      onClick={() => openUserProfile(actor.id)}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bell size={15} />
                    </div>
                  )}

                  {/* Body text */}
                  <div className="flex-1 min-w-0 pr-3">
                    <h4
                      className={`text-xs font-semibold ${
                        isWarning
                          ? 'text-red-900 dark:text-red-300'
                          : isNotice
                          ? 'text-purple-900 dark:text-purple-300'
                          : isBroadcast
                          ? 'text-amber-900 dark:text-amber-300'
                          : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {n.title}
                    </h4>

                    <p
                      className={`text-xs mt-0.5 leading-relaxed ${
                        isWarning
                          ? 'text-red-800 dark:text-red-300'
                          : isNotice
                          ? 'text-purple-800 dark:text-purple-300'
                          : 'text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {n.message}
                    </p>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                      <span>{formatRelativeTime(n.createdAt)}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          clearNotification(n.id);
                        }}
                        className="hover:text-red-500 p-0.5"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
