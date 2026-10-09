/**
 * Admin Authentication Middleware
 * 
 * Protects Content Management mutations (POST, PUT, DELETE) from unauthorized users.
 * Normal users can freely read content; only authorized webmasters can modify official records.
 */

export function requireAdminAuth(req, res, next) {
  const configuredKey = process.env.ADMIN_API_KEY || 'admin_secret_key_2026';
  
  // Extract key from header x-admin-key, Authorization Bearer, or query param
  let providedKey = req.headers['x-admin-key'];
  
  if (!providedKey && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    if (authHeader.startsWith('Bearer ')) {
      providedKey = authHeader.substring(7).trim();
    } else {
      providedKey = authHeader.trim();
    }
  }

  if (!providedKey && req.query?.adminKey) {
    providedKey = req.query.adminKey;
  }

  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Administrator authorization key is missing or invalid. Modifications to official language content are restricted to webmasters.'
    });
  }

  next();
}
