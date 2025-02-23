const express = require('express');
const app = express();
const cors = require('cors');
const fileUpload= require('express-fileupload');
require('dotenv').config();
const database=require('./config/dbConnect')
const cookieParser=require('cookie-parser')
const {cloudinaryConnect}=require('./config/cloudinary')
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors(
    {
        origin:"http://localhost:3000",
        credentials:true
         
    }

));
database.connect()

app.use(
    fileUpload({
        useTempFiles:true,
        tempFileDir:"/tmp",
      
     
    })
)

cloudinaryConnect();
const userRoute=require('./routes/User')
const productRoute=require('./routes/Product')
const orderRoute=require('./routes/Order')

// Routes
app.use("/api/v1/auth",userRoute)
app.use("/api/v1/products",productRoute)
app.use("/api/v1/order",orderRoute)


app.get('/', (req, res) => {
    res.send('Server is running');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
