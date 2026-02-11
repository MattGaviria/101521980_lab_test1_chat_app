const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

//signup route POST api/auth/signup
router.post('/signup', async (req, res) => {
    try { 
        const {username, firstname, lastname, password} = req.body;

        if (!username || !firstname || !lastname || !password) {
            return res.status(400).json({ ok: false, message: 'Please provide all required fields'});
        }

        const existingUser = await User.findOne({username});
        if (existingUser) {
            return res.status(409).json({ ok: false, message: 'Username already exists'});
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            firstname,
            lastname,
            password: hashed
        });
        return res.json({
            ok: true,
            message: 'User created successfully',
            user: { username: user.username, firstname: user.firstname, lastname: user.lastname }
        });
    } catch (err) {
        console.error("Error creating user:", err);

        return res.status(500).json({ ok: false, message: 'Server error' });
    }
});


//Log in route POST api/auth/login
router.post('/login', async (req, res) => {
    try {
        const {username, password} = req.body;

        if (!username || !password) {
            return res.status(400).json({ ok: false, message: 'Please provide all required fields'});
        }

        const user = await User.findOne({username});
        if (!user) {
            return res.status(400).json({ ok: false, message: 'User does not exist'});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ ok: false, message: 'Invalid credentials'});
        }
        return res.json({
            ok: true,
            message: 'Login successful',
            user: { username: user.username, firstname: user.firstname, lastname: user.lastname }
        });
    } catch (err) {
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
});

//Private chat route Get api/auth/users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, { username: 1, _id: 0 }).sort({ username: 1 });
        return res.json({ ok: true, users });
    } catch (err) {
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
});

module.exports = router;