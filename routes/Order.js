const express = require('express');

const router = express.Router()

const { createOrder, getOrderById, getOrderHistory, getSellerOrderHistory,

} = require('../controller/Order');

const { auth,
    isUser, 
    isSeller} = require('../middleware/auth');
const {  updatePaymentInformations, createPaymentLinkBeforeOrder, handleWebhook, verifyPayment} = require('../controller/Payment');

router.post('/createorder/', auth, isUser, createOrder)
router.post('/createorder/', auth, isUser, createOrder)
router.get('/findeorderbyid/:orderId',auth,isUser,getOrderById)
router.get('/orderhistory',auth,isUser,getOrderHistory)
router.post('/seller/orders',auth,isSeller,getSellerOrderHistory)



// router.post('/createpaymentlink/:orderId',auth,isUser,createPaymentLink)
// router.get('/updatepayemtstatus',auth,isUser,updatePaymentInformations)
router.post('/create-payment-link-before-order',auth,isUser,createPaymentLinkBeforeOrder)
router.post("/payment/verify", auth, verifyPayment);
router.post("/payment/webhook", handleWebhook); 
module.exports = router;
