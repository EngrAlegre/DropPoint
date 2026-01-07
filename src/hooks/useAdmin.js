import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export function useAdmin() {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const adminRef = ref(database, `admins/${currentUser.uid}`);
    
    const unsubscribe = onValue(adminRef, (snapshot) => {
      setIsAdmin(snapshot.exists() && snapshot.val() === true);
      setLoading(false);
    }, (error) => {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setLoading(false);
    });

    return () => {
      off(adminRef);
    };
  }, [currentUser]);

  return { isAdmin, loading };
}

