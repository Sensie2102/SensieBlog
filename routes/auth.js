const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dbConn = require('./db');

const dbConnect = dbConn.dbConnect;
const getDb = dbConn.getDb;

let db;

dbConnect((err) => {
    if (!err) {
        console.log("Successful DB Connection in auth routes");
    }
    db = getDb();
});

const SECRET_KEY = process.env.SECRET_KEY || 'your-fallback-secret-key-for-dev';

// POST /auth/signup - Register a new user
router.post('/signup', async (req, res) => {
    const {username, email, password} = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({"error":"Email, password, and name are required"});
    }

    try {
        const existing = await db.collection('users').findOne({email});
        if (existing) {
            return res.status(400).json({"error":"User already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            username: username,
            email: email,
            password: hashedPassword,
            createdAt: new Date()
        };
        
        await db.collection('users').insertOne(newUser);
        return res.status(201).json({"message":"User created successfully"});
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({"error":"Server error"});
    }
});

// POST /auth/login - Authenticate a user and generate a JWT token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
        return res.status(400).json({"error":"Email and password are required"});
    }
  
    try {
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return res.status(401).json({"error":"Invalid credentials"});
        }
  
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({"error":"Invalid credentials"});
        }
  
        const token = jwt.sign(
            { userId: user._id, username: user.username, email: user.email },
            SECRET_KEY,
            { expiresIn: '1h' }
        );
  
        res.status(200).json({ 
            token,
            username: user.username
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({"error":"Server error"});
    }
});
  
module.exports = router;