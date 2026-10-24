const express=require('express');const router=express.Router();const auth=require('../middleware/auth');
const { validerPayoutConfiguration } = require('../utils/validation');const c=require('../controllers/payoutController');router.get('/configuration',auth,c.getConfig);router.put('/configuration',auth,validerPayoutConfiguration,c.setConfig);module.exports=router;
