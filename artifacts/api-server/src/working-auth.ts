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

  console.log('[AUTH] Working auth system initialized');
}

// Auth middleware for protecting routes
export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireRole(...roles: string[]) {
  return async (req: any, res: any, next: any) => {
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
      if (userRoles.includes('administrator') || userRoles.includes('shop_manager')) {
        hasRole = roles.includes('admin') || roles.includes('trustee');
      } else if (userRoles.includes('doctor') || userRoles.includes('physician')) {
        hasRole = roles.includes('doctor') || roles.includes('clinic');
      }
    }

    // Hardcoded constraint: only blake should have exclusive trustee access
    // if 'trustee' is one of the allowed roles AND the user doesn't already have
    // an admin/trustee role mapped above, check if they are blake.
    // If the route explicitly requires ONLY 'trustee' (and not 'admin'), then 
    // further restrict it to blake. But if they already passed the role check
    // (e.g. they are an admin and the route allows 'admin' or 'trustee'), don't break it.
    if (roles.includes('trustee') && !roles.includes('admin')) {
      const email = req.user?.email || '';
      const isBlake = email.toLowerCase().includes('blake');
      if (isBlake) {
        hasRole = true;
      } else if (!userRoles.includes('administrator')) {
        hasRole = false; // Only Blake or WP Administrators get Trustee if ONLY trustee is asked for
      }
    }

    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
