import React, { useState, useId, useRef, useEffect } from 'react';
import {
  Check,
  X,
  Shield,
  ShieldCheck,
  UserCheck,
  Calendar,
  ExternalLink,
  Copy,
  Share2,
  Sparkles,
  Award,
  Fingerprint,
  CheckCircle2,
} from 'lucide-react';
import { VerificationStatus, User, BadgeVariant, BadgeShape } from '../types';
import { formatExactDateTime } from '../utils/formatters';

export interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: VerificationStatus | boolean;
  variant?: BadgeVariant;
  shape?: BadgeShape;
  showPill?: boolean;
  pillText?: string;
  className?: string;
  tooltipText?: string;
  user?: User | null;
  interactive?: boolean;
  showHoverCard?: boolean;
  shimmer?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const BADGE_CONFIGS: Record<
  BadgeVariant,
  {
    start: string;
    end: string;
    accent: string;
    ring: string;
    glow: string;
    text: string;
    bg: string;
    border: string;
    label: string;
    badgeTitle: string;
    desc: string;
    gradientClass: string;
  }
> = {
  blue: {
    start: '#0284c7',
    end: '#2563eb',
    accent: '#60a5fa',
    ring: 'ring-blue-500/30',
    glow: 'shadow-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    border: 'border-blue-200 dark:border-blue-800/60',
    label: 'Verified Member',
    badgeTitle: 'Verified Account',
    desc: 'Identity officially authenticated by Alokpat Administration with registered sequential ID.',
    gradientClass: 'from-sky-500 to-blue-600',
  },
  gold: {
    start: '#f59e0b',
    end: '#b45309',
    accent: '#fde047',
    ring: 'ring-amber-500/30',
    glow: 'shadow-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-200 dark:border-amber-800/60',
    label: 'Official Staff / Org',
    badgeTitle: 'Official Staff & Organization',
    desc: 'Official platform staff, moderator, or recognized verified partner organization.',
    gradientClass: 'from-amber-400 to-yellow-600',
  },
  purple: {
    start: '#9333ea',
    end: '#6366f1',
    accent: '#c084fc',
    ring: 'ring-purple-500/30',
    glow: 'shadow-purple-500/30',
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    border: 'border-purple-200 dark:border-purple-800/60',
    label: 'VIP Founding Creator',
    badgeTitle: 'VIP Founding Creator',
    desc: 'Founding creator with distinctive contributions to the Alokpat ecosystem.',
    gradientClass: 'from-purple-500 to-indigo-600',
  },
  green: {
    start: '#10b981',
    end: '#059669',
    accent: '#6ee7b7',
    ring: 'ring-emerald-500/30',
    glow: 'shadow-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    label: 'Certified Real Identity',
    badgeTitle: 'Certified Real Human Identity',
    desc: 'Verified genuine human identity with zero standing policy infractions.',
    gradientClass: 'from-emerald-400 to-teal-600',
  },
  ruby: {
    start: '#f43f5e',
    end: '#be123c',
    accent: '#fda4af',
    ring: 'ring-rose-500/30',
    glow: 'shadow-rose-500/30',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    border: 'border-rose-200 dark:border-rose-800/60',
    label: 'Featured Partner',
    badgeTitle: 'Featured Top Creator',
    desc: 'Featured elite creator honored for outstanding community engagement.',
    gradientClass: 'from-rose-500 to-red-600',
  },
};

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'md',
  status = 'verified',
  variant,
  shape,
  showPill = false,
  pillText,
  className = '',
  tooltipText,
  user,
  interactive = true,
  showHoverCard = true,
  shimmer = true,
  onClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCertId, setCopiedCertId] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const badgeContainerRef = useRef<HTMLSpanElement | null>(null);

  const rawId = useId();
  const gradientId = `badge-grad-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Check if status is explicitly verified
  const isVerified = user
    ? (user.isVerified || user.verificationStatus === 'verified')
    : (status === true || status === 'verified');
  if (!isVerified) return null;

  // Resolve variant: prop variant (if specified) -> user.badgeVariant -> admin check -> default 'blue'
  const resolvedVariant: BadgeVariant =
    variant ||
    user?.badgeVariant ||
    (user?.username === 'admin' || user?.email === 'cosmozenix@gmail.com' ? 'gold' : 'blue');

  // Resolve shape: prop shape (if specified) -> user.badgeShape -> default 'starburst'
  const resolvedShape: BadgeShape = shape || user?.badgeShape || 'starburst';

  const config = BADGE_CONFIGS[resolvedVariant] || BADGE_CONFIGS.blue;

  const sizeDimensions = {
    xs: { class: 'w-3 h-3', sizePx: 12 },
    sm: { class: 'w-3.5 h-3.5', sizePx: 14 },
    md: { class: 'w-4 h-4', sizePx: 16 },
    lg: { class: 'w-4.5 h-4.5', sizePx: 18 },
    xl: { class: 'w-5 h-5', sizePx: 20 },
    '2xl': { class: 'w-7 h-7', sizePx: 28 },
  };

  const currentSize = sizeDimensions[size];
  const certId = `ALOK-AUTH-${(user?.id || 10001).toString().padStart(5, '0')}-${resolvedVariant.toUpperCase()}`;

  const handleMouseEnter = () => {
    if (!showHoverCard || !interactive) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 280);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsHovered(false);
    if (onClick) {
      onClick(e);
    }
    if (interactive) {
      setIsModalOpen(true);
    }
  };

  const copyCertToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(certId);
    setCopiedCertId(true);
    setTimeout(() => setCopiedCertId(false), 2200);
  };

  const copyLinkToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#verify-${user?.id || 10001}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const shareCertificate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: `${user?.name || 'User'} Verified on Alokpat`,
      text: `Official verification credentials for @${user?.username || 'user'} on Alokpat. Tier: ${config.badgeTitle}.`,
      url: `${window.location.origin}/#verify-${user?.id || 10001}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        copyLinkToClipboard(e);
      }
    } else {
      copyLinkToClipboard(e);
    }
  };

  // Render SVG badge based on shape
  const renderBadgeSvg = (pxSize: number, customClass: string = '') => {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${customClass} select-none transition-transform duration-200 relative`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={config.start} />
            <stop offset="100%" stopColor={config.end} />
          </linearGradient>
          <filter id={`filter-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.3" />
          </filter>
        </defs>

        {resolvedShape === 'shield' ? (
          // Knightly / Safety Shield Shape
          <path
            d="M12 2L4 5v6.5c0 5.25 3.4 10.15 8 11.5 4.6-1.35 8-6.25 8-11.5V5l-8-3z"
            fill={`url(#${gradientId})`}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.6"
          />
        ) : resolvedShape === 'circle' ? (
          // Clean Concentric Circle Shape
          <circle
            cx="12"
            cy="12"
            r="10"
            fill={`url(#${gradientId})`}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.6"
          />
        ) : resolvedShape === 'gem' ? (
          // 8-Point Faceted Diamond / Gem Shape
          <path
            d="M12 2l3 3.5 4.5.5-1 4.5 3 3.5-3 3.5 1 4.5-4.5.5L12 22l-3-3.5-4.5-.5 1-4.5-3-3.5 3-3.5-1-4.5 4.5-.5L12 2z"
            fill={`url(#${gradientId})`}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.6"
          />
        ) : (
          // Precision 12-Lobed Scalloped Starburst Rosette (Classic Official Emblem)
          <path
            d="M12 1.5l1.63 2.13 2.68-.35.85 2.55 2.58.82-.03 2.7 2.14 1.62-1 2.5 1.34 2.34-1.87 1.93.36 2.67-2.55.85-.82 2.58-2.7-.03-1.62 2.14-2.5-1-2.34 1.34-1.93-1.87-2.67.36-.85-2.55-2.58-.82.03-2.7L1.6 14.5l1-2.5L1.26 9.66l1.87-1.93-.36-2.67 2.55-.85.82-2.58 2.7.03 1.62-2.14 2.5 1L12 1.5z"
            fill={`url(#${gradientId})`}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.5"
          />
        )}

        {/* Optical Center Specular Highlight */}
        <circle cx="12" cy="12" r="7.5" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />

        {/* Optical Pure White Verification Checkmark */}
        <path
          d="M9.4 16.2l-3.8-3.8 1.4-1.4 2.4 2.4 6.2-6.2 1.4 1.4-7.6 7.6z"
          fill="#ffffff"
        />
      </svg>
    );
  };

  const defaultTooltip =
    tooltipText || `${user?.customBadgeLabel || config.label} • Click to inspect verification credentials`;

  return (
    <>
      <span
        ref={badgeContainerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative inline-flex items-center"
      >
        {showPill ? (
          <span
            onClick={handleClick}
            title={defaultTooltip}
            role="button"
            tabIndex={0}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${config.bg} ${config.border} border ${config.text} text-[11px] font-semibold select-none shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer active:scale-95 group overflow-hidden ${className}`}
          >
            <span
              className={`${currentSize.class} flex-shrink-0 group-hover:scale-110 transition-transform`}
            >
              {renderBadgeSvg(currentSize.sizePx, 'w-full h-full')}
            </span>
            <span className="leading-none truncate max-w-[150px]">
              {user?.customBadgeLabel || pillText || config.label}
            </span>
            {shimmer && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-badge-shimmer pointer-events-none" />
            )}
          </span>
        ) : (
          <span
            onClick={handleClick}
            title={defaultTooltip}
            role="button"
            tabIndex={0}
            className={`inline-flex items-center justify-center flex-shrink-0 align-middle select-none transition-all duration-150 cursor-pointer hover:scale-120 active:scale-90 ${currentSize.class} ${className}`}
          >
            {renderBadgeSvg(currentSize.sizePx, 'w-full h-full drop-shadow-xs')}
          </span>
        )}

        {/* Rich Desktop Hover Card Popover */}
        {isHovered && interactive && showHoverCard && (
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 bg-white dark:bg-neutral-900 rounded-2xl p-3.5 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-left pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
              setIsHovered(true);
            }}
            onMouseLeave={handleMouseLeave}
          >
            {/* Popover Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2.5 h-2.5 bg-white dark:bg-neutral-900 border-r border-b border-neutral-200 dark:border-neutral-800 rotate-45" />

            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex-shrink-0">
                  {renderBadgeSvg(24, 'w-6 h-6')}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-white leading-tight">
                    {user?.customBadgeLabel || config.badgeTitle}
                  </h4>
                  <span className={`inline-block text-[10px] font-semibold ${config.text}`}>
                    {config.label}
                  </span>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                #{user?.id || 10001}
              </span>
            </div>

            <p className="mt-2 text-[11px] text-neutral-600 dark:text-neutral-300 leading-snug">
              {config.desc}
            </p>

            <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[10px]">
              <span className="text-neutral-400 flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-500" />
                <span>ID Protected</span>
              </span>
              <button
                onClick={handleClick}
                className="text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Inspect Certificate</span>
                <ExternalLink size={10} />
              </button>
            </div>
          </div>
        )}
      </span>

      {/* Official Verification Certificate Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150 text-left"
          onClick={e => {
            e.stopPropagation();
            setIsModalOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Ornamental Header Banner */}
            <div className={`relative px-6 pt-6 pb-5 bg-gradient-to-r ${config.gradientClass} text-white overflow-hidden`}>
              {/* Background watermark icon */}
              <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-15 pointer-events-none">
                {renderBadgeSvg(128, 'w-full h-full text-white')}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3">
                <div className="relative p-2 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-inner">
                  <div className="w-10 h-10 flex items-center justify-center">
                    {renderBadgeSvg(40, 'w-10 h-10 drop-shadow-md')}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/90 uppercase tracking-wider">
                    <Award size={13} />
                    <span>Official Authenticity Certificate</span>
                  </div>
                  <h3 className="font-extrabold text-lg text-white leading-tight">
                    {user?.customBadgeLabel || config.badgeTitle}
                  </h3>
                  <p className="text-xs text-white/80 mt-0.5">
                    Alokpat Identity Trust Registry
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* User Profile Spotlight Card */}
              {user ? (
                <div className="p-3.5 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/40"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5">
                      {renderBadgeSvg(20, 'w-full h-full')}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-neutral-900 dark:text-white truncate">
                      <span>{user.name}</span>
                      <span className="w-4 h-4 flex-shrink-0">
                        {renderBadgeSvg(16, 'w-4 h-4')}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 truncate">
                      @{user.username} • Account ID: #{user.id}
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1">
                      <Calendar size={11} />
                      <span>
                        {user.verifiedAt
                          ? `Authenticated on ${formatExactDateTime(user.verifiedAt)}`
                          : 'Officially Authenticated Member'}
                      </span>
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Certificate Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Badge Tier</span>
                  <span className={`font-bold mt-0.5 inline-flex items-center gap-1 ${config.text}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>{config.label}</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Security Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 inline-flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>Active & Protected</span>
                  </span>
                </div>

                <div className="col-span-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Registry Certificate ID</span>
                    <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300 text-[11px] truncate block">
                      {certId}
                    </span>
                  </div>
                  <button
                    onClick={copyCertToClipboard}
                    className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-300 transition-colors cursor-pointer flex-shrink-0"
                    title="Copy Certificate ID"
                  >
                    {copiedCertId ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* Verification Criteria & Proofs */}
              <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50/80 dark:bg-neutral-850/80 p-3.5 rounded-2xl border border-neutral-200/60 dark:border-neutral-800">
                <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white text-xs">
                  <Fingerprint size={14} className="text-purple-600" />
                  <span>Authentication Criteria Met</span>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {config.desc}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-neutral-200/60 dark:border-neutral-750 text-[11px]">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck size={13} className="flex-shrink-0" />
                    <span>Unique Sequential ID Registered & Locked</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                    <UserCheck size={13} className="flex-shrink-0" />
                    <span>Username Reserved Against Impersonation & Clones</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Sparkles size={13} className="flex-shrink-0" />
                    <span>Account in Good Standing with Zero Policy Infractions</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={shareCertificate}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-neutral-200 dark:border-neutral-700"
                >
                  <Share2 size={13} />
                  <span>{copiedLink ? 'Link Copied!' : 'Share Proof'}</span>
                </button>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer text-center"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
