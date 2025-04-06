'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface NotificationContextType {
  unreadCount: number;
  refreshNotifications: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshNotifications: () => {},
  clearNotifications: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationKey, setNotificationKey] = useState(0);

  // Function to force a refresh of notifications
  const refreshNotifications = () => {
    setNotificationKey(prev => prev + 1);
  };

  // Function to clear all notifications (set count to 0)
  const clearNotifications = () => {
    setUnreadCount(0);
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Query for incoming user-to-group requests (for group leaders)
    const incomingGroupRequests = query(
      collection(db, 'requests'),
      where('GroupLeaderId', '==', user.uid),
      where('status', '==', 'pending'),
      where('fromGroup', '==', false),
      where('hasSeen', '!=', true)
    );

    // Query for incoming group-to-user requests
    const incomingUserRequests = query(
      collection(db, 'requests'),
      where('userid', '==', user.uid),
      where('status', '==', 'pending'),
      where('fromGroup', '==', true),
      where('hasSeen', '!=', true)
    );

    const unsubscribeGroupRequests = onSnapshot(incomingGroupRequests, (snapshot) => {
      const count = snapshot.docs.length;
      setUnreadCount(prevCount => {
        // Only count the user-to-group requests here
        const otherRequests = prevCount - (prevCount % 100); // Assuming we store counts as groupRequests + userRequests*100
        return otherRequests + count;
      });
    });

    const unsubscribeUserRequests = onSnapshot(incomingUserRequests, (snapshot) => {
      const count = snapshot.docs.length;
      setUnreadCount(prevCount => {
        // Store user requests in the hundreds place for separation
        const groupRequests = prevCount % 100; // Get just the group requests part
        return groupRequests + (count * 100);
      });
    });

    return () => {
      unsubscribeGroupRequests();
      unsubscribeUserRequests();
    };
  }, [user, notificationKey]); // Add notificationKey dependency to force re-fetch

  // Calculate total unread count from both sources
  const totalUnread = Math.floor(unreadCount / 100) + (unreadCount % 100);

  return (
    <NotificationContext.Provider 
      value={{ 
        unreadCount: totalUnread, 
        refreshNotifications, 
        clearNotifications 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};