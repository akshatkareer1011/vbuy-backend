const express = require("express");
const router = new express.Router();
const db = require("../db").db;
const { auth } = require("../middleware/auth");
const shipping = require("../services/shiprocket");
const { orderEmail } = require("../utils/email");

router.post("/create", shipping.getAuthTokenSR, auth, async (req, res) => {
  const { id, email } = req.user;
  const SRtoken = req.SRtoken;
  const orderDetails = req.body;

  try {
    const [user] = await db.query(
      `SELECT firstName, lastName FROM USERS WHERE userID=?`,
      [id]
    );

    console.log(user);

    const name = user[0].firstName + " " + user[0].lastName;

    const [result] = await db.query(
      `SELECT cartID, cartTotal, quantity FROM CART WHERE userID=?`,
      [id]
    );

    console.log(result);
    // if (result.length === 0) {
    //   res.status(400).send({ error: "Empty cart" });
    //   return;
    // }

    const [orders] = await db.query(`SELECT * FROM ORDERS WHERE userID=?`, [
      id,
    ]);
    const count = orders.length;
    console.log(count);
    const orderID = "VB-" + id + `-${count + 1}`;

    const response = await shipping.createOrder(SRtoken, orderDetails);
    const sql1 = `INSERT INTO ORDERS (orderID, userID, cartID, item_count, orderTotal, orderDate, orderStatus) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const response1 = await db.query(sql1, [
      orderID,
      id,
      result[0].cartID,
      result[0].quantity[0],
      result[0].cartTotal,
      Date(Date.now()),
      "Confirmed",
    ]);

    console.log(
      orderID,
      id,
      result[0].cartID,
      result[0].quantity[0],
      result[0].cartTotal,
      Date.now(),
      "Confirmed"
    );

    console.log(response1);

    const { order_id, shipment_id } = response;

    const [address] = await db.query(
      `SELECT addressID FROM USER_ADDRESS WHERE userID=?`,
      [id]
    );

    const sql2 = `INSERT INTO SHIPPING (shippingID, ship_orderID, orderID, addressID) VALUES (?, ?, ?, ?)`;
    await db.query(sql2, [
      shipment_id,
      order_id,
      orderID,
      address[0].addressID,
    ]);

    await orderEmail("order_confirm", name, email, orderID);

    res.status(201).send({ message: "Order created" });
  } catch (e) {
    res.status(500).send({ error: "Database error", e: e.message });
  }
});

router.patch(
  "/create/awb/:shipment_id",
  shipping.getAuthTokenSR,
  async (req, res) => {
    const { shipment_id } = req.params;
    const SRtoken = req.SRtoken;

    try {
      const { response } = await shipping.generateShipment(
        SRtoken,
        shipment_id
      );
      const { awb_code, transporter_name } = response.data;

      const sql = `UPDATE SHIPPING SET AWBnumber=?, AWB_transporter=?, shippingStatus=? WHERE shippingID=?`;
      await db.query(sql, [
        awb_code,
        transporter_name,
        "In transit",
        shipment_id,
      ]);

      const [ship] = await db.query(
        `SELECT orderID FROM SHIPPING WHERE shippingID=?`,
        [shipment_id]
      );

      await db.query(`UPDATE ORDERS SET orderStatus=? WHERE orderID=?`, [
        "Completed",
        ship[0].orderID,
      ]);

      res.status(200).send({ message: "AWB created" });
    } catch (e) {
      res.status(500).send({ error: "Database error", e });
    }
  }
);

router.post(
  "/cancel/:order_id",
  shipping.getAuthTokenSR,
  auth,
  async (req, res) => {
    const { order_id } = req.params;
    const { id, email } = req.user;
    const SRtoken = req.SRtoken;

    try {
      const [user] = await db.query(
        `SELECT firstName, lastName FROM USERS WHERE userID=?`,
        [id]
      );
      const name = user[0].firstName + " " + user[0].lastName;

      const response = await shipping.cancelOrder(SRtoken, [order_id]);

      const [ship] = await db.query(
        `SELECT orderID FROM SHIPPING WHERE ship_orderID=?`,
        [order_id]
      );

      await db.query(`UPDATE ORDERS SET orderStatus=? WHERE orderID=?`, [
        "Cancelled",
        ship[0].orderID,
      ]);

      await orderEmail("order_cancel", name, email, ship[0].orderID);

      res.status(202).send({ message: "Order cancelled" });
    } catch (e) {
      res.status(500).send({ error: "Database error", e });
    }
  }
);

router.post(
  "/invoice/:order_id",
  shipping.getAuthTokenSR,
  auth,
  async (req, res) => {
    const SRtoken = req.SRtoken;
    const { order_id } = req.params;

    console.log(order);

    try {
      const response = await shipping.generateInvoice(SRtoken, [order_id]);

      const { invoice_url } = response;

      await db.query(`UPDATE SHIPPING SET invoiceLink=? WHERE ship_orderID=?`, [
        invoice_url,
        order_id,
      ]);

      res.status(200).send({ message: "Invoice generated", invoice_url });
    } catch (e) {
      res.status(500).send({ error: "Database error", e });
    }
  }
);

router.get("/myorders", auth, async (req, res) => {
  const { id } = req.user;

  console.log(id);

  try {
    const [result] = await db.query(`SELECT * FROM ORDERS WHERE userID=?`, [
      id,
    ]);

    if (result.length === 0) {
      res.status(404).send({ message: "No orders found" });
      return;
    }
    res.status(200).send(result);

    console.log(result);
  } catch (e) {
    res.status(500).send({ error: "Database error", e: e.message });
  }
});

router.get("/shipping/:orderID", auth, async (req, res) => {
  const { orderID } = req.params;

  try {
    const [result] = await db.query(`SELECT * FROM SHIPPING WHERE orderID=?`, [
      orderID,
    ]);
    res.status(200).send(result);
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

module.exports = router;
