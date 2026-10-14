const express = require('express');
const router = express.Router();
const { createHotel, getMonHotel, getHotelPublic, getHotels, updateHotel } = require('../controllers/hotelController');
const { getHotelDashboard } = require('../controllers/hotelDashboardController');
const auth = require('../middleware/auth');

router.post('/', auth, createHotel);
router.get('/moi', auth, getMonHotel);
router.put('/moi', auth, updateHotel);
router.get('/dashboard', auth, getHotelDashboard);

router.get('/', getHotels);
router.get('/:id', getHotelPublic);

module.exports = router;
