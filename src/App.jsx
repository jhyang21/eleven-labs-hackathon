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
const DEFAULT_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '';

const PERSONALITIES = [
  { id: DEFAULT_AGENT_ID || 'default', name: 'Default', description: 'Standard cooking assistant' },
  { id: 'agent-id-2', name: '2', description: 'Personality option 2' },
  { id: 'agent-id-3', name: '3', description: 'Personality option 3' },
  { id: 'agent-id-4', name: '4', description: 'Personality option 4' },
  { id: 'agent-id-5', name: '5', description: 'Personality option 5' },
];

export default function App() {
  const [recipeUrl, setRecipeUrl] = useState('');
  const [recipe, setRecipe] = useState(defaultRecipe);
  const [selectedAgentId, setSelectedAgentId] = useState(() => {
    // Load from localStorage if available, otherwise use default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedAgentId');
      return saved || DEFAULT_AGENT_ID || PERSONALITIES[0]?.id || '';
    }
    return DEFAULT_AGENT_ID || PERSONALITIES[0]?.id || '';
  });
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
  
  const sessionRef = useRef(session);
  const recipeRef = useRef(recipe);

  useEffect(() => {
    sessionRef.current = session;
    recipeRef.current = recipe;
  }, [session, recipe]);

  const conversation = useConversation({
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

  const [isIngredientsOpen, setIsIngredientsOpen] = useState(false);
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
    localStorage.setItem('selectedAgentId', agentId);
  };

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
            <h1>We couldn’t read this recipe</h1>
            <p>Try another link or a different site</p>
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
                <h1 className="landing-title">Voice AI Cooking Assistant</h1>
                <p className="landing-subtitle">Hands-free recipe guidance powered by ElevenLabs</p>
              </div>
              <div className="landing-card">
                <div className="landing-card-header">
                  <h2 className="landing-card-title">Get Started</h2>
                  <p className="landing-card-subtitle">Enter your recipe URL to begin</p>
                </div>
                <div className="landing-input-group">
                  <div className="personality-selector-group">
                    <label htmlFor="personality-select" className="personality-label">AI Personality</label>
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
                    placeholder="https://example.com/recipe..."
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
            <div className="landing-sidebar">
              <div className="landing-features">
                <div className="feature-item">
                  <div className="feature-icon-wrapper">
                    <div className="feature-icon">🎙️</div>
                  </div>
                  <div className="feature-content">
                    <h3>Voice Commands</h3>
                    <p>Interact hands-free while you cook</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon-wrapper">
                    <div className="feature-icon">⏱️</div>
                  </div>
                  <div className="feature-content">
                    <h3>Smart Timers</h3>
                    <p>Automatic timer management</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon-wrapper">
                    <div className="feature-icon">📝</div>
                  </div>
                  <div className="feature-content">
                    <h3>Step Guidance</h3>
                    <p>Clear, easy-to-follow instructions</p>
                  </div>
                </div>
              </div>
            </div>
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
            transcript={null}
            isVoiceSupported={true}
            onRetry={() =>
              conversation.startSession({
                agentId: selectedAgentId,
              })
            }
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
