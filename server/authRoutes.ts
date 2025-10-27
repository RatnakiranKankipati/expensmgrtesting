import express from 'express';
import { authProvider } from './authProvider';

const router = express.Router();

// Login route - redirects to Microsoft 365 authentication
router.get('/signin', authProvider.login({
  successRedirect: '/dashboard'
}));

// OAuth redirect callback route
router.get('/redirect', async (req, res, next) => {
  await authProvider.completeAuth(req, res, next);
});

// Logout route
router.get('/signout', authProvider.logout());

// Current user info route
router.get('/me', authProvider.requireAuth(), (req, res) => {
  res.json(req.session.user);
});

export default router;