'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from '@/types';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Fetch additional user data from Firestore
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          // Merge auth user data with Firestore user data
          const userDataFromFirestore = userDocSnap.data();
          const combinedUserData: User = {
            id: authUser.uid, // Use Firebase UID as id
            email: authUser.email,
            // Add other properties from Firebase authUser if needed and available
            // Example: displayName: authUser.displayName,
            ...userDataFromFirestore, // Spread data from Firestore
          } as User; // Cast to User type

          setUser(combinedUserData);
        } else {
          // Handle case where user document doesn't exist (e.g., new user just created)
          // You might want to set a basic user object or redirect for profile completion
          setUser(null); // Or a partial user object if your User type allows
        }
      }
      setLoading(false);
    });

    // Clean up the subscription
    return () => unsubscribe();
  }, []); // Empty dependency array as auth and db are stable

  return { user, loading };
}