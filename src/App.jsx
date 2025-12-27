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
import LandingScreen from './components/LandingScreen.jsx';
import StepCard from './components/StepCard.jsx';
import TimerRing from './components/TimerRing.jsx';
import VoiceOrb from './components/VoiceOrb.jsx';
import IngredientsPanel from './components/IngredientsPanel.jsx';
import ErrorScreen from './components/ErrorScreen.jsx';

const defaultRecipe = {
  title: 'Paste a recipe to begin',
  ingredients: [],
  steps: [],
};

const phaseForStep = (index, total) => {
  if (total === 0) return 'Preparation';
  if (index === 0) return 'Preparation';
  if (index === total - 1) return 'Finishing';
  return 'Cooking';
};

const playChime = () => {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  gain.gain.setValueAtTime(0.2, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 1);
};

export default function App() {
  const [recipeUrl, setRecipeUrl] = useState('');
  const [recipe, setRecipe] = useState(defaultRecipe);
  const [session, setSession] = useState({
    currentStepIndex: 0,
    activeTimers: [],
    lastConfirmedStep: null,
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [voiceState, setVoiceState] = useState('idle');
  const [assistantNote, setAssistantNote] = useState('');
  const [isIngredientOpen, setIsIngredientOpen] = useState(false);

  const currentStep = useMemo(
    () => recipe.steps[session.currentStepIndex],
    [recipe.steps, session.currentStepIndex]
  );

  const phase = useMemo(
    () => phaseForStep(session.currentStepIndex, recipe.steps.length),
    [session.currentStepIndex, recipe.steps.length]
  );

  const timers = useCookingTimers(session.activeTimers, setSession, {
    onExpire: async () => {
      playChime();
      if (currentStep) {
        await speak(`Timer finished. ${currentStep}`);
      }
    },
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

  const speak = async (text) => {
    setVoiceState('speaking');
    await speakWithElevenLabs(text, {
      onStart: () => setVoiceState('speaking'),
      onEnd: () => setVoiceState('idle'),
    });
  };

  const handleParseRecipe = async () => {
    setError('');
    setStatus('parsing');
    try {
      const parsed = await parseRecipeFromUrl(recipeUrl);
      setRecipe(parsed);
      setSession((prev) => ({
        ...prev,
        currentStepIndex: 0,
        lastConfirmedStep: null,
      }));
      setStatus('cooking');
      setAssistantNote('');
      if (parsed.steps.length > 0) {
        await speak(`Great. Let's start with preparation: ${parsed.steps[0]}`);
      }
    } catch (parseError) {
      setError(parseError.message);
      setStatus('error');
    }
  };

  const handleAdvanceStep = async () => {
    if (!recipe.steps.length) return;
    setSession((prev) => advanceToNextStep(prev, recipe.steps.length));
    const nextStep = recipe.steps[session.currentStepIndex + 1];
    if (nextStep) {
      await speak(`Next step: ${nextStep}`);
    }
  };

  const handleRepeatStep = async () => {
    if (!currentStep) return;
    setSession((prev) => repeatCurrentStep(prev));
    await speak(`Repeating: ${currentStep}`);
  };

  const handleSetTimer = async (durationSeconds) => {
    const newTimer = createTimer(durationSeconds);
    setSession((prev) => ({
      ...prev,
      activeTimers: [...prev.activeTimers, newTimer],
    }));
    await speak(`Timer set for ${Math.round(durationSeconds / 60)} minutes.`);
  };

  const { isListening, transcript, startListening, stopListening } = useSpeechInput({
    onFinalTranscript: async (text) => {
      if (!text) return;
      setVoiceState('thinking');
      if (text.match(/next step|what's next|done|i've done that/i)) {
        setAssistantNote('');
        await handleAdvanceStep();
        return;
      }
      if (text.match(/repeat/i)) {
        setAssistantNote('');
        await handleRepeatStep();
        return;
      }
      if (text.match(/set a timer for/i)) {
        const match = text.match(/timer for (\d+) (minutes|minute|seconds|second)/i);
        if (match) {
          const amount = Number(match[1]);
          const unit = match[2].toLowerCase();
          const seconds = unit.startsWith('minute') ? amount * 60 : amount;
          setAssistantNote('');
          await handleSetTimer(seconds);
          return;
        }
      }
      setAssistantNote('Ready when you are.');
      await speak(
        `I heard: ${text}. You can say "next step", "repeat", or "set a timer for 5 minutes".`
      );
    },
  });

  useEffect(() => {
    if (isListening) {
      setVoiceState('listening');
    } else if (voiceState === 'listening') {
      setVoiceState('idle');
    }
  }, [isListening, voiceState]);

  if (status === 'error') {
    return (
      <ErrorScreen
        onRetry={() => {
          setError('');
          setStatus('idle');
        }}
      />
    );
  }

  if (status !== 'cooking') {
    return (
      <LandingScreen
        recipeUrl={recipeUrl}
        onChangeRecipeUrl={setRecipeUrl}
        onSubmit={handleParseRecipe}
        isParsing={status === 'parsing'}
      />
    );
  }

  return (
    <div className="app">
      <main className="main">
        <StepCard step={currentStep} phase={phase} note={assistantNote} />
        {timers[0] ? <TimerRing timer={timers[0]} /> : null}
        <IngredientsPanel
          ingredients={recipe.ingredients}
          isOpen={isIngredientOpen}
          onToggle={() => setIsIngredientOpen((prev) => !prev)}
        />
      </main>
      <VoiceOrb
        state={voiceState}
        transcript={transcript}
        onStart={startListening}
        onStop={stopListening}
        isListening={isListening}
      />
    </div>
  );
}
