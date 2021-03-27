//import product as the object, as Es6 has object distruction
//create a new object in the curly braces ans assign it in order to use it anywhere

const { Product } = require("../models/product");
const { Category } = require("../models/category");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer"); //importing multer for uploading images

//for defing the file type that is comming to the backend

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

//for handling the image upload to the server
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error(" !!!!Invalid image type!!!! ");

    //check if the file is valid or not
    if (isValid) {
      uploadError = null;
    }
    //assign the upload error value
    //if there is no error the value is assign as null
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    //ading custom file name and replacinf the spaces with - in filename
    const fileName = file.originalname.split(" ").join("-");

    //it will go through the array and check the filetype
    //and assign (key,value) value as the extension
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
  //get item based on the category using the filter parameter
  //link after using the filter seems something like this
  //you can send multiple categories based seperated by comma
  // localhost:3000/api/v1/products?categories=2342342,234234

  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
  }

  const productList = await Product.find(filter).populate("category");

  if (!productList) {
    res.status(500).json({ success: false });
  }
  res.send(productList);
});

router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");

  if (!product) {
    res.status(500).json({ success: false });
  }
  res.send(product);
});

//for the post request and the call back
//uploading single image file to api
router.post(`/`, uploadOptions.single("image"), async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category");

  //checking if there is no file in the frontend
  const file = req.file;
  //if there is no file then showing error
  if (!file)
    return res.status(400).send("!!!!No image file in the request !!!!");

  const fileName = req.file.filename;
  //protocol get the http protocol and host get your local host
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    //first the path and the file name which is uploaded
    image: `${basePath}${fileName}`, // "http://localhost:3000/public/upload/image-2323232"
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  });

  product = await product.save();

  if (!product) return res.status(500).send("The product cannot be created");

  res.send(product);
});

//for updating the product
router.put("/:id", async (req, res) => {
  //checking if the user is passing correct product ID
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Product Id");
  }

  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category");

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: req.body.image,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );

  if (!product) return res.status(500).send("the product cannot be updated!");

  res.send(product);
});

router.delete("/:id", (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then((product) => {
      if (product) {
        return res
          .status(200)
          .json({ success: true, message: "the product is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "product not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

//get the count of number of products in the store
router.get(`/get/count`, async (req, res) => {
  const productCount = await Product.countDocuments((count) => count);

  if (!productCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    productCount: productCount,
  });
});

router.get(`/get/featured/:count`, async (req, res) => {
  //to limit the number of isfeatured product according to the url count
  const count = req.params.count ? req.params.count : 0;
  const products = await Product.find({ isFeatured: true }).limit(+count);

  if (!products) {
    res.status(500).json({ success: false });
  }
  res.send(products);
});

//for uploading multiple image(image gallery)
//adding gallery-images as the route followed by the id of the product
router.put(
  "/gallery-images/:id",
  uploadOptions.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Product Id");
    }
    //getting multiple files from the request
    const files = req.files;

    //image pathes will be the array of strings
    let imagesPaths = [];
    //basepath will be same as uploading a single file
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    //if there is file in req
    //adding the file in array that we have created above along with basePath
    //using the map funcion
    if (files) {
      files.map((file) => {
        imagesPaths.push(`${basePath}${file.filename}`);
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,

      //only the image field is required from the frontend
      {
        images: imagesPaths,
      },
      { new: true }
    );

    if (!product) return res.status(500).send("the gallery cannot be updated!");

    res.send(product);
  }
);

module.exports = router;
