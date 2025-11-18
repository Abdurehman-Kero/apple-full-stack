const express = require("express");
const mysql = require("mysql2");
const app = express();
const cors = require("cors");
app.use(cors());

// parse URL-encoded bodies and JSON BEFORE routes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

// -----------------------------------------
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

  db.query(productTable, (err) => {
    if (err) console.error("Products table error:", err);
    else console.log("Products_Table created successfully");
  });
  db.query(productDescription, (err) => {
    if (err) console.error("product_Description table error:", err);
    else console.log("productDescription_Table created successfully");
  });
  db.query(productPrice, (err) => {
    if (err) console.error("Product_Price table error:", err);
    else console.log("productPrice_Table created successfully");
  });
  db.query(orders, (err) => {
    if (err) console.error("orders table error:", err);
    else console.log("orders_Table created successfully");
  });
  db.query(user, (err) => {
    if (err) console.error("user table error:", err);
    else console.log("user_Table created successfully");
  });

  res.send("Table creation attempted (check server logs for result).");
});

// -----------------------------------------
// ADD PRODUCT (kept callback style, ensure final response only after all inserts finish)
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
  } = req.body;

  if (!product_name || !product_url) {
    return res.status(400).send("Missing required product fields");
  }

  // Insert into Products
  const insertProduct =
    "INSERT INTO Products (product_name, product_url) VALUES (?, ?)";
  db.query(insertProduct, [product_name, product_url], (err, productResult) => {
    if (err) {
      console.log("Product insert error:", err.message);
      return res.status(500).send("Error inserting product");
    }

    const newProductId = productResult.insertId;

    // Insert into product_Description
    const insertDescription = `
      INSERT INTO product_Description
      (product_id, Product_brief_description, Product_description, Product_img, Product_link)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(
      insertDescription,
      [
        newProductId,
        product_brief_description || "",
        product_description || "",
        product_img || "",
        product_link || "",
      ],
      (err) => {
        if (err) {
          console.log("Description insert error:", err.message);
          // continue; we will not abort here but log error
        }

        // Insert into Product_Price
        const insertPrice = `
          INSERT INTO Product_Price (product_id, starting_price, price_range)
          VALUES (?, ?, ?)
        `;
        db.query(
          insertPrice,
          [newProductId, starting_price || "", price_range || ""],
          (err) => {
            if (err) {
              console.log("Price insert error:", err.message);
              // continue; log error
            }

            // Insert into user table (use backticks around `user` table)
            if (!user_name || !user_password) {
              // If user info not provided, finish with product inserted (no order)
              return res.status(201).send("Product added (no user provided).");
            }

            const insertUser = `
              INSERT INTO \`user\` (user_name, User_password)
              VALUES (?, ?)
            `;
            db.query(
              insertUser,
              [user_name, user_password],
              (err, userResult) => {
                if (err) {
                  console.log("User insert error:", err.message);
                  return res.status(500).send("Error inserting user");
                }

                const newUserId = userResult.insertId;

                // Insert into orders table (linking user + product)
                const insertOrder = `
                INSERT INTO orders (product_id, user_id)
                VALUES (?, ?)
              `;
                db.query(insertOrder, [newProductId, newUserId], (err) => {
                  if (err) {
                    console.log("Order insert error:", err.message);
                    return res.status(500).send("Error inserting order");
                  }

                  // All inserts completed
                  res
                    .status(201)
                    .send("Product, user, and order added successfully!");
                });
              }
            );
          }
        );
      }
    );
  });
});

// -----------------------------------------
// DEFAULT ROUTE
app.get("/", (req, res) => {
  res.send("Up and running!");
});

// Selection part - GET all products (use exact table/column names used in CREATE TABLE)
app.get("/iphones", (req, res) => {
  const selectProduct = `
    SELECT
      p.product_id,
      p.product_name,
      p.product_url,
      pd.Description_id AS description_id,
      pd.Product_brief_description AS brief_description,
      pd.Product_description AS full_description,
      pd.Product_img AS product_img,
      pd.Product_link AS product_link,
      pp.price_id,
      pp.starting_price,
      pp.price_range
    FROM Products p
    LEFT JOIN product_Description pd
      ON pd.product_id = p.product_id
    LEFT JOIN Product_Price pp
      ON pp.product_id = p.product_id;
  `;

  db.query(selectProduct, (err, results) => {
    if (err) {
      console.error("Select error:", err);
      return res.status(500).send("Database error while fetching product");
    }
    res.json(results);
  });
});
app.get("/iphones/:id", (req, res) => {
  const phoneId = req.params.id;
  const selectProduct = `
    SELECT
      p.product_id,
      p.product_name,
      p.product_url,
      pd.Description_id AS description_id,
      pd.Product_brief_description AS brief_description,
      pd.Product_description AS full_description,
      pd.Product_img AS product_img,
      pd.Product_link AS product_link,
      pp.price_id,
      pp.starting_price,
      pp.price_range
    FROM Products p
    LEFT JOIN product_Description pd
      ON pd.product_id = p.product_id
    LEFT JOIN Product_Price pp
      ON pp.product_id = p.product_id
      WHERE P.product_id = ?;
  `;

  db.query(selectProduct,[phoneId], (err, rows) => {
    if (err) {
      console.error("database error:", err);
      return res.status(500).send("Internal server error!");
    } else if (rows.length === 0) {
      res.status(404).send("product not found");
    } else{
       const phone = rows[0]
      res.json(phone);
    }
  });
});



// -----------------------------------------
// SERVER START
app.listen(3000, (err) => {
  if (err) console.log(err);
  else console.log("Server is running on: http://localhost:3000/");
});
