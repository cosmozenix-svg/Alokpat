import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  Pin,
  Send,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Flag,
} from 'lucide-react';
import { Post, User } from '../types';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { formatExactDateTime, formatRelativeTime, renderRichText } from '../utils/formatters';

interface PostCardProps {
  post: Post;
  onTagClick?: (tag: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onTagClick }) => {
  const {
    currentUser,
    getUserById,
    toggleReaction,
    togglePinPost,
    toggleSavePost,
    isPostSaved,
    deletePost,
    getPostComments,
    addComment,
    deleteComment,
    toggleLikeComment,
    openUserProfile,
    setSearchTerm,
    setActiveTab,
    isAdminLoggedIn,
    adminDeletePost,
    openReportModal,
    setIsAuthModalOpen,
  } = useApp();

  const author: User | undefined = getUserById(post.userId);
  const isPinned = author?.pinnedPostIds?.includes(post.id) || post.isPinned;
  const isOwner = currentUser?.id === post.userId;
  const comments = getPostComments(post.id);

  // Love Reaction Resolution (Exclusive Love React)
  const isLiked = useMemo(() => {
    if (!currentUser) return false;
    if (post.reactions?.heart && post.reactions.heart.includes(currentUser.id)) {
      return true;
    }
    if (post.likes && post.likes.includes(currentUser.id)) {
      return true;
    }
    return false;
  }, [post.reactions, post.likes, currentUser]);

  // Total Love Count
  const loveCount = useMemo(() => {
    const heartList = post.reactions?.heart || [];
    const legacyLikes = post.likes || [];
    // Combine unique user IDs
    const combined = new Set<number>([...heartList, ...legacyLikes]);
    return combined.size;
  }, [post.reactions, post.likes]);

  // Users who loved the post
  const loversList = useMemo(() => {
    const heartList = post.reactions?.heart || [];
    const legacyLikes = post.likes || [];
    const uniqueIds = Array.from(new Set<number>([...heartList, ...legacyLikes]));
    return uniqueIds
      .map(id => getUserById(id))
      .filter((u): u is User => !!u);
  }, [post.reactions, post.likes, getUserById]);

  // Local state
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  // Touch & Swipe gesture refs for media carousel
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const mouseStartX = useRef<number>(0);
  const isMouseDown = useRef<boolean>(false);

  // Double-tap timestamp ref
  const lastTapRef = useRef<number>(0);

  const isSaved = isPostSaved(post.id);

  const handleToggleSave = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const nextSaved = !isSaved;
    toggleSavePost(post.id);
    setIsMenuOpen(false);
    setSaveToast(nextSaved ? 'Saved to bookmarks' : 'Removed from bookmarks');
    setTimeout(() => setSaveToast(null), 2000);
  };

  // Toggle Love Reaction
  const handleToggleLove = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    toggleReaction(post.id, 'heart');
  };

  // Double Tap handler (Grants Like + Heart Burst Animation)
  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const delta = now - lastTapRef.current;

    if (delta < 320 && delta > 0) {
      // Confirmed double tap
      triggerLoveBurst();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const triggerLoveBurst = () => {
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);

    if (!isLiked) {
      if (!currentUser) {
        setIsAuthModalOpen(true);
        return;
      }
      toggleReaction(post.id, 'heart');
    }
  };

  // Touch Swipe Handlers for multi-image navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current || !post.images || post.images.length <= 1) {
      isSwiping.current = false;
      return;
    }
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Detect horizontal swipe
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        // Swiped Left -> Next Image
        setCurrentImageIndex(prev => (prev === post.images.length - 1 ? 0 : prev + 1));
      } else {
        // Swiped Right -> Previous Image
        setCurrentImageIndex(prev => (prev === 0 ? post.images.length - 1 : prev - 1));
      }
    }
    isSwiping.current = false;
  };

  // Desktop Mouse Drag Swipe Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
    isMouseDown.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDown.current || !post.images || post.images.length <= 1) {
      isMouseDown.current = false;
      return;
    }
    const deltaX = e.clientX - mouseStartX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        setCurrentImageIndex(prev => (prev === post.images.length - 1 ? 0 : prev + 1));
      } else {
        setCurrentImageIndex(prev => (prev === 0 ? post.images.length - 1 : prev - 1));
      }
    }
    isMouseDown.current = false;
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText);
    setCommentText('');
  };

  const handleTagClickInternal = (tag: string) => {
    if (onTagClick) {
      onTagClick(tag);
    } else {
      setSearchTerm(tag);
      setActiveTab('search');
    }
  };

  const handleReportPost = () => {
    setIsMenuOpen(false);
    openReportModal('post', post.id, post.userId);
  };

  const handleReportComment = (commentId: string, commentUserId: number) => {
    openReportModal('comment', commentId, commentUserId);
  };

  return (
    <article className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-4 shadow-xs">
      {/* Pinned Post Indicator */}
      {isPinned && (
        <div className="bg-purple-50/70 dark:bg-purple-950/40 px-4 py-1.5 border-b border-purple-100 dark:border-purple-900/40 flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300 font-semibold">
          <Pin size={12} className="rotate-45" />
          <span>Pinned Post</span>
        </div>
      )}

      {/* Author & Header */}
      <div className="p-3.5 flex items-center justify-between">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => author && openUserProfile(author.id)}
        >
          <UserAvatar user={author} size="md" />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-50 hover:underline">
                {author?.name || 'User'}
              </span>
              {author?.isVerified && <VerifiedBadge size="sm" user={author} />}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-300 font-medium">
              <span>@{author?.username || 'user'}</span>
              <span>•</span>
              <span title={formatExactDateTime(post.createdAt)}>
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Post Options Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Post options"
          >
            <MoreHorizontal size={17} />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-1.5 z-40 text-xs animate-in fade-in duration-150">
                {isOwner && (
                  <button
                    onClick={() => {
                      togglePinPost(post.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg font-medium cursor-pointer"
                  >
                    <Pin size={14} />
                    <span>{isPinned ? 'Unpin' : 'Pin to Profile'}</span>
                  </button>
                )}

                <button
                  onClick={handleToggleSave}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg font-medium cursor-pointer"
                >
                  {isSaved ? (
                    <BookmarkCheck size={14} className="text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Bookmark size={14} />
                  )}
                  <span>{isSaved ? 'Unsave Post' : 'Save Post'}</span>
                </button>

                {!isOwner && (
                  <button
                    onClick={handleReportPost}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg font-medium cursor-pointer"
                  >
                    <Flag size={14} />
                    <span>Report Post</span>
                  </button>
                )}

                {(isOwner || isAdminLoggedIn) && (
                  <button
                    onClick={() => {
                      if (isAdminLoggedIn) {
                        adminDeletePost(post.id);
                      } else {
                        deletePost(post.id);
                      }
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg font-medium cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Delete Post</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Caption Content */}
      <div className="px-3.5 pb-3">
        <p className="text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-line leading-relaxed font-normal">
          {renderRichText(post.caption)}
        </p>

        {/* Timestamp */}
        <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-2 font-medium">
          {formatExactDateTime(post.createdAt)}
        </p>

        {/* Keyword Tags */}
        {post.keywords && post.keywords.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {post.keywords.map((kw, idx) => (
              <button
                key={idx}
                onClick={() => handleTagClickInternal(kw)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>#{kw}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Multi-Image Gallery with Touch & Button Swiping and Double-Tap Like */}
      {post.images && post.images.length > 0 && (
        <div
          className="relative bg-neutral-100 dark:bg-neutral-950 overflow-hidden select-none border-y border-neutral-100 dark:border-neutral-800 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleDoubleTap}
        >
          <div className="relative aspect-square max-h-[460px] w-full flex items-center justify-center cursor-pointer group">
            <img
              src={post.images[currentImageIndex]}
              alt={`Post media ${currentImageIndex + 1}`}
              className="w-full h-full object-cover transition-opacity duration-200"
              draggable={false}
            />

            {/* Double Tap Heart Burst Animation */}
            {showHeartBurst && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                <div className="animate-heart-burst">
                  <Heart
                    size={96}
                    className="text-rose-500 fill-rose-500 drop-shadow-[0_10px_35px_rgba(244,63,94,0.7)]"
                  />
                </div>
              </div>
            )}

            {/* Expand Fullscreen Icon */}
            <button
              onClick={e => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white transition-all cursor-pointer shadow-md active:scale-90"
              title="View full screen"
              aria-label="View full screen"
            >
              <Maximize2 size={14} />
            </button>

            {/* Multi-Image Swipe Buttons & Dots */}
            {post.images.length > 1 && (
              <>
                {/* Left Button Swipe */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setCurrentImageIndex(prev => (prev === 0 ? post.images.length - 1 : prev - 1));
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xs text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-md z-10"
                  title="Previous photo"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Right Button Swipe */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setCurrentImageIndex(prev => (prev === post.images.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xs text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-md z-10"
                  title="Next photo"
                  aria-label="Next photo"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Swiping Indicator Dots (Bottom Center) */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm z-10 pointer-events-auto">
                  {post.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={e => {
                        e.stopPropagation();
                        setCurrentImageIndex(idx);
                      }}
                      className={`transition-all rounded-full ${
                        currentImageIndex === idx
                          ? 'w-4 h-1.5 bg-white shadow-xs'
                          : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Photo Count Pill (Bottom Right) */}
                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold">
                  {currentImageIndex + 1}/{post.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Love Summary & Comments Count Bar */}
      {(loveCount > 0 || (post.commentsCount || comments.length) > 0) && (
        <div className="px-3.5 pt-2.5 pb-1 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300 font-medium border-t border-neutral-100 dark:border-neutral-800/80">
          {/* Love Count Badge */}
          {loveCount > 0 ? (
            <button
              onClick={() => setIsLikesModalOpen(true)}
              className="flex items-center gap-1.5 hover:underline text-left group cursor-pointer"
            >
              <span className="w-5 h-5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-xs shadow-2xs">
                ❤️
              </span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                {loveCount} {loveCount === 1 ? 'love' : 'loves'}
              </span>
            </button>
          ) : (
            <div />
          )}

          {/* Comments Count */}
          {(post.commentsCount || comments.length) > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline ml-auto text-neutral-600 dark:text-neutral-300 font-semibold cursor-pointer"
            >
              {post.commentsCount || comments.length}{' '}
              {comments.length === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      {/* Action Buttons Bar: Exclusively Love React, Comments, Bookmark */}
      <div className="px-3.5 py-2.5 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-850">
        <div className="flex items-center gap-2">
          {/* Dedicated Love Button */}
          <button
            onClick={handleToggleLove}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 border shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer select-none ${
              isLiked
                ? 'bg-rose-50/95 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/90 dark:border-rose-900/70 shadow-rose-500/10'
                : 'bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white border-neutral-200/80 dark:border-neutral-800'
            }`}
            title={isLiked ? 'Unlike' : 'Love this post (or double tap image)'}
          >
            <Heart
              size={17}
              className={`transition-transform duration-150 ${
                isLiked
                  ? 'fill-rose-500 text-rose-500 scale-110 animate-pop'
                  : 'text-neutral-600 dark:text-neutral-300'
              }`}
            />
            <span>{isLiked ? 'Loved' : 'Love'}</span>
            {loveCount > 0 && (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isLiked
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                    : 'bg-neutral-200/80 dark:bg-neutral-750 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {loveCount}
              </span>
            )}
          </button>

          {/* Comments Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:text-purple-600 dark:hover:text-purple-400 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <MessageCircle size={16} />
            <span>Comment</span>
            {comments.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-neutral-200/80 dark:bg-neutral-750 text-neutral-700 dark:text-neutral-300">
                {comments.length}
              </span>
            )}
          </button>

          {/* Save / Bookmark Button */}
          <button
            onClick={handleToggleSave}
            className={`p-2 rounded-xl transition-all duration-150 active:scale-90 cursor-pointer flex items-center justify-center border shadow-2xs hover:shadow-xs ${
              isSaved
                ? 'bg-gradient-to-tr from-purple-500/15 to-indigo-500/15 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 shadow-purple-500/10'
                : 'bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 border-neutral-200/80 dark:border-neutral-800'
            }`}
            title={isSaved ? 'Remove from Saved' : 'Save Post'}
            aria-label={isSaved ? 'Unsave post' : 'Save post'}
          >
            {isSaved ? (
              <BookmarkCheck size={16} className="fill-purple-600/20 dark:fill-purple-400/20 animate-pop" />
            ) : (
              <Bookmark size={16} />
            )}
          </button>
        </div>

        {saveToast && (
          <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold animate-in fade-in">
            {saveToast}
          </span>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-3.5 py-3 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          {post.hideComments ? (
            <div className="p-2.5 text-center text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1.5 font-medium">
              <Lock size={13} />
              <span>Comments are disabled for this post.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="flex items-center gap-2">
                <UserAvatar user={currentUser} size="xs" showVerifiedCorner={false} />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-750 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-purple-600 transition-all shadow-2xs font-normal"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-all cursor-pointer shadow-xs hover:shadow-md hover:shadow-purple-500/20"
                    title="Send comment"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </form>

              {/* Comments List */}
              {comments.length === 0 ? (
                <p className="text-center py-2 text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                  No comments yet. Start the conversation!
                </p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {comments.map(c => {
                    const cAuthor = getUserById(c.userId);
                    const cIsLiked = currentUser ? c.likes.includes(currentUser.id) : false;
                    const canDelete = currentUser?.id === c.userId || isOwner || isAdminLoggedIn;
                    const isOwnComment = currentUser?.id === c.userId;

                    return (
                      <div key={c.id} className="flex items-start gap-2 group">
                        <UserAvatar
                          user={cAuthor}
                          size="xs"
                          onClick={() => cAuthor && openUserProfile(cAuthor.id)}
                        />
                        <div className="flex-1 min-w-0 bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div
                              className="flex items-center gap-1 font-bold text-xs text-neutral-900 dark:text-neutral-100 cursor-pointer hover:underline"
                              onClick={() => cAuthor && openUserProfile(cAuthor.id)}
                            >
                              <span>{cAuthor?.name || 'User'}</span>
                              {cAuthor?.isVerified && <VerifiedBadge size="sm" user={cAuthor} />}
                              <span className="text-[11px] font-normal text-neutral-500 dark:text-neutral-400">
                                @{cAuthor?.username}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                              {formatRelativeTime(c.createdAt)}
                            </span>
                          </div>

                          <p className="text-neutral-900 dark:text-neutral-100 mt-1 whitespace-pre-wrap leading-relaxed text-xs">
                            {c.text}
                          </p>

                          <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                            <button
                              onClick={() => toggleLikeComment(c.id)}
                              className={`flex items-center gap-1 py-0.5 px-1.5 rounded-md active:scale-95 transition-all cursor-pointer font-semibold ${
                                cIsLiked
                                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
                                  : 'hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                              }`}
                            >
                              <Heart size={11} className={cIsLiked ? 'fill-rose-600 dark:fill-rose-400 text-rose-600' : ''} />
                              <span>{c.likes.length || 'Like'}</span>
                            </button>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!isOwnComment && (
                                <button
                                  onClick={() => handleReportComment(c.id, c.userId)}
                                  title="Report"
                                  className="p-1 rounded-md text-neutral-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 active:scale-90 transition-all cursor-pointer"
                                >
                                  <Flag size={11} />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => deleteComment(c.id)}
                                  className="p-1 rounded-md text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-90 transition-all cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loved By Modal */}
      {isLikesModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsLikesModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-rose-500">❤️</span>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Loved by ({loversList.length})
                </h3>
              </div>
              <button
                onClick={() => setIsLikesModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Lovers List */}
            <div className="p-3 max-h-72 overflow-y-auto space-y-2 text-xs">
              {loversList.length === 0 ? (
                <p className="text-center py-6 text-neutral-500 dark:text-neutral-400 font-medium">
                  Be the first one to love this post!
                </p>
              ) : (
                loversList.map(u => (
                  <div
                    key={u.id}
                    onClick={() => {
                      openUserProfile(u.id);
                      setIsLikesModalOpen(false);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar user={u} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 font-bold text-neutral-900 dark:text-white truncate">
                          <span>{u.name}</span>
                          {u.isVerified && <VerifiedBadge size="xs" user={u} />}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-300 font-medium truncate">
                          @{u.username} • ID: #{u.id}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm">❤️</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && post.images && post.images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={post.images[currentImageIndex]}
              alt={`Fullscreen Photo ${currentImageIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-xl select-none"
            />

            {post.images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIndex(prev => (prev === 0 ? post.images.length - 1 : prev - 1))
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all active:scale-95 cursor-pointer"
                  title="Previous"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex(prev => (prev === post.images.length - 1 ? 0 : prev + 1))
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all active:scale-95 cursor-pointer"
                  title="Next"
                >
                  <ChevronRight size={24} />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 text-white text-xs font-semibold">
                  {currentImageIndex + 1} / {post.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
};
