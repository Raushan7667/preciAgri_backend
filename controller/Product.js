const Product = require('../models/Product')
const Category = require('../models/Category')
const ParenstCategory = require('../models/ParentCategory');
const User = require('../models/Users')
const { uploadUmageToCloudinary } = require('../utils/ImageUploader')


// create a new Product
exports.createProduct = async (req, res) => {
    try {
        const userId = req.user.id// payload me add kiy tha
        console.log("userId: ", userId)
        const {

            name,
            price_size,
            category,
            description,
            tag: _tag,
            badges,
            fullShopDetails

        } = req.body

        const parsedPriceSize = Array.isArray(price_size) ? price_size : JSON.parse(price_size);

        console.log("req body: ", req.body)
        console.log("name: ", name)
        console.log("price_size: ", price_size)

        console.log("category: ", category)
        console.log("description: ", description)
        console.log("tag: ", _tag)
        console.log("badges: ", badges)

        const image = req.files.image
        console.log("image: ", image)

        let tag = JSON.parse(_tag)
        if (
            !image ||
            !name ||
            !price_size ||
            !category ||
            !description ||
            !badges ||
            !tag ||
            !fullShopDetails


        ) {
            return res.status(400).json(
                {
                    success: false,
                    msg: 'Please fill all fieldss'
                })
        }

        // check if Admin 
        const users = await User.findById(userId)
        if (!users || users.accountType !== "Seller") {
            return res.status(401).json({
                success: false,
                msg: 'Only Seller can create Product'
            })
        }


        // check Category exists
        const categoryExists = await Category.findById(category)
        if (!categoryExists) {
            return res.status(404).json({
                success: false,
                msg: 'Category not found'
            })
        }

        // upload image to cloudinary
        const uploadedImages = [];
        for (var i = 0; i < image.length; i++) {

            const imagei = image[i];
            const uploadimage = await uploadUmageToCloudinary(imagei, process.env.FOLDER_NAME, 1000, 1000)
            uploadedImages.push(uploadimage.secure_url);
        }

        for (var i = 0; i < uploadedImages.length; i++) {
            console.log('image ', i, uploadedImages[i])
        }

        // create Product
        const product = new Product({
            name,
            price_size: parsedPriceSize,
            category,
            description,
            tag,
            images: uploadedImages,
            badges,
            fullShopDetails,
            sellerId: userId
        })
        await product.save()

        // update product in user
        const user = await User.findByIdAndUpdate(userId, {
            $push: {
                products: product._id
            }
        }, { new: true })

        // add new product in category
        const categories = await Category.findByIdAndUpdate(
            { _id: category },
            {
                $push: {
                    product: product._id
                }
            }, { new: true })

        console.log("newly created product", product)

        // response
        res.status(200).json({
            success: true,
            msg: 'Product created successfully',
            product
        })


    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: 'Some thing error while creating product'
        })

    }
}

// find product by id

exports.getProductById = async (req, res) => {
    try {

        const productId = req.params.productId;

        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({
                success: false,
                msg: 'Product not found'
            })
        }

        res.status(200).json({
            success: true,
            msg: 'Product found successfully',
            product
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: 'Some thing error while finding product'
        })
    }
}

// get all products

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()

        res.status(200).json({
            success: true,
            msg: 'Products found successfully',
            products
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: 'Some thing error while finding products'
        })
    }
}

// get product by parent category

exports.getProductsByParentCategory = async (req, res) => {
    try {
        const { parentCategoryId } = req.body;


        const parentCategory = await ParenstCategory.findById(parentCategoryId)
            .populate({
                path: 'subcategories', // Populating subcategories
                populate: {
                    path: 'product', // Populating products inside each subcategory
                },
            });

        if (!parentCategory) {
            return res.status(404).json({ message: 'Parent category not found' });
        }

        // Flattening all products from subcategories into a single array
        const allProducts = parentCategory.subcategories.reduce((acc, subcategories) => {
            return acc.concat(subcategories.product);
        }, []);

        // Return the list of products
        return res.status(200).json(allProducts);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error, please try again' });
    }
};


//   get product by category

exports.getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.body;

        const category = await Category.findById(categoryId)
            .populate('product');

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Return the list of products
        return res.status(200).json(category.product);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error, please try again' });
    }
};


exports.seachProduct = async (req, res) => {
    try {
        let { query, page, limit } = req.query;
        if (!query) return res.status(400).json({ message: "Query is required" });

        const words = query.split(" "); // Split query into words
        const searchRegexArray = words.map(word => new RegExp(word, 'i')); // Create regex for each word

        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);

        const totalProducts = await Product.countDocuments({
            tag: { $in: searchRegexArray } // Match if any tag contains any word
        });

        const products = await Product.find({
            tag: { $in: searchRegexArray }
        })
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize);

        res.json({
            totalProducts,
            totalPages: Math.ceil(totalProducts / pageSize),
            currentPage: pageNumber,
            pageSize,
            products,
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// exports.filterAndSortProducts = async (req, res) => {
//     try {
//         let query = {};
//         let sort = {};
//         let { category, name, tag, minPrice, maxPrice, minDiscount, maxDiscount, sortBy, page, limit, search } = req.query;

//         // Filtering by category, name, or tags
//         if (category) query.category = category;
//         if (name) query.name = { $regex: name, $options: "i" };
//         if (tag) query.tag = { $in: tag.split(",") };

//         // Price range filter
//         if (minPrice || maxPrice) {
//             query["price_size"] = { $elemMatch: {} };
//             if (minPrice) query["price_size"].$elemMatch.price = { $gte: Number(minPrice) };
//             if (maxPrice) query["price_size"].$elemMatch.price = { $lte: Number(maxPrice) };
//         }

//         // Discount percentage filter
//         // if (minDiscount || maxDiscount) {
//         //     query["price_size"] = query["price_size"] || { $elemMatch: {} };
//         //     query["price_size"].$elemMatch["$expr"] = {};

//         //     if (minDiscount) {
//         //         query["price_size"].$elemMatch["$expr"].$gte = [
//         //             { $multiply: [{ $divide: ["$discountedPrice", "$price"] }, 100] },
//         //             Number(minDiscount),
//         //         ];
//         //     }

//         //     if (maxDiscount) {
//         //         query["price_size"].$elemMatch["$expr"].$lte = [
//         //             { $multiply: [{ $divide: ["$discountedPrice", "$price"] }, 100] },
//         //             Number(maxDiscount),
//         //         ];
//         //     }
//         // }

//         // Full-text search (splitting query into words and searching in tags)
//         if (search) {
//             const words = search.split(" ");
//             const searchRegexArray = words.map(word => new RegExp(word, 'i'));
//             query.tag = { $in: searchRegexArray };
//         }

//         // Sorting
//         if (sortBy) {
//             const sortFields = sortBy.split(",");
//             sortFields.forEach(field => {
//                 const order = field.startsWith("-") ? -1 : 1;
//                 const key = field.replace("-", "");

//                 if (key === "price") {
//                     sort["price_size.price"] = order;
//                 } else {
//                     sort[key] = order;
//                 }
//             });
//         } else {
//             sort.createdAt = -1;
//         }

//         // Pagination
//         const pageNumber = parseInt(page) || 1;
//         const pageSize = parseInt(limit) || 15;
//         const skip = (pageNumber - 1) * pageSize;

//         // Fetching minimal product details
//         const products = await Product.aggregate([
//             { $match: query },
//             { $unwind: "$price_size" },
//             { $sort: sort },
//             { $skip: skip },
//             { $limit: pageSize },
//             {
//                 $project: {
//                     _id: 1,
//                     name: 1,
//                     price_size: 1,
//                     images: { $arrayElemAt: ["$images", 0] }, // First image
//                     avgRating: 1,
//                 },
//             },
//         ]);

//         // Total count for pagination
//         const totalProducts = await Product.countDocuments(query);

//         res.status(200).json({
//             success: true,
//             totalProducts,
//             totalPages: Math.ceil(totalProducts / pageSize),
//             currentPage: pageNumber,
//             pageSize,
//             products,
//         });

//     } catch (error) {
//         res.status(500).json({ success: false, message: "Server Error", error: error.message });
//     }
// };


exports.getFilteredProducts = async (req, res) => {
    try {
        const {
            search,
            category,
            minPrice,
            maxPrice,
            minDiscount,
            minRating,
            tags,
            badges,
            sellerId,
            sort = 'newest',
            page = 1,
            limit = 10
        } = req.query;
        // Build the filter object
        const filter = {};

        // Search by name or tags
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { tag: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        //search by category
        if (category) {
            // Split the comma-separated string into an array of IDs
            const categoryIds = category.split(',');
            // Use $in operator to match any product whose category is in the array
            filter.category = { $in: categoryIds };
        }

        // Tags filter (multiple tags possible)
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            filter.tag = { $in: tagArray };
        }

        // Badge filter
        if (badges) {
            filter.badges = badges;
        }

        // Seller filter
        if (sellerId) {
            filter.sellerId = sellerId;
        }

        // Rating filter
        if (minRating) {
            filter.avgRating = { $gte: parseFloat(minRating) };
        }

        // Price filter (needs special handling since price is in an array)
        if (minPrice || maxPrice) {
            filter['price_size.price'] = {};

            if (minPrice) {
                filter['price_size.price'].$gte = parseFloat(minPrice);
            }

            if (maxPrice) {
                filter['price_size.price'].$lte = parseFloat(maxPrice);
            }
        }

        // Discount filter (calculated as percentage)
        if (minDiscount) {
            // We'll handle this in the aggregation pipeline
        }

        // Set up sort options
        let sortOption = {};
        switch (sort) {
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            case 'price_asc':
                // Will use $sort in aggregation pipeline
                break;
            case 'price_desc':
                // Will use $sort in aggregation pipeline
                break;
            case 'rating':
                sortOption = { avgRating: -1 };
                break;
            case 'popularity':
                sortOption = { 'ratings.count': -1 };
                break;
            case 'discount':
                // Will use $sort in aggregation pipeline
                break;
            default:
                sortOption = { createdAt: -1 }; // Default to newest
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build the aggregation pipeline
        const pipeline = [];

        // Match stage (apply filters)
        pipeline.push({ $match: filter });

        // Unwind the price_size array for price/discount filtering
        if (minPrice || maxPrice || minDiscount || sort === 'price_asc' || sort === 'price_desc' || sort === 'discount') {
            pipeline.push({ $unwind: '$price_size' });

            // Additional filtering after unwind
            const additionalMatch = {};

            // Price range filtering (after unwind)
            if (minPrice) {
                additionalMatch['price_size.price'] = additionalMatch['price_size.price'] || {};
                additionalMatch['price_size.price'].$gte = parseFloat(minPrice);
            }

            if (maxPrice) {
                additionalMatch['price_size.price'] = additionalMatch['price_size.price'] || {};
                additionalMatch['price_size.price'].$lte = parseFloat(maxPrice);
            }

            // Discount percentage filtering
            if (minDiscount) {
                pipeline.push({
                    $addFields: {
                        discountPercentage: {
                            $multiply: [
                                {
                                    $divide: [
                                        { $subtract: ['$price_size.price', '$price_size.discountedPrice'] },
                                        '$price_size.price'
                                    ]
                                },
                                100
                            ]
                        }
                    }
                });

                additionalMatch.discountPercentage = { $gte: parseFloat(minDiscount) };
            }

            if (Object.keys(additionalMatch).length > 0) {
                pipeline.push({ $match: additionalMatch });
            }

            // Group back after unwinding
            pipeline.push({
                $group: {
                    _id: '$_id',
                    name: { $first: '$name' },
                    price_size: { $push: '$price_size' },
                    images: { $first: '$images' },
                    avgRating: { $first: '$avgRating' },
                    ratings: { $first: '$ratings' },
                    createdAt: { $first: '$createdAt' },
                    badges: { $first: '$badges' },
                    // Store min/max values for sorting
                    minPrice: { $min: '$price_size.price' },
                    maxPrice: { $max: '$price_size.price' },
                    maxDiscount: {
                        $max: {
                            $cond: [
                                { $eq: ['$price_size.price', 0] },
                                0,
                                {
                                    $multiply: [
                                        {
                                            $divide: [
                                                { $subtract: ['$price_size.price', '$price_size.discountedPrice'] },
                                                '$price_size.price'
                                            ]
                                        },
                                        100
                                    ]
                                }
                            ]
                        }
                    }
                }
            });
        }

        // Sort based on selected option
        if (sort === 'price_asc') {
            pipeline.push({ $sort: { minPrice: 1 } });
        } else if (sort === 'price_desc') {
            pipeline.push({ $sort: { minPrice: -1 } });
        } else if (sort === 'discount') {
            pipeline.push({ $sort: { maxDiscount: -1 } });
        } else {
            pipeline.push({ $sort: sortOption });
        }

        // Pagination
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        // Project only required fields
        pipeline.push({
            $project: {
                _id: 1,
                name: 1,
                price_size: 1,
                images: { $arrayElemAt: ["$images", 0] }, // First image only
                avgRating: 1,
            }
        });

        // Execute the aggregation pipeline
        const products = await Product.aggregate(pipeline);

        // Get total count for pagination
        const countPipeline = [...pipeline];
        // Remove skip, limit and project from count pipeline
        countPipeline.splice(countPipeline.findIndex(stage => Object.keys(stage)[0] === '$skip'), 3);
        countPipeline.push({ $count: 'total' });

        const totalResults = await Product.aggregate(countPipeline);
        const total = totalResults.length > 0 ? totalResults[0].total : 0;

        res.status(200).json({
            success: true,
            data: {
                products,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message
        });
    }
};

/**
 * Get featured products (best sellers, top rated, etc.)
 */
exports.getFeaturedProducts = async (req, res) => {
    try {
        const { type = 'bestSeller', limit = 8 } = req.query;

        let filter = {};
        let sort = {};

        switch (type) {
            case 'bestSeller':
                filter.badges = 'Best Seller';
                sort = { 'ratings.count': -1 };
                break;
            case 'featured':
                filter.badges = 'Featured';
                sort = { createdAt: -1 };
                break;
            case 'newArrival':
                filter.badges = 'New Arrival';
                sort = { createdAt: -1 };
                break;
            case 'topRated':
                filter.avgRating = { $gte: 4 };
                sort = { avgRating: -1 };
                break;
            case 'mostDiscounted':
                // Handled in pipeline
                break;
            default:
                filter = {};
                sort = { createdAt: -1 };
        }

        const pipeline = [
            { $match: filter }
        ];

        if (type === 'mostDiscounted') {
            // Unwind to find items with biggest discounts
            pipeline.push(
                { $unwind: '$price_size' },
                {
                    $addFields: {
                        discountPercentage: {
                            $multiply: [
                                {
                                    $divide: [
                                        { $subtract: ['$price_size.price', '$price_size.discountedPrice'] },
                                        '$price_size.price'
                                    ]
                                },
                                100
                            ]
                        }
                    }
                },
                { $sort: { discountPercentage: -1 } },
                {
                    $group: {
                        _id: '$_id',
                        name: { $first: '$name' },
                        price_size: { $push: '$price_size' },
                        images: { $first: '$images' },
                        avgRating: { $first: '$avgRating' },
                        discountPercentage: { $max: '$discountPercentage' }
                    }
                },
                { $sort: { discountPercentage: -1 } }
            );
        } else {
            pipeline.push({ $sort: sort });
        }

        pipeline.push(
            { $limit: parseInt(limit) },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    price_size: 1,
                    images: { $arrayElemAt: ["$images", 0] },
                    avgRating: 1,
                }
            }
        );

        const products = await Product.aggregate(pipeline);

        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch featured products',
            error: error.message
        });
    }
};

/**
 * Get product recommendations (similar products)
 */
exports.getRecommendedProducts = async (req, res) => {
    try {
        const { productId, limit = 4 } = req.params;

        // Get the product details to find similar ones
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Find similar products based on category and tags
        const recommendedProducts = await Product.aggregate([
            {
                $match: {
                    _id: { $ne: product._id }, // Exclude current product
                    $or: [
                        { category: product.category },
                        { tag: { $in: product.tag } }
                    ]
                }
            },
            // Add a relevance score (more matching tags = higher relevance)
            {
                $addFields: {
                    relevanceScore: {
                        $add: [
                            { $cond: [{ $eq: ["$category", product.category] }, 3, 0] },
                            {
                                $size: {
                                    $setIntersection: ["$tag", product.tag]
                                }
                            }
                        ]
                    }
                }
            },
            { $sort: { relevanceScore: -1, avgRating: -1 } },
            { $limit: parseInt(limit) },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    price_size: 1,
                    images: { $arrayElemAt: ["$images", 0] },
                    avgRating: 1,
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: recommendedProducts
        });
    } catch (error) {
        console.error('Error fetching recommended products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recommended products',
            error: error.message
        });
    }
};