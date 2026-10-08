import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Users, Flame, Compass, RefreshCw, Layers, ArrowDown, ArrowUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PostCard } from './PostCard';

const INITIAL_VISIBLE_COUNT = 8;
const LOAD_MORE_STEP = 6;

export const HomeFeed: React.FC = () => {
  const { posts, currentUser, setActiveTab, setIsAuthModalOpen, setAuthMode } = useApp();
  const [feedFilter, setFeedFilter] = useState<'all' | 'following' | 'trending'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Pull to refresh state (Touch only)
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const PULL_THRESHOLD = 65;
  const MAX_PULL = 100;

  // Reset pagination when filter or posts change
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [feedFilter]);

  // Sorting & Prioritization logic:
  // Followed creators prioritized first, then chronological
  const sortedPosts = useMemo(() => {
    const followingIds = currentUser?.following || [];

    if (feedFilter === 'following') {
      return posts
        .filter(p => followingIds.includes(p.userId) || p.userId === currentUser?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (feedFilter === 'trending') {
      return [...posts].sort((a, b) => (b.likes.length + (b.commentsCount || 0)) - (a.likes.length + (a.commentsCount || 0)));
    }

    const followedPosts: typeof posts = [];
    const otherPosts: typeof posts = [];

    const chronological = [...posts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    chronological.forEach(p => {
      if (followingIds.includes(p.userId) || (currentUser && p.userId === currentUser.id)) {
        followedPosts.push(p);
      } else {
        otherPosts.push(p);
      }
    });

    return [...followedPosts, ...otherPosts];
  }, [posts, currentUser, feedFilter]);

  const displayedPosts = useMemo(() => {
    return sortedPosts.slice(0, visibleCount);
  }, [sortedPosts, visibleCount]);

  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPullDistance(PULL_THRESHOLD * 0.7);

    setTimeout(() => {
      setIsRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
      setVisibleCount(INITIAL_VISIBLE_COUNT);
    }, 600);
  }, [PULL_THRESHOLD]);

  // Touch event handlers for mobile pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollParent = containerRef.current?.closest('main');
    const parentScroll = scrollParent ? scrollParent.scrollTop : 0;

    if (scrollY <= 0 && parentScroll <= 0) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollParent = containerRef.current?.closest('main');
    const parentScroll = scrollParent ? scrollParent.scrollTop : 0;

    if (scrollY > 0 || parentScroll > 0) {
      setPullDistance(0);
      return;
    }

    currentYRef.current = e.touches[0].clientY;
    const diff = currentYRef.current - startYRef.current;

    if (diff > 0) {
      const damped = Math.min(MAX_PULL, Math.pow(diff, 0.85) * 1.8);
      setPullDistance(damped);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling || isRefreshing) return;
    if (pullDistance >= PULL_THRESHOLD) {
      triggerRefresh();
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  // Scroll listener for back-to-top button & infinite feed scrolling
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const mainEl = containerRef.current?.closest('main');
      const mainScroll = mainEl ? mainEl.scrollTop : 0;
      const currentScroll = Math.max(scrollY, mainScroll);

      // Show scroll-to-top button when scrolled past 220px
      setShowScrollTop(currentScroll > 220);

      // Check if approaching bottom to load more posts smoothly
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const isNearWindowBottom = scrollY + windowHeight >= docHeight - 350;

      const isNearMainBottom = mainEl
        ? mainEl.scrollTop + mainEl.clientHeight >= mainEl.scrollHeight - 350
        : false;

      if (isNearWindowBottom || isNearMainBottom) {
        setVisibleCount(prev => {
          if (prev < sortedPosts.length) {
            return Math.min(prev + LOAD_MORE_STEP, sortedPosts.length);
          }
          return prev;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const mainEl = containerRef.current?.closest('main');
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, [sortedPosts.length]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainEl = containerRef.current?.closest('main') || document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const pullRatio = Math.min(1, pullDistance / PULL_THRESHOLD);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="pb-24 pt-2 relative"
    >
      {/* Pull to Refresh Indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{
          height: isRefreshing ? `${PULL_THRESHOLD * 0.7}px` : `${pullDistance}px`,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
        }}
      >
        <div className="flex items-center justify-center gap-2 py-2">
          <div
            className={`w-7 h-7 rounded-full bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-purple-600 transition-transform ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: isRefreshing ? 'none' : `rotate(${pullRatio * 180}deg)`,
            }}
          >
            {isRefreshing ? (
              <RefreshCw size={14} />
            ) : (
              <ArrowDown size={14} className={pullDistance >= PULL_THRESHOLD ? 'text-purple-600' : 'text-neutral-400'} />
            )}
          </div>
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
            {isRefreshing
              ? 'Refreshing feed...'
              : pullDistance >= PULL_THRESHOLD
              ? 'Release to refresh'
              : 'Pull down to refresh'}
          </span>
        </div>
      </div>

      {/* Welcome Banner if no user is signed in */}
      {!currentUser && (
        <div className="bg-neutral-50 dark:bg-neutral-850 rounded-2xl p-4 mb-4 border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
            Welcome to Alokpat
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
            Create an account or sign in to share posts, follow members, and discover keywords.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => {
                setAuthMode('register');
                setIsAuthModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-xs hover:shadow-md hover:shadow-purple-500/25 active:scale-[0.98] transition-all cursor-pointer border border-purple-500/30"
            >
              Sign Up
            </button>
            <button
              onClick={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              className="px-4 py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-neutral-900 dark:text-neutral-100 font-semibold rounded-xl text-xs active:scale-[0.98] transition-all cursor-pointer border border-neutral-200 dark:border-neutral-700 shadow-2xs"
            >
              Log In
            </button>
          </div>
        </div>
      )}

      {/* Feed Filter Navigation */}
      <div className="flex items-center justify-between gap-2 mb-3.5 px-0.5">
        <div className="flex items-center gap-1 bg-neutral-100/90 dark:bg-neutral-900 p-1 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/80">
          <button
            onClick={() => setFeedFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              feedFilter === 'all'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-bold border border-neutral-200/50 dark:border-neutral-700/50'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/60'
            }`}
          >
            <Compass size={13} />
            <span>Feed</span>
          </button>
          <button
            onClick={() => setFeedFilter('following')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              feedFilter === 'following'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-bold border border-neutral-200/50 dark:border-neutral-700/50'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/60'
            }`}
          >
            <Users size={13} />
            <span>Following</span>
          </button>
          <button
            onClick={() => setFeedFilter('trending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              feedFilter === 'trending'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-bold border border-neutral-200/50 dark:border-neutral-700/50'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/60'
            }`}
          >
            <Flame size={13} />
            <span>Trending</span>
          </button>
        </div>

        <button
          onClick={triggerRefresh}
          title="Refresh Feed"
          className={`p-2.5 rounded-2xl text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 shadow-2xs hover:shadow-xs active:scale-90 transition-all cursor-pointer ${
            isRefreshing ? 'animate-spin text-purple-600' : ''
          }`}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Feed Content */}
      {sortedPosts.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-200 dark:border-neutral-800">
          <div className="w-12 h-12 mx-auto rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
            <Layers size={22} />
          </div>
          <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
            No posts yet
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 max-w-xs mx-auto leading-relaxed">
            {currentUser
              ? 'Be the first to share an update, thoughts, or photos.'
              : 'Create an account to start sharing posts with the community.'}
          </p>
          <button
            onClick={() => {
              if (!currentUser) {
                setAuthMode('register');
                setIsAuthModalOpen(true);
              } else {
                setActiveTab('add');
              }
            }}
            className="mt-4 px-4 py-2.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer border border-purple-500/30"
          >
            {currentUser ? 'Create Post' : 'Sign Up to Post'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}

          {/* Infinite Scroll / Feed Status */}
          {visibleCount < sortedPosts.length ? (
            <div className="text-center py-4">
              <button
                onClick={() => setVisibleCount(prev => Math.min(prev + LOAD_MORE_STEP, sortedPosts.length))}
                className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-semibold border border-neutral-200/60 dark:border-neutral-700 shadow-2xs active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Load more posts ({sortedPosts.length - visibleCount} remaining)</span>
              </button>
            </div>
          ) : sortedPosts.length > 3 ? (
            <div className="py-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                <span>✨ You're all caught up</span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-5 z-40 p-3 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-600/40 hover:scale-105 active:scale-90 transition-all duration-150 flex items-center justify-center border border-purple-300/40 cursor-pointer animate-pop"
          title="Scroll to Top"
          aria-label="Scroll back to top"
        >
          <ArrowUp size={18} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
};
