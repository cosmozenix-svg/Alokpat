import React from 'react';

/**
 * Formats an ISO date string, Date object, or timestamp into exact date and time
 * Example: "Oct 6, 2026 at 6:18 PM"
 */
export function formatExactDateTime(isoOrDate: any): string {
  try {
    if (!isoOrDate) return 'Just now';
    let date: Date;
    if (isoOrDate instanceof Date) {
      date = isoOrDate;
    } else if (typeof isoOrDate === 'number') {
      date = new Date(isoOrDate > 1e11 ? isoOrDate : isoOrDate * 1000);
    } else if (typeof isoOrDate === 'object') {
      if (typeof isoOrDate.toDate === 'function') {
        date = isoOrDate.toDate();
      } else if (typeof isoOrDate.toMillis === 'function') {
        date = new Date(isoOrDate.toMillis());
      } else if (typeof isoOrDate.seconds === 'number') {
        date = new Date(isoOrDate.seconds * 1000);
      } else if (typeof isoOrDate._seconds === 'number') {
        date = new Date(isoOrDate._seconds * 1000);
      } else {
        date = new Date();
      }
    } else {
      date = new Date(String(isoOrDate));
    }

    if (isNaN(date.getTime())) return String(isoOrDate);

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (e) {
    return String(isoOrDate || 'Just now');
  }
}

/**
 * Formats an ISO date string, Date object, or timestamp into relative time
 * Example: "Just now", "2m ago", "3h ago", "2d ago"
 */
export function formatRelativeTime(isoOrDate: any): string {
  try {
    if (!isoOrDate) return 'Just now';
    let timestamp = 0;
    if (isoOrDate instanceof Date) {
      timestamp = isoOrDate.getTime();
    } else if (typeof isoOrDate === 'number') {
      timestamp = isoOrDate > 1e11 ? isoOrDate : isoOrDate * 1000;
    } else if (typeof isoOrDate === 'object') {
      if (typeof isoOrDate.toDate === 'function') {
        timestamp = isoOrDate.toDate().getTime();
      } else if (typeof isoOrDate.toMillis === 'function') {
        timestamp = isoOrDate.toMillis();
      } else if (typeof isoOrDate.seconds === 'number') {
        timestamp = isoOrDate.seconds * 1000;
      } else if (typeof isoOrDate._seconds === 'number') {
        timestamp = isoOrDate._seconds * 1000;
      }
    } else {
      const parsed = Date.parse(String(isoOrDate));
      if (!isNaN(parsed)) {
        timestamp = parsed;
      } else {
        const d = new Date(String(isoOrDate));
        if (!isNaN(d.getTime())) timestamp = d.getTime();
      }
    }

    if (!timestamp || isNaN(timestamp)) return 'Just now';

    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 45) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return formatExactDateTime(timestamp);
  } catch (e) {
    return 'Just now';
  }
}

/**
 * Parses caption text and renders auto-detected hyperlinks as clickable links
 */
export function renderRichText(text: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-purple-600 dark:text-purple-400 hover:underline font-semibold break-all inline-flex items-center gap-0.5"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

/**
 * Safely extracts a reliable numeric timestamp in milliseconds from a notification.
 * Handles ISO strings, millisecond numbers, Date objects, Firestore timestamps, and ID timestamp fallbacks.
 */
export function getNotificationTimestamp(item: { createdAt?: any; id?: string } | null | undefined): number {
  if (!item) return 0;

  // 1. Check createdAt field
  const d = item.createdAt;
  if (d !== undefined && d !== null) {
    if (d instanceof Date) {
      const ms = d.getTime();
      if (!isNaN(ms) && ms > 0) return ms;
    }
    if (typeof d === 'number') {
      return d > 1e11 ? d : d * 1000;
    }
    if (typeof d === 'string') {
      const parsed = Date.parse(d);
      if (!isNaN(parsed) && parsed > 0) return parsed;

      const objDate = new Date(d);
      if (!isNaN(objDate.getTime()) && objDate.getTime() > 0) return objDate.getTime();
    }
    if (typeof d === 'object') {
      if (typeof d.toDate === 'function') {
        const dt = d.toDate();
        if (dt instanceof Date && !isNaN(dt.getTime())) return dt.getTime();
      }
      if (typeof d.toMillis === 'function') return d.toMillis();
      if (typeof d.getTime === 'function') return d.getTime();
      if (typeof d.seconds === 'number') {
        return d.seconds * 1000 + (d.nanoseconds ? Math.floor(d.nanoseconds / 1e6) : 0);
      }
      if (typeof d._seconds === 'number') {
        return d._seconds * 1000 + (d._nanoseconds ? Math.floor(d._nanoseconds / 1e6) : 0);
      }
    }
  }

  // 2. Fallback: extract unix timestamp from ID if present (e.g. notif-reaction-1728770000000 or notif-1728770000000)
  if (item.id && typeof item.id === 'string') {
    const match = item.id.match(/\d{10,14}/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > 1e9) {
        return num < 1e11 ? num * 1000 : num;
      }
    }

    // Secondary fallback: extract any number sequence from ID
    const anyNums = item.id.match(/\d+/g);
    if (anyNums && anyNums.length > 0) {
      const lastNum = parseInt(anyNums[anyNums.length - 1], 10);
      if (!isNaN(lastNum) && lastNum > 0) {
        return lastNum;
      }
    }
  }

  return 0;
}

/**
 * Strict comparator: The notification which came at the last stands at the very top,
 * and older notifications are placed below.
 */
export function compareNotificationsLatestFirst<T extends { createdAt?: any; id?: string }>(a: T, b: T): number {
  const timeA = getNotificationTimestamp(a);
  const timeB = getNotificationTimestamp(b);

  if (timeB !== timeA) {
    // Descending order: highest timestamp (the latest notification that came last) stands at the very top!
    return timeB - timeA;
  }

  // Tie-breaker when timestamps are equal: extract numeric sequence from ID
  const extractIdNum = (id?: string): number => {
    if (!id || typeof id !== 'string') return 0;
    const match = id.match(/\d+/g);
    if (match && match.length > 0) {
      const lastNum = match[match.length - 1];
      const parsed = parseInt(lastNum, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  };

  const idNumA = extractIdNum(a.id);
  const idNumB = extractIdNum(b.id);
  if (idNumB !== idNumA) {
    return idNumB - idNumA; // Higher numeric sequence came last, so it stands at top
  }

  return 0;
}

/**
 * Returns a sorted clone of notifications, ensuring newest (the notification which came at the last)
 * is always at the very top.
 */
export function sortNotificationsLatestFirst<T extends { createdAt?: any; id?: string }>(list: T[]): T[] {
  if (!Array.isArray(list)) return [];
  return [...list].sort(compareNotificationsLatestFirst);
}

