const router = require('express').Router();
const db = require("../models");
const bcrypt = require('bcrypt');
const jwt = require('json-web-token');

const { User } = db;


const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = await jwt.decode(process.env.JWT_SECRET, token);
        const user = await User.findByPk(decoded.value.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        req.currentUser = user; // ATTACH USER TO REQ //
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

router.post('/', async (req, res) => {
    let user = await User.findOne({
        where: { email: req.body.email }
    });

    if (!user || !await bcrypt.compare(req.body.password, user.passwordDigest)) {
        res.status(404).json({ message: 'Could not find a user with the provided username and password' });
    } else {
        const result = await jwt.encode(process.env.JWT_SECRET, { id: user.userId });
        res.json({ user: user, token: result.value });
    }
});

router.get('/profile', authenticate, async (req, res) => {
    res.json(req.currentUser);
});

module.exports = router;