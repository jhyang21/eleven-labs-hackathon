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
import Header from './components/Header.jsx';
import RecipeOverview from './components/RecipeOverview.jsx';
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
  const timers = useCookingTimers(session.activeTimers, setSession);

  const currentStep = useMemo(
    () => recipe.steps[session.currentStepIndex],
    [recipe.steps, session.currentStepIndex]
  );

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

  const handleParseRecipe = async () => {
    setError('');
    setStatus('Parsing recipe...');
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
        await speakWithElevenLabs(`Great. Let's start with preparation: ${parsed.steps[0]}`);
      }
    } catch (parseError) {
      setError(parseError.message);
      setStatus('Idle');
    }
  };

  const handleAdvanceStep = async () => {
    if (!recipe.steps.length) return;
    setSession((prev) => advanceToNextStep(prev, recipe.steps.length));
    const nextStep = recipe.steps[session.currentStepIndex + 1];
    if (nextStep) {
      await speakWithElevenLabs(`Next step: ${nextStep}`);
    }
  };

  const handleRepeatStep = async () => {
    if (!currentStep) return;
    setSession((prev) => repeatCurrentStep(prev));
    await speakWithElevenLabs(`Repeating: ${currentStep}`);
  };

  const handleSetTimer = async (durationSeconds) => {
    const newTimer = createTimer(durationSeconds);
    setSession((prev) => ({
      ...prev,
      activeTimers: [...prev.activeTimers, newTimer],
    }));
    await speakWithElevenLabs(`Timer set for ${Math.round(durationSeconds / 60)} minutes.`);
  };

  const { isListening, transcript, startListening, stopListening } = useSpeechInput({
    onFinalTranscript: async (text) => {
      if (!text) return;
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
      await speakWithElevenLabs(
        `I heard: ${text}. You can say "next step", "repeat", or "set a timer for 5 minutes".`
      );
    },
  });

  return (
    <div className="app">
      <Header status={status} />
      <main className="main">
        <section className="panel">
          <h2>Recipe intake</h2>
          <p>Paste a recipe URL to begin. We will parse ingredients and steps deterministically.</p>
          <div className="recipe-input">
            <input
              type="url"
              placeholder="https://example.com/recipe"
              value={recipeUrl}
              onChange={(event) => setRecipeUrl(event.target.value)}
            />
            <button type="button" onClick={handleParseRecipe}>
              Parse recipe
            </button>
          </div>
          {error && <p className="error">{error}</p>}
          <RecipeOverview recipe={recipe} />
        </section>
        <section className="panel">
          <StepCard
            step={currentStep}
            stepIndex={session.currentStepIndex}
            totalSteps={recipe.steps.length}
            onNext={handleAdvanceStep}
            onRepeat={handleRepeatStep}
          />
          <TimerPanel timers={timers} />
        </section>
        <section className="panel">
          <VoiceConsole
            isListening={isListening}
            transcript={transcript}
            onStart={startListening}
            onStop={stopListening}
          />
        </section>
      </main>
    </div>
  );
}
