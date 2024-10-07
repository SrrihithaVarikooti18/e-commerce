const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { log } = require('console');

const app = express();
dotenv.config();

const port = process.env.PORT || 4000;
const mongoUrl = process.env.MONGO_URL;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(mongoUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Could not connect to MongoDB:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// File upload configuration
const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Serve static files
app.use('/images', express.static('upload/images'));

// File upload endpoint
app.post("/upload", upload.single('product'), (req, res) => {
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`
  });
});

// Product model
const Product = mongoose.model("Product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String, // Corrected from typeLString to String
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: { // Corrected from avilable to available
    type: Boolean, // Corrected from Boolea to Boolean
    default: true,
  },
});

// Add product endpoint
app.post('/addproduct', async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product = products[products.length - 1];
    id = last_product.id + 1;
  } else {
    id = 1;
  }

  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });

  await product.save();
  console.log("Saved");
  res.json({
    success: true,
    name: req.body.name,
  });
});

// Remove product endpoint
app.post('/removeproduct', async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Removed");
  res.json({
    success: true,
    name: req.body.name
  });
});

// Get all products endpoint
app.get('/allproducts', async (req, res) => {
  let products = await Product.find({});
  console.log("All Products Fetched");
  res.send(products); 
});

const Users= mongoose.model('Users',{
  name:{
    type:String,
  },
  email:{
    type:String,
  unique:true,
  },
  password:{
    type:String,
  },
  cartData:{
    type:Object,
  },
  date:{
    type:Date,
    default:Date.now,
  }
})

app.post('/signup',async(req,res)=>{
  let check=await Users.findOne({email:req.body.email});
  if(check){
    return res.status(400).json({success:false,errors:"existing user found with same email address"})
  }
  let cart={};
  for(let index=0;index<Array.length;index++){
    cart[index]=0;
  }
  const user=new Users({
    name:req.body.username,
    email:req.body.email,
    password:req.body.password,
    cartData:cart,
  })
  await user.save();
  const data={
    user:{
      id:user.id
    }
  }
const token=jwt.sign(data,'secret_ecom');
res.json({success:true,token})
})


app.post('/login',async (req,res)=>{
  let user=await Users.findOne({email:req.body.email});
  if(user){
    const passCompare =req.body.password=== user.password;
    if(passCompare){
      const data={
        user:{
          id:user.id
        }
      }
      const token= jwt.sign(data,'secret_ecom');
      res.json({success:true,token});
    }
    else{
      res.json({success:false,errors:"Wrong Password"});
    }
  }
  else{
    res.json({success:false,errors:"Wrong Email ID"});
  }
})

app.get('/newcollections',async(req,res)=>{
  let products=await Product.find({});
  let newcollection=products.slice(1).slice(-8);
  console.log("NewCollection Fetched");
  res.send(newcollection);
})

app.get('/popularinwomen',async(req,res)=>{
  let products= await Product.find({category:"women"});
  let popular_in_women=products.slice(0,4);
  console.log("Popular in women fetches");
  res.send(popular_in_women);
})

const fetchUser=async (req,res,next)=>{
  const token=req.header('auth-token');
  if(!token){
    res.status(401).send({errors:"please authenticate using validation"})
  }
  else{
    try{
      const data=jwt.verify(token,'secret-ecom');
      req.user=data.user;
      next();
    }
    catch(error){
        res.status(401).send({errors:"please authenticate using "})
    }
  }
}

app.post('/addtocart', fetchUser,async (req,res)=>{
 
  let userData = await Users.findOne({_id:req.user.id});
  userData.cartData[req.body.itemId]+=1;
  await Users.findOneAndUpdate({_id:req.user.id},{cartData:user.cartData});
  res.send("Added")

})
// Start the server
app.listen(port, (error) => {
  if(!error){
  console.log(`Server is running on http://localhost:${port}`)
  }
});
