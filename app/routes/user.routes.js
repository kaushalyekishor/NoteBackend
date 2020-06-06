var express = require('express');
const router = express.Router();
expressValidator = require('express-validator');
var userController = require('../controller/user.controller')
router.use(expressValidator())

//New user Registration
router.post('/signUp', userController.signUp);
//verufy user Account      
router.get('/verifyAccount/:token', userController.confirmAccount);
//Login user Account  
router.get('/Login/', userController.login);     
//get user Token
router.get('/getToken/', userController.getToken);
//user Forget Password       
router.post('/resetPassword/', userController.passwordReset); 
 //user Update password       
router.post('/updatePassword/:token', userController.updatePassword);       

module.exports = router