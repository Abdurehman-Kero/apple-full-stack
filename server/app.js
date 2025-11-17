const express = require("express");
const mysql = require("mysql2");
const app = express();
const cors = require("cors");
app.use(cors());

const db = mysql.createConnection({
  host: "localhost",
  user: "myDBuser",
  database: "myDB",
  password: "myDBuser",
});

db.connect((err) => {
  if (err) console.log("Db connection failed: ", err.message);
  else console.log("Connected to MySQL database successfully!");
});
app.use(express.urlencoded({ extended: true })); // -----------------------------------------
// TABLE CREATION

app.get("/install", (req, res) => {
  let productTable = `CREATE TABLE IF NOT EXISTS Products (
  product_id INT AUTO_INCREMENT,
  product_url VARCHAR(512) NOT NULL DEFAULT '',
  product_name VARCHAR(255) NOT NULL,
  PRIMARY KEY (product_id)
)`;

  let productDescription = `CREATE TABLE IF NOT EXISTS product_Description (
  Description_id INT AUTO_INCREMENT,
  product_id INT NOT NULL,
  Product_brief_description TEXT NOT NULL,
  Product_description TEXT NOT NULL,
  Product_img VARCHAR(512) NOT NULL,
  Product_link VARCHAR(512) NOT NULL,
  PRIMARY KEY (Description_id),
  FOREIGN KEY (product_id) REFERENCES Products(product_id)
)`;
  let productPrice = `CREATE TABLE IF NOT EXISTS Product_Price (
  price_id INT AUTO_INCREMENT,
  product_id INT NOT NULL,
  starting_price VARCHAR(512) NOT NULL,
  price_range VARCHAR(512) NOT NULL,
  PRIMARY KEY (price_id),
  FOREIGN KEY (product_id) REFERENCES Products(product_id)
)`;

  let orders = `CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (order_id),
  FOREIGN KEY (product_id) REFERENCES Products(product_id)
)`;

  let user = `CREATE TABLE IF NOT EXISTS user (
  user_id INT AUTO_INCREMENT,
  user_name VARCHAR(255) NOT NULL,
  User_password VARCHAR(255) NOT NULL,
  PRIMARY KEY (user_id)
)`;

  db.query(productTable, (err, result) => {
    if (err) console.log(err);
    else console.log("Products_Table created successfully");
  });
  db.query(productDescription, (err, result) => {
    if (err) console.log(err);
    else console.log("productDescription_Table created successfully");
  });
  db.query(productPrice, (err, result) => {
    if (err) console.log(err);
    else console.log("productPrice_Table created successfully");
  });
  db.query(orders, (err, result) => {
    if (err) console.log(err);
    else console.log("orders_Table created successfully");
  });
  db.query(user, (err, result) => {
    if (err) console.log(err);
    else console.log("user_Table created successfully");
  });
  res.send("Table created");
});

// -----------------------------------------
// Middle ware to extract info from the frontend that are sent through json
app.use(express.json());
// -----------------------------------------

app.post("/add-product", (req, res) => {
  const {
    product_name,
    product_url,
    product_brief_description,
    product_description,
    product_img,
    product_link,
    starting_price,
    price_range,
    user_name,
    user_password,
    user_id,
    product_id,
  } = req.body;

  // Insert into Products
  const insertProduct =
    "INSERT INTO Products (product_name, product_url) VALUES (?, ?)";
  db.query(insertProduct, [product_name, product_url], (err, productResult) => {
    if (err) {
      console.log("Product insert error:", err.message);
      return res.status(500).send("Error inserting product");
    }

    const newProductId = productResult.insertId;

    //  Insert into product_Description
    const insertDescription = `
      INSERT INTO product_Description
      (product_id, Product_brief_description, Product_description, Product_img, Product_link)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(
      insertDescription,
      [
        newProductId,
        product_brief_description,
        product_description,
        product_img,
        product_link,
      ],
      (err) => {
        if (err) console.log("Description insert error:", err.message);
      }
    );

    //   Insert into Product_Price
    const insertPrice = `
      INSERT INTO Product_Price (product_id, starting_price, price_range)
      VALUES (?, ?, ?)
    `;
    db.query(
      insertPrice,
      [newProductId, starting_price, price_range],
      (err) => {
        if (err) console.log("Price insert error:", err.message);
      }
    );

    // Insert into user table
    const insertUser = `
      INSERT INTO user (user_name, User_password)
      VALUES (?, ?)
    `;
    db.query(insertUser, [user_name, user_password], (err, userResult) => {
      if (err) {
        console.log("User insert error:", err.message);
        return;
      }

      const newUserId = userResult.insertId;

      //  Insert into orders table (linking user + product)
      const insertOrder = `
        INSERT INTO orders (product_id, user_id)
        VALUES (?, ?)
      `;
      db.query(insertOrder, [newProductId, newUserId], (err) => {
        if (err) console.log("Order insert error:", err.message);
      });
    });

    res.send("Product, user, and order added successfully!");
  });
});

// -----------------------------------------
// DEFAULT ROUTE
// -----------------------------------------
app.get("/", (req, res) => {
  res.send("Up and running!");
});

// Selection part

app.get("/get-product", (req, res) => {
  let selectProduct = `SELECT products.product_id as id, products.product_name AS product, product_price.starting_price AS price FROM products inner join product_price ON products.product_id = product_price.product_id`;
  db.query(selectProduct, (err, results, fields) => {
    if (err) console.log(`error ${err}`);
    res.send(results);
    console.log(results);
  });
});
// -----------------------------------------
// SERVER START
// -----------------------------------------
app.listen(3000, (err) => {
  if (err) console.log(err);
  else console.log("Server is running on: http://localhost:3000/");
});
