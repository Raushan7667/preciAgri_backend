const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the user placing the order
        ref: 'User',
        required: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId, // Reference to the product
                ref: 'Product',
                required: true
            },
            size: {
                type: String, // Selected size (e.g., Small, Medium, Large)
                required: true
            },
            selectedprice: {
                type: Number, // Price of the product for the selected size
                required: true
            },
            selectedDiscountedPrice: {
                type: Number, // Discounted price of the product for the selected size
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String, // e.g., 'Credit Card', 'Debit Card', 'UPI', 'Cash on Delivery'
        
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'], // Payment status options
        default: 'Pending'
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], // Order status options
        default: 'Pending'
    },

    paymentId:{
        type: String,
    },
    paymentLink:{
        type: String,

    },
    shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Addresses',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update `updatedAt` timestamp before saving
orderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
