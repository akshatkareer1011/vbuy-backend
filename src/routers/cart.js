const express = require("express");
const router = new express.Router();
const db = require("../db").db;
const { auth } = require("../middleware/auth");

router.post("/additem", auth, async (req, res) => {
  const { isbn, quantity, costPrice } = req.body;
  const { id } = req.user;
  const cartID = id + "__cart";
  const cartStatus = "full";

  console.log(req.body);

  try {
    const [results] = await db.query(`SELECT * FROM CART WHERE userID=?`, [id]);
    if (results.length === 0) {
      console.log("hi");
      await db.query(
        `INSERT INTO CART (cartID, userID, isbn, quantity, costPrice, cartTotal, cartStatus) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          cartID,
          id,
          JSON.stringify([isbn]),
          JSON.stringify([quantity]),
          JSON.stringify([costPrice]),
          costPrice ? costPrice * quantity : 0,
          cartStatus,
        ]
      );
      return res.status(201).send({ message: "Added to cart" });
    } else if (results.length > 0) {
      const cart = results[0];
      console.log(cart);
      const cartTotal = Number(cart.cartTotal) + costPrice * quantity;
      const count = cart.isbn.filter(ISBN => ISBN === isbn);
      if (count.length !== 0) {
        const index = cart.isbn.indexOf(isbn);
        const sql = `UPDATE CART SET quantity=JSON_SET(quantity, '$[${index}]', ?), costPrice=JSON_SET(costPrice, '$[${index}]', ?), cartTotal=?, cartStatus=? WHERE cartID=?`;
        await db.query(sql, [
          quantity + cart.quantity[index],
          costPrice,
          cartTotal,
          cartStatus,
          cartID,
        ]);
        return res.status(200).send({ message: "Cart updated" });
      }
      const sql = `UPDATE CART SET isbn=JSON_ARRAY_APPEND(isbn, '$', ?), quantity=JSON_ARRAY_APPEND(quantity, '$', ?), costPrice=JSON_ARRAY_APPEND(costPrice, '$', ?), cartTotal=?, cartStatus=? WHERE cartID=?`;
      await db.query(sql, [
        isbn,
        quantity,
        costPrice,
        quantity * costPrice,
        cartStatus,
        cartID,
      ]);
      console.log("Hello");
      res.status(200).send({ message: "Cart updated" });
    }
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

router.get("/", auth, async (req, res) => {
  const { id } = req.user;
  const sql = `SELECT * FROM CART WHERE userID=?`;
  try {
    const [result] = await db.query(sql, [id]);
    res.status(200).send({ result });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

router.delete("/delete", auth, async (req, res) => {
  const { id } = req.user;
  const sql = `DELETE FROM CART WHERE userID=?`;
  try {
    await db.query(sql, [id]);
    res.status(200).send({ message: "Cart emptied!" });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

module.exports = router;
