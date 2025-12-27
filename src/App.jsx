import { useEffect, useMemo, useState } from 'react';
import {
  advanceToNextStep,
  createTimer,
  getSessionState,
  repeatCurrentStep,
  saveSessionState,
  useCookingTimers,
} from './lib/sessionState.js';
import { parseRecipeFromUrl } from './lib/recipeParser.js';
import { useSpeechInput } from './lib/voiceInput.js';
import { speakWithElevenLabs } from './lib/voiceOutput.js';
import IngredientsPanel from './components/IngredientsPanel.jsx';
import StepCard from './components/StepCard.jsx';
import TimerPanel from './components/TimerPanel.jsx';
import VoiceConsole from './components/VoiceConsole.jsx';

const defaultRecipe = {
  title: 'Paste a recipe to begin',
  ingredients: [],
  steps: [],
};

export default function App() {
  const [recipeUrl, setRecipeUrl] = useState('');
  const [recipe, setRecipe] = useState(defaultRecipe);
  const [session, setSession] = useState({
    currentStepIndex: 0,
    activeTimers: [],
    lastConfirmedStep: null,
  });
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [readyPromptVisible, setReadyPromptVisible] = useState(false);
  const [voiceState, setVoiceState] = useState('idle');
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const [isIngredientsOpen, setIsIngredientsOpen] = useState(false);
  const [flashingTimerId, setFlashingTimerId] = useState(null);

  const currentStep = useMemo(
    () => recipe.steps[session.currentStepIndex],
    [recipe.steps, session.currentStepIndex]
  );

  const timers = useCookingTimers(session.activeTimers, setSession, async (timer) => {
    playTimerChime();
    setFlashingTimerId(timer.id);
    setTimeout(() => setFlashingTimerId(null), 400);
    await speakWithElevenLabs('Timer finished. Ready for your next instruction.');
  });

  useEffect(() => {
    let isMounted = true;
    getSessionState().then((savedSession) => {
      if (!isMounted) return;
      if (savedSession) {
        setSession((prev) => ({ ...prev, ...savedSession }));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    saveSessionState(session);
  }, [session]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsVoiceSupported(Boolean(SpeechRecognition));
  }, []);

  useEffect(() => {
    setReadyPromptVisible(false);
  }, [session.currentStepIndex]);

  const handleParseRecipe = async () => {
    setError('');
    setStatus('Parsing recipe...');
    setIsParsing(true);
    try {
      const parsed = await parseRecipeFromUrl(recipeUrl);
      setRecipe(parsed);
      setSession((prev) => ({
        ...prev,
        currentStepIndex: 0,
        lastConfirmedStep: null,
      }));
      setStatus('Ready to cook');
      if (parsed.steps.length > 0) {
        await triggerSpeech(`Great. Let's start with preparation: ${parsed.steps[0]}`);
      }
    } catch (parseError) {
      setError(parseError.message);
      setStatus('Idle');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAdvanceStep = async () => {
    if (!recipe.steps.length) return;
    setSession((prev) => advanceToNextStep(prev, recipe.steps.length));
    const nextStep = recipe.steps[session.currentStepIndex + 1];
    if (nextStep) {
      await triggerSpeech(`Next step: ${nextStep}`);
    }
    setReadyPromptVisible(false);
  };

  const handleRepeatStep = async () => {
    if (!currentStep) return;
    setSession((prev) => repeatCurrentStep(prev));
    await triggerSpeech(`Repeating: ${currentStep}`);
    setReadyPromptVisible(false);
  };

  const handleSetTimer = async (durationSeconds) => {
    const newTimer = createTimer(durationSeconds);
    setSession((prev) => ({
      ...prev,
      activeTimers: [...prev.activeTimers, newTimer],
    }));
    await triggerSpeech(`Timer set for ${Math.round(durationSeconds / 60)} minutes.`);
  };

  const { isListening, transcript, startListening } = useSpeechInput({
    onFinalTranscript: async (text) => {
      if (!text) return;
      setReadyPromptVisible(false);
      if (text.match(/next step|what's next|done|i've done that/i)) {
        await handleAdvanceStep();
        return;
      }
      if (text.match(/repeat/i)) {
        await handleRepeatStep();
        return;
      }
      if (text.match(/set a timer for/i)) {
        const match = text.match(/timer for (\d+) (minutes|minute|seconds|second)/i);
        if (match) {
          const amount = Number(match[1]);
          const unit = match[2].toLowerCase();
          const seconds = unit.startsWith('minute') ? amount * 60 : amount;
          await handleSetTimer(seconds);
          return;
        }
      }
      setVoiceState('thinking');
      await new Promise((resolve) => setTimeout(resolve, 150));
      await triggerSpeech(
        `I heard: ${text}. You can say "next step", "repeat", or "set a timer for 5 minutes".`
      );
      setReadyPromptVisible(true);
    },
  });

  useEffect(() => {
    if (!recipe.steps.length) return;
    if (!isVoiceSupported) return;
    if (!isListening) {
      startListening();
    }
  }, [isListening, isVoiceSupported, recipe.steps.length, startListening]);

  const handleRetryVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsVoiceSupported(Boolean(SpeechRecognition));
    if (SpeechRecognition) {
      startListening();
    }
  };

  const handleResetError = () => {
    setError('');
    setStatus('Idle');
  };

  const triggerSpeech = async (text) => {
    setVoiceState('speaking');
    try {
      await speakWithElevenLabs(text);
    } finally {
      setVoiceState('idle');
    }
  };

  const playTimerChime = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.05;
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.25);
  };

  const hasRecipe = recipe.steps.length > 0;
  const phaseLabel = getPhaseLabel(session.currentStepIndex, recipe.steps.length);
  const effectiveVoiceState = !isVoiceSupported
    ? 'disabled'
    : isListening
      ? 'listening'
      : voiceState;

  return (
    <div className="app">
      {error ? (
        <main className="error-screen">
          <div className="error-card">
            <h1>We couldn’t read this recipe</h1>
            <p>Try another link or a different site</p>
            <button type="button" onClick={handleResetError}>
              Try again
            </button>
          </div>
        </main>
      ) : !hasRecipe ? (
        <main className="landing">
          <div className="landing-card">
            <input
              type="url"
              placeholder="Paste a recipe link"
              value={recipeUrl}
              onChange={(event) => setRecipeUrl(event.target.value)}
            />
            <button type="button" onClick={handleParseRecipe} disabled={!recipeUrl || isParsing}>
              {isParsing ? <span className="spinner" aria-hidden="true" /> : 'Start cooking'}
            </button>
            {isParsing && <p className="hint">Preparing your cooking session…</p>}
          </div>
        </main>
      ) : (
        <main className="cooking">
          <div className="content">
            <StepCard
              key={session.currentStepIndex}
              phaseLabel={phaseLabel}
              step={currentStep}
              readyPromptVisible={readyPromptVisible}
            />
            <TimerPanel timers={timers} flashingTimerId={flashingTimerId} />
          </div>
          <VoiceConsole
            voiceState={effectiveVoiceState}
            transcript={transcript}
            isVoiceSupported={isVoiceSupported}
            onRetry={handleRetryVoice}
          />
          <IngredientsPanel
            isOpen={isIngredientsOpen}
            onToggle={() => setIsIngredientsOpen((open) => !open)}
            ingredients={recipe.ingredients}
          />
        </main>
      )}
    </div>
  );
}

const getPhaseLabel = (currentIndex, totalSteps) => {
  if (!totalSteps) return 'Preparation';
  const progress = (currentIndex + 1) / totalSteps;
  if (progress <= 0.34) return 'Preparation';
  if (progress <= 0.75) return 'Cooking';
  return 'Finishing';
};
