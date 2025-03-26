const express = require("express");
const router = new express.Router();
const db = require("../db").db;
const { adminAuth } = require("../middleware/auth");
const { getBookInfo, calculatePrice } = require("../services/googlebooks");

router.post("/addbook", async (req, res) => {
  const { isbn } = req.body;
  try {
    const Book = await getBookInfo(isbn);
    const volumeInfo = Book.volumeInfo;
    const saleInfo = Book.saleInfo;

    const book = {
      isbn: isbn,
      title:
        volumeInfo.title +
        " " +
        (volumeInfo.subtitle ? volumeInfo.subtitle : ""),
      author: JSON.stringify(volumeInfo.authors),
      publication: volumeInfo.publisher,
      published: volumeInfo.publishedDate,
      mrp:
        saleInfo.saleability === "NOT_FOR_SALE"
          ? null
          : saleInfo.listPrice.amount,
      costPrice:
        saleInfo.saleability === "NOT_FOR_SALE"
          ? null
          : calculatePrice(saleInfo.listPrice.amount, 0.3),
      stock: 1,
    };

    const values = Object.values(book);
    const sql = `INSERT INTO BOOKS VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.query(sql, [...values]);
    res.status(201).send({ message: "Book added" });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/books", async (req, res) => {
  const sql = `SELECT * FROM BOOKS`;
  try {
    const [results] = await db.query(sql);
    res.status(200).send({ results });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

router.get("/books/:isbn", async (req, res) => {
  const isbn = req.params.isbn;
  const sql = `SELECT * FROM BOOKS WHERE isbn=?`;
  try {
    const [result] = await db.query(sql, [isbn]);
    res.status(200).send({ result });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

router.patch("/change_qty", async (req, res) => {
  const { isbn, stockToBeAdded } = req.body;

  try {
    const [result] = await db.query(`SELECT stock FROM BOOKS WHERE isbn=?`, [
      isbn,
    ]);
    var stock = result[0].stock;
    stock += stockToBeAdded;

    const sql = `UPDATE BOOKS SET stock=? WHERE isbn=?`;
    await db.query(sql, [stock, isbn]);
    res.status(200).send({ message: "Stock updated" });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

router.delete("/delete/:isbn", async (req, res) => {
  const isbn = req.params.isbn;
  const sql = `DELETE FROM BOOKS WHERE isbn=?`;
  try {
    await db.query(sql, [isbn]);
    res.status(200).send({ message: "Book deleted" });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

module.exports = router;
