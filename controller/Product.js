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

        const image = Array.isArray(req.files.image) ? req.files.image : [req.files.image]

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


// find all product for a seller that listed
exports.getAllProductBySeller = async (req, res) => {
    try {
        const userId = req.user.id
        const products = await Product.find({ sellerId: userId })
        if (!products) {
            return res.status(404).json({
                success: false,
                msg: 'Products not found'
            })
        }

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

// delete products
exports.deleteProduct = async (req, res) => {
    try {
        const userId = req.user.id
        const productId = req.params.productId
        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({
                success: false,
                msg: 'Product not found'
            })
        }

        if (product.sellerId != userId) {
            return res.status(401).json({
                success: false,
                msg: 'You are not authorized to delete this product'
            })
        }

        await Product.findByIdAndDelete(productId)
        // also remove from category and user schema
        await Category.findByIdAndUpdate(product.category, {
            $pull: {
                product: productId
            }
        })
        await User.findByIdAndUpdate(userId, {
            $pull: {
                products: productId
            }
        })
        // send notification to admin

        res.status(200).json({
            success: true,
            msg: 'Product deleted successfully'
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: 'Some thing error while deleting product'
        })
    }
}
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

exports.editProduct = async (req, res) => {
    try {
        const userId = req.user.id
        const productId = req.params.productId
        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({
                success: false,
                msg: 'Product not found'
            })
        }

        // Check if the user is the seller of this product
        if (product.sellerId.toString() !== userId) {
            return res.status(401).json({
                success: false,
                msg: 'You are not authorized to edit this product'
            })
        }

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
        let tag = _tag ? JSON.parse(_tag) : product.tag;

        // Handle image updates if new images are provided
        let updatedImages = product.images;
        if (req.files && req.files.image) {
            const image = req.files.image;
            const uploadedImages = [];
            for (let i = 0; i < image.length; i++) {
                const imagei = image[i];
                const uploadimage = await uploadUmageToCloudinary(imagei, process.env.FOLDER_NAME, 1000, 1000);
                uploadedImages.push(uploadimage.secure_url);
            }
            updatedImages = uploadedImages;
        }

        // If category is being updated, verify it exists
        if (category && category !== product.category.toString()) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return res.status(404).json({
                    success: false,
                    msg: 'New category not found'
                });
            }

            // Remove product from old category
            await Category.findByIdAndUpdate(product.category, {
                $pull: { product: productId }
            });

            // Add product to new category
            await Category.findByIdAndUpdate(category, {
                $push: { product: productId }
            });
        }

        // Update product with new values
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                name: name || product.name,
                price_size: parsedPriceSize || product.price_size,
                category: category || product.category,
                description: description || product.description,
                tag: tag,
                images: updatedImages,
                badges: badges || product.badges,
                fullShopDetails: fullShopDetails || product.fullShopDetails
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            msg: 'Product updated successfully',
            product: updatedProduct
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: 'Something went wrong while updating the product'
        });
    }
}




// Controller to add a seller to an existing product
exports.addSellerToProduct = async (req, res) => {
    try {
        const { id } = req.params; // Product ID from the URL
        const { sellerId, price_size, tags, fullShopDetails } = req.body;

        // Validate required fields
        if (!sellerId || !Array.isArray(price_size) || price_size.length === 0) {
            return res.status(400).json({ error: 'Invalid or missing seller data' });
        }

        if (!Array.isArray(tags)) {
            return res.status(400).json({ error: 'Tags must be an array' });
        }

        if (!fullShopDetails || typeof fullShopDetails !== 'string') {
            return res.status(400).json({ error: 'Invalid shop details' });
        }

        // Find the product and update it by pushing the new seller data
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            {
                $push: {
                    sellers: {
                        sellerId,
                        price_size,
                        tags,
                        fullShopDetails
                    }
                }
            },
            { new: true } // Return the updated document
        );

        // If the product doesn't exist, return a 404 error
        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Return success response with the updated product
        return res.status(200).json({
            message: 'Seller added successfully',
            product: updatedProduct
        });
    } catch (error) {
        console.error('Error adding seller to product:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
