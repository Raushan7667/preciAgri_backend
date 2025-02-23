const Wishlist = require('../models/WishList');
const Product=require('../models/Product')

exports.addToWishList =async(req,res)=>{
    try {
        const userId = req.user.id;
        const { productId } = req.body;
        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId, items: [] });
        }
        const exists = wishlist.items.some(item => item.productId.toString() === productId);
        if (!exists) {
            wishlist.items.push({ productId });
            await wishlist.save();
        }
        res.status(200).json(wishlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
exports.getWishList=async(req,res)=>{
    try {
        const userId = req.user.id;
        const wishlist = await Wishlist.findOne({ userId })
        .populate({
            path: 'items',
            // select: '_id', // Only include the product ID
        });

    // Extract and return only the product IDs
    const productIds = wishlist ? wishlist.items.map(item => item.productId._id) : [];
        res.status(200).json(wishlist);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
}

exports.getWishlistProducts = async (req, res) => {
    try {
        const userId = req.user.id; // Assume user ID comes from authentication middleware
        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
            return []; // Return an empty array if no items in wishlist
        }
    
        // Extract product IDs from the wishlist
        const productIds = wishlist.items.map((item) => item.productId);
    
        // Fetch product details from the Product model
        const products = await Product.find({ _id: { $in: productIds } });

        res.status(200).json({ products });
    } catch (error) {
        console.error('Error in getWishlistProducts controller:', error);
        res.status(500).json({ message: 'Failed to fetch wishlist products' });
    }
};

exports.removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;
        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) throw new Error('Wishlist not found');
        wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
        await wishlist.save();
        res.status(200).json(wishlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};