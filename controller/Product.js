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

exports.filterAndSortProducts = async (req, res) => {
    try {
        let query = {};
        let sort = {};
        let { category, name, tag, minPrice, maxPrice, minDiscount, maxDiscount, sortBy, page, limit, search } = req.query;

        // Filtering by category, name, or tags
        if (category) query.category = category;
        if (name) query.name = { $regex: name, $options: "i" };
        if (tag) query.tag = { $in: tag.split(",") };

        // Price range filter
        if (minPrice || maxPrice) {
            query["price_size"] = { $elemMatch: {} };
            if (minPrice) query["price_size"].$elemMatch.price = { $gte: Number(minPrice) };
            if (maxPrice) query["price_size"].$elemMatch.price = { $lte: Number(maxPrice) };
        }

        // Discount percentage filter
        // if (minDiscount || maxDiscount) {
        //     query["price_size"] = query["price_size"] || { $elemMatch: {} };
        //     query["price_size"].$elemMatch["$expr"] = {};

        //     if (minDiscount) {
        //         query["price_size"].$elemMatch["$expr"].$gte = [
        //             { $multiply: [{ $divide: ["$discountedPrice", "$price"] }, 100] },
        //             Number(minDiscount),
        //         ];
        //     }

        //     if (maxDiscount) {
        //         query["price_size"].$elemMatch["$expr"].$lte = [
        //             { $multiply: [{ $divide: ["$discountedPrice", "$price"] }, 100] },
        //             Number(maxDiscount),
        //         ];
        //     }
        // }

        // Full-text search (splitting query into words and searching in tags)
        if (search) {
            const words = search.split(" ");
            const searchRegexArray = words.map(word => new RegExp(word, 'i'));
            query.tag = { $in: searchRegexArray };
        }

        // Sorting
        if (sortBy) {
            const sortFields = sortBy.split(",");
            sortFields.forEach(field => {
                const order = field.startsWith("-") ? -1 : 1;
                const key = field.replace("-", "");

                if (key === "price") {
                    sort["price_size.price"] = order;
                } else {
                    sort[key] = order;
                }
            });
        } else {
            sort.createdAt = -1;
        }

        // Pagination
        const pageNumber = parseInt(page) || 1;
        const pageSize = parseInt(limit) || 15;
        const skip = (pageNumber - 1) * pageSize;

        // Fetching minimal product details
        const products = await Product.aggregate([
            { $match: query },
            { $unwind: "$price_size" },
            { $sort: sort },
            { $skip: skip },
            { $limit: pageSize },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    price_size: 1,
                    images: { $arrayElemAt: ["$images", 0] }, // First image
                    avgRating: 1,
                },
            },
        ]);

        // Total count for pagination
        const totalProducts = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            totalProducts,
            totalPages: Math.ceil(totalProducts / pageSize),
            currentPage: pageNumber,
            pageSize,
            products,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};