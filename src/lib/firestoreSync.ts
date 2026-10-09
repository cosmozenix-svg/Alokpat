import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { User, Post, Comment, AppNotification, ContentReport } from '../types';

export const USERS_COL = 'users';
export const POSTS_COL = 'posts';
export const COMMENTS_COL = 'comments';
export const NOTIFICATIONS_COL = 'notifications';
export const REPORTS_COL = 'reports';

/**
 * Sanitizes object data for Firestore by removing undefined values and normalizing types.
 */
export function sanitizeForFirestore<T>(data: T): any {
  if (data === null || data === undefined) {
    return null;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned;
  }
  return data;
}

/**
 * Seeds initial demo data to Firestore if the database is currently unpopulated.
 */
export async function seedFirestoreIfNeeded(
  initialUsers: User[],
  initialPosts: Post[],
  initialComments: Comment[],
  initialNotifications: AppNotification[],
  initialReports: ContentReport[]
): Promise<void> {
  try {
    const postsSnap = await getDocs(collection(db, POSTS_COL));
    if (!postsSnap.empty) {
      return; // Database already seeded
    }

    const batch = writeBatch(db);

    // Seed users
    initialUsers.forEach(u => {
      batch.set(doc(db, USERS_COL, u.id.toString()), sanitizeForFirestore(u), { merge: true });
    });

    // Seed posts
    initialPosts.forEach(p => {
      batch.set(doc(db, POSTS_COL, p.id), sanitizeForFirestore(p), { merge: true });
    });

    // Seed comments
    initialComments.forEach(c => {
      batch.set(doc(db, COMMENTS_COL, c.id), sanitizeForFirestore(c), { merge: true });
    });

    // Seed notifications
    initialNotifications.forEach(n => {
      batch.set(doc(db, NOTIFICATIONS_COL, n.id), sanitizeForFirestore(n), { merge: true });
    });

    // Seed reports
    initialReports.forEach(r => {
      batch.set(doc(db, REPORTS_COL, r.id), sanitizeForFirestore(r), { merge: true });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, POSTS_COL);
  }
}

/**
 * Subscribes to real-time updates from all core collections.
 */
export function subscribeToDatabase(callbacks: {
  onUsers: (users: User[]) => void;
  onPosts: (posts: Post[]) => void;
  onComments: (comments: Comment[]) => void;
  onNotifications: (notifications: AppNotification[]) => void;
  onReports: (reports: ContentReport[]) => void;
}) {
  const unsubUsers = onSnapshot(
    collection(db, USERS_COL),
    snapshot => {
      if (!snapshot.empty) {
        const users = snapshot.docs.map(d => {
          const raw = d.data();
          return {
            ...raw,
            id: Number(raw.id || d.id),
          } as User;
        });
        callbacks.onUsers(users);
      }
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.GET, USERS_COL);
      } catch (err) {
        console.warn('Real-time listener notice (users):', err);
      }
    }
  );

  const unsubPosts = onSnapshot(
    collection(db, POSTS_COL),
    snapshot => {
      if (!snapshot.empty) {
        const posts = snapshot.docs.map(d => {
          const raw = d.data();
          return {
            ...raw,
            userId: Number(raw.userId),
          } as Post;
        });
        callbacks.onPosts(posts);
      }
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.GET, POSTS_COL);
      } catch (err) {
        console.warn('Real-time listener notice (posts):', err);
      }
    }
  );

  const unsubComments = onSnapshot(
    collection(db, COMMENTS_COL),
    snapshot => {
      if (!snapshot.empty) {
        const comments = snapshot.docs.map(d => {
          const raw = d.data();
          return {
            ...raw,
            userId: Number(raw.userId),
          } as Comment;
        });
        callbacks.onComments(comments);
      }
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.GET, COMMENTS_COL);
      } catch (err) {
        console.warn('Real-time listener notice (comments):', err);
      }
    }
  );

  const unsubNotifications = onSnapshot(
    collection(db, NOTIFICATIONS_COL),
    snapshot => {
      if (!snapshot.empty) {
        const notifs = snapshot.docs.map(d => {
          const raw = d.data();
          return {
            ...raw,
            userId: Number(raw.userId),
          } as AppNotification;
        });
        callbacks.onNotifications(notifs);
      }
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.GET, NOTIFICATIONS_COL);
      } catch (err) {
        console.warn('Real-time listener notice (notifications):', err);
      }
    }
  );

  const unsubReports = onSnapshot(
    collection(db, REPORTS_COL),
    snapshot => {
      if (!snapshot.empty) {
        const reps = snapshot.docs.map(d => d.data() as ContentReport);
        callbacks.onReports(reps);
      }
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.GET, REPORTS_COL);
      } catch (err) {
        console.warn('Real-time listener notice (reports):', err);
      }
    }
  );

  return () => {
    unsubUsers();
    unsubPosts();
    unsubComments();
    unsubNotifications();
    unsubReports();
  };
}

/**
 * Direct Write Operations with proper handleFirestoreError handling
 */
export async function syncUserToDb(user: User): Promise<void> {
  const path = `${USERS_COL}/${user.id}`;
  try {
    const cleaned = sanitizeForFirestore(user);
    await setDoc(doc(db, USERS_COL, user.id.toString()), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserFromDb(userId: number | string): Promise<void> {
  const path = `${USERS_COL}/${userId}`;
  try {
    await deleteDoc(doc(db, USERS_COL, userId.toString()));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncPostToDb(post: Post): Promise<void> {
  const path = `${POSTS_COL}/${post.id}`;
  try {
    const cleaned = sanitizeForFirestore(post);
    await setDoc(doc(db, POSTS_COL, post.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePostFromDb(postId: string): Promise<void> {
  const path = `${POSTS_COL}/${postId}`;
  try {
    await deleteDoc(doc(db, POSTS_COL, postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncCommentToDb(comment: Comment): Promise<void> {
  const path = `${COMMENTS_COL}/${comment.id}`;
  try {
    const cleaned = sanitizeForFirestore(comment);
    await setDoc(doc(db, COMMENTS_COL, comment.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCommentFromDb(commentId: string): Promise<void> {
  const path = `${COMMENTS_COL}/${commentId}`;
  try {
    await deleteDoc(doc(db, COMMENTS_COL, commentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncNotificationToDb(notification: AppNotification): Promise<void> {
  const path = `${NOTIFICATIONS_COL}/${notification.id}`;
  try {
    const cleaned = sanitizeForFirestore(notification);
    await setDoc(doc(db, NOTIFICATIONS_COL, notification.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteNotificationFromDb(notificationId: string): Promise<void> {
  const path = `${NOTIFICATIONS_COL}/${notificationId}`;
  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COL, notificationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncReportToDb(report: ContentReport): Promise<void> {
  const path = `${REPORTS_COL}/${report.id}`;
  try {
    const cleaned = sanitizeForFirestore(report);
    await setDoc(doc(db, REPORTS_COL, report.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteReportFromDb(reportId: string): Promise<void> {
  const path = `${REPORTS_COL}/${reportId}`;
  try {
    await deleteDoc(doc(db, REPORTS_COL, reportId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
