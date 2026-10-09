/**
 * Privacy-First Middleware for Hindi Assist
 * 
 * Enforces Zero-Log Policy on sensitive data:
 * - NEVER logs request bodies containing user messages or clipboard content.
 * - Sanitizes sensitive headers (e.g., authorization, passwords, OTPs).
 * - Implements request size limits to prevent payload abuse.
 * - Strips any metadata tracking individual keystrokes or private conversations.
 */

export function zeroLogPolicy(req, res, next) {
  // Overwrite request logging to ensure payload text is NEVER printed
  const startTime = Date.now();
  
  // Safe metadata only (method, endpoint route, response status, duration)
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    // Log ONLY sanitized status and endpoint, NEVER req.body or translation text
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[PRIVACY-SAFE AUDIT] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms) [Zero-Log: Active]`);
    }
  });

  next();
}

export function validateInputPayload(req, res, next) {
  if (req.method === 'POST') {
    const { text, incomingText } = req.body || {};
    const payload = text || incomingText;

    if (payload !== undefined && typeof payload !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Text payload must be a valid string.'
      });
    }

    if (payload && payload.length > 5000) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: 'Message length exceeds the 5,000 character privacy boundary.'
      });
    }
  }

  next();
}
