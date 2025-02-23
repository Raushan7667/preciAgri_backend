const express = require('express');
const router=express.Router()
const {
    SendOtp,
    SignUp,
    Login,
    getUserById,
    getUserByToken,
}=require("../controller/Auth");
const { createAddress, getAllAddresses, deleteAddress } = require('../controller/Address');
const { auth, isUser } = require('../middleware/auth');

router.post("/sendotp", SendOtp)
router.post("/signup",SignUp)
router.post("/login",Login)
router.post('/addaddress',auth,isUser,createAddress)
router.get('/getaddress',auth,isUser,getAllAddresses)
router.delete('/deleteaddress/:id',auth,isUser,deleteAddress)


router.get('/getuserbyid/:userId',auth,isUser,getUserById)
router.get('/getuserbytoken',auth,getUserByToken)

// reset Password
const { resetPassword, resetPasswordToken } = require('../controller/ResetPassword');
router.post('/resetpassword',resetPassword),
router.post('/resetpasswordtoken',resetPasswordToken)

module.exports = router