import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { useEffect, useRef, useState } from 'react';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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

export const useCookingTimers = (timers, setSession, { onExpire } = {}) => {
  const [displayTimers, setDisplayTimers] = useState([]);
  const expiredIdsRef = useRef(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDisplayTimers(
        timers.map((timer) => {
          const remaining = timer.endTime - now;
          const total = timer.durationSeconds * 1000;
          return {
            ...timer,
            remainingLabel: formatRemaining(remaining),
            remainingSeconds: Math.max(0, Math.ceil(remaining / 1000)),
            progress: total > 0 ? Math.max(0, Math.min(1, 1 - remaining / total)) : 1,
            isExpired: remaining <= 0,
          };
        })
      );

      const expiredTimers = timers.filter((timer) => timer.endTime <= now);
      if (expiredTimers.length > 0) {
        expiredTimers.forEach((timer) => {
          if (!expiredIdsRef.current.has(timer.id)) {
            expiredIdsRef.current.add(timer.id);
            onExpire?.(timer);
          }
        });
        setSession((prev) => ({
          ...prev,
          activeTimers: prev.activeTimers.filter((timer) => timer.endTime > now),
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timers, setSession, onExpire]);

  return displayTimers;
};
