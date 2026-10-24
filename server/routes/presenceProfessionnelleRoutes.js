const express=require('express');const router=express.Router();const auth=require('../middleware/auth');const c=require('../controllers/presenceProfessionnelleController');
router.post('/',auth,c.creer);router.get('/moi',auth,c.moi);router.put('/moi',auth,c.modifier);router.get('/:id',c.publicUne);module.exports=router;
