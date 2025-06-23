const express = require('express');

const router = express.Router()

const { createOrder, getOrderById, getOrderHistory, getSellerOrderHistory, getOrderHistoryApp,

} = require('../controller/Order');

const { auth,
    isUser,
    isSeller } = require('../middleware/auth');
const { updatePaymentInformations, createPaymentLinkBeforeOrder, handleWebhook, verifyPayment, createPaymentApp, verifyPaymentApp } = require('../controller/Payment');

router.post('/createorder/', auth, isUser, createOrder)
router.get('/findeorderbyid/:orderId', auth, isUser, getOrderById)
router.get('/orderhistory', auth, isUser, getOrderHistory)
router.get('/orderhistoryapp', auth, isUser, getOrderHistoryApp)
router.post('/seller/orders', auth, isSeller, getSellerOrderHistory)



// router.post('/createpaymentlink/:orderId',auth,isUser,createPaymentLink)
// router.get('/updatepayemtstatus',auth,isUser,updatePaymentInformations)
router.post('/create-payment-link-before-order', auth, isUser, createPaymentLinkBeforeOrder)
router.post("/payment/verify", auth, verifyPayment);
router.post("/payment/webhook", handleWebhook);
router.post('/create-payment-app', auth, createPaymentApp)
router.post("/verify-payment-app", auth, verifyPaymentApp);
module.exports = router;
