const express = require("express");
const app = express();
var cors = require("cors");
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());

require("dotenv").config();

const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fiojy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("db connect");
    const productCollection = client
      .db("booksInventory")
      .collection("products");

    //jsonwebtoken create
    app.post("/login", async (req, res) => {
      const email = req.body;
      console.log(email);
      const token = jwt.sign(email, process.env.ACCESS_KEY);
      console.log(token);
      res.send({ token });
    });

    app.get("/products", async (req, res) => {
      const products = await productCollection.find({}).toArray();
      res.send(products);
    });

    app.post("/productupload", async (req, res) => {
      const productin = req.body;

      const result = await productCollection.insertOne(productin);
      res.send({ success: "Upload product Successfully" });
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });

    // update user
    app.put("/product/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      console.log(updatedProduct.quantity);
      console.log(typeof updatedProduct.quantity);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          // name: updatedProduct.name,
          // email: updatedProduct.email,
          quantity: updatedProduct.quantity,
          // price: updatedProduct.price,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.post("/uploadPd", async (req, res) => {
      const product = req.body;
      // console.log("uploadPd", product);
      const tokeninfo = req.headers.authorization;
      // console.log("uploadPd", tokeninfo);

      const [email, accessToken] = tokeninfo?.split(" ");
      // console.log("uploadPd", accessToken);
      const decoded = verifyToken(accessToken);

      // console.log("uploadPd", email, decoded);
      if (email === decoded.email) {
        const result = await productCollection.insertOne(product);
        res.send({ success: "Product Upload Successfully" });
      } else {
        res.send({ success: "unAuthorize" });
      }
    });

    //myitem
    app.get("/myitem", async (req, res) => {
      // const myitem = req.body;

      const tokeninfo = req.headers.authorization;

      const [email, accessToken] = tokeninfo?.split(" ");
      console.log("myitem", accessToken);
      const decoded = verifyToken(accessToken);

      console.log(decoded, decoded.email, email, "myitem");

      if (email === decoded.email) {
        var query = { email: email };
        const orders = await productCollection.find(query).toArray();
        res.send(orders);
      } else {
        res.send({ success: "unAuthorize order name" });
      }
    });

    app.delete("/manageinventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

function verifyToken(token) {
  let email;
  jwt.verify(token, process.env.ACCESS_KEY, function (err, decoded) {
    if (err) {
      email = "Invalid email";
    }
    if (decoded) {
      console.log(decoded);
      email = decoded;
    }
  });
  return email;
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
