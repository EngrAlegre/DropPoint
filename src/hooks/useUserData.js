import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export function useUserData() {
  const { currentUser } = useAuth();
  const [points, setPoints] = useState(0);
  const [earnedToday, setEarnedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pointsLoaded, setPointsLoaded] = useState(false);
  const [disposalsLoaded, setDisposalsLoaded] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setPoints(0);
      setEarnedToday(0);
      setLoading(false);
      setPointsLoaded(false);
      setDisposalsLoaded(false);
      return;
    }

    try {
      const userId = currentUser.uid;
      
      // Reset loading states
      setPointsLoaded(false);
      setDisposalsLoaded(false);
      setLoading(true);
      
      // Fetch user points
      const pointsRef = ref(database, `users/${userId}/points`);
      const unsubscribePoints = onValue(pointsRef, (snapshot) => {
        try {
          const userPoints = snapshot.val() || 0;
          setPoints(userPoints);
          setPointsLoaded(true);
        } catch (error) {
          console.error('Error reading points:', error);
          setPoints(0);
          setPointsLoaded(true);
        }
      }, (error) => {
        console.error('Error setting up points listener:', error);
        setPoints(0);
        setPointsLoaded(true);
      });

      // Calculate points earned today from disposals
      const disposalsRef = ref(database, `disposals/${userId}`);
      const unsubscribeDisposals = onValue(disposalsRef, (snapshot) => {
        try {
          const disposals = snapshot.val();
          if (!disposals) {
            setEarnedToday(0);
            setDisposalsLoaded(true);
            return;
          }

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayTimestamp = today.getTime();

          let todayPoints = 0;
          Object.values(disposals).forEach(disposal => {
            if (disposal && disposal.timestamp >= todayTimestamp) {
              todayPoints += (disposal.points || 0);
            }
          });

          setEarnedToday(todayPoints);
          setDisposalsLoaded(true);
        } catch (error) {
          console.error('Error calculating earned today:', error);
          setEarnedToday(0);
          setDisposalsLoaded(true);
        }
      }, (error) => {
        console.error('Error setting up disposals listener:', error);
        setEarnedToday(0);
        setDisposalsLoaded(true);
      });

      return () => {
        try {
          off(pointsRef);
          off(disposalsRef);
        } catch (error) {
          console.error('Error cleaning up listeners:', error);
        }
      };
    } catch (error) {
      console.error('Error in useUserData:', error);
      setPoints(0);
      setEarnedToday(0);
      setLoading(false);
      setPointsLoaded(false);
      setDisposalsLoaded(false);
    }
  }, [currentUser]);

  // Set loading to false when both listeners have fired
  useEffect(() => {
    if (pointsLoaded && disposalsLoaded) {
      setLoading(false);
    }
  }, [pointsLoaded, disposalsLoaded]);

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    if (currentUser && loading) {
      const timeout = setTimeout(() => {
        console.warn('useUserData: Loading timeout, setting loading to false');
        setLoading(false);
      }, 5000); // 5 second timeout

      return () => clearTimeout(timeout);
    }
  }, [currentUser, loading]);

  return { points, earnedToday, loading };
}

