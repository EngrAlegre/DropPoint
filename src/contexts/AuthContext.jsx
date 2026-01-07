import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from '../firebase/config';

const AuthContext = createContext({
  currentUser: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {}
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function login(email, password) {
    return await signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email, password, userData = {}) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create user profile in database
    if (userCredential.user) {
      await set(ref(database, `users/${userCredential.user.uid}`), {
        email: email,
        points: 0,
        ...userData,
        createdAt: Date.now()
      });
    }
    return userCredential;
  }

  function logout() {
    return signOut(auth);
  }

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

