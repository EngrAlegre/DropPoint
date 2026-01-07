import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';

export function useAllRedemptions() {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redemptionsRef = ref(database, 'redemptions');
    
    const unsubscribe = onValue(redemptionsRef, (snapshot) => {
      try {
        const redemptionsData = snapshot.val();
        if (redemptionsData) {
          const allRedemptions = [];
          Object.keys(redemptionsData).forEach(userId => {
            const userRedemptions = redemptionsData[userId];
            if (userRedemptions) {
              Object.keys(userRedemptions).forEach(redemptionId => {
                allRedemptions.push({
                  id: redemptionId,
                  userId,
                  ...userRedemptions[redemptionId]
                });
              });
            }
          });
          // Sort by timestamp (newest first)
          allRedemptions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setRedemptions(allRedemptions);
        } else {
          setRedemptions([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error reading redemptions:', error);
        setRedemptions([]);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error setting up redemptions listener:', error);
      setRedemptions([]);
      setLoading(false);
    });

    return () => {
      off(redemptionsRef);
    };
  }, []);

  return { redemptions, loading };
}

