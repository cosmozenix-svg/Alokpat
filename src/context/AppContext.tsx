import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Post, Comment, AppNotification, TabType, ContentReport, ReportReason, ReportContentType, VerificationStatus, ReactionType, BadgeVariant, BadgeShape } from '../types';
import { INITIAL_USERS, INITIAL_POSTS, INITIAL_COMMENTS, INITIAL_NOTIFICATIONS, INITIAL_REPORTS } from '../data/initialData';
import { safeSetStorage, safeGetStorage, idbGet } from '../utils/storage';
import {
  subscribeToDatabase,
  seedFirestoreIfNeeded,
  syncUserToDb,
  syncPostToDb,
  deletePostFromDb,
  syncCommentToDb,
  deleteCommentFromDb,
  syncNotificationToDb,
  deleteNotificationFromDb,
  syncReportToDb,
} from '../lib/firestoreSync';

interface AppContextType {
  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;

  // Auth & Current User
  currentUser: User | null;
  users: User[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  login: (identifier: string, password: string) => { success: boolean; error?: string };
  register: (data: { name: string; username: string; email: string; phone: string; password: string }) => { success: boolean; error?: string };
  logout: () => void;
  checkUsernameAvailable: (username: string, excludeUserId?: number) => boolean;
  switchUser: (userId: number) => void;

  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  viewingUserId: number | null;
  setViewingUserId: (id: number | null) => void;
  openUserProfile: (userId: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Posts
  posts: Post[];
  createPost: (data: { caption: string; images: string[]; keywords: string[]; hideComments: boolean; isAIPost: boolean }) => void;
  deletePost: (postId: string) => void;
  toggleLikePost: (postId: string) => void;
  toggleReaction: (postId: string, reaction: ReactionType) => void;
  togglePinPost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  isPostSaved: (postId: string) => boolean;

  // Comments
  comments: Comment[];
  addComment: (postId: string, text: string, parentId?: string) => void;
  deleteComment: (commentId: string) => void;
  toggleLikeComment: (commentId: string) => void;
  getPostComments: (postId: string) => Comment[];

  // Profile & Social
  toggleFollow: (targetUserId: number) => void;
  updateProfile: (updates: Partial<User>) => { success: boolean; error?: string };
  requestVerification: (reason?: string) => { success: boolean; message: string };
  getUserById: (id: number) => User | undefined;

  // Reports & Moderation
  reports: ContentReport[];
  submitReport: (contentType: ReportContentType, contentId: string, reportedUserId: number, reason: ReportReason, details?: string) => { success: boolean; message: string };
  adminResolveReport: (reportId: string, resolutionAction: 'deleted_content' | 'warned_user' | 'banned_user' | 'dismissed', note?: string) => void;
  adminDismissReport: (reportId: string) => void;
  reportModalState: { isOpen: boolean; contentType: ReportContentType; contentId: string; reportedUserId: number } | null;
  openReportModal: (contentType: ReportContentType, contentId: string, reportedUserId: number) => void;
  closeReportModal: () => void;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotification: (id: string) => void;

  // Admin Panel
  isAdminLoggedIn: boolean;
  adminUsername: string;
  isAdminPanelOpen: boolean;
  setIsAdminPanelOpen: (open: boolean) => void;
  adminLogin: (username: string, password: string) => { success: boolean; error?: string };
  adminLogout: () => void;
  adminToggleVerify: (userId: number, variant?: BadgeVariant, shape?: BadgeShape, customLabel?: string) => void;
  adminUpdateVerificationBadge: (userId: number, variant: BadgeVariant, shape: BadgeShape, customLabel?: string) => void;
  adminSetVerificationStatus: (userId: number, status: VerificationStatus) => void;
  adminToggleBan: (userId: number, reason?: string) => void;
  adminIssueWarning: (userId: number, message: string, severity?: 'mild' | 'moderate' | 'severe') => void;
  adminSendNotice: (userId: number, title: string, message: string, urgency?: 'normal' | 'info' | 'warning' | 'alert') => void;
  adminSendBroadcast: (title: string, message: string, urgency?: 'normal' | 'info' | 'warning' | 'alert') => void;
  adminDeletePost: (postId: string) => void;
  adminDeleteComment: (commentId: string) => void;
  adminUpdateUser: (userId: number, updates: Partial<User>) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('alokpat_theme');
    return saved === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('alokpat_theme', 'dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('alokpat_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Fresh real state keys (clearing legacy mock data)
  const [users, setUsers] = useState<User[]>(() => {
    return safeGetStorage<User[]>('alokpat_real_users', INITIAL_USERS);
  });

  const [currentUserId, setCurrentUserId] = useState<number | null>(() => {
    const saved = safeGetStorage<string | null>('alokpat_real_current_user_id', null);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  });

  const currentUser = users.find(u => u.id === currentUserId) || null;

  const [posts, setPosts] = useState<Post[]>(() => {
    return safeGetStorage<Post[]>('alokpat_real_posts', INITIAL_POSTS);
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    return safeGetStorage<Comment[]>('alokpat_real_comments', INITIAL_COMMENTS);
  });

  const [reports, setReports] = useState<ContentReport[]>(() => {
    return safeGetStorage<ContentReport[]>('alokpat_real_reports', INITIAL_REPORTS);
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    return safeGetStorage<AppNotification[]>('alokpat_real_notifications', INITIAL_NOTIFICATIONS);
  });

  // Admin State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return safeGetStorage<string>('alokpat_admin_logged', 'false') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [isAdminPanelOpen, setIsAdminPanelOpenState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      return p.endsWith('/admin') || p === '/admin' || h === '#/admin' || h === '#admin';
    }
    return false;
  });

  // Hydrate from IndexedDB on initial mount if available
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [idbUsers, idbPosts, idbComments, idbReports, idbNotifs] = await Promise.all([
          idbGet<User[]>('alokpat_real_users'),
          idbGet<Post[]>('alokpat_real_posts'),
          idbGet<Comment[]>('alokpat_real_comments'),
          idbGet<ContentReport[]>('alokpat_real_reports'),
          idbGet<AppNotification[]>('alokpat_real_notifications'),
        ]);
        if (!mounted) return;
        if (idbUsers && idbUsers.length > 0) setUsers(idbUsers);
        if (idbPosts && idbPosts.length > 0) setPosts(idbPosts);
        if (idbComments && idbComments.length > 0) setComments(idbComments);
        if (idbReports && idbReports.length > 0) setReports(idbReports);
        if (idbNotifs && idbNotifs.length > 0) setNotifications(idbNotifs);
      } catch (e) {
        // Fallback silently to localStorage data
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Real-time Firestore Database Synchronization & Seeding
  useEffect(() => {
    let active = true;

    // Seed Firestore with initial data if database is fresh
    seedFirestoreIfNeeded(
      INITIAL_USERS,
      INITIAL_POSTS,
      INITIAL_COMMENTS,
      INITIAL_NOTIFICATIONS,
      INITIAL_REPORTS
    ).catch(err => {
      console.warn('[Firestore] Initial seeding check completed or skipped', err);
    });

    // Real-time listener across users and devices
    const unsubscribe = subscribeToDatabase({
      onUsers: remoteUsers => {
        if (!active) return;
        if (remoteUsers.length > 0) setUsers(remoteUsers);
      },
      onPosts: remotePosts => {
        if (!active) return;
        if (remotePosts.length > 0) setPosts(remotePosts);
      },
      onComments: remoteComments => {
        if (!active) return;
        if (remoteComments.length > 0) setComments(remoteComments);
      },
      onNotifications: remoteNotifs => {
        if (!active) return;
        if (remoteNotifs.length > 0) setNotifications(remoteNotifs);
      },
      onReports: remoteReports => {
        if (!active) return;
        if (remoteReports.length > 0) setReports(remoteReports);
      },
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const setIsAdminPanelOpen = (open: boolean) => {
    setIsAdminPanelOpenState(open);
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      if (open) {
        if (!p.endsWith('/admin') && p !== '/admin' && h !== '#/admin' && h !== '#admin') {
          window.history.pushState(null, '', '/admin');
        }
      } else {
        if (p.endsWith('/admin') || p === '/admin') {
          window.history.pushState(null, '', '/');
        }
        if (h === '#/admin' || h === '#admin') {
          window.location.hash = '';
        }
      }
    }
  };

  useEffect(() => {
    const handleUrlChange = () => {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      if (p.endsWith('/admin') || p === '/admin' || h === '#/admin' || h === '#admin') {
        setIsAdminPanelOpenState(true);
      } else {
        setIsAdminPanelOpenState(false);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  // Report Modal State
  const [reportModalState, setReportModalState] = useState<{
    isOpen: boolean;
    contentType: ReportContentType;
    contentId: string;
    reportedUserId: number;
  } | null>(null);

  // Persistence Effects
  useEffect(() => {
    safeSetStorage('alokpat_real_users', users);
  }, [users]);

  useEffect(() => {
    safeSetStorage('alokpat_real_posts', posts);
  }, [posts]);

  useEffect(() => {
    safeSetStorage('alokpat_real_comments', comments);
  }, [comments]);

  useEffect(() => {
    safeSetStorage('alokpat_real_reports', reports);
  }, [reports]);

  useEffect(() => {
    safeSetStorage('alokpat_real_notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    if (currentUserId) {
      safeSetStorage('alokpat_real_current_user_id', currentUserId.toString());
    } else {
      try { localStorage.removeItem('alokpat_real_current_user_id'); } catch {}
    }
  }, [currentUserId]);

  useEffect(() => {
    safeSetStorage('alokpat_admin_logged', isAdminLoggedIn ? 'true' : 'false');
  }, [isAdminLoggedIn]);

  // Auth Helpers
  const checkUsernameAvailable = (username: string, excludeUserId?: number): boolean => {
    const clean = username.trim().toLowerCase();
    if (!clean) return false;
    return !users.some(u => u.username.toLowerCase() === clean && u.id !== excludeUserId);
  };

  const register = (data: { name: string; username: string; email: string; phone: string; password: string }) => {
    const cleanUsername = data.username.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();

    if (!checkUsernameAvailable(cleanUsername)) {
      return { success: false, error: `Username "@${cleanUsername}" is already taken. Please choose another.` };
    }

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    // Determine sequential next ID: e.g. max ID + 1, starting at 10001
    const maxId = users.reduce((max, u) => Math.max(max, u.id), 10000);
    const nextId = maxId + 1;

    const newUser: User = {
      id: nextId,
      name: data.name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      phone: cleanPhone,
      password: data.password,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name.trim())}&backgroundColor=7c3aed`,
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      bio: `Hello! I'm on Alokpat.`,
      isVerified: false,
      verificationStatus: 'unverified',
      isBanned: false,
      warningCount: 0,
      warnings: [],
      isPrivate: false,
      pinnedPostIds: [],
      savedPostIds: [],
      createdAt: new Date().toISOString(),
      followers: [],
      following: [],
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUserId(nextId);
    setIsAuthModalOpen(false);

    // Sync to Firestore database
    syncUserToDb(newUser).catch(() => {});

    // Send Welcome notification
    const welcomeNotif: AppNotification = {
      id: `notif-welcome-${Date.now()}`,
      userId: nextId,
      type: 'admin_notice',
      title: 'Welcome to Alokpat',
      message: `Your account has been created successfully! Your unique User ID is #${nextId}. Start sharing posts and exploring tags!`,
      isRead: false,
      createdAt: new Date().toISOString(),
      urgency: 'info'
    };
    setNotifications(prev => [welcomeNotif, ...prev]);
    syncNotificationToDb(welcomeNotif).catch(() => {});

    return { success: true };
  };

  const login = (identifier: string, password: string) => {
    const clean = identifier.trim().toLowerCase();
    const user = users.find(
      u => u.email.toLowerCase() === clean || u.phone.trim() === identifier.trim() || u.username.toLowerCase() === clean
    );

    if (!user) {
      return { success: false, error: 'No account found with this email, phone number, or username.' };
    }

    if (user.password !== password) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }

    if (user.isBanned) {
      return {
        success: false,
        error: `Your account has been banned by the moderation team. Reason: ${user.banReason || 'Violation of Terms of Service'}. Please contact support@alokpat.com for appeals.`
      };
    }

    setCurrentUserId(user.id);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const logout = () => {
    setCurrentUserId(null);
  };

  const switchUser = (userId: number) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      if (target.isBanned) {
        alert(`Cannot switch to banned account #${target.id} (@${target.username})`);
        return;
      }
      setCurrentUserId(target.id);
    }
  };

  const getUserById = (id: number) => {
    return users.find(u => u.id === id);
  };

  const openUserProfile = (userId: number) => {
    setViewingUserId(userId);
    setActiveTab('profile');
  };

  // Posts Methods
  const createPost = (data: { caption: string; images: string[]; keywords: string[]; hideComments: boolean; isAIPost: boolean }) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const newPost: Post = {
      id: `post-${Date.now()}`,
      userId: currentUser.id,
      caption: data.caption,
      images: data.images,
      keywords: data.keywords,
      hideComments: data.hideComments,
      isAIPost: data.isAIPost,
      likes: [],
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      viewsCount: 1,
    };

    setPosts(prev => [newPost, ...prev]);
    syncPostToDb(newPost).catch(() => {});
    setActiveTab('home');
  };

  const deletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setComments(prev => prev.filter(c => c.postId !== postId));
    deletePostFromDb(postId).catch(() => {});
    setReports(prev =>
      prev.map(r => (r.contentType === 'post' && r.contentId === postId ? { ...r, status: 'resolved', resolutionNote: 'Post deleted by moderation' } : r))
    );
  };

  const toggleReaction = (postId: string, reactionType: ReactionType = 'heart') => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const currentReactions: { [key in ReactionType]?: number[] } = { ...(p.reactions || {}) };
          
          // Check if user already has this specific reaction
          const userAlreadyHasThis = (currentReactions[reactionType] || []).includes(currentUser.id);

          // Remove user from all reaction buckets on this post
          const reactionKeys: ReactionType[] = ['heart', 'fire', 'laugh', 'clap', 'wow', 'sad'];
          reactionKeys.forEach(k => {
            if (currentReactions[k]) {
              currentReactions[k] = currentReactions[k]!.filter(id => id !== currentUser.id);
            }
          });

          // Sync likes array
          let updatedLikes = (p.likes || []).filter(id => id !== currentUser.id);

          if (!userAlreadyHasThis) {
            // Add user to the chosen reaction
            currentReactions[reactionType] = [...(currentReactions[reactionType] || []), currentUser.id];
            updatedLikes = [...updatedLikes, currentUser.id];

            // Send notification if not own post
            if (p.userId !== currentUser.id) {
              const reactionEmojiMap: Record<ReactionType, string> = {
                heart: '❤️',
                fire: '🔥',
                laugh: '😂',
                clap: '👏',
                wow: '😮',
                sad: '😢',
              };
              const reactionNameMap: Record<ReactionType, string> = {
                heart: 'Heart',
                fire: 'Fire',
                laugh: 'Laugh',
                clap: 'Clap',
                wow: 'Wow',
                sad: 'Sad',
              };
              const notif: AppNotification = {
                id: `notif-reaction-${Date.now()}`,
                userId: p.userId,
                type: 'reaction',
                actorId: currentUser.id,
                postId: p.id,
                reactionType,
                title: `${reactionEmojiMap[reactionType]} New Reaction`,
                message: `${currentUser.name} (@${currentUser.username}) reacted with ${reactionEmojiMap[reactionType]} (${reactionNameMap[reactionType]}) to your post.`,
                isRead: false,
                createdAt: new Date().toISOString()
              };
              setNotifications(nPrev => [notif, ...nPrev]);
              syncNotificationToDb(notif).catch(() => {});
            }
          }

          const updatedPost = {
            ...p,
            likes: updatedLikes,
            reactions: currentReactions,
          };
          syncPostToDb(updatedPost).catch(() => {});
          return updatedPost;
        }
        return p;
      })
    );
  };

  const toggleLikePost = (postId: string) => {
    toggleReaction(postId, 'heart');
  };

  const togglePinPost = (postId: string) => {
    if (!currentUser) return;
    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          const isPinned = u.pinnedPostIds.includes(postId);
          const newPinned = isPinned
            ? u.pinnedPostIds.filter(id => id !== postId)
            : [...u.pinnedPostIds, postId];
          const updatedUser = { ...u, pinnedPostIds: newPinned };
          syncUserToDb(updatedUser).catch(() => {});
          return updatedUser;
        }
        return u;
      })
    );
  };

  const toggleSavePost = (postId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          const currentSaved = u.savedPostIds || [];
          const isSaved = currentSaved.includes(postId);
          const newSaved = isSaved
            ? currentSaved.filter(id => id !== postId)
            : [...currentSaved, postId];
          const updatedUser = { ...u, savedPostIds: newSaved };
          syncUserToDb(updatedUser).catch(() => {});
          return updatedUser;
        }
        return u;
      })
    );
  };

  const isPostSaved = (postId: string): boolean => {
    if (!currentUser) return false;
    return !!currentUser.savedPostIds?.includes(postId);
  };

  // Comments Methods
  const addComment = (postId: string, text: string, parentId?: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const cleanText = text.trim();
    if (!cleanText) return;

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      postId,
      userId: currentUser.id,
      text: cleanText,
      createdAt: new Date().toISOString(),
      likes: [],
      parentId
    };

    setComments(prev => [...prev, newComment]);
    syncCommentToDb(newComment).catch(() => {});

    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          if (p.userId !== currentUser.id) {
            const notif: AppNotification = {
              id: `notif-comm-${Date.now()}`,
              userId: p.userId,
              type: 'comment',
              actorId: currentUser.id,
              postId: p.id,
              title: 'New Comment',
              message: `${currentUser.name} (@${currentUser.username}) commented: "${cleanText.slice(0, 60)}${cleanText.length > 60 ? '...' : ''}"`,
              isRead: false,
              createdAt: new Date().toISOString()
            };
            setNotifications(nPrev => [notif, ...nPrev]);
            syncNotificationToDb(notif).catch(() => {});
          }
          const updatedPost = { ...p, commentsCount: (p.commentsCount || 0) + 1 };
          syncPostToDb(updatedPost).catch(() => {});
          return updatedPost;
        }
        return p;
      })
    );
  };

  const deleteComment = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    setComments(prev => prev.filter(c => c.id !== commentId));
    deleteCommentFromDb(commentId).catch(() => {});
    setPosts(prev =>
      prev.map(p => {
        if (p.id === comment.postId) {
          const updatedPost = { ...p, commentsCount: Math.max(0, p.commentsCount - 1) };
          syncPostToDb(updatedPost).catch(() => {});
          return updatedPost;
        }
        return p;
      })
    );
    setReports(prev =>
      prev.map(r => (r.contentType === 'comment' && r.contentId === commentId ? { ...r, status: 'resolved', resolutionNote: 'Comment removed by moderation' } : r))
    );
  };

  const toggleLikeComment = (commentId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          const hasLiked = c.likes.includes(currentUser.id);
          const updatedComment = {
            ...c,
            likes: hasLiked ? c.likes.filter(id => id !== currentUser.id) : [...c.likes, currentUser.id]
          };
          syncCommentToDb(updatedComment).catch(() => {});
          return updatedComment;
        }
        return c;
      })
    );
  };

  const getPostComments = (postId: string) => {
    return comments.filter(c => c.postId === postId);
  };

  // Reporting System
  const openReportModal = (contentType: ReportContentType, contentId: string, reportedUserId: number) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setReportModalState({
      isOpen: true,
      contentType,
      contentId,
      reportedUserId,
    });
  };

  const closeReportModal = () => {
    setReportModalState(null);
  };

  const submitReport = (
    contentType: ReportContentType,
    contentId: string,
    reportedUserId: number,
    reason: ReportReason,
    details?: string
  ) => {
    if (!currentUser) return { success: false, message: 'Please log in to report content.' };

    const newReport: ContentReport = {
      id: `rep-${Date.now()}`,
      contentType,
      contentId,
      reportedUserId,
      reporterId: currentUser.id,
      reason,
      details,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    setReports(prev => [newReport, ...prev]);
    syncReportToDb(newReport).catch(() => {});
    closeReportModal();
    return { success: true, message: 'Report submitted. Our moderation team will review this shortly.' };
  };

  const adminResolveReport = (
    reportId: string,
    resolutionAction: 'deleted_content' | 'warned_user' | 'banned_user' | 'dismissed',
    note?: string
  ) => {
    setReports(prev =>
      prev.map(r => {
        if (r.id === reportId) {
          const updatedReport: ContentReport = {
            ...r,
            status: resolutionAction === 'dismissed' ? 'dismissed' : 'resolved',
            resolutionNote: note || `Action taken: ${resolutionAction.replace('_', ' ')}`,
            resolvedAt: new Date().toISOString(),
          };
          syncReportToDb(updatedReport).catch(() => {});
          return updatedReport;
        }
        return r;
      })
    );
  };

  const adminDismissReport = (reportId: string) => {
    adminResolveReport(reportId, 'dismissed', 'Dismissed by moderator as non-violating.');
  };

  // Profile & Social Methods
  const toggleFollow = (targetUserId: number) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (currentUser.id === targetUserId) return;

    const isFollowing = currentUser.following.includes(targetUserId);

    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          const updated = {
            ...u,
            following: isFollowing
              ? u.following.filter(id => id !== targetUserId)
              : [...u.following, targetUserId]
          };
          syncUserToDb(updated).catch(() => {});
          return updated;
        }
        if (u.id === targetUserId) {
          const updated = {
            ...u,
            followers: isFollowing
              ? u.followers.filter(id => id !== currentUser.id)
              : [...u.followers, currentUser.id]
          };
          syncUserToDb(updated).catch(() => {});
          return updated;
        }
        return u;
      })
    );

    if (!isFollowing) {
      const notif: AppNotification = {
        id: `notif-follow-${Date.now()}`,
        userId: targetUserId,
        type: 'follow',
        actorId: currentUser.id,
        title: 'New Follower',
        message: `${currentUser.name} (@${currentUser.username}) started following you.`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [notif, ...prev]);
      syncNotificationToDb(notif).catch(() => {});
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!currentUser) return { success: false, error: 'Not logged in' };

    if (updates.username && updates.username.toLowerCase() !== currentUser.username.toLowerCase()) {
      const cleanUsername = updates.username.trim().toLowerCase();
      if (!checkUsernameAvailable(cleanUsername, currentUser.id)) {
        return { success: false, error: `Username "@${cleanUsername}" is already taken.` };
      }

      if (currentUser.lastUsernameChangeDate) {
        const lastChange = new Date(currentUser.lastUsernameChangeDate).getTime();
        const now = Date.now();
        const daysSinceLastChange = (now - lastChange) / (1000 * 60 * 60 * 24);
        if (daysSinceLastChange < 30) {
          const daysRemaining = Math.ceil(30 - daysSinceLastChange);
          return {
            success: false,
            error: `Usernames can only be changed once every 30 days. Please wait ${daysRemaining} more days.`
          };
        }
      }

      updates.username = cleanUsername;
      updates.lastUsernameChangeDate = new Date().toISOString();
    }

    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          const updated = { ...u, ...updates };
          syncUserToDb(updated).catch(() => {});
          return updated;
        }
        return u;
      })
    );

    return { success: true };
  };

  const requestVerification = (reason?: string) => {
    if (!currentUser) return { success: false, message: 'Please sign in to request verification.' };
    if (currentUser.isVerified) return { success: false, message: 'Your account is already verified!' };
    if (currentUser.verificationStatus === 'pending') {
      return { success: false, message: 'Your verification request is already under review.' };
    }

    const updatedUser: User = {
      ...currentUser,
      verificationStatus: 'pending',
    };

    setUsers(prev => prev.map(u => (u.id === currentUser.id ? updatedUser : u)));
    syncUserToDb(updatedUser).catch(() => {});

    // Issue notice
    const notif: AppNotification = {
      id: `notif-verify-req-${Date.now()}`,
      userId: currentUser.id,
      type: 'admin_notice',
      title: 'Verification Request Submitted',
      message: reason
        ? `Your verification request has been received: "${reason}". Our moderation team is reviewing your profile.`
        : 'Your verification request has been received. Our moderation team will review your account authenticity shortly.',
      isRead: false,
      createdAt: new Date().toISOString(),
      urgency: 'info',
    };
    setNotifications(prev => [notif, ...prev]);
    syncNotificationToDb(notif).catch(() => {});

    return { success: true, message: 'Verification request submitted! Moderation review is in progress.' };
  };

  // Notifications Methods
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === id) {
          const updated = { ...n, isRead: true };
          syncNotificationToDb(updated).catch(() => {});
          return updated;
        }
        return n;
      })
    );
  };

  const markAllNotificationsAsRead = () => {
    if (!currentUser) return;
    setNotifications(prev =>
      prev.map(n => {
        if (n.userId === currentUser.id || n.userId === 'all') {
          const updated = { ...n, isRead: true };
          syncNotificationToDb(updated).catch(() => {});
          return updated;
        }
        return n;
      })
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    deleteNotificationFromDb(id).catch(() => {});
  };

  const userNotifications = notifications.filter(
    n => !currentUser || n.userId === currentUser.id || n.userId === 'all'
  );
  const unreadNotificationCount = userNotifications.filter(n => !n.isRead).length;

  // Admin Methods
  const adminLogin = (username: string, pass: string) => {
    if (username === 'admin' && pass === 'admin123') {
      setIsAdminLoggedIn(true);
      setAdminUsername(username);
      setIsAdminPanelOpen(true);
      return { success: true };
    }
    return { success: false, error: 'Invalid admin credentials. Use admin / admin123' };
  };

  const adminLogout = () => {
    setIsAdminLoggedIn(false);
    setIsAdminPanelOpen(false);
  };

  const adminToggleVerify = (
    userId: number,
    variant?: BadgeVariant,
    shape?: BadgeShape,
    customLabel?: string
  ) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const newStatus = !u.isVerified;
          const status: VerificationStatus = newStatus ? 'verified' : 'unverified';
          const resolvedVariant: BadgeVariant =
            variant ||
            u.badgeVariant ||
            (u.username === 'admin' || u.email === 'cosmozenix@gmail.com' ? 'gold' : 'blue');
          const resolvedShape: BadgeShape = shape || u.badgeShape || 'starburst';

          const notif: AppNotification = {
            id: `notif-verify-${Date.now()}`,
            userId: u.id,
            type: 'admin_notice',
            title: newStatus ? 'Account Verified' : 'Verification Status Updated',
            message: newStatus
              ? `Congratulations! Your profile has been officially verified by Alokpat Administration with the ${resolvedVariant.toUpperCase()} Verified Badge.`
              : 'Your verified status has been removed by Alokpat Administration.',
            isRead: false,
            createdAt: new Date().toISOString(),
            urgency: 'info',
          };
          setNotifications(nPrev => [notif, ...nPrev]);
          syncNotificationToDb(notif).catch(() => {});

          const updatedUser: User = {
            ...u,
            isVerified: newStatus,
            verificationStatus: status,
            verifiedAt: newStatus ? new Date().toISOString() : undefined,
            badgeVariant: newStatus ? resolvedVariant : u.badgeVariant,
            badgeShape: newStatus ? resolvedShape : u.badgeShape,
            customBadgeLabel:
              newStatus && customLabel !== undefined ? customLabel : u.customBadgeLabel,
          };
          syncUserToDb(updatedUser).catch(() => {});
          return updatedUser;
        }
        return u;
      })
    );
  };

  const adminUpdateVerificationBadge = (
    userId: number,
    variant: BadgeVariant,
    shape: BadgeShape,
    customLabel?: string
  ) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updatedUser: User = {
            ...u,
            isVerified: true,
            verificationStatus: 'verified',
            verifiedAt: u.verifiedAt || new Date().toISOString(),
            badgeVariant: variant,
            badgeShape: shape,
            customBadgeLabel: customLabel !== undefined ? customLabel : u.customBadgeLabel,
          };
          syncUserToDb(updatedUser).catch(() => {});
          return updatedUser;
        }
        return u;
      })
    );
  };

  const adminSetVerificationStatus = (userId: number, status: VerificationStatus) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const isVerified = status === 'verified';
          const updatedUser: User = {
            ...u,
            isVerified,
            verificationStatus: status,
            verifiedAt: isVerified ? new Date().toISOString() : undefined,
          };
          syncUserToDb(updatedUser).catch(() => {});
          return updatedUser;
        }
        return u;
      })
    );
  };

  const adminToggleBan = (userId: number, reason?: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const newBan = !u.isBanned;
          const updatedUser: User = {
            ...u,
            isBanned: newBan,
            banReason: newBan ? (reason || 'Violation of community policies & terms') : undefined
          };
          syncUserToDb(updatedUser).catch(() => {});

          if (newBan) {
            const notif: AppNotification = {
              id: `notif-ban-${Date.now()}`,
              userId: u.id,
              type: 'admin_warning',
              title: '⛔️ Account Banned',
              message: `Your account has been suspended. Reason: ${reason || 'Violation of terms'}. Contact support@alokpat.com for appeals.`,
              isRead: false,
              createdAt: new Date().toISOString(),
              urgency: 'alert'
            };
            setNotifications(nPrev => [notif, ...nPrev]);
            syncNotificationToDb(notif).catch(() => {});

            if (currentUserId === userId) {
              setCurrentUserId(null);
            }
          }

          return updatedUser;
        }
        return u;
      })
    );
  };

  const adminIssueWarning = (userId: number, message: string, severity: 'mild' | 'moderate' | 'severe' = 'moderate') => {
    const warningItem = {
      id: `warn-${Date.now()}`,
      date: new Date().toISOString(),
      message,
      issuedBy: adminUsername,
      severity
    };

    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updatedUser: User = {
            ...u,
            warningCount: (u.warningCount || 0) + 1,
            warnings: [...(u.warnings || []), warningItem]
          };
          syncUserToDb(updatedUser).catch(() => {});
          return updatedUser;
        }
        return u;
      })
    );

    const notif: AppNotification = {
      id: `notif-warn-${Date.now()}`,
      userId,
      type: 'admin_warning',
      title: `⚠️ Official Community Warning (${severity.toUpperCase()})`,
      message: `Moderation Notice: ${message}. Repeated violations may lead to account suspension.`,
      isRead: false,
      createdAt: new Date().toISOString(),
      urgency: 'warning'
    };
    setNotifications(prev => [notif, ...prev]);
    syncNotificationToDb(notif).catch(() => {});
  };

  const adminSendNotice = (
    userId: number,
    title: string,
    message: string,
    urgency: 'normal' | 'info' | 'warning' | 'alert' = 'info'
  ) => {
    const notif: AppNotification = {
      id: `notif-notice-${Date.now()}`,
      userId,
      type: 'admin_notice',
      title: `🛡️ Notice: ${title}`,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
      urgency
    };
    setNotifications(prev => [notif, ...prev]);
    syncNotificationToDb(notif).catch(() => {});
  };

  const adminSendBroadcast = (
    title: string,
    message: string,
    urgency: 'normal' | 'info' | 'warning' | 'alert' = 'info'
  ) => {
    const notif: AppNotification = {
      id: `notif-broadcast-${Date.now()}`,
      userId: 'all',
      type: 'broadcast',
      title: `📢 Announcement: ${title}`,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
      urgency
    };
    setNotifications(prev => [notif, ...prev]);
    syncNotificationToDb(notif).catch(() => {});
  };

  const adminDeletePost = (postId: string) => {
    deletePost(postId);
  };

  const adminDeleteComment = (commentId: string) => {
    deleteComment(commentId);
  };

  const adminUpdateUser = (userId: number, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updates } : u)));
  };

  const resetAllData = () => {
    localStorage.removeItem('alokpat_real_users');
    localStorage.removeItem('alokpat_real_posts');
    localStorage.removeItem('alokpat_real_comments');
    localStorage.removeItem('alokpat_real_reports');
    localStorage.removeItem('alokpat_real_notifications');
    localStorage.removeItem('alokpat_real_current_user_id');
    setUsers([]);
    setPosts([]);
    setComments([]);
    setReports([]);
    setNotifications([]);
    setCurrentUserId(null);
  };

  return (
    <AppContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        currentUser,
        users,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode,
        login,
        register,
        logout,
        checkUsernameAvailable,
        switchUser,
        activeTab,
        setActiveTab,
        viewingUserId,
        setViewingUserId,
        openUserProfile,
        searchTerm,
        setSearchTerm,
        posts,
        createPost,
        deletePost,
        toggleLikePost,
        toggleReaction,
        togglePinPost,
        toggleSavePost,
        isPostSaved,
        comments,
        addComment,
        deleteComment,
        toggleLikeComment,
        getPostComments,
        toggleFollow,
        updateProfile,
        requestVerification,
        getUserById,
        reports,
        submitReport,
        adminResolveReport,
        adminDismissReport,
        reportModalState,
        openReportModal,
        closeReportModal,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotification,
        isAdminLoggedIn,
        adminUsername,
        isAdminPanelOpen,
        setIsAdminPanelOpen,
        adminLogin,
        adminLogout,
        adminToggleVerify,
        adminUpdateVerificationBadge,
        adminSetVerificationStatus,
        adminToggleBan,
        adminIssueWarning,
        adminSendNotice,
        adminSendBroadcast,
        adminDeletePost,
        adminDeleteComment,
        adminUpdateUser,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
