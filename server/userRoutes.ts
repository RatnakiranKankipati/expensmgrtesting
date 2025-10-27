import express from 'express';
import { authProvider } from './authProvider';
import { storage } from './storage';
import { insertUserSchema, updateUserSchema } from '@shared/schema';

const router = express.Router();

// Get all users (admin only)
router.get('/', authProvider.requireAdmin(), async (req, res) => {
  try {
    const users = await storage.getUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user (admin only)
router.post('/', authProvider.requireAdmin(), async (req, res) => {
  try {
    const userData = insertUserSchema.omit({ id: true, createdAt: true, updatedAt: true, azureObjectId: true, lastLoginAt: true }).parse(req.body);
    const user = await storage.createUser(userData);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ error: 'Failed to create user' });
  }
});

// Get user by ID (admin only)
router.get('/:id', authProvider.requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await storage.getUserById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user role or status (admin only)
router.put('/:id', authProvider.requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from demoting themselves
    if (id === req.session.user?.id && req.body.role === 'user') {
      return res.status(400).json({ error: 'Cannot demote yourself from admin role' });
    }
    
    const userData = updateUserSchema.partial().parse(req.body);
    const user = await storage.updateUser(id, userData);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).json({ error: 'Failed to update user' });
  }
});

// Toggle user active status (admin only)
router.patch('/:id/status', authProvider.requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    // Prevent admin from deactivating themselves
    if (id === req.session.user?.id && !isActive) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    const user = await storage.updateUser(id, { isActive });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete user (admin only)
router.delete('/:id', authProvider.requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (id === req.session.user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const success = await storage.deleteUser(id);
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;