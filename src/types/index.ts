export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type BadgeVariant = 'blue' | 'gold' | 'purple' | 'green' | 'ruby';
export type BadgeShape = 'starburst' | 'shield' | 'circle' | 'gem';

export type ReactionType = 'heart' | 'fire' | 'laugh' | 'clap' | 'wow' | 'sad';

export interface User {
  id: number; // e.g. 10001, 10002
  name: string;
  username: string; // unique
  email: string;
  phone: string;
  password: string;
  avatar: string;
  cover: string;
  bio: string;
  isVerified: boolean;
  verificationStatus: VerificationStatus; // 'unverified' | 'pending' | 'verified' | 'rejected'
  verifiedAt?: string;
  badgeVariant?: BadgeVariant;
  badgeShape?: BadgeShape;
  customBadgeLabel?: string;
  isBanned: boolean;
  banReason?: string;
  warningCount: number;
  warnings: UserWarning[];
  isPrivate: boolean;
  pinnedPostIds: string[];
  savedPostIds?: string[]; // bookmarked post IDs
  lastUsernameChangeDate?: string; // ISO string for 30-day cooldown
  createdAt: string;
  followers: number[]; // user IDs
  following: number[]; // user IDs
  website?: string;
  location?: string;
}

export interface UserWarning {
  id: string;
  date: string;
  message: string;
  issuedBy: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface Post {
  id: string;
  userId: number;
  caption: string;
  images: string[];
  keywords: string[]; // YouTube-style tags e.g. ['nature images', 'natural scene', 'nature']
  hideComments: boolean;
  isAIPost: boolean;
  likes: number[]; // user IDs who liked with heart (kept for compatibility)
  reactions?: { [key in ReactionType]?: number[] }; // mapped array of user IDs per reaction
  commentsCount: number;
  createdAt: string; // ISO string
  isPinned?: boolean;
  location?: string;
  viewsCount?: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: number;
  text: string;
  createdAt: string;
  likes: number[];
  parentId?: string;
}

export type ReportContentType = 'post' | 'comment' | 'user';
export type ReportReason =
  | 'Spam or Scam'
  | 'Harassment or Hate Speech'
  | 'Inappropriate Content'
  | 'Misinformation'
  | 'Copyright Violation'
  | 'Other';

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ContentReport {
  id: string;
  contentType: ReportContentType;
  contentId: string; // postId or commentId or userId
  reportedUserId: number; // author of the offending content
  reporterId: number; // who submitted the report
  reason: ReportReason;
  details?: string;
  createdAt: string;
  status: ReportStatus;
  resolutionNote?: string;
  resolvedAt?: string;
}

export type NotificationType =
  | 'like'
  | 'reaction'
  | 'comment'
  | 'follow'
  | 'admin_notice'
  | 'admin_warning'
  | 'broadcast';

export interface AppNotification {
  id: string;
  userId: number | 'all';
  type: NotificationType;
  actorId?: number;
  postId?: string;
  reactionType?: ReactionType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  urgency?: 'normal' | 'info' | 'warning' | 'alert';
}

export type TabType = 'home' | 'search' | 'add' | 'profile' | 'settings' | 'notifications';
