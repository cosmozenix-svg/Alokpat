import React from 'react';
import { User } from '../types';
import { VerifiedBadge } from './VerifiedBadge';

interface UserAvatarProps {
  user?: User | null;
  src?: string;
  name?: string;
  isVerified?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showVerifiedCorner?: boolean;
  className?: string;
  onClick?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  src,
  name,
  isVerified,
  size = 'md',
  showVerifiedCorner = true,
  className = '',
  onClick,
}) => {
  const avatarSrc = src || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  const userName = name || user?.name || 'User';
  const verified = isVerified !== undefined ? isVerified : (!!user?.isVerified || user?.verificationStatus === 'verified');

  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-24 h-24',
  };

  const cornerBadgeSizes = {
    xs: 'xs' as const,
    sm: 'xs' as const,
    md: 'sm' as const,
    lg: 'sm' as const,
    xl: 'md' as const,
    '2xl': 'lg' as const,
  };

  const cornerBadgeOffsets = {
    xs: '-bottom-0.5 -right-0.5',
    sm: '-bottom-0.5 -right-0.5',
    md: '-bottom-0.5 -right-0.5',
    lg: 'bottom-0 right-0',
    xl: 'bottom-0.5 right-0.5',
    '2xl': 'bottom-1 right-1',
  };

  // Resolve ring styling based on badge tier
  const badgeVariant =
    user?.badgeVariant ||
    (user?.username === 'admin' || user?.email === 'cosmozenix@gmail.com' ? 'gold' : 'blue');

  const ringStyles: Record<string, string> = {
    gold: 'p-[2px] bg-gradient-to-tr from-amber-500 to-yellow-400 ring-2 ring-amber-500/30',
    purple: 'p-[2px] bg-gradient-to-tr from-purple-600 to-indigo-500 ring-2 ring-purple-500/30',
    green: 'p-[2px] bg-gradient-to-tr from-emerald-500 to-teal-400 ring-2 ring-emerald-500/30',
    ruby: 'p-[2px] bg-gradient-to-tr from-rose-500 to-red-500 ring-2 ring-rose-500/30',
    blue: 'p-[2px] bg-gradient-to-tr from-sky-500 to-blue-600 ring-2 ring-blue-500/30',
  };

  const verifiedRingClass = ringStyles[badgeVariant] || ringStyles.blue;

  return (
    <div
      onClick={onClick}
      className={`relative inline-block flex-shrink-0 ${onClick ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : ''} ${className}`}
    >
      <div
        className={`rounded-full transition-colors ${
          verified
            ? verifiedRingClass
            : 'p-[1px] bg-neutral-200 dark:bg-neutral-800'
        }`}
      >
        <img
          src={avatarSrc}
          alt={userName}
          className={`${sizeClasses[size]} rounded-full object-cover bg-neutral-100 dark:bg-neutral-900`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.dataset.fallback) {
              target.dataset.fallback = 'true';
              target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}`;
            }
          }}
        />
      </div>

      {verified && showVerifiedCorner && (
        <div className={`absolute ${cornerBadgeOffsets[size]} z-10 pointer-events-none`}>
          <div className="bg-white dark:bg-neutral-950 rounded-full p-[1px] shadow-xs">
            <VerifiedBadge size={cornerBadgeSizes[size]} user={user} interactive={false} />
          </div>
        </div>
      )}
    </div>
  );
};
