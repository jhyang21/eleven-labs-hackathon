import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { useEffect, useRef, useState } from 'react';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app;
let db;

const FALLBACK_KEY = 'voice-cooking-session';

const initFirebase = () => {
  if (!firebaseConfig.projectId) {
    return null;
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
};

export const getSessionState = async () => {
  const firestore = initFirebase();
  if (!firestore) {
    const stored = localStorage.getItem(FALLBACK_KEY);
    return stored ? JSON.parse(stored) : null;
  }
  const snapshot = await getDoc(doc(firestore, 'sessions', 'default'));
  return snapshot.exists() ? snapshot.data() : null;
};

export const saveSessionState = async (session) => {
  const firestore = initFirebase();
  if (!firestore) {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(session));
    return;
  }
  await setDoc(doc(firestore, 'sessions', 'default'), session, { merge: true });
};

export const advanceToNextStep = (session, totalSteps) => {
  const nextIndex = Math.min(session.currentStepIndex + 1, totalSteps - 1);
  return {
    ...session,
    currentStepIndex: nextIndex,
    lastConfirmedStep: nextIndex,
  };
};

export const repeatCurrentStep = (session) => ({
  ...session,
  lastConfirmedStep: session.currentStepIndex,
});

export const createTimer = (durationSeconds) => {
  const endTime = Date.now() + durationSeconds * 1000;
  return {
    id: crypto.randomUUID(),
    durationSeconds,
    endTime,
    label: `Timer (${Math.round(durationSeconds / 60)} min)`,
  };
};

const formatRemaining = (remainingMs) => {
  if (remainingMs <= 0) return '00:00';
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const useCookingTimers = (timers, setSession, onTimerExpired) => {
  const [displayTimers, setDisplayTimers] = useState([]);
  const expiredTimersRef = useRef(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDisplayTimers(
        timers.map((timer) => {
          const remaining = timer.endTime - now;
          return {
            ...timer,
            remainingLabel: formatRemaining(remaining),
            remainingMs: remaining,
            isExpired: remaining <= 0,
          };
        })
      );

      const newlyExpired = timers.filter(
        (timer) => timer.endTime <= now && !expiredTimersRef.current.has(timer.id)
      );
      if (newlyExpired.length > 0) {
        newlyExpired.forEach((timer) => {
          expiredTimersRef.current.add(timer.id);
          if (onTimerExpired) {
            onTimerExpired(timer);
          }
        });
        setTimeout(() => {
          setSession((prev) => ({
            ...prev,
            activeTimers: prev.activeTimers.filter(
              (timer) => !expiredTimersRef.current.has(timer.id)
            ),
          }));
        }, 1000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timers, setSession, onTimerExpired]);

  return displayTimers;
};
