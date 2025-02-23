
const RatingAndReview = require("../models/RatingAndReview");
const Product = require("../models/Product");

// Create a Rating and Review
exports.createRatingAndReview = async (req, res) => {
    try {
        const { productId, rating, review } = req.body;
        const userId = req.user.id; // Assuming user ID from authentication middleware

        // Check if the product exists
        const productExists = await Product.findById(productId);
        if (!productExists) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Check if user has already reviewed this product
        const existingReview = await RatingAndReview.findOne({ user: userId, product: productId });
        if (existingReview) {
            return res.status(400).json({ success: false, message: "You have already reviewed this product" });
        }

        // Create a new review
        const newReview = await RatingAndReview.create({
            user: userId,
            product: productId,
            rating,
            review
        });
           const ratingAndReview = await Product.findByIdAndUpdate(productId, {
                    $push: {
                        ratingandreview: newReview._id
                    }
                }, { new: true })

        res.status(201).json({ success: true, message: "Review added successfully", data: newReview });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error adding review", error: error.message });
    }
};


// Get all ratings and reviews for a specific product
exports.getAllRatingsAndReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check if the product exists
        const productExists = await Product.findById(productId);
        if (!productExists) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Fetch all reviews for the product
        const reviews = await RatingAndReview.find({ product: productId })
            .populate("user", "Name") // Populates user details (only name)
            .sort({ createdAt: -1 }); // Sort by latest reviews

        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching reviews", error: error.message });
    }
};

