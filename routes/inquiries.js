const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Create inquiry
router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, phone, property_id, inquiry_type, message } = req.body;

        await db.execute(
            'INSERT INTO inquiries (name, email, phone, property_id, inquiry_type, message) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, phone, property_id || null, inquiry_type, message]
        );

        res.status(201).json({ message: 'تم إرسال استفسارك بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;