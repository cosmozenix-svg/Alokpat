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
      batch.set(doc(db, USERS_COL, u.id.toString()), u);
    });

    // Seed posts
    initialPosts.forEach(p => {
      batch.set(doc(db, POSTS_COL, p.id), p);
    });

    // Seed comments
    initialComments.forEach(c => {
      batch.set(doc(db, COMMENTS_COL, c.id), c);
    });

    // Seed notifications
    initialNotifications.forEach(n => {
      batch.set(doc(db, NOTIFICATIONS_COL, n.id), n);
    });

    // Seed reports
    initialReports.forEach(r => {
      batch.set(doc(db, REPORTS_COL, r.id), r);
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
        const users = snapshot.docs.map(d => d.data() as User);
        callbacks.onUsers(users);
      }
    },
    error => {
      handleFirestoreError(error, OperationType.GET, USERS_COL);
    }
  );

  const unsubPosts = onSnapshot(
    collection(db, POSTS_COL),
    snapshot => {
      if (!snapshot.empty) {
        const posts = snapshot.docs.map(d => d.data() as Post);
        callbacks.onPosts(posts);
      }
    },
    error => {
      handleFirestoreError(error, OperationType.GET, POSTS_COL);
    }
  );

  const unsubComments = onSnapshot(
    collection(db, COMMENTS_COL),
    snapshot => {
      if (!snapshot.empty) {
        const comments = snapshot.docs.map(d => d.data() as Comment);
        callbacks.onComments(comments);
      }
    },
    error => {
      handleFirestoreError(error, OperationType.GET, COMMENTS_COL);
    }
  );

  const unsubNotifications = onSnapshot(
    collection(db, NOTIFICATIONS_COL),
    snapshot => {
      if (!snapshot.empty) {
        const notifs = snapshot.docs.map(d => d.data() as AppNotification);
        callbacks.onNotifications(notifs);
      }
    },
    error => {
      handleFirestoreError(error, OperationType.GET, NOTIFICATIONS_COL);
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
      handleFirestoreError(error, OperationType.GET, REPORTS_COL);
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
    await setDoc(doc(db, USERS_COL, user.id.toString()), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncPostToDb(post: Post): Promise<void> {
  const path = `${POSTS_COL}/${post.id}`;
  try {
    await setDoc(doc(db, POSTS_COL, post.id), post);
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
    await setDoc(doc(db, COMMENTS_COL, comment.id), comment);
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
    await setDoc(doc(db, NOTIFICATIONS_COL, notification.id), notification);
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
    await setDoc(doc(db, REPORTS_COL, report.id), report);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
