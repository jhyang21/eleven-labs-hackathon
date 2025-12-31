import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { durationSeconds, label, session } = req.body;
    
    if (!durationSeconds || typeof durationSeconds !== 'number' || durationSeconds <= 0) {
      res.status(400).json({ error: 'Invalid durationSeconds. Must be a positive number.' });
      return;
    }

    // Create timer object
    const endTime = Date.now() + durationSeconds * 1000;
    const newTimer = {
      id: randomUUID(),
      durationSeconds,
      endTime,
      label: label || `Timer (${Math.round(durationSeconds / 60)} min)`,
    };

    // Update session state if provided
    let updatedSession = null;
    if (session) {
      updatedSession = {
        ...session,
        activeTimers: [...(session.activeTimers || []), newTimer],
      };
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


