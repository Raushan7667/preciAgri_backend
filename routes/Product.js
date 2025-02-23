const express = require('express');
const router = express.Router()
const {
    createCategory,
    getCategories,
    getCategoryById,
    createParentCategory,
    getAllParentCategories,
    getParentCategoryById,

} = require('../controller/Category');
const { auth, isAdmin, isUser, isSeller } = require('../middleware/auth');
const { createProduct,
    getProductById,
    getAllProducts,
    getProductsByParentCategory,
    getProductsByCategory, 
    seachProduct} = require('../controller/Product');


router.post('/createparentcategory', auth, isAdmin, createParentCategory)
router.get('/getallparentcategory', getAllParentCategories)
router.post('/getonecategory', getParentCategoryById)
router.post("/createcategory", auth, isAdmin, createCategory)
router.get('/getCategory', getCategories)
router.post('/particularcreatecategory', getCategoryById)


router.post("/createproduct", auth, isSeller, createProduct)
router.get('/getproductbyId/:productId', getProductById)
router.get('/getallproduct', getAllProducts)
router.get('/getproductbyparentcategory', getProductsByParentCategory)
router.get('/getproductbycategory', getProductsByCategory)




const { addToProductToCart,
    getCartItems,
    removeCartItem } = require('../controller/AddToCart');

router.post('/addtocart', auth, isUser, addToProductToCart)
router.get('/cartitems', auth, isUser, getCartItems)
router.delete('/removeitem/:id', auth, isUser, removeCartItem)


// wishlist
const { addToWishList, getWishlistProducts, removeFromWishlist, getWishList }=require('../controller/WishList')
router.post('/addwishlist',auth,isUser,addToWishList)
router.get('/getdetailswishlist',auth,isUser,getWishlistProducts)
router.post('/removewishlist',auth,isUser,removeFromWishlist)
router.get('/wishlistid', auth,isUser,getWishList)


router.get('/searchProducts/search',seachProduct)


// rating and review
const { createRatingAndReview, getAllRatingsAndReviews }=require('../controller/RatingAndReview')
router.post("/create", auth, createRatingAndReview); 
router.get("/:productId", getAllRatingsAndReviews); 



module.exports = router;