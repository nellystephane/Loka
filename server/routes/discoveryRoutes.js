const express=require('express');const router=express.Router();const c=require('../controllers/discoveryController');router.get('/home',c.home);module.exports=router;
