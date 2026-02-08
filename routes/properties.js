const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Get all properties with filters
router.get('/', async (req, res) => {
    try {
        const { type, location, min_price, max_price, status, limit = 20, offset = 0 } = req.query;
        
        let query = 'SELECT * FROM properties WHERE 1=1';
        const params = [];

        if (type) {
            query += ' AND property_type = ?';
            params.push(type);
        }

        if (location) {
            query += ' AND location LIKE ?';
            params.push(`%${location}%`);
        }

        if (min_price) {
            query += ' AND price >= ?';
            params.push(min_price);
        }

        if (max_price) {
            query += ' AND price <= ?';
            params.push(max_price);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [properties] = await db.execute(query, params);
        
        res.json(properties);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single property
router.get('/:id', async (req, res) => {
    try {
        const [properties] = await db.execute(
            'SELECT * FROM properties WHERE id = ?',
            [req.params.id]
        );

        if (properties.length === 0) {
            return res.status(404).json({ message: 'Property not found' });
        }

        res.json(properties[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search properties
router.get('/search/:term', async (req, res) => {
    try {
        const searchTerm = `%${req.params.term}%`;
        const [properties] = await db.execute(
            'SELECT * FROM properties WHERE title LIKE ? OR location LIKE ? OR description LIKE ?',
            [searchTerm, searchTerm, searchTerm]
        );

        res.json(properties);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;