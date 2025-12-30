import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  console.log('API createTimer called with method:', req.method);
  
  if (req.method !== 'POST') {
    console.log('Method not allowed');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { durationSeconds, session } = req.body;
    
    console.log('Received durationSeconds:', durationSeconds);
    console.log('Received session:', session);
    
    if (!durationSeconds || typeof durationSeconds !== 'number' || durationSeconds <= 0) {
      console.log('Invalid durationSeconds');
      res.status(400).json({ error: 'Invalid durationSeconds. Must be a positive number.' });
      return;
    }

    // Create timer object
    const endTime = Date.now() + durationSeconds * 1000;
    const newTimer = {
      id: randomUUID(),
      durationSeconds,
      endTime,
      label: `Timer (${Math.round(durationSeconds / 60)} min)`,
    };

    console.log('Created timer:', newTimer);

    // Update session state if provided
    let updatedSession = null;
    if (session) {
      updatedSession = {
        ...session,
        activeTimers: [...(session.activeTimers || []), newTimer],
      };
      console.log('Updated session with new timer');
    }

    // Return the timer and updated session
    res.status(200).json({
      success: true,
      timer: newTimer,
      session: updatedSession,
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}


