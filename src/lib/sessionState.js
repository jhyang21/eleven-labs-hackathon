import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'voice-cooking-session';

export const getSessionState = async () => {
  return null;
};

export const saveSessionState = async (session) => {
  // Session persistence disabled
};

export const advanceToNextStep = (session, totalSteps) => {
  const nextIndex = Math.min(session.currentStepIndex + 1, totalSteps - 1);
  return {
    ...session,
    currentStepIndex: nextIndex,
    lastConfirmedStep: nextIndex,
  };
};

export const goBackToPreviousStep = (session) => {
  const prevIndex = Math.max(session.currentStepIndex - 1, 0);
  return {
    ...session,
    currentStepIndex: prevIndex,
    lastConfirmedStep: prevIndex,
  };
};

export const repeatCurrentStep = (session) => ({
  ...session,
  lastConfirmedStep: session.currentStepIndex,
});

export const createTimer = (durationSeconds, label) => {
  const endTime = Date.now() + durationSeconds * 1000;
  return {
    id: crypto.randomUUID(),
    durationSeconds,
    endTime,
    label: label || `Timer (${Math.round(durationSeconds / 60)} min)`,
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
