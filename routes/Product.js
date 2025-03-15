const express = require('express');
const router = express.Router()
const {
    createCategory,
    getCategories,
    getCategoryById,
    createParentCategory,
    getAllParentCategories,
    getParentCategoryById,
    getParentCategoriesList

} = require('../controller/Category');
const { auth, isAdmin, isUser, isSeller } = require('../middleware/auth');
const { createProduct,
    getProductById,
    getAllProducts,
    getProductsByParentCategory,
    getProductsByCategory,
    seachProduct,
    getFilteredProducts } = require('../controller/Product');


router.post('/createparentcategory', auth, isAdmin, createParentCategory)
router.get('/getallparentcategory', getAllParentCategories)
router.get('/getcategorylist', getParentCategoriesList)
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
    removeCartItem, addProductToCartApp, getCartItemsApp, clearCart } = require('../controller/AddToCart');

router.post('/addtocart', auth, isUser, addToProductToCart)
router.post('/addtocartapp', auth, isUser, addProductToCartApp)
router.get('/cartitems', auth, isUser, getCartItems)
router.get('/cartitemsapp', auth, isUser, getCartItemsApp)
router.delete('/removeitem/:id', auth, isUser, removeCartItem)
router.delete('/clearcart', auth, isUser, clearCart);


// wishlist
const { addToWishList, getWishlistProducts, removeFromWishlist, getWishList, getWishlistProductsMinimal } = require('../controller/WishList')
router.post('/addwishlist', auth, isUser, addToWishList)
router.get('/getdetailswishlist', auth, isUser, getWishlistProducts)
router.get('/getminimalwishlist', auth, isUser, getWishlistProductsMinimal)
router.post('/removewishlist', auth, isUser, removeFromWishlist)
router.get('/wishlistid', auth, isUser, getWishList)


router.get('/searchProducts/search', seachProduct)
router.get('/filteredproducts', getFilteredProducts)


// rating and review
const { createRatingAndReview, getAllRatingsAndReviews } = require('../controller/RatingAndReview')
router.post("/create", auth, createRatingAndReview);
router.get("/:productId", getAllRatingsAndReviews);



module.exports = router;