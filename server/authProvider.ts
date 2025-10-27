import { ConfidentialClientApplication, CryptoProvider, AuthenticationResult } from '@azure/msal-node';
import { Request, Response, NextFunction } from 'express';
import { msalConfig, REDIRECT_URI, POST_LOGOUT_REDIRECT_URI, SCOPES } from './authConfig';
import { storage } from './storage';
import { User } from '@shared/schema';
import axios from 'axios';

declare module 'express-session' {
  interface SessionData {
    accessToken?: string;
    idToken?: string;
    account?: any;
    isAuthenticated?: boolean;
    user?: User;
  }
}

class AuthProvider {
  private msalInstance: ConfidentialClientApplication;
  private cryptoProvider: CryptoProvider;

  constructor() {
    this.msalInstance = new ConfidentialClientApplication(msalConfig);
    this.cryptoProvider = new CryptoProvider();
  }

  login(options: { successRedirect?: string } = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const state = this.cryptoProvider.base64Encode(
          JSON.stringify({
            successRedirect: options.successRedirect || '/dashboard'
          })
        );

        const authCodeUrlRequestParams = {
          state: state,
          scopes: SCOPES,
          redirectUri: REDIRECT_URI
        };

        const authCodeUrl = await this.msalInstance.getAuthCodeUrl(authCodeUrlRequestParams);
        res.redirect(authCodeUrl);
      } catch (error) {
        console.error('Auth login error:', error);
        next(error);
      }
    };
  }

  async completeAuth(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.query.code || !req.query.state) {
        return res.status(400).send('Missing code or state parameter');
      }
     
      const state = JSON.parse(this.cryptoProvider.base64Decode(req.query.state as string));

      const authCodeRequest = {
        code: req.query.code as string,
        scopes: SCOPES,
        redirectUri: REDIRECT_URI,
        state: req.query.state as string
      };
      console.log("authCodeRequest",authCodeRequest)
      const response: AuthenticationResult = await this.msalInstance.acquireTokenByCode(authCodeRequest);
     
      // Get user info from Microsoft Graph
      const userInfo = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${response.accessToken}`
        }
      });

      const azureUser = userInfo.data;
      
      // Only allow pre-approved users to sign in
      let user = await storage.getUserByAzureObjectId(azureUser.id);
      
      
      if (!user) {
        // Try to find user by email (for existing users without Azure Object ID)
        const email = azureUser.mail || azureUser.userPrincipalName;
        user = await storage.getUserByEmail(email);
        
        if (user) {
          // Check if user is active
          if (!user.isActive) {
            return res.status(403).json({ 
              error: 'Your account is not active. Please contact the administrator.' 
            });
          }
          
          // Update existing user with Azure Object ID
        
          user = await storage.updateUser(user.id, {
            azureObjectId: azureUser.id,
            name: azureUser.displayName, // Update name from Azure
          });
        } else {
          // User not found - not pre-approved
          return res.status(403).json({ 
            error: 'Access denied. Your email is not authorized. Please contact the administrator to request access.' 
          });
        }
      } else {
        // Check if user is active
        if (!user.isActive) {
          return res.status(403).json({ 
            error: 'Your account is not active. Please contact the administrator.' 
          });
        }
      }

      // Ensure user is defined at this point
      if (!user) {
        return res.status(500).json({ error: 'Authentication failed' });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);
      
      // Set session data
      req.session.accessToken = response.accessToken;
      req.session.idToken = response.idToken;
      req.session.account = response.account;
      req.session.isAuthenticated = true;
      req.session.user = user;
      
      res.redirect(state.successRedirect);
    } catch (error) {
      console.error('Auth completion error:', error);
      next(error);
    }
  }

  logout() {
    return (req: Request, res: Response) => {
      const logoutUri = `${msalConfig.auth.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${POST_LOGOUT_REDIRECT_URI}`;
      
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
        res.redirect(logoutUri);
      });
    };
  }

  requireAuth() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.session.isAuthenticated && req.session.user) {
        return next();
      } else {
        return res.status(401).json({ error: 'Authentication required' });
      }
    };
  }

  requireAdmin() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.session.isAuthenticated && req.session.user?.role === 'admin') {
        return next();
      } else {
        return res.status(403).json({ error: 'Admin access required' });
      }
    };
  }

  getUser() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.session.user) {
        (req as any).user = req.session.user;
      }
      next();
    };
  }
}

export const authProvider = new AuthProvider();