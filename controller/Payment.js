
const Order = require('../models/Order');
const User = require('../models/Users');
const razorpay = require('../config/razorpay');

exports.createPaymentLink = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.user.id;
        const user = await User.findById(userId);

        const order = await Order.findById(orderId).populate('items.product');

        // Check if order exists and if it's authorized for the user
        if (!order || order.userId.toString() !== userId) {
            return res.status(404).json({ message: 'Order not found or not authorized' });
        }

        // Corrected the typo in paymentLinkRequest variable name
        const paymentLinkRequest = {
            amount: order.totalAmount*100,  // Ensure this is in paise (100 = 1 INR)
            currency: 'INR',
            customer: {
                name: user.Name,
                email: user.email,
                contact: "7633020372",  // You can also get this from the User model
            },
            notify: {
                sms: true,
                email: true,
                contact:true //
            },
            reminder_enable: true,
            callback_url: `https://localhost:3000/${orderId}`,  
            callback_method: 'get',  // Assuming 'get' method for callback
        };

        // Razorpay payment link creation
        const paymentLink = await razorpay.paymentLink.create(paymentLinkRequest);

        const paymentLinkId = paymentLink.id;
        const payment_link_url = paymentLink.short_url;
        order.paymentId = paymentLink.id; // Save Razorpay PaymentLink ID
        order.paymentLink = paymentLink.short_url; // Save the payment link URL
        await order.save();

        const resData = {
            paymentLinkId: paymentLinkId,
            payment_link_url,
        };

        console.log(order);
        res.status(200).json({
            success: true,
            data: resData,
            message: 'Payment link created',
            order: order,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during payment' });
    }
};

// update payment information
 exports.updatePaymentInformations=async(req,res)=>{
    try {
        const orderId=req.query.orderId
       
        console.log("order id: " , orderId)
       
        const order= await Order.findById(orderId)
        const paymentId=order.paymentId
        console.log("payment id: " , paymentId)
        if(!paymentId){
            return res.status(404).json({
                success: false,
                message: "Order not found"
            })
        }
       
        const payment=await razorpay.payments.fetch(paymentId)
        console.log("payment details: ", payment)
        if(payment.status==='captured'){
            order.paymentStatus
            order.orderStatus='Processing'
            await order.save()
        }
        res.status(200).json({
            success: true,
            message: "Payment information updated successfully",
            order: order
        })

    } catch (error) {
        console.error("error in updating payment information", error)
        return res.status(500).json({
            success: false,
            message: "Error while updating payment information"
        })
    }


 }
