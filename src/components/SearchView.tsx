import React, { useState, useMemo, useEffect } from 'react';
import {
  Search as SearchIcon,
  X,
  Tag,
  User as UserIcon,
  FileText,
  SlidersHorizontal,
  ArrowUpDown,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  Users,
  Sparkles,
  Clock,
  Trash2,
  History,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { PostCard } from './PostCard';
import { safeGetStorage, safeSetStorage } from '../utils/storage';

type SortOption = 'relevance' | 'newest' | 'oldest' | 'popularity';
type DateFilterOption = 'all' | '24h' | 'week' | 'month';
type ContentTypeOption = 'all' | 'users' | 'posts' | 'tags' | 'media_only';
type DiscoverTabOption = 'all' | 'creators' | 'posts';

const SEARCH_HISTORY_KEY = 'alokpat_recent_searches';

export const SearchView: React.FC = () => {
  const { users, posts, searchTerm, setSearchTerm, openUserProfile, toggleFollow, currentUser } = useApp();

  // Local storage-based search history (last 5 recent search queries)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = safeGetStorage<string[]>(SEARCH_HISTORY_KEY, []);
      return Array.isArray(saved) ? saved.slice(0, 5) : [];
    } catch {
      return [];
    }
  });

  const saveQueryToHistory = (query: string) => {
    const clean = query.trim();
    if (!clean || clean.length < 2) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5);
      safeSetStorage(SEARCH_HISTORY_KEY, updated);
      return updated;
    });
  };

  const removeQueryFromHistory = (queryToRemove: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setRecentSearches(prev => {
      const updated = prev.filter(q => q !== queryToRemove);
      safeSetStorage(SEARCH_HISTORY_KEY, updated);
      return updated;
    });
  };

  const clearAllSearchHistory = () => {
    setRecentSearches([]);
    safeSetStorage(SEARCH_HISTORY_KEY, []);
  };

  const handleSelectHistoryQuery = (query: string) => {
    setSearchTerm(query);
    saveQueryToHistory(query);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      saveQueryToHistory(searchTerm.trim());
    }
  };

  // Auto-record query in history when user pauses typing
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) return;
    const timer = setTimeout(() => {
      saveQueryToHistory(searchTerm.trim());
    }, 1200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter & Sort State
  const [contentType, setContentType] = useState<ContentTypeOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [dateRange, setDateRange] = useState<DateFilterOption>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [discoverSection, setDiscoverSection] = useState<DiscoverTabOption>('all');

  // Top 10 Creators sorted strictly by followers count descending
  const topCreators = useMemo(() => {
    return [...users]
      .sort((a, b) => {
        const countA = a.followers?.length || 0;
        const countB = b.followers?.length || 0;
        if (countB !== countA) return countB - countA;
        if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 10);
  }, [users]);

  // Suggested recently published posts
  const recentSuggestedPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [posts]);

  // Helper date filtering
  const isWithinDateRange = (isoString: string, range: DateFilterOption) => {
    if (range === 'all') return true;
    const itemDate = new Date(isoString).getTime();
    const now = Date.now();
    const diffHours = (now - itemDate) / (1000 * 60 * 60);

    if (range === '24h') return diffHours <= 24;
    if (range === 'week') return diffHours <= 24 * 7;
    if (range === 'month') return diffHours <= 24 * 30;
    return true;
  };

  // Perform multi-dimensional search & sorting
  const results = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const cleanId = term.replace(/^#/, '');

    // 1. User matching: ID, Username, Name, Bio, Phone, Email
    let matchedUsers = !term
      ? []
      : users.filter(u => {
          const idMatch = u.id.toString() === cleanId || u.id.toString().includes(cleanId);
          const usernameMatch = u.username.toLowerCase().includes(term.replace(/^@/, ''));
          const nameMatch = u.name.toLowerCase().includes(term);
          const bioMatch = u.bio.toLowerCase().includes(term);
          const matches = idMatch || usernameMatch || nameMatch || bioMatch;

          if (!matches) return false;
          if (verifiedOnly && !u.isVerified) return false;
          if (!isWithinDateRange(u.createdAt, dateRange)) return false;
          return true;
        });

    // 2. Tag matching
    let matchedTags = !term
      ? []
      : Array.from(
          new Set(
            posts
              .flatMap(p => p.keywords || [])
              .filter(k => k.toLowerCase().includes(term.replace(/^#/, '')))
          )
        );

    // 3. Post matching: Keywords, Caption, Author matching
    let matchedPosts = !term
      ? []
      : posts.filter(p => {
          const keywordMatch = p.keywords?.some(k => k.toLowerCase().includes(term.replace(/^#/, '')));
          const captionMatch = p.caption.toLowerCase().includes(term);
          const author = users.find(u => u.id === p.userId);
          const authorMatch =
            author &&
            (author.username.toLowerCase().includes(term.replace(/^@/, '')) ||
              author.name.toLowerCase().includes(term) ||
              author.id.toString() === cleanId);

          const matches = keywordMatch || captionMatch || authorMatch;
          if (!matches) return false;

          // Verified author check if toggled
          if (verifiedOnly && (!author || !author.isVerified)) return false;

          // Date filter check
          if (!isWithinDateRange(p.createdAt, dateRange)) return false;

          // Media filter
          if (contentType === 'media_only' && (!p.images || p.images.length === 0)) return false;

          return true;
        });

    // Sort matched posts according to sort option
    matchedPosts = [...matchedPosts].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'popularity') {
        const popA = a.likes.length * 2 + (a.commentsCount || 0);
        const popB = b.likes.length * 2 + (b.commentsCount || 0);
        return popB - popA;
      }
      // Relevance sorting
      let scoreA = 0;
      let scoreB = 0;
      if (a.keywords?.some(k => k.toLowerCase() === term)) scoreA += 10;
      if (b.keywords?.some(k => k.toLowerCase() === term)) scoreB += 10;
      if (a.caption.toLowerCase().includes(term)) scoreA += 5;
      if (b.caption.toLowerCase().includes(term)) scoreB += 5;
      if (a.userId.toString() === cleanId) scoreA += 15;
      if (b.userId.toString() === cleanId) scoreB += 15;

      return scoreB - scoreA;
    });

    // Sort matched users according to sort option
    matchedUsers = [...matchedUsers].sort((a, b) => {
      if (sortBy === 'popularity') {
        return b.followers.length - a.followers.length;
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (a.id.toString() === cleanId) return -1;
      if (b.id.toString() === cleanId) return 1;
      if (a.username.toLowerCase() === term.replace(/^@/, '')) return -1;
      if (b.username.toLowerCase() === term.replace(/^@/, '')) return 1;
      return 0;
    });

    return {
      users: matchedUsers,
      posts: matchedPosts,
      tags: matchedTags,
    };
  }, [searchTerm, users, posts, contentType, sortBy, dateRange, verifiedOnly]);

  const totalResultsCount =
    results.users.length + results.posts.length + results.tags.length;

  return (
    <div className="pb-24 pt-2">
      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="relative mb-2.5">
        <SearchIcon
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          placeholder="Search ID (e.g. 10001), @username, or keywords..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-16 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-xl text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-purple-600 transition-colors"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-md"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`p-1 rounded-md transition-colors ${
              showAdvancedFilters || sortBy !== 'relevance' || dateRange !== 'all' || verifiedOnly
                ? 'text-purple-600 bg-purple-50 dark:bg-purple-950/60'
                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
            }`}
            title="Filter & Sort"
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </form>

      {/* Quick Recent Queries Strip (when search term is active) */}
      {recentSearches.length > 0 && searchTerm.trim() && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none mb-2 text-xs">
          <span className="text-neutral-400 dark:text-neutral-500 flex items-center gap-1 flex-shrink-0 text-[11px] font-semibold tracking-wide pl-0.5">
            <Clock size={11} className="text-purple-600 dark:text-purple-400" />
            <span>Recent:</span>
          </span>
          {recentSearches.map(q => (
            <button
              key={q}
              type="button"
              onClick={() => handleSelectHistoryQuery(q)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium flex-shrink-0 transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                searchTerm.toLowerCase() === q.toLowerCase()
                  ? 'bg-purple-600 text-white shadow-xs font-semibold'
                  : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <span className="truncate max-w-[130px]">{q}</span>
            </button>
          ))}
        </div>
      )}

      {/* Advanced Filter Drawer */}
      {showAdvancedFilters && (
        <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700 mb-3 space-y-2.5 text-xs">
          {/* Sorting Options */}
          <div>
            <label className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1 mb-1.5">
              <ArrowUpDown size={12} className="text-purple-600" />
              <span>Sort By</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {[
                { id: 'relevance', label: 'Relevance' },
                { id: 'newest', label: 'Newest' },
                { id: 'oldest', label: 'Oldest' },
                { id: 'popularity', label: 'Popularity' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as SortOption)}
                  className={`py-1 px-2 rounded-lg text-center font-medium transition-colors ${
                    sortBy === opt.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Filter Options */}
          <div>
            <label className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1 mb-1.5">
              <Calendar size={12} className="text-purple-600" />
              <span>Timeframe</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: 'All Time' },
                { id: '24h', label: '24 Hours' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => setDateRange(d.id as DateFilterOption)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    dateRange === d.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Verification toggle */}
          <div className="flex items-center justify-between pt-1 border-t border-neutral-200/80 dark:border-neutral-700/80">
            <span className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-blue-500" />
              Verified Accounts Only
            </span>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={e => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

      {/* Category Filter Buttons (When Searching) */}
      {searchTerm.trim() ? (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
          <button
            onClick={() => setContentType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1 flex-shrink-0 ${
              contentType === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            <span>All ({totalResultsCount})</span>
          </button>
          <button
            onClick={() => setContentType('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1 flex-shrink-0 ${
              contentType === 'users'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            <UserIcon size={12} />
            <span>People ({results.users.length})</span>
          </button>
          <button
            onClick={() => setContentType('posts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1 flex-shrink-0 ${
              contentType === 'posts'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            <FileText size={12} />
            <span>Posts ({results.posts.length})</span>
          </button>
          <button
            onClick={() => setContentType('media_only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1 flex-shrink-0 ${
              contentType === 'media_only'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            <ImageIcon size={12} />
            <span>Media</span>
          </button>
          <button
            onClick={() => setContentType('tags')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1 flex-shrink-0 ${
              contentType === 'tags'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            <Tag size={12} />
            <span>Tags ({results.tags.length})</span>
          </button>
        </div>
      ) : null}

      {/* When Empty: Show Search History & Discover Info */}
      {!searchTerm.trim() ? (
        <div className="space-y-4">
          {/* Section 0: Local Storage Search History (Last 5 Queries) */}
          {recentSearches.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <History size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <span>Recent Searches</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold">
                        {recentSearches.length}/5
                      </span>
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Tap any previous query to jump back into search
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearAllSearchHistory}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Clear all recent search history"
                >
                  <Trash2 size={12} />
                  <span>Clear All</span>
                </button>
              </div>

              {/* 5 Recent queries chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {recentSearches.map(query => (
                  <div
                    key={query}
                    onClick={() => handleSelectHistoryQuery(query)}
                    className="group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-neutral-100/90 hover:bg-purple-50 dark:bg-neutral-800 dark:hover:bg-neutral-750 border border-neutral-200/80 hover:border-purple-300 dark:border-neutral-700 dark:hover:border-purple-700/60 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:text-purple-700 dark:hover:text-purple-300 cursor-pointer transition-all active:scale-95 shadow-2xs"
                  >
                    <Clock size={12} className="text-neutral-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex-shrink-0" />
                    <span className="max-w-[160px] truncate">{query}</span>
                    <button
                      type="button"
                      onClick={e => removeQueryFromHistory(query, e)}
                      className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors ml-0.5 cursor-pointer"
                      title={`Remove "${query}" from search history`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Quick Discover Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setDiscoverSection('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                discoverSection === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              <span>Explore All</span>
            </button>
            <button
              onClick={() => setDiscoverSection('creators')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                discoverSection === 'creators'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              <Users size={12} />
              <span>Discover Creators ({topCreators.length})</span>
            </button>
            <button
              onClick={() => setDiscoverSection('posts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                discoverSection === 'posts'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              <Sparkles size={12} />
              <span>Discover Posts ({recentSuggestedPosts.length})</span>
            </button>
          </div>

          {/* Section 1: Discover Creators (Top 10 Accounts with Most Followers) */}
          {(discoverSection === 'all' || discoverSection === 'creators') && (
            <div>
              {topCreators.length > 0 ? (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-xs">
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                        <Users size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                          Discover Creators
                        </h3>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Top creators with the most followers
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80">
                      Top 10
                    </span>
                  </div>

                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
                    {topCreators.map((u, index) => {
                      const isFollowing = currentUser?.following.includes(u.id);
                      const isSelf = currentUser?.id === u.id;
                      const followerCount = u.followers?.length || 0;

                      return (
                        <div
                          key={u.id}
                          className="flex items-center justify-between py-2.5 px-1 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 rounded-xl transition-colors"
                        >
                          <div
                            className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                            onClick={() => openUserProfile(u.id)}
                          >
                            {/* Ranking Indicator */}
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                index === 0
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60'
                                  : index === 1
                                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300/60 dark:border-neutral-700/60'
                                  : index === 2
                                  ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-300/60 dark:border-orange-700/60'
                                  : 'text-neutral-400 dark:text-neutral-500 font-mono text-[11px]'
                              }`}
                              title={`Rank #${index + 1}`}
                            >
                              {index < 3 ? `#${index + 1}` : `${index + 1}`}
                            </div>

                            <UserAvatar user={u} size="md" />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                <span className="truncate">{u.name}</span>
                                {u.isVerified && <VerifiedBadge size="sm" user={u} />}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                                <span>@{u.username}</span>
                                <span>•</span>
                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                  {followerCount === 1 ? '1 follower' : `${followerCount.toLocaleString()} followers`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {!isSelf && (
                            <button
                              onClick={() => toggleFollow(u.id)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer flex-shrink-0 ml-2 ${
                                isFollowing
                                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 border border-neutral-200/80 dark:border-neutral-700'
                                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs hover:shadow-md hover:shadow-purple-500/25 border border-purple-500/30'
                              }`}
                            >
                              {isFollowing ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-box empty-state-box bg-white dark:bg-neutral-800/80 rounded-2xl p-6 text-center border border-neutral-200 dark:border-neutral-700 shadow-xs">
                  <Users size={22} className="mx-auto text-neutral-400 dark:text-neutral-300 mb-2" />
                  <p className="text-xs text-neutral-600 dark:text-neutral-200 font-medium">
                    No creators found yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Discover Posts (Suggested Recently Published Posts) */}
          {(discoverSection === 'all' || discoverSection === 'posts') && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                      Discover Posts
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Suggested recently published posts
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center gap-1">
                  <Clock size={10} />
                  Recent
                </span>
              </div>

              {recentSuggestedPosts.length > 0 ? (
                <div className="space-y-3">
                  {recentSuggestedPosts.map(p => (
                    <PostCard key={p.id} post={p} onTagClick={t => handleSelectHistoryQuery(t)} />
                  ))}
                </div>
              ) : (
                <div className="text-box empty-state-box bg-white dark:bg-neutral-800/80 rounded-2xl p-8 text-center border border-neutral-200 dark:border-neutral-700 shadow-xs">
                  <Sparkles size={22} className="mx-auto text-neutral-400 dark:text-neutral-300 mb-2" />
                  <h4 className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white">
                    No suggested posts yet
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-200 mt-1">
                    Recently published posts will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Search Results Content */
        <div className="space-y-3">
          {totalResultsCount === 0 ? (
            <div className="text-box empty-state-box bg-white dark:bg-neutral-700/80 rounded-2xl p-8 text-center border border-neutral-200 dark:border-white/30 shadow-xs">
              <SearchIcon size={24} className="mx-auto text-neutral-400 dark:text-neutral-300 mb-2" />
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
                No results found
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-200 mt-1">
                Try searching for a user ID (e.g. 10001), @username, or post keywords.
              </p>
            </div>
          ) : (
            <>
              {/* Users Results */}
              {(contentType === 'all' || contentType === 'users') && results.users.length > 0 && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3 border border-neutral-200 dark:border-neutral-800">
                  <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-1">
                    Users ({results.users.length})
                  </h4>
                  <div className="space-y-1">
                    {results.users.map(u => (
                      <div
                        key={u.id}
                        onClick={() => openUserProfile(u.id)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar user={u} size="md" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              <span>{u.name}</span>
                              {u.isVerified && <VerifiedBadge size="sm" user={u} />}
                            </div>
                            <p className="text-[11px] text-neutral-400">
                              @{u.username} • ID: #{u.id}
                            </p>
                            {u.bio && (
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-xs mt-0.5">
                                {u.bio}
                              </p>
                            )}
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-neutral-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tag Results */}
              {(contentType === 'all' || contentType === 'tags') && results.tags.length > 0 && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3 border border-neutral-200 dark:border-neutral-800">
                  <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-1">
                    Tags ({results.tags.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {results.tags.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectHistoryQuery(t)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-xs hover:bg-neutral-200 cursor-pointer transition-colors"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Post Results */}
              {(contentType === 'all' || contentType === 'posts' || contentType === 'media_only') &&
                results.posts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
                      Posts ({results.posts.length})
                    </h4>
                    {results.posts.map(p => (
                      <PostCard key={p.id} post={p} onTagClick={t => handleSelectHistoryQuery(t)} />
                    ))}
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
