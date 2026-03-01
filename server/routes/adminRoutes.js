const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
router.put('/users/:id/role', protect, authorize('admin'), async (req, res) => {
    const { role } = req.body;
    if (!['admin', 'doctor', 'patient'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const user = await User.findById(req.params.id);

        if (user) {
            if (user.email === 'admin@pneumodetect.com') {
                return res.status(400).json({ message: 'Cannot modify Super Admin' });
            }
            user.role = role;
            await user.save();
            res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Reset User Password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private/Admin
router.put('/users/:id/reset-password', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.email === 'admin@pneumodetect.com') {
                return res.status(400).json({ message: 'Cannot reset Super Admin password' });
            }
            console.log('Resetting password for user:', user.email);
            user.password = 'password123'; // Logic in User model will hash this
            await user.save();
            console.log('Password reset successful for:', user.email);
            res.json({ message: 'Password reset to password123' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.email === 'admin@pneumodetect.com') {
                return res.status(400).json({ message: 'Cannot delete Super Admin' });
            }
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
