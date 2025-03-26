const express = require("express");
const cors = require("cors");
const path = require("path");
const auth = require("./middleware/auth");
require("./db").createTables();
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "../public")));

const userRouter = require("./routers/user");
const cartRouter = require("./routers/cart");
const orderRouter = require("./routers/order");
const paymentRouter = require("./routers/payment");
const warehouseRouter = require("./routers/warehouse");
const calculatorRouter = require("./routers/calculator");
const supportRouter = require("./routers/support");

app.use("/user", userRouter);
app.use("/carts", cartRouter);
app.use("/orders", orderRouter);
app.use("/payments", paymentRouter);
app.use("/warehouse", warehouseRouter);
app.use("/calculator", calculatorRouter);
app.use("/support", supportRouter);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

app.get("/cart", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/cart.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/about.html"));
});

app.get("/order", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/order.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server up and running on port ${PORT}!`));
