import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'voice-cooking-session';

export const getSessionState = async () => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const saveSessionState = async (session) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
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
