const User = require('../models/Users')
const Product = require('../models/Product')
const Cart = require('../models/CartItem')
exports.addToProductToCart = async (req, res) => {
    try {
        const { productId, quantity, selectedsize, selecetedDiscountedPrice, selectedPrice } = req.body;
        const userId = req.user.id;

        if (!productId || !quantity || !selectedsize) {
            return res.status(400).json({ message: 'Product ID, quantity, and size are required.' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        let cart = await Cart.findOne({ userId });
        if (cart) {
            // Check if the product with the same size exists in the cart
            const existingItemIndex = cart.items.findIndex(
                (item) =>
                    item.product.toString() === productId && item.selectedsize === selectedsize
            );

            if (existingItemIndex > -1) {
                // Update quantity if the item exists
                cart.items[existingItemIndex].quantity = quantity;
                // Update the selected price and discounted price if the quantity is updated
                cart.items[existingItemIndex].selectedPrice = selectedPrice;
                cart.items[existingItemIndex].selecetedDiscountedPrice = selecetedDiscountedPrice;
            } else {
                // Add a new item to the cart 
                cart.items.push({ product: productId, quantity, selectedsize, selectedPrice, selecetedDiscountedPrice });
            }
        } else {
            // Create a new cart for the user
            cart = new Cart({
                userId,
                items: [{ product: productId, quantity, selectedsize, selectedPrice, selecetedDiscountedPrice }],
            });
        }

        // Save the cart
        await cart.save();

        res.status(200).json({
            message: 'Item added/updated in cart successfully.',
            cart,
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Internal server error.', error });
    }
};

exports.getCartItems = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId }).populate('items.product');
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' })
        }
        res.status(200).json({ cart })

    } catch (error) {

    }
}

exports.removeCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const itemId = req.params.id;
        console.log("itemId: " + itemId);


        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }


        cart.items = cart.items.filter(item => item._id.toString() !== itemId);


        cart.totalPrice = cart.items.reduce((total, item) => total + item.selectedPrice * item.quantity, 0);
        cart.totalDiscountedPrice = cart.items.reduce((total, item) => total + item.selecetedDiscountedPrice * item.quantity, 0);


        await cart.save();

        res.status(200).json({ cart });

    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ message: 'Internal server error.', error });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the user's cart
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Clear items and reset total prices
        cart.items = [];
        cart.totalPrice = 0;
        cart.totalDiscountedPrice = 0;

        await cart.save();

        res.status(200).json({ message: 'Cart cleared successfully', cart });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// using it for app
exports.addProductToCartApp = async (req, res) => {
    try {
        const { productId, quantity, selectedsize, selecetedDiscountedPrice, selectedPrice } = req.body;
        const userId = req.user.id;

        if (!productId || !quantity || !selectedsize) {
            return res.status(400).json({ message: 'Product ID, quantity, and size are required.' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        let cart = await Cart.findOne({ userId });
        if (cart) {
            // Check if the product with the same size exists in the cart
            const existingItemIndex = cart.items.findIndex(
                (item) =>
                    item.product.toString() === productId && item.selectedsize === selectedsize
            );

            if (existingItemIndex > -1) {
                // Update quantity if the item exists
                cart.items[existingItemIndex].quantity = quantity;
                // Update the selected price and discounted price if the quantity is updated
                cart.items[existingItemIndex].selectedPrice = selectedPrice;
                cart.items[existingItemIndex].selecetedDiscountedPrice = selecetedDiscountedPrice;
            } else {
                // Add a new item to the cart 
                cart.items.push({ product: productId, quantity, selectedsize, selectedPrice, selecetedDiscountedPrice });
            }
        } else {
            // Create a new cart for the user
            cart = new Cart({
                userId,
                items: [{ product: productId, quantity, selectedsize, selectedPrice, selecetedDiscountedPrice }],
            });
        }

        // Save the cart
        await cart.save();
        const formattedCart = {
            _id: cart._id,
            userId: cart.userId,
            totalPrice: cart.items.reduce((acc, item) => acc + item.selectedPrice * item.quantity, 0),
            totalDiscountedPrice: cart.items.reduce((acc, item) => acc + item.selecetedDiscountedPrice * item.quantity, 0),
            items: await Promise.all(
                cart.items.map(async (item) => {
                    const productDetails = await Product.findById(item.product).select('name images');
                    return {
                        _id: item._id,
                        productId: item.product,
                        productName: productDetails?.name || 'Unknown',
                        productImage: productDetails?.images?.[0] || '',
                        quantity: item.quantity,
                        selectedsize: item.selectedsize,
                        selectedPrice: item.selectedPrice,
                        selecetedDiscountedPrice: item.selecetedDiscountedPrice,
                    };
                })
            ),
        };

        res.status(200).json({
            message: 'Item added/updated in cart successfully.',
            cart: formattedCart,
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Internal server error.', error });
    }
};

exports.getCartItemsApp = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Format response with product details
        const formattedCart = {
            _id: cart._id,
            userId: cart.userId,
            totalPrice: cart.items.reduce((acc, item) => acc + item.selectedPrice * item.quantity, 0),
            totalDiscountedPrice: cart.items.reduce((acc, item) => acc + item.selecetedDiscountedPrice * item.quantity, 0),
            items: await Promise.all(
                cart.items.map(async (item) => {
                    const productDetails = await Product.findById(item.product).select('name images');
                    return {
                        _id: item._id,
                        productId: item.product,
                        productName: productDetails?.name || 'Unknown',
                        productImage: productDetails?.images?.[0] || '',
                        quantity: item.quantity,
                        selectedsize: item.selectedsize,
                        selectedPrice: item.selectedPrice,
                        selecetedDiscountedPrice: item.selecetedDiscountedPrice,
                    };
                })
            ),
        };

        res.status(200).json({
            message: 'Cart retrieved successfully.',
            cart: formattedCart,
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Internal server error.', error });
    }
};
