//importing the express
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
//useful in knowing the request comming from the frontend i.e. from user
const morgan = require("morgan");
//mongoose is responsible opration for all mongodb database
const mongoose = require("mongoose");
const cors = require("cors");

//for knowing the type of request sending from the frontend
require("dotenv/config");

//we need to enable cors to allow any application to request api from the server
app.use(cors());
app.options("*", cors()); //http option like get post and other

//for using the variable name decleared in .env file
const api = process.env.API_URL;

////for the get request and the callback of the product route
const categoriesRoutes = require("./routes/categories");
const productRouter = require("./routes/product");
const userRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");

// for the middleware section
app.use(bodyParser.json());
app.use(morgan("tiny"));

//routes
//using the product api route as middleware
app.use(`${api}/products`, productRouter);
app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/users`, userRoutes);
app.use(`${api}/orders`, ordersRoutes);

mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "eshopDatabase",
  })
  .then(() => {
    console.log("Database is connected");
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(3000, () => {
  console.log("server is running http://localhost:3000");
});
