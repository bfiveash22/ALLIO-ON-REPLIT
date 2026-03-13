import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import { Strategy as LocalStrategy } from "passport-local";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
// WordPress auth temporarily disabled - will implement internal Allio auth
// import { authenticateWithWordPress } from "../../services/wordpress-auth";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.REPL_SLUG;
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  // Serialize only minimal, verified data to session
  passport.serializeUser((user: Express.User, cb) => {
    const sessionData = user as any;
    // Store only authProvider and verified userId from our database
    cb(null, {
      authProvider: sessionData.authProvider || "replit",
      userId: sessionData.claims?.sub,
      // For Replit auth, we need OAuth tokens for refresh
      ...(sessionData.authProvider !== "wordpress" && {
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        expires_at: sessionData.expires_at,
      }),
    });
  });
  
  passport.deserializeUser(async (sessionData: any, cb) => {
    try {
      console.log(`[DESERIALIZE] Called with sessionData keys: ${sessionData ? Object.keys(sessionData).join(',') : 'null'}, userId: ${sessionData?.userId}, authProvider: ${sessionData?.authProvider}`);
      
      if (!sessionData?.userId) {
        console.log('[DESERIALIZE] No userId in sessionData, returning false');
        return cb(null, false);
      }
      
      const user = await authStorage.getUser(sessionData.userId);
      if (!user) {
        console.log(`[DESERIALIZE] User not found in DB for id: ${sessionData.userId}`);
        return cb(null, false);
      }
      
      console.log(`[DESERIALIZE] User found: id=${user.id}, email=${user.email}`);
      
      const sessionUser = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image_url: user.profileImageUrl,
        },
        authProvider: sessionData.authProvider,
        ...(sessionData.authProvider !== "wordpress" && {
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
          expires_at: sessionData.expires_at,
        }),
        ...(sessionData.authProvider === "wordpress" && {
          expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        }),
      };
      
      cb(null, sessionUser);
    } catch (error: any) {
      console.error(`[DESERIALIZE] Error: ${error.message}`);
      cb(error);
    }
  });

  // WordPress Local Strategy temporarily disabled - implementing internal Allio auth
  // Will be replaced with internal user accounts that sync with WooCommerce roles
  /*
  passport.use(
    "wordpress",
    new LocalStrategy(async (username, password, done) => {
      // ... WordPress auth disabled
    })
  );
  */

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // WordPress sessions: expiry is refreshed on each request via deserializeUser
  // so we just check if the user is authenticated
  if (user.authProvider === "wordpress") {
    return next();
  }

  // Replit OAuth sessions: check expiry and refresh if needed
  if (!user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
