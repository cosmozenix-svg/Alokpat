import React, { useState } from 'react';
import {
  Edit3,
  Camera,
  Image as ImageIcon,
  Heart,
  Bookmark,
  Grid,
  Lock,
  Calendar,
  MapPin,
  Link as LinkIcon,
  AlertCircle,
  Check,
  X,
  Settings as SettingsIcon,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { PostCard } from './PostCard';
import { formatExactDateTime } from '../utils/formatters';
import { compressImage } from '../utils/imageCompressor';

interface ProfileViewProps {
  userId?: number | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userId }) => {
  const {
    currentUser,
    getUserById,
    posts,
    toggleFollow,
    updateProfile,
    requestVerification,
    setActiveTab,
    viewingUserId,
    setIsAuthModalOpen,
    setAuthMode,
  } = useApp();

  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationReason, setVerificationReason] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  const targetId = userId || viewingUserId || currentUser?.id;
  const user = targetId ? getUserById(targetId) || (currentUser?.id === targetId ? currentUser : null) : currentUser;
  const isSelf = !!currentUser && currentUser.id === user?.id;

  const [activeTabSub, setActiveTabSub] = useState<'posts' | 'media' | 'liked' | 'saved'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(user?.name || '');
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [editCover, setEditCover] = useState(user?.cover || '');
  const [editLocation, setEditLocation] = useState(user?.location || '');
  const [editWebsite, setEditWebsite] = useState(user?.website || '');
  const [editIsPrivate, setEditIsPrivate] = useState(user?.isPrivate || false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  if (!user) {
    return (
      <div className="pb-24 pt-8 text-center">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 space-y-3 max-w-sm mx-auto">
          <div className="w-12 h-12 mx-auto rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <UserIcon size={22} />
          </div>
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
            {currentUser ? 'Profile Not Found' : 'Sign in to view your profile'}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {currentUser
              ? 'This account does not exist or may have been removed.'
              : 'Create an account to customize your profile, bio, cover, and share posts.'}
          </p>
          {!currentUser && (
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
          )}
        </div>
      </div>
    );
  }

  const isFollowing = currentUser ? currentUser.following.includes(user.id) : false;
  const userPosts = posts.filter(p => p.userId === user.id);
  const pinnedPosts = userPosts.filter(p => user.pinnedPostIds?.includes(p.id));
  const otherPosts = userPosts.filter(p => !user.pinnedPostIds?.includes(p.id));
  const sortedUserPosts = [...pinnedPosts, ...otherPosts];

  const mediaPosts = userPosts.filter(p => p.images && p.images.length > 0);
  const likedPosts = posts.filter(p => p.likes.includes(user.id));
  const savedPosts = posts.filter(p => user.savedPostIds?.includes(p.id));
  const totalLikesReceived = userPosts.reduce((acc, p) => acc + p.likes.length, 0);

  const handleOpenEdit = () => {
    setEditName(user.name);
    setEditUsername(user.username);
    setEditBio(user.bio || '');
    setEditAvatar(user.avatar || '');
    setEditCover(user.cover || '');
    setEditLocation(user.location || '');
    setEditWebsite(user.website || '');
    setEditIsPrivate(user.isPrivate || false);
    setEditError('');
    setEditSuccess('');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    const res = updateProfile({
      name: editName,
      username: editUsername,
      bio: editBio,
      avatar: editAvatar,
      cover: editCover,
      location: editLocation,
      website: editWebsite,
      isPrivate: editIsPrivate,
    });

    if (!res.success) {
      setEditError(res.error || 'Failed to update profile.');
    } else {
      setEditSuccess('Profile updated successfully!');
      setTimeout(() => setIsEditModalOpen(false), 700);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.8);
      setEditAvatar(compressed);
    } catch (err) {
      console.error('Failed to compress avatar', err);
    }
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1080, 600, 0.75);
      setEditCover(compressed);
    } catch (err) {
      console.error('Failed to compress cover', err);
    }
  };

  return (
    <div className="pb-24 pt-1">
      {/* Profile Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-3.5">
        {/* 16:9 Cover Photo */}
        <div className="relative aspect-[16/9] w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <img
            src={user.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          {isSelf && (
            <button
              onClick={handleOpenEdit}
              className="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-white/20 shadow-sm"
            >
              <Camera size={12} />
              <span>Edit Cover</span>
            </button>
          )}

          {/* User ID Badge */}
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-md bg-black/60 text-white text-[11px] font-mono">
            ID: #{user.id}
          </div>
        </div>

        {/* Profile Details */}
        <div className="px-4 pb-4">
          {/* Avatar Row */}
          <div className="flex justify-between items-end -mt-10 mb-2.5">
            <div className="relative">
              <UserAvatar
                user={user}
                size="2xl"
                showVerifiedCorner={true}
                className="ring-4 ring-white dark:ring-neutral-900 rounded-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              {isSelf ? (
                <>
                  <button
                    onClick={handleOpenEdit}
                    className="px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-neutral-200/70 dark:border-neutral-700/60 shadow-2xs"
                  >
                    <Edit3 size={13} />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 active:scale-90 transition-all cursor-pointer border border-neutral-200/70 dark:border-neutral-700/60 shadow-2xs"
                    title="Settings"
                  >
                    <SettingsIcon size={15} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => toggleFollow(user.id)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer ${
                    isFollowing
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 border border-neutral-200/80 dark:border-neutral-700'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs hover:shadow-md hover:shadow-purple-500/25 border border-purple-500/30'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          {/* Names */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                {user.name}
              </h2>
              {user.isVerified && <VerifiedBadge size="lg" user={user} />}
              {!user.isVerified && isSelf && (
                <button
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 active:scale-95 transition-all cursor-pointer shadow-2xs"
                  title="Apply for Alokpat Verified Badge"
                >
                  <ShieldCheck size={12} />
                  <span>{user.verificationStatus === 'pending' ? 'Verification Pending' : 'Get Verified'}</span>
                </button>
              )}
              {user.isPrivate && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                  <Lock size={10} /> Private
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-neutral-400">
                @{user.username}
              </p>
              {user.isVerified && (
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <VerifiedBadge
                    size="xs"
                    user={user}
                    showPill={true}
                    pillText={user.customBadgeLabel}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="mt-2.5 text-xs text-neutral-900 dark:text-neutral-100 leading-relaxed whitespace-pre-wrap font-normal">
              {user.bio}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {user.location}
              </span>
            )}
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline"
              >
                <LinkIcon size={12} />
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Joined {formatExactDateTime(user.createdAt).split('at')[0]}
            </span>
          </div>

          {/* Stats Bar */}
          <div className="mt-3.5 grid grid-cols-4 gap-2 p-2.5 bg-neutral-50 dark:bg-neutral-850 rounded-xl border border-neutral-200/60 dark:border-neutral-800 text-center">
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">{userPosts.length}</p>
              <p className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">Posts</p>
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">{(user.followers || []).length}</p>
              <p className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">Followers</p>
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">{(user.following || []).length}</p>
              <p className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">Following</p>
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">{totalLikesReceived}</p>
              <p className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">Loves</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex bg-neutral-100/90 dark:bg-neutral-850/90 rounded-2xl p-1 mb-3.5 border border-neutral-200/60 dark:border-neutral-800">
        <button
          onClick={() => setActiveTabSub('posts')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTabSub === 'posts'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-bold border border-neutral-200/50 dark:border-neutral-700/50'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-800/50'
          }`}
        >
          <Grid size={13} />
          <span>Posts ({userPosts.length})</span>
        </button>
        <button
          onClick={() => setActiveTabSub('media')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTabSub === 'media'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-bold border border-neutral-200/50 dark:border-neutral-700/50'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-800/50'
          }`}
        >
          <ImageIcon size={13} />
          <span>Media ({mediaPosts.length})</span>
        </button>
        <button
          onClick={() => setActiveTabSub('liked')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTabSub === 'liked'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-bold border border-neutral-200/50 dark:border-neutral-700/50'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-800/50'
          }`}
        >
          <Heart size={13} />
          <span>Loved ({likedPosts.length})</span>
        </button>
        <button
          onClick={() => setActiveTabSub('saved')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTabSub === 'saved'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-bold border border-neutral-200/50 dark:border-neutral-700/50'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-800/50'
          }`}
        >
          <Bookmark size={13} />
          <span>Saved ({savedPosts.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTabSub === 'posts' && (
        <div className="space-y-3">
          {sortedUserPosts.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-200 dark:border-neutral-800">
              <p className="text-xs text-neutral-400">No posts shared yet.</p>
            </div>
          ) : (
            sortedUserPosts.map(p => <PostCard key={p.id} post={p} />)
          )}
        </div>
      )}

      {activeTabSub === 'media' && (
        <div className="grid grid-cols-2 gap-2">
          {mediaPosts.length === 0 ? (
            <div className="col-span-2 bg-white dark:bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-200 dark:border-neutral-800">
              <p className="text-xs text-neutral-400">No media uploaded yet.</p>
            </div>
          ) : (
            mediaPosts.map(p => (
              <div
                key={p.id}
                className="relative aspect-square rounded-xl overflow-hidden group bg-neutral-100 dark:bg-neutral-800"
              >
                <img
                  src={p.images[0]}
                  alt="Media thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-semibold text-xs">
                  <span className="flex items-center gap-1">
                    <Heart size={13} className="fill-white" /> {p.likes.length}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTabSub === 'liked' && (
        <div className="space-y-3">
          {likedPosts.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-200 dark:border-neutral-800">
              <p className="text-xs text-neutral-400">No liked posts yet.</p>
            </div>
          ) : (
            likedPosts.map(p => <PostCard key={p.id} post={p} />)
          )}
        </div>
      )}

      {activeTabSub === 'saved' && (
        <div className="space-y-3">
          {savedPosts.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-200 dark:border-neutral-800 space-y-1.5">
              <div className="w-9 h-9 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center">
                <Bookmark size={16} />
              </div>
              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">No saved posts</p>
              <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                {isSelf
                  ? 'Tap the bookmark icon on any post to save it for easy access later.'
                  : 'This user has no saved posts.'}
              </p>
            </div>
          ) : (
            savedPosts.map(p => <PostCard key={p.id} post={p} />)
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">Edit Profile</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              {editError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg flex items-start gap-2">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center gap-2">
                  <Check size={14} />
                  <span>{editSuccess}</span>
                </div>
              )}

              {/* Profile Pic Upload (1:1 Circle) */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Profile Picture (1:1 Circle)
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={editAvatar}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border border-neutral-300 dark:border-neutral-700"
                  />
                  <label className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium cursor-pointer hover:bg-neutral-200 transition-colors">
                    Upload Photo
                    <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Cover Photo Upload (16:9) */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Cover Photo (16:9)
                </label>
                <div className="space-y-2">
                  <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 dark:border-neutral-800">
                    <img src={editCover} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                  <label className="inline-block px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium cursor-pointer hover:bg-neutral-200 transition-colors">
                    Upload 16:9 Cover
                    <input type="file" accept="image/*" onChange={handleCoverFile} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                />
              </div>

              {/* Username (once a month check) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Username</label>
                  <span className="text-[10px] text-neutral-400">Changed max once/month</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">@</span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full pl-7 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white resize-none"
                  placeholder="Tell the community about yourself..."
                />
              </div>

              {/* Location & Website */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value)}
                    placeholder="e.g. Tokyo"
                    className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Website</label>
                  <input
                    type="url"
                    value={editWebsite}
                    onChange={e => setEditWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Privacy Toggle */}
              <label className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl cursor-pointer">
                <div>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200">Private Account</p>
                  <p className="text-[10px] text-neutral-400">Only approved followers can view your full posts</p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsPrivate}
                  onChange={e => setEditIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
              </label>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors text-xs"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
