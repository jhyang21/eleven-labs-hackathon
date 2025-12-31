import { useEffect, useMemo, useState, useRef } from 'react';
import {
  advanceToNextStep,
  createTimer,
  getSessionState,
  goBackToPreviousStep,
  repeatCurrentStep,
  saveSessionState,
  useCookingTimers,
} from './lib/sessionState.js';
import { parseRecipeFromUrl } from './lib/recipeParser.js';
import { useConversation } from '@elevenlabs/react';
import IngredientsPanel from './components/IngredientsPanel.jsx';
import StepCard from './components/StepCard.jsx';
import TimerPanel from './components/TimerPanel.jsx';
import VoiceConsole from './components/VoiceConsole.jsx';

const defaultRecipe = {
  title: 'Paste a recipe to begin',
  ingredients: [],
  steps: [],
};

// Personality/Agent configurations
const PERSONALITIES = [
  { 
    id: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_GRANDMA, 
    name: 'Grandma', 
    description: 'Sweet and encouraging, like cooking with grandma' 
  },
  { 
    id: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_CHEF, 
    name: 'Professional Chef', 
    description: 'Strict and precise culinary expert' 
  },
  { 
    id: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_YOGA, 
    name: 'Yoga Instructor', 
    description: 'Mindful and zen cooking experience' 
  },
  { 
    id: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_SCIENTIST, 
    name: 'Scientist', 
    description: 'Analytical and detail-oriented approach' 
  },
].filter(p => p.id); // Only show personalities with configured IDs

export default function App() {
  const [recipeUrl, setRecipeUrl] = useState('');
  const [recipe, setRecipe] = useState(defaultRecipe);
  const [selectedAgentId, setSelectedAgentId] = useState(PERSONALITIES[0]?.id || '');
  const [session, setSession] = useState({
    currentStepIndex: 0,
    activeTimers: [],
    lastConfirmedStep: null,
    recipe: null,
  });
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [readyPromptVisible, setReadyPromptVisible] = useState(false);
  const [flashingTimerId, setFlashingTimerId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const sessionRef = useRef(session);
  const recipeRef = useRef(recipe);

  useEffect(() => {
    sessionRef.current = session;
    recipeRef.current = recipe;
  }, [session, recipe]);

  const conversation = useConversation({
    micMuted: isMuted,
    clientTools: {
      startCookingSession: async () => {
        const r = recipeRef.current;
        if (!r.steps.length) return 'No recipe loaded.';

        setSession((prev) => ({
          ...prev,
          currentStepIndex: 0,
          lastConfirmedStep: 0,
        }));

        return r.steps[0];
      },
      advanceToNextStep: async () => {
        const s = sessionRef.current;
        const r = recipeRef.current;
        if (!r.steps.length) return 'No recipe loaded.';
        
        const nextSession = advanceToNextStep(s, r.steps.length);
        setSession(prev => ({ ...prev, ...nextSession }));
        
        const stepText = r.steps[nextSession.currentStepIndex];
        return stepText || 'You have finished the recipe.';
      },
      getCurrentStep: async () => {
        const s = sessionRef.current;
        const r = recipeRef.current;
        if (!r.steps.length) return 'No recipe loaded.';
        
        const stepText = r.steps[s.currentStepIndex];
        return stepText || 'No current step.';
      },
      goBackToPreviousStep: async () => {
        const s = sessionRef.current;
        const r = recipeRef.current;
        if (!r.steps.length) return 'No recipe loaded.';
        
        const nextSession = goBackToPreviousStep(s);
        setSession(prev => ({ ...prev, ...nextSession }));
        
        const stepText = r.steps[nextSession.currentStepIndex];
        return stepText || 'No current step.';
      },
      startTimer: async ({ durationSeconds, label }) => {
        const newTimer = createTimer(durationSeconds, label);
        setSession((prev) => ({
          ...prev,
          activeTimers: [...prev.activeTimers, newTimer],
        }));
        return `Timer started for ${Math.round(durationSeconds / 60)} minutes.`;
      },
    },
  });

  const { status: conversationStatus, isSpeaking } = conversation;


  const currentStep = useMemo(
    () => recipe.steps[session.currentStepIndex],
    [recipe.steps, session.currentStepIndex]
  );

  const timers = useCookingTimers(session.activeTimers, setSession, async (timer) => {
    playTimerChime();
    setFlashingTimerId(timer.id);
    setTimeout(() => setFlashingTimerId(null), 400);
    if (conversation.status === 'connected') {
      await conversation.sendUserMessage(`The timer for ${Math.round(timer.durationSeconds / 60)} minutes has finished.`);
    }
  });

  useEffect(() => {
    let isMounted = true;
    getSessionState().then((savedSession) => {
      if (!isMounted) return;
      if (savedSession) {
        setSession((prev) => ({ ...prev, ...savedSession }));
        // Restore recipe from session state if available
        if (savedSession.recipe) {
          setRecipe(savedSession.recipe);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    saveSessionState(session);
  }, [session]);


  const handleAgentChange = (agentId) => {
    setSelectedAgentId(agentId);
  };

  const handleParseRecipe = async () => {
    setError('');
    setStatus('Parsing recipe...');
    setIsParsing(true);
    try {
      // Validate that it's an AllRecipes link before parsing
      if (recipeUrl) {
        try {
          const parsedUrl = new URL(recipeUrl);
          const hostname = parsedUrl.hostname.toLowerCase();
          if (!hostname.includes('allrecipes.com')) {
            throw new Error('Invalid URL. Please provide a valid AllRecipes.com recipe link (e.g., https://www.allrecipes.com/...).');
          }
        } catch (urlError) {
          if (urlError.message.includes('Invalid URL') || urlError.message.includes('AllRecipes')) {
            throw urlError;
          }
          throw new Error('Invalid URL format. Please ensure you are using a valid AllRecipes.com recipe link.');
        }
      }
      const parsed = await parseRecipeFromUrl(recipeUrl);
      setRecipe(parsed);
      setSession((prev) => ({
        ...prev,
        currentStepIndex: 0,
        lastConfirmedStep: null,
        recipe: {
          title: parsed.title,
          ingredients: parsed.ingredients,
          steps: parsed.steps,
        },
      }));
      setStatus('Ready to cook');
      if (parsed.steps.length > 0) {
        try {
          await conversation.startSession({
            agentId: selectedAgentId,
          });
        } catch (sessionError) {
          console.error('Failed to start conversation session:', sessionError);
        }
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
    setReadyPromptVisible(false);
  };

  const handleRepeatStep = async () => {
    if (!currentStep) return;
    setSession((prev) => repeatCurrentStep(prev));
    setReadyPromptVisible(false);
  };

  const handleSetTimer = async (durationSeconds) => {
    const newTimer = createTimer(durationSeconds);
    setSession((prev) => ({
      ...prev,
      activeTimers: [...prev.activeTimers, newTimer],
    }));
  };

  const handleResetError = () => {
    setError('');
    setStatus('Idle');
  };


  useEffect(() => {
    setReadyPromptVisible(false);
  }, [session.currentStepIndex]);

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
  const effectiveVoiceState =
    conversationStatus === 'connected'
      ? isSpeaking
        ? 'speaking'
        : 'listening'
      : conversationStatus === 'connecting'
      ? 'thinking'
      : 'idle';

  return (
    <div className="app">
      {error ? (
        <main className="error-screen">
          <div className="error-card">
            <h1>We couldn't read this recipe</h1>
            <p>Please provide a valid AllRecipes.com recipe link (e.g., https://www.allrecipes.com/...)</p>
            <button type="button" onClick={handleResetError}>
              Try again
            </button>
          </div>
        </main>
      ) : !hasRecipe ? (
        <main className="landing">
          <div className="landing-container">
            <div className="landing-content">
              <div className="landing-hero">
                <h1 className="landing-title">Sous AI</h1>
                <p className="landing-subtitle">Hands-free recipe guidance powered with ElevenLabs</p>
              </div>
              <div className="landing-card">
                <div className="landing-card-header">
                  <h2 className="landing-card-title">Get Started</h2>
                  <p className="landing-card-subtitle">Enter your recipe URL to begin</p>
                </div>
                <div className="landing-input-group">
                  <div className="personality-selector-group">
                    <label htmlFor="personality-select" className="personality-label">Choose Personality</label>
                    <select
                      id="personality-select"
                      className="personality-select"
                      value={selectedAgentId}
                      onChange={(e) => handleAgentChange(e.target.value)}
                      disabled={isParsing}
                    >
                      {PERSONALITIES.map((personality) => (
                        <option key={personality.id} value={personality.id}>
                          {personality.name}
                        </option>
                      ))}
                    </select>
                    {PERSONALITIES.find(p => p.id === selectedAgentId)?.description && (
                      <p className="personality-description">
                        {PERSONALITIES.find(p => p.id === selectedAgentId).description}
                      </p>
                    )}
                  </div>
                  <input
                    type="url"
                    placeholder="https://www.allrecipes.com/..."
                    value={recipeUrl}
                    onChange={(event) => setRecipeUrl(event.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && recipeUrl && !isParsing) {
                        handleParseRecipe();
                      }
                    }}
                  />
                  <button type="button" onClick={handleParseRecipe} disabled={!recipeUrl || isParsing} className="landing-submit-btn">
                    {isParsing ? <span className="spinner" aria-hidden="true" /> : 'Start Cooking'}
                  </button>
                </div>
                {isParsing && <p className="hint">Preparing your cooking session…</p>}
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="cooking">
          <div className="content">
            <IngredientsPanel
              ingredients={recipe.ingredients}
            />
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
            transcript={null}
            isVoiceSupported={true}
            onRetry={() =>
              conversation.startSession({
                agentId: selectedAgentId,
              })
            }
            onStopSession={() => conversation.endSession()}
            onToggleMute={() => setIsMuted((m) => !m)}
            isMuted={isMuted}
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
