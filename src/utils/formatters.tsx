import React from 'react';

/**
 * Formats an ISO date string into exact date and time
 * Example: "Oct 6, 2026 at 6:18 PM"
 */
export function formatExactDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (e) {
    return isoString;
  }
}

/**
 * Formats an ISO date string into relative time
 * Example: "Just now", "2m ago", "3h ago", "2d ago"
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return formatExactDateTime(isoString);
  } catch (e) {
    return isoString;
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
