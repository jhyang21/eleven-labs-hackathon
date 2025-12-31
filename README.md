# Sous AI 🍳

**Voice-First Cooking Assistant Powered by ElevenLabs**

A hands-free cooking companion that guides you through recipes conversationally, so you can focus on cooking instead of scrolling through your phone with messy hands.

---

## Inspiration
I like to cook, but it's annoying having to go back and forth with the recipe on the phone, having to wash my hands from prepping ingredients or using my elbow to click since my hands are dirty. We wanted to build a true "sous chef" that keeps your hands free and your focus on the food, not the screen.

## What it does
**Sous AI** is a voice-first cooking assistant that guides you through recipes conversationally. Instead of scrolling through a long web page with messy hands while cooking, you simply paste an AllRecipes URL of a recipe you like and start cooking.

*   **Hands-Free Navigation**: Navigate steps naturally by saying "done", "can you go back a step?", or "what was that again?". The UI updates instantly to match the voice agent's progress.
*   **Intelligent Timers**: Need to boil pasta for 10 minutes? Just say "Set a timer for 10 minutes for the pasta." The AI understands the context, creates a timer, and the app visually tracks it while managing background notifications. The AI will automatically suggest setting a timer if the recipe step includes a time.
*   **Multiple Personalities**: Choose your cooking companion! Whether you want the comforting encouragement of "Grandma," the strict precision of a "Professional Chef," the calm vibes of a "Yoga Instructor," or the science background of a "Food Scientist," Sous AI adapts its tone and style to your preference.
*   **Visual & Audio Sync**: The app shows the current step and ingredients while speaking, ensuring you can glance at the screen for details if needed without touching it.

## How we built it
We built Sous AI using a modern web stack designed for real-time interaction:

*   **Frontend**: Built with **Next.js** (React) and CSS for a responsive, fast user interface.
*   **Voice AI**: We integrated the **ElevenLabs Conversational AI** via their React SDK, using Client Tools to enable the AI to control application state directly. 
*   **Backend & Parsing**: We utilized **Next.js API Routes** and **Cheerio** to scrape and structure unstructured recipe data from AllRecipes into a clean JSON format that our AI can read.
*   **Deployment**: The app is deployed on **Firebase App Hosting** for seamless scalability and performance.

## Challenges we ran into
*   **Bridging Voice and UI**: This was our first time configuring an ElevenLabs Voice AI agent. The biggest challenge was bidirectional synchronization, ensuring that when the AI decides to move to the next step, the React UI updates immediately, and vice versa.
*   **Prompt Engineering**: Taming the AI to be helpful but concise was tricky. We had to fine-tune the system prompts & tool definitions and play around with the configurations so the agent wouldn't ramble while we were trying to chop onions.
*   **Recipe Scraping**: Recipe sites vary widely in HTML structure and schema markup. To ensure reliable, consistent data for the AI, we focused on AllRecipes.com and built targeted parsing logic using Cheerio, rather than attempting a fragile universal parser that could introduce errors or incomplete information.

## Accomplishments that we're proud of
*   **It actually works hands-free!** We successfully built a system where you can cook an entire meal without touching the screen once after setup.
*   **Personality Engine**: We had a lot of fun with the different personalities, especially the chef's personality which turned out quite dramatic. It adds a layer of fun that makes the AI feel less like a robot.
*   **The "Timer" Tool**: Getting the AI to recognize a time intent, extract the duration, and trigger a client-side JavaScript timer (that prompts the AI when the timer goes off) felt like magic when it first worked.

## What we learned
*   **Tool Calling is Powerful**: We learned how to use function calling (tools) to turn a standard chatbot into an agent that can take actions properly.
*   **Latency Matters**: In a voice interface, speed is critical. We learned to optimize our state updates to make the conversation feel natural and snappy.
*   **Accessibility First**: Designing for voice naturally forced us to think about accessibility. A tool that helps cooks with dirty hands also helps users with motor impairments or visual difficulties.

## What's next for Sous AI
*   **Persistent Sessions**: Currently, if you refresh, you lose your place. We plan to add Firebase Firestore integration to save your cooking session so you can switch devices or resume later.
*   **More Recipe Sites**: Expanding our parsing engine to support more websites like Bon Appétit, NYT Cooking, and food blogs.
*   **Smart Home Integration**: Imagine Sous AI preheating your smart oven or dimming the lights for dinner automatically.
*   **Multi-Modal Inputs**: Allowing the user to ask "What does this look like?" and having the AI pull up a specific image or video for that step.

---

## 🛠️ Tech Stack

*   **Next.js 15** - React framework
*   **ElevenLabs Conversational AI** - Voice AI agent with client tools
*   **Cheerio** - HTML parsing and scraping
*   **Firebase App Hosting** - Deployment platform
*   **React Hooks** - State management and UI logic

---

Built for the AI Partner Catalyst Accelerate Innovation - ElevenLabs Track
