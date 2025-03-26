const express = require("express");
const router = new express.Router();
const db = require("../db").db;
const gateway = require("../services/razorpay");
const { auth } = require("../middleware/auth");

router.post("/create", auth, async (req, res) => {
  const { id } = req.user;

  try {
    const [results] = await db.query("SELECT * FROM PAYMENTS WHERE userID=?", [
      id,
    ]);
    const paymentID = id + "__pymt__" + String(results.length + 1);

    const sql = `INSERT INTO PAYMENTS (paymentID, userID) VALUES (?, ?)`;
    await db.query(sql, [paymentID, id]);
    res.status(201).send({ message: "Payment instance created" });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

router.post("/contact/create", auth, async (req, res) => {
  const { id } = req.user;

  try {
    const [result] = await db.query(
      `SELECT firstName, lastName, email, mobile_no FROM USERS WHERE userID=?`,
      [id]
    );
    const user = result[0];

    const contact_id = await gateway.createContact(
      user.firstName + " " + user.lastName,
      user.email,
      user.mobile_no
    );

    await db.query(`UPDATE BANK_ACCOUNT SET contact_id=? WHERE userID=?`, [
      contact_id,
      id,
    ]);

    res.status(201).send({ message: "Contact created" });
  } catch (e) {
    res.status(500).send({ error: "Error creating contact", e });
  }
});

router.post("/fund_account/create/bank", auth, async (req, res) => {
  const { id } = req.user;

  try {
    const [result] = await db.query(
      `SELECT firstName, lastName FROM USERS WHERE userID=?`,
      [id]
    );
    const user = result[0];

    const [bank_acc] = await db.query(
      `SELECT contact_id, accountNumber, ifsc FROM BANK_ACCOUNT WHERE userID=?`,
      [id]
    );
    const account = bank_acc[0];

    const fund_account_id = await gateway.createFundAccountBank(
      user.firstName + " " + user.lastName,
      account.contact_id,
      account.accountNumber,
      account.ifsc
    );

    await db.query(`UPDATE BANK_ACCOUNT SET fund_account_id=? WHERE userID=?`, [
      fund_account_id,
      id,
    ]);
    res.status(201).send({ message: "Fund account created! " });
  } catch (e) {
    res.status(500).send({ error: "Error creating account", e });
  }
});

router.post("/fund_account/create/vpa", auth, async (req, res) => {
  const { id } = req.user;

  try {
    const [bank_acc] = await db.query(
      `SELECT contact_id, vpaID FROM BANK_ACCOUNT WHERE userID=?`,
      [id]
    );
    const account = bank_acc[0];

    const fund_account_id = await gateway.createFundAccountVPA(
      account.contact_id,
      account.vpaID
    );

    await db.query(`UPDATE BANK_ACCOUNT SET fund_account_id=? WHERE userID=?`, [
      fund_account_id,
      id,
    ]);
    res.status(201).send({ message: "Fund account created! " });
  } catch (e) {
    res.status(500).send({ error: "Error creating account", e });
  }
});

router.post("/transfer/bank/:orderID", auth, async (req, res) => {
  const { id } = req.user;
  const { orderID } = req.params;

  try {
    const [account] = await db.query(
      `SELECT fund_account_id FROM BANK_ACCOUNT WHERE userID=?`,
      [id]
    );
    const fund_account_id = account[0].fund_account_id;

    const [order] = await db.query(
      `SELECT orderTotal FROM ORDERS WHERE orderID=?`,
      [orderID]
    );
    const amount = order[0].orderTotal;

    const payout_id = await gateway.makePayoutBank(fund_account_id, amount);

    await db.query(
      `UPDATE PAYMENTS SET transactionID=?, paymentStatus=? where orderID=?`,
      [payout_id, "completed", orderID]
    );
    res.status(200).send({ message: "Payout successful" });
  } catch (e) {
    res.status(500).send({ error: "Error making payout", e });
  }
});

router.post("/transfer/vpa/:orderID", auth, async (req, res) => {
  const { id } = req.user;
  const { orderID } = req.params;

  try {
    const [account] = await db.query(
      `SELECT fund_account_id FROM BANK_ACCOUNT WHERE userID=?`,
      [id]
    );
    const fund_account_id = account[0].fund_account_id;

    const [order] = await db.query(
      `SELECT orderTotal FROM ORDERS WHERE orderID=?`,
      [orderID]
    );
    const amount = order[0].orderTotal;

    const payout_id = await gateway.makePayoutVPA(fund_account_id, amount);

    await db.query(
      `UPDATE PAYMENTS SET transactionID=?, paymentStatus=? where orderID=?`,
      [payout_id, "completed", orderID]
    );

    res.status(200).send({ message: "Payout successful" });
  } catch (e) {
    res.status(500).send({ error: "Error making payout", e });
  }
});

module.exports = router;
