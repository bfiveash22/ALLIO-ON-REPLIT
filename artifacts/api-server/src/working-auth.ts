// WORKING AUTH FIX - NO SCHEMA IMPORTS NEEDED
// This bypasses all the compilation issues by using raw SQL

import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';

const { Pool } = pg;
const PgSession = connectPgSimple(session);

export function setupWorkingAuth(app: any) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // Expose pool to middleware for API Key verification
  app.locals.pool = pool;

  // Trust nginx proxy
  app.set('trust proxy', 1);

  // Session middleware
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: 'sessions', // Must match Drizzle definition in @shared/models/auth.ts
        createTableIfMissing: false
      }),
      secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production behind Nginx
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'lax'
      }
    })
  );

  // Auth middleware
  app.use((req: any, res: any, next: any) => {
    req.isAuthenticated = () => {
      return !!(req.session && req.session.userId && req.session.user);
    };

    if (req.session?.user) {
      req.user = req.session.user;
    }

    next();
  });

  // Login endpoint
  app.post('/api/auth/login', async (req: any, res: any) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password required'
        });
      }

      // Verify against WordPress
      const wpResponse = await fetch(
        `${process.env.WP_SITE_URL}/wp-login.php`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `log=${encodeURIComponent(username)}&pwd=${encodeURIComponent(password)}`,
          redirect: 'manual'
        }
      );

      // WordPress redirects on success
      if (wpResponse.status !== 302) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password.'
        });
      }

      // Fetch user roles from WordPress REST API
      const auth = Buffer.from(
        `${process.env.WP_USERNAME}:${process.env.WP_APPLICATION_PASSWORD}`
      ).toString('base64');

      const wpUser = await fetch(
        `${process.env.WP_SITE_URL}/wp-json/wp/v2/users?search=${encodeURIComponent(username)}&context=edit`,
        {
          headers: { Authorization: `Basic ${auth}` }
        }
      ).then(r => r.json());

      if (!wpUser || !Array.isArray(wpUser) || wpUser.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      // WordPress ?search=username is fuzzy and returns multiple accounts (e.g. Benjamin Blake before blake)
      // We must exact-match the username or email to prevent mapping the session to the wrong Postgres user
      // context=edit allows us to see u.username and u.email
      const searchStr = username.toLowerCase().trim();
      const exactMatch = (wpUser as any[]).find((u: any) =>
        (u.username && u.username.toLowerCase() === searchStr) ||
        (u.email && u.email.toLowerCase() === searchStr) ||
        u.slug?.toLowerCase() === searchStr ||
        u.name?.toLowerCase() === searchStr
      );

      const userData = exactMatch;

      if (!userData) {
        return res.status(401).json({
          success: false,
          error: 'Could not confidently match WordPress user profile.'
        });
      }

      // Check/create user in local database using RAW SQL (no schema imports!)
      // FIX: Prioritize wp_user_id over email to ensure we get exactly the right matched user
      let userQuery = await pool.query(
        'SELECT * FROM users WHERE wp_user_id = $1 LIMIT 1',
        [String(userData.id)]
      );

      const emailToUse = userData.email || `${username}@forgottenformula.com`;

      if (userQuery.rows.length === 0) {
        // Fallback to email if wp_user_id not found
        userQuery = await pool.query(
          'SELECT * FROM users WHERE email = $1 LIMIT 1',
          [emailToUse]
        );
      }

      let dbUser;
      if (userQuery.rows.length > 0) {
        dbUser = userQuery.rows[0];

        // Sync roles and profile data from WordPress to PostgreSQL on every login
        // This ensures if roles change in WP (or were cached wrongly before), they instantly fix here
        const newRoles = JSON.stringify(userData.roles || []);

        await pool.query(
          'UPDATE users SET wp_user_id = $1, wp_roles = $2, email = $3, first_name = $4, updated_at = NOW() WHERE id = $5',
          [String(userData.id), newRoles, emailToUse, userData.name || username, dbUser.id]
        );

        // Update the dbUser object in memory so the session gets the right roles immediately
        dbUser.wp_user_id = String(userData.id);
        dbUser.wp_roles = newRoles;
        dbUser.email = emailToUse;
        dbUser.first_name = userData.name || username;
      } else {
        // Create new user
        const insertResult = await pool.query(
          `INSERT INTO users (id, email, first_name, last_name, wp_user_id, wp_roles, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
           RETURNING *`,
          [
            emailToUse,
            userData.name || username,
            '',
            String(userData.id),
            JSON.stringify(userData.roles || [])
          ]
        );
        dbUser = insertResult.rows[0];
      }

      let parsedRoles = [];
      if (typeof dbUser.wp_roles === 'string') {
        try {
          parsedRoles = JSON.parse(dbUser.wp_roles);
          if (!Array.isArray(parsedRoles)) parsedRoles = [];
        } catch {
          parsedRoles = dbUser.wp_roles.split(',').map((r: string) => r.trim()).filter(Boolean);
        }
      } else if (Array.isArray(dbUser.wp_roles)) {
        parsedRoles = dbUser.wp_roles;
      }

      // Set session
      req.session.userId = dbUser.id;
      req.session.user = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        wpUserId: dbUser.wp_user_id,
        wpRoles: parsedRoles
      };

      // Save session and wait for it
      await new Promise((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      // Determine redirect
      const roles = req.session.user.wpRoles;
      const userEmail = req.session.user.email || '';
      const isBlake = userEmail.toLowerCase().includes('blake');

      const doctorHealerPatterns = [
        'doctor', 'healer', 'ff_healer', 'ff_doctor', 'practitioner',
        'um_healer', 'um_doctor', 'um_practitioner',
        'wellness_practitioner', 'healthcare_provider'
      ];
      const normalizedRoles = roles.map((r: string) => r.toLowerCase());
      let redirectTo = '/dashboard';
      if (normalizedRoles.includes('administrator') || isBlake) {
        redirectTo = '/trustee';
      } else if (normalizedRoles.includes('clinic_owner')) {
        redirectTo = '/clinic';
      } else if (normalizedRoles.some((r: string) =>
                   doctorHealerPatterns.includes(r) ||
                   r.includes('doctor') || r.includes('healer'))) {
        redirectTo = '/doctors';
      }

      res.json({
        success: true,
        user: req.session.user,
        redirectTo
      });

    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed: ' + error.message
      });
    }
  });

  // Profile endpoint
  app.get('/api/profile', (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    res.json({ user: req.user });
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req: any, res: any) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  // User info endpoint
  app.get('/api/auth/user', (req: any, res: any) => {
    if (req.isAuthenticated()) {
      res.json({ authenticated: true, user: req.user });
    } else {
      res.json({ authenticated: false });
    }
  });

  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_LOGIN !== 'false') {
    app.post('/api/auth/dev-login', async (req: any, res: any) => {
      try {
        const { userId, email } = req.body;
        if (!userId && !email) {
          return res.status(400).json({ success: false, error: 'userId or email required' });
        }

        let userQuery;
        if (userId) {
          userQuery = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId]);
        } else {
          userQuery = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
        }

        if (userQuery.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }

        const dbUser = userQuery.rows[0];
        let parsedRoles: string[] = [];
        if (typeof dbUser.wp_roles === 'string') {
          try { parsedRoles = JSON.parse(dbUser.wp_roles); } catch { parsedRoles = []; }
        } else if (Array.isArray(dbUser.wp_roles)) {
          parsedRoles = dbUser.wp_roles;
        }

        req.session.userId = dbUser.id;
        req.session.user = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
          wpUserId: dbUser.wp_user_id,
          wpRoles: parsedRoles,
        };

        await new Promise((resolve, reject) => {
          req.session.save((err: any) => { if (err) reject(err); else resolve(true); });
        });

        res.json({ success: true, user: req.session.user });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    console.log('[AUTH] Dev login endpoint enabled (non-production only)');
  }

  // Forgot Password endpoint
  app.post('/api/auth/forgot-password', async (req: any, res: any) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const result = await pool.query(
        'SELECT id, email FROM member_profiles WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [email.trim()]
      );

      if (result.rows.length > 0) {
        const crypto = await import('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000);

        await pool.query(
          `INSERT INTO password_reset_tokens (user_id, token, expires_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
          [result.rows[0].id, token, expiresAt]
        );

        console.log(`[AUTH] Password reset requested for ${email} - token generated (email delivery pending integration)`);
      }

      res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
    } catch (err: any) {
      console.error('[AUTH] Forgot password error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Reset Password endpoint
  app.post('/api/auth/reset-password', async (req: any, res: any) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      try {
        const result = await pool.query(
          'SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() LIMIT 1',
          [token]
        );

        if (result.rows.length === 0) {
          return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

        // NOTE: Full password update requires WP REST API integration:
        // POST /wp-json/wp/v2/users/<id> { password: newPassword }
        console.log(`[AUTH] Password reset token validated for user ${result.rows[0].user_id} - WP REST API password update pending integration`);
        res.json({ success: true, message: 'Password reset validated. Full WordPress integration pending.' });
      } catch (dbErr: any) {
        if (dbErr.code === '42P01') {
          return res.status(400).json({ error: 'Password reset is not yet configured. Please contact support.' });
        }
        throw dbErr;
      }
    } catch (err: any) {
      console.error('[AUTH] Reset password error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Profile update endpoint
  app.patch('/api/profile/update', async (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const { firstName, lastName, email } = req.body;
      const userId = req.session.userId;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (firstName !== undefined) {
        updates.push(`first_name = $${paramIndex++}`);
        values.push(firstName);
      }
      if (lastName !== undefined) {
        updates.push(`last_name = $${paramIndex++}`);
        values.push(lastName);
      }
      if (email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(email);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(userId);
      await pool.query(
        `UPDATE member_profiles SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex}`,
        values
      );

      if (firstName) req.session.user.firstName = firstName;
      if (lastName) req.session.user.lastName = lastName;
      if (email) req.session.user.email = email;

      res.json({ success: true, message: 'Profile updated' });
    } catch (err: any) {
      console.error('[PROFILE] Update error:', err.message);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Change password endpoint
  app.post('/api/profile/change-password', async (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }

      const username = req.session.user.email || req.session.user.username;
      const wpResponse = await fetch(
        `${process.env.WP_SITE_URL}/wp-login.php`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `log=${encodeURIComponent(username)}&pwd=${encodeURIComponent(currentPassword)}`,
          redirect: 'manual'
        }
      );

      if (wpResponse.status !== 302) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // NOTE: Full WP password update requires WordPress REST API integration
      // with application passwords or JWT auth. For now, we validate the old password
      // and log the change request. The WP REST API endpoint would be:
      // POST /wp-json/wp/v2/users/<id> { password: newPassword }
      console.log(`[AUTH] Password change validated for user ${req.session.userId} - WP REST API update pending integration`);
      res.json({ success: true, message: 'Password change request validated. Full WordPress integration pending.' });
    } catch (err: any) {
      console.error('[AUTH] Change password error:', err.message);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // Get addresses endpoint
  app.get('/api/profile/addresses', async (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const userId = req.session.userId;
      const result = await pool.query(
        `SELECT metadata->'billing_address' as billing, metadata->'shipping_address' as shipping
         FROM member_profiles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.json({ billing: null, shipping: null });
      }

      res.json({
        billing: result.rows[0].billing || null,
        shipping: result.rows[0].shipping || null,
      });
    } catch (err: any) {
      console.error('[PROFILE] Get addresses error:', err.message);
      res.json({ billing: null, shipping: null });
    }
  });

  // Save address endpoint
  app.post('/api/profile/addresses', async (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const address = req.body;
      const userId = req.session.userId;

      const metaKey = address.type === 'billing' ? 'billing_address' : 'shipping_address';

      await pool.query(
        `UPDATE member_profiles
         SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object($1, $2::jsonb),
             updated_at = NOW()
         WHERE user_id = $3`,
        [metaKey, JSON.stringify(address), userId]
      );

      res.json({ success: true, message: 'Address saved' });
    } catch (err: any) {
      console.error('[PROFILE] Save address error:', err.message);
      res.status(500).json({ error: 'Failed to save address' });
    }
  });

  // Clinics listing endpoint
  app.get('/api/clinics', async (req: any, res: any) => {
    try {
      const result = await pool.query(
        `SELECT id, name, pma_name as "pmaName", doctor_name as "doctorName",
                address, city, state, phone, email, website,
                pma_status as "pmaStatus", on_map as "onMap",
                created_at as "createdAt"
         FROM clinics
         WHERE pma_status = 'active' OR on_map = true
         ORDER BY name ASC`
      );
      res.json(result.rows);
    } catch (err: any) {
      console.error('[CLINICS] List error:', err.message);
      res.json([]);
    }
  });

  console.log('[AUTH] Working auth system initialized');
}

// Auth middleware for protecting routes
export function requireAuth(req: any, res: any, next: any) {
  if (typeof req.isAuthenticated !== 'function') {
    return res.status(500).json({ error: 'Auth middleware not initialized — route registered before setupWorkingAuth' });
  }
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireRole(...roles: string[]) {
  return async (req: any, res: any, next: any) => {
    if (typeof req.isAuthenticated !== 'function') {
      return res.status(500).json({ error: 'Auth middleware not initialized — route registered before setupWorkingAuth' });
    }
    // API KEY FALLBACK FOR SENTINEL/INTERNAL AGENT ENDPOINTS
    if (!req.isAuthenticated()) {
      if (roles.includes('admin')) {
        const pool = req.app?.locals?.pool;
        if (pool) {
          const authHeader = req.headers['authorization'];
          if (authHeader && authHeader.startsWith('Bearer allio_')) {
            const crypto = await import('crypto');
            const rawKey = authHeader.substring(7);
            const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

            try {
              const result = await pool.query(
                'SELECT id, permissions FROM api_keys WHERE key_hash = $1 AND is_active = true',
                [keyHash]
              );

              if (result.rows.length > 0) {
                const key = result.rows[0];
                // Fire and forget updating the last access time
                pool.query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [key.id]).catch(() => { });

                req.apiKeyId = key.id;
                req.apiKeyPermissions = Array.isArray(key.permissions) ? key.permissions : JSON.parse(key.permissions || '[]');

                const method = req.method.toUpperCase();
                const needsWrite = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
                if (needsWrite && (!req.apiKeyPermissions || !req.apiKeyPermissions.includes('write'))) {
                  return res.status(403).json({ error: 'API key lacks write permission' });
                }

                return next();
              }
            } catch (err) {
              console.error('[AUTH] API key validation error:', err);
            }
          }
        }
      }
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = req.user?.wpRoles || [];
    let hasRole = roles.some(role => userRoles.includes(role));

    // Map wpRoles to Allio roles
    if (!hasRole) {
      const WP_DOCTOR_ROLES = [
        'doctor', 'physician', 'healer', 'practitioner',
        'ff_doctor', 'ff_healer',
        'um_doctor', 'um_healer', 'um_practitioner',
        'wellness_practitioner', 'healthcare_provider',
      ];
      if (userRoles.includes('administrator') || userRoles.includes('shop_manager')) {
        hasRole = roles.includes('admin') || roles.includes('trustee');
      } else if (userRoles.some((r: string) => WP_DOCTOR_ROLES.includes(r))) {
        hasRole = roles.includes('doctor') || roles.includes('clinic');
      }
    }

    const email = (req.user?.email || '').toLowerCase();
    const TRUSTEE_EMAILS = ['blake@forgottenformula.com'];
    const isTrustee = TRUSTEE_EMAILS.includes(email);
    if (isTrustee && (roles.includes('admin') || roles.includes('trustee'))) {
      hasRole = true;
    }

    if (!hasRole && roles.includes('trustee') && !roles.includes('admin')) {
      if (!userRoles.includes('administrator')) {
        hasRole = false;
      }
    }

    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };

}
