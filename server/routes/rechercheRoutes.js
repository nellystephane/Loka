const express=require('express');const router=express.Router();const c=require('../controllers/rechercheController');router.get('/',c.search);module.exports=router;
