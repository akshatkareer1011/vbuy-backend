const express = require("express");
const router = new express.Router();
const db = require("../db").db;
const { auth, adminAuth } = require("../middleware/auth");
const { supportEmail, supportReply } = require("../utils/email");
const { fromWeb } = require("form-data");

router.post("/raise", auth, async (req, res) => {
  const { id, email } = req.user;
  const { issueSubject, issueMessage } = req.body;

  try {
    const [user] = await db.query(
      `SELECT firstName, lastName FROM USERS WHERE userID=?`,
      [id]
    );
    const name = user[0].firstName + " " + user[0].lastName;

    const [result] = await db.query(`SELECT * FROM SUPPORT WHERE userID=?`, [
      id,
    ]);
    const ticketID = id + "__supp__" + String(result.length + 1);

    const sql = `INSERT INTO SUPPORT (ticketID, userID, issueSubject, issueMessage, ticketStatus) VALUES (?, ?, ?, ?, ?)`;
    await db.query(sql, [ticketID, id, issueSubject, issueMessage, "Open"]);

    await supportEmail(name, email, ticketID);
    res.status(200).send({ message: "Ticket raised" });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

router.patch("/reply/:ticketID", async (req, res) => {
  const { ticketID } = req.params;
  const { reply } = req.body;

  try {
    const [result] = await db.query(
      `SELECT userID FROM SUPPORT WHERE ticketID=?`,
      [ticketID]
    );
    const ticket = result[0];

    const [results] = await db.query(
      `SELECT firstName, lastName, email FROM USERS WHERE userID=?`,
      [ticket.userID]
    );
    const user = results[0];

    const sql = `UPDATE SUPPORT SET replyMessage=?, ticketStatus=? WHERE ticketID=?`;
    await db.query(sql, [reply, "Closed", ticketID]);

    const name = user.firstName + " " + user.lastName;
    const email = user.email;
    await supportReply(name, email, reply, ticketID);

    res.status(200).send({ message: "Ticket resolved" });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

module.exports = router;
