import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';

export function useStoreItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const itemsRef = ref(database, 'storeItems');
    
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      try {
        const itemsData = snapshot.val();
        if (itemsData) {
          const itemsArray = Object.keys(itemsData).map(key => ({
            id: key,
            ...itemsData[key]
          }));
          setItems(itemsArray);
        } else {
          setItems([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error reading store items:', error);
        setItems([]);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error setting up store items listener:', error);
      setItems([]);
      setLoading(false);
    });

    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('useStoreItems: Loading timeout, setting loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => {
      clearTimeout(timeout);
      try {
        off(itemsRef);
      } catch (error) {
        console.error('Error cleaning up store items listener:', error);
      }
    };
  }, []);

  return { items, loading };
}

