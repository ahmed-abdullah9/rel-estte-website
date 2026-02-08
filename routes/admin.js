const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateToken, requireAdmin);

// Get all properties for admin
router.get('/properties', async (req, res) => {
    try {
        const [properties] = await db.execute(
            'SELECT * FROM properties ORDER BY created_at DESC'
        );
        res.json(properties);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create property
router.post('/properties', [
    body('title').notEmpty().withMessage('Title is required'),
    body('price').isNumeric().withMessage('Price must be numeric'),
    body('property_type').isIn(['apartment', 'villa', 'office', 'land']).withMessage('Invalid property type'),
    body('status').isIn(['for_sale', 'for_rent']).withMessage('Invalid status'),
    body('location').notEmpty().withMessage('Location is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title, description, price, property_type, status, location,
            area, bedrooms, bathrooms, features, image_url
        } = req.body;

        const [result] = await db.execute(
            'INSERT INTO properties (title, description, price, property_type, status, location, area, bedrooms, bathrooms, features, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, price, property_type, status, location, area, bedrooms, bathrooms, features, image_url]
        );

        res.status(201).json({ message: 'Property created successfully', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update property
router.put('/properties/:id', async (req, res) => {
    try {
        const {
            title, description, price, property_type, status, location,
            area, bedrooms, bathrooms, features, image_url
        } = req.body;

        await db.execute(
            'UPDATE properties SET title=?, description=?, price=?, property_type=?, status=?, location=?, area=?, bedrooms=?, bathrooms=?, features=?, image_url=? WHERE id=?',
            [title, description, price, property_type, status, location, area, bedrooms, bathrooms, features, image_url, req.params.id]
        );

        res.json({ message: 'Property updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete property
router.delete('/properties/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM properties WHERE id = ?', [req.params.id]);
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all inquiries
router.get('/inquiries', async (req, res) => {
    try {
        const [inquiries] = await db.execute(`
            SELECT i.*, p.title as property_title 
            FROM inquiries i 
            LEFT JOIN properties p ON i.property_id = p.id 
            ORDER BY i.created_at DESC
        `);
        res.json(inquiries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update inquiry status
router.put('/inquiries/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await db.execute(
            'UPDATE inquiries SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        res.json({ message: 'Inquiry status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;