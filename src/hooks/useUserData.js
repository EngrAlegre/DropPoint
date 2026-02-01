import { useState, useEffect, useMemo } from 'react';
import { ref, onValue, off, set } from 'firebase/database';
import { database } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

function normalizeTimestampToMs(value) {
  if (typeof value !== 'number' || !isFinite(value) || value <= 0) return 0;
  // If it's seconds (e.g. 1769918435), convert to ms.
  return value < 1_000_000_000_000 ? value * 1000 : value;
}

export function useUserData() {
  const { currentUser } = useAuth();
  const [serverPoints, setServerPoints] = useState(0);
  const [earnedTotal, setEarnedTotal] = useState(0);
  const [spentTotal, setSpentTotal] = useState(0);
  const [earnedToday, setEarnedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pointsLoaded, setPointsLoaded] = useState(false);
  const [disposalsLoaded, setDisposalsLoaded] = useState(false);
  const [redemptionsLoaded, setRedemptionsLoaded] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setServerPoints(0);
      setEarnedTotal(0);
      setSpentTotal(0);
      setEarnedToday(0);
      setLoading(false);
      setPointsLoaded(false);
      setDisposalsLoaded(false);
      setRedemptionsLoaded(false);
      return;
    }

    try {
      const userId = currentUser.uid;
      
      // Reset loading states
      setPointsLoaded(false);
      setDisposalsLoaded(false);
      setRedemptionsLoaded(false);
      setLoading(true);
      
      // Fetch user points
      const pointsRef = ref(database, `users/${userId}/points`);
      const unsubscribePoints = onValue(pointsRef, (snapshot) => {
        try {
          const userPoints = snapshot.val() || 0;
          setServerPoints(userPoints);
          setPointsLoaded(true);
        } catch (error) {
          console.error('Error reading points:', error);
          setServerPoints(0);
          setPointsLoaded(true);
        }
      }, (error) => {
        console.error('Error setting up points listener:', error);
        setServerPoints(0);
        setPointsLoaded(true);
      });

      // Calculate points from disposals and redemptions (ESP32 writes disposals only).
      const disposalsRef = ref(database, `disposals/${userId}`);
      const unsubscribeDisposals = onValue(disposalsRef, (snapshot) => {
        try {
          const disposals = snapshot.val();
          if (!disposals) {
            setEarnedTotal(0);
            setEarnedToday(0);
            setDisposalsLoaded(true);
            return;
          }

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayTimestamp = today.getTime();

          let earnedTotal = 0;
          let todayPoints = 0;
          Object.values(disposals).forEach(disposal => {
            if (!disposal) return;
            const pts = disposal.points || 0;
            earnedTotal += pts;

            const tsMs = normalizeTimestampToMs(disposal.timestamp);
            if (tsMs >= todayTimestamp) {
              todayPoints += pts;
            }
          });

          setEarnedTotal(earnedTotal);
          setEarnedToday(todayPoints);
          setDisposalsLoaded(true);
        } catch (error) {
          console.error('Error calculating earned today:', error);
          setEarnedTotal(0);
          setEarnedToday(0);
          setDisposalsLoaded(true);
        }
      }, (error) => {
        console.error('Error setting up disposals listener:', error);
        setEarnedTotal(0);
        setEarnedToday(0);
        setDisposalsLoaded(true);
      });

      const redemptionsRef = ref(database, `redemptions/${userId}`);
      const unsubscribeRedemptions = onValue(redemptionsRef, (snapshot) => {
        try {
          const redemptions = snapshot.val();
          if (!redemptions) {
            setSpentTotal(0);
            setRedemptionsLoaded(true);
            return;
          }

          let spent = 0;
          Object.values(redemptions).forEach(redemption => {
            if (!redemption) return;
            spent += (redemption.points || 0);
          });
          setSpentTotal(spent);
          setRedemptionsLoaded(true);
        } catch (error) {
          console.error('Error reading redemptions:', error);
          setSpentTotal(0);
          setRedemptionsLoaded(true);
        }
      }, (error) => {
        console.error('Error setting up redemptions listener:', error);
        setSpentTotal(0);
        setRedemptionsLoaded(true);
      });

      return () => {
        try {
          off(pointsRef);
          off(disposalsRef);
          off(redemptionsRef);
        } catch (error) {
          console.error('Error cleaning up listeners:', error);
        }
      };
    } catch (error) {
      console.error('Error in useUserData:', error);
      setServerPoints(0);
      setEarnedTotal(0);
      setSpentTotal(0);
      setEarnedToday(0);
      setLoading(false);
      setPointsLoaded(false);
      setDisposalsLoaded(false);
      setRedemptionsLoaded(false);
    }
  }, [currentUser]);

  const computedPoints = useMemo(() => {
    return Math.max(0, (earnedTotal || 0) - (spentTotal || 0));
  }, [earnedTotal, spentTotal]);

  const points = useMemo(() => {
    // Show whichever is higher: server points (admin/manual) or computed points (from disposals - redemptions).
    return Math.max(serverPoints || 0, computedPoints || 0);
  }, [serverPoints, computedPoints]);

  // Optional: keep server points in sync upward (never decreases points from here).
  useEffect(() => {
    if (!currentUser) return;
    if (!pointsLoaded || !disposalsLoaded || !redemptionsLoaded) return;

    const userId = currentUser.uid;
    if ((computedPoints || 0) > (serverPoints || 0)) {
      set(ref(database, `users/${userId}/points`), computedPoints).catch((e) => {
        console.warn('Failed to sync server points:', e);
      });
    }
  }, [currentUser, computedPoints, serverPoints, pointsLoaded, disposalsLoaded, redemptionsLoaded]);

  // Set loading to false when both listeners have fired
  useEffect(() => {
    if (pointsLoaded && disposalsLoaded && redemptionsLoaded) {
      setLoading(false);
    }
  }, [pointsLoaded, disposalsLoaded, redemptionsLoaded]);

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

