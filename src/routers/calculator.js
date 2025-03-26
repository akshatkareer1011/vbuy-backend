const express = require("express");
const router = new express.Router();
const { calculatePrice, getBookInfo } = require("../services/googlebooks");

router.post("/calculate", (req, res) => {
  const { customPrice } = req.body;
  const costPrice = calculatePrice(customPrice, 0.3);
  res.status(200).send({ costPrice });
});

router.get("/book/:isbn", async (req, res) => {
  const { isbn } = req.params;

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
    };
    res.status(200).send({ book });
  } catch (e) {
    res.status(400).send({ error: "Book not found", e });
  }
});

module.exports = router;
