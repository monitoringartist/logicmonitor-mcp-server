/**
 * Generic OAuth Strategy Factory
 * 
 * Creates Passport strategies for various OAuth/OIDC providers
 * Supports: GitHub, Google, Azure AD, Okta, Auth0, and custom providers
 */

import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { OAuthConfig } from './cli-config.js';

export interface OAuthUser {
  id: string;
  username?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  provider: string;
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
  };
  raw?: any; // Original profile data
}

/**
 * Configure Passport with the appropriate OAuth strategy based on provider
 */
export function configureOAuthStrategy(config: OAuthConfig): void {
  const strategy = createStrategy(config);
  passport.use(strategy);

  // Serialize user for session storage
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((obj: any, done) => {
    done(null, obj);
  });
}

/**
 * Create the appropriate OAuth strategy based on provider
 */
function createStrategy(config: OAuthConfig): any {
  switch (config.provider) {
    case 'github':
      return createGitHubStrategy(config);
    
    case 'google':
      return createGoogleStrategy(config);
    
    case 'azure':
      return createAzureStrategy(config);
    
    case 'okta':
      return createOktaStrategy(config);
    
    case 'auth0':
      return createAuth0Strategy(config);
    
    case 'custom':
      return createCustomStrategy(config);
    
    default:
      throw new Error(`Unsupported OAuth provider: ${config.provider}`);
  }
}

/**
 * GitHub OAuth Strategy
 */
function createGitHubStrategy(config: OAuthConfig): GitHubStrategy {
  return new GitHubStrategy(
    {
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackUrl,
      scope: config.scope?.split(',') || ['user:email'],
    },
    (accessToken: string, refreshToken: string, profile: any, done: any) => {
      const user: OAuthUser = {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value,
        avatarUrl: profile.photos?.[0]?.value,
        provider: 'github',
        tokens: {
          accessToken,
          refreshToken,
          expiresAt: Date.now() + (3600 * 1000), // GitHub tokens typically expire in 1 hour
        },
        raw: profile,
      };
      return done(null, user);
    },
  );
}

/**
 * Google OAuth Strategy
 */
function createGoogleStrategy(config: OAuthConfig): OAuth2Strategy {
  return new OAuth2Strategy(
    {
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token',
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackUrl,
      scope: config.scope?.split(',') || ['profile', 'email'],
    },
    async (accessToken: string, refreshToken: string, params: any, profile: any, done: any) => {
      try {
        // Fetch user profile from Google
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const googleProfile = await response.json();

        const user: OAuthUser = {
          id: googleProfile.id,
          username: googleProfile.email?.split('@')[0],
          displayName: googleProfile.name,
          email: googleProfile.email,
          avatarUrl: googleProfile.picture,
          provider: 'google',
          tokens: {
            accessToken,
            refreshToken,
            expiresAt: Date.now() + ((params.expires_in || 3600) * 1000),
          },
          raw: googleProfile,
        };
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  );
}

/**
 * Azure AD OAuth Strategy
 */
function createAzureStrategy(config: OAuthConfig): OAuth2Strategy {
  const tenantId = process.env.OAUTH_AZURE_TENANT_ID || 'common';
  
  return new OAuth2Strategy(
    {
      authorizationURL: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackUrl,
      scope: config.scope?.split(',') || ['openid', 'profile', 'email'],
    },
    async (accessToken: string, refreshToken: string, params: any, profile: any, done: any) => {
      try {
        // Fetch user profile from Microsoft Graph
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const azureProfile = await response.json();

        const user: OAuthUser = {
          id: azureProfile.id,
          username: azureProfile.userPrincipalName?.split('@')[0],
          displayName: azureProfile.displayName,
          email: azureProfile.mail || azureProfile.userPrincipalName,
          provider: 'azure',
          tokens: {
            accessToken,
            refreshToken,
            expiresAt: Date.now() + ((params.expires_in || 3600) * 1000),
          },
          raw: azureProfile,
        };
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  );
}

/**
 * Okta OAuth Strategy
 */
function createOktaStrategy(config: OAuthConfig): OAuth2Strategy {
  const oktaDomain = process.env.OAUTH_OKTA_DOMAIN;
  if (!oktaDomain) {
    throw new Error('OAUTH_OKTA_DOMAIN is required for Okta provider');
  }

  return new OAuth2Strategy(
    {
      authorizationURL: `https://${oktaDomain}/oauth2/v1/authorize`,
      tokenURL: `https://${oktaDomain}/oauth2/v1/token`,
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackUrl,
      scope: config.scope?.split(',') || ['openid', 'profile', 'email'],
    },
    async (accessToken: string, refreshToken: string, params: any, profile: any, done: any) => {
      try {
        // Fetch user profile from Okta
        const response = await fetch(`https://${oktaDomain}/oauth2/v1/userinfo`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const oktaProfile = await response.json();

        const user: OAuthUser = {
          id: oktaProfile.sub,
          username: oktaProfile.preferred_username || oktaProfile.email?.split('@')[0],
          displayName: oktaProfile.name,
          email: oktaProfile.email,
          provider: 'okta',
          tokens: {
            accessToken,
            refreshToken,
            expiresAt: Date.now() + ((params.expires_in || 3600) * 1000),
          },
          raw: oktaProfile,
        };
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  );
}

/**
 * Auth0 OAuth Strategy
 */
function createAuth0Strategy(config: OAuthConfig): OAuth2Strategy {
  const auth0Domain = process.env.OAUTH_AUTH0_DOMAIN;
  if (!auth0Domain) {
    throw new Error('OAUTH_AUTH0_DOMAIN is required for Auth0 provider');
  }

  return new OAuth2Strategy(
    {
      authorizationURL: `https://${auth0Domain}/authorize`,
      tokenURL: `https://${auth0Domain}/oauth/token`,
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackUrl,
      scope: config.scope?.split(',') || ['openid', 'profile', 'email'],
    },
    async (accessToken: string, refreshToken: string, params: any, profile: any, done: any) => {
      try {
        // Fetch user profile from Auth0
        const response = await fetch(`https://${auth0Domain}/userinfo`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const auth0Profile = await response.json();

        const user: OAuthUser = {
          id: auth0Profile.sub,
          username: auth0Profile.nickname || auth0Profile.email?.split('@')[0],
          displayName: auth0Profile.name,
          email: auth0Profile.email,
          avatarUrl: auth0Profile.picture,
          provider: 'auth0',
          tokens: {
            accessToken,
            refreshToken,
            expiresAt: Date.now() + ((params.expires_in || 3600) * 1000),
          },
          raw: auth0Profile,
        };
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  );
}

/**
 * Custom OAuth Strategy (generic OAuth2)
 */
function createCustomStrategy(config: OAuthConfig): OAuth2Strategy {
  if (!config.authorizationUrl || !config.tokenUrl) {
    throw new Error('Custom OAuth provider requires authorizationUrl and tokenUrl');
  }

  return new OAuth2Strategy(
    {
      authorizationURL: config.authorizationUrl,
      tokenURL: config.tokenUrl,
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackUrl,
      scope: config.scope?.split(','),
    },
    async (accessToken: string, refreshToken: string, params: any, profile: any, done: any) => {
      try {
        let customProfile: any = {};

        // Fetch user profile if URL is provided
        if (config.userProfileUrl) {
          const response = await fetch(config.userProfileUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          customProfile = await response.json();
        }

        const user: OAuthUser = {
          id: customProfile.id || customProfile.sub || accessToken.substring(0, 16),
          username: customProfile.username || customProfile.preferred_username || customProfile.email?.split('@')[0],
          displayName: customProfile.name || customProfile.displayName,
          email: customProfile.email,
          avatarUrl: customProfile.picture || customProfile.avatar,
          provider: 'custom',
          tokens: {
            accessToken,
            refreshToken,
            expiresAt: Date.now() + ((params.expires_in || 3600) * 1000),
          },
          raw: customProfile,
        };
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  );
}

/**
 * Get provider-specific refresh token function
 */
export function getRefreshTokenFunction(provider: string): ((refreshToken: string) => Promise<any>) | undefined {
  switch (provider) {
    case 'google':
      return refreshGoogleToken;
    case 'azure':
      return refreshAzureToken;
    case 'okta':
      return refreshOktaToken;
    case 'auth0':
      return refreshAuth0Token;
    case 'custom':
      return refreshCustomToken;
    default:
      return undefined; // GitHub doesn't support refresh tokens
  }
}

/**
 * Refresh Google access token
 */
async function refreshGoogleToken(refreshToken: string): Promise<any> {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId!,
      client_secret: clientSecret!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh Google token: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // Google may return new refresh token
    expiresAt: Date.now() + (data.expires_in * 1000),
    tokenType: data.token_type,
    scope: data.scope,
  };
}

/**
 * Refresh Azure AD access token
 */
async function refreshAzureToken(refreshToken: string): Promise<any> {
  const tenantId = process.env.OAUTH_AZURE_TENANT_ID || 'common';
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId!,
        client_secret: clientSecret!,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to refresh Azure token: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in * 1000),
    tokenType: data.token_type,
    scope: data.scope,
  };
}

/**
 * Refresh Okta access token
 */
async function refreshOktaToken(refreshToken: string): Promise<any> {
  const oktaDomain = process.env.OAUTH_OKTA_DOMAIN;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  const response = await fetch(`https://${oktaDomain}/oauth2/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId!,
      client_secret: clientSecret!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh Okta token: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in * 1000),
    tokenType: data.token_type,
    scope: data.scope,
  };
}

/**
 * Refresh Auth0 access token
 */
async function refreshAuth0Token(refreshToken: string): Promise<any> {
  const auth0Domain = process.env.OAUTH_AUTH0_DOMAIN;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  const response = await fetch(`https://${auth0Domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh Auth0 token: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in * 1000),
    tokenType: data.token_type,
    scope: data.scope,
  };
}

/**
 * Refresh custom OAuth provider access token
 */
async function refreshCustomToken(refreshToken: string): Promise<any> {
  const tokenUrl = process.env.OAUTH_TOKEN_URL;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  if (!tokenUrl) {
    throw new Error('OAUTH_TOKEN_URL is required for custom provider token refresh');
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId!,
      client_secret: clientSecret!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh custom token: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + ((data.expires_in || 3600) * 1000),
    tokenType: data.token_type,
    scope: data.scope,
  };
}

