import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';

export function useAllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      try {
        const usersData = snapshot.val();
        if (usersData) {
          const usersArray = Object.keys(usersData).map(uid => ({
            uid,
            ...usersData[uid]
          }));
          setUsers(usersArray);
        } else {
          setUsers([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error reading users:', error);
        setUsers([]);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error setting up users listener:', error);
      setUsers([]);
      setLoading(false);
    });

    return () => {
      off(usersRef);
    };
  }, []);

  return { users, loading };
}

