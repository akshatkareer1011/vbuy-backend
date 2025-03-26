const express = require("express");
const router = new express.Router();
const db = require("../db").db;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { auth, adminAuth } = require("../middleware/auth");
const getBankDetails = require("../utils/bank_details");
const {
  sendOTPemail,
  sendWelcomeEmail,
  sendCancellationEmail,
} = require("../utils/email");

router.post("/register", async (req, res) => {
  const {
    userID,
    firstName,
    lastName,
    email,
    password,
    mobile_no,
    street,
    city,
    state_,
    pincode,
    otp,
  } = req.body;
  const name = firstName + " " + lastName;
  // console.log(req.body);
  const data = await db.query("SELECT * FROM OTP_VERIFICATION");
  // console.log(data[0]);
  const [otpRows] = await db.query(
    "SELECT OTP, EXPIRES_AT FROM OTP_VERIFICATION WHERE email = ?",
    [email]
  );
  // console.log(otpRows[0].);

  if (otpRows.length === 0 || otpRows[0].OTP !== otp) {
    return res.status(400).json({ error: "Invalid OTP." });
  }

  if (new Date() > new Date(otpRows[0].EXPIRES_AT)) {
    return res.status(400).json({ error: "OTP expired. Request a new one." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const token = jwt.sign({ id: userID, email }, process.env.JWT_SECRET_USER, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const sql1 = `INSERT INTO USERS (userID, firstName, lastName, email, passwd, mobile_no, tokens) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const sql2 = `INSERT INTO USER_ADDRESS (addressID, userID, street, city, state_, pincode) VALUES (?, ?, ?, ?, ?, ?)`;
  try {
    await db.query(sql1, [
      userID,
      firstName,
      lastName,
      email,
      hashedPassword,
      mobile_no,
      JSON.stringify([token]),
    ]);

    await db.query(sql2, [
      userID + "__addr",
      userID,
      street,
      city,
      state_,
      pincode,
    ]);

    await sendWelcomeEmail(name, email);
    await db.query("DELETE FROM OTP_VERIFICATION WHERE email = ?", [email]);

    res.status(201).send({ message: "User created!", token });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }

  //   debug queries
  // try {
  // const data = await db.query("SELECT * FROM USER_ADDRESS");
  // console.log(data[0]);
  // } catch (e) {
  //   console.log(e);
  // }
});

router.post("/request_otp", async (req, res) => {
  const { name, email } = req.body;
  try {
    const { otp, expires_at } = await sendOTPemail(name, email);
    await db.query(
      `INSERT INTO OTP_VERIFICATION (email, OTP, EXPIRES_AT) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE OTP = ?, EXPIRES_AT = ?`,
      [email, otp, expires_at, otp, expires_at]
    );
    res.status(200).send({ message: "OTP sent", otp });
  } catch (e) {
    res.status(500).send({ error: "Error sending OTP", e });
  }
});

router.post("/debug_queries", async (req, res) => {
  try {
    const data = await db.query(`SELECT * FROM SHIPPING`);
    console.log(data[0]);
    res.send();
  } catch (e) {
    console.log(e);
  }
});

router.post("/login", async (req, res) => {
  const { userID, password } = req.body;

  const sql = `SELECT * FROM USERS WHERE userID=?`;
  try {
    const [result] = await db.query(sql, [userID]);

    if (result.length === 0) {
      return res.status(403).send({ error: "Invalid credentials" });
    }

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.passwd);

    if (!isMatch) {
      return res.status(401).send({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.userID, email: user.email },
      process.env.JWT_SECRET_USER,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const response = await db.query(
      `UPDATE USERS SET tokens=JSON_ARRAY_APPEND(tokens, '$', ?)`,
      [token]
    );

    res.status(200).send({ message: "Logged in", token });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

router.post("/logout", auth, async (req, res) => {
  const sql = `UPDATE USERS SET tokens = JSON_REMOVE(tokens, COALESCE(JSON_UNQUOTE(JSON_SEARCH(tokens, 'one', ?)), '$')) WHERE userID = ?`;
  try {
    const response = await db.query(sql, [req.token, req.user.id]);
    res.status(200).send({ message: "Logged out" });
  } catch (e) {
    return res.status(401).send({ error: e });
  }
});

router.post("/logout/all", auth, async (req, res) => {
  const sql = `UPDATE USERS SET tokens = '[]' where userID = ?`;
  try {
    const response = await db.query(sql, [req.user.id]);
    res.status(200).send({ message: "Logged out from all devices" });
  } catch (e) {
    res.status(500).send({ error: "Database error!", e });
  }
});

router.get("/profile", auth, async (req, res) => {
  const { id } = req.user;
  const sql = `SELECT * FROM USERS WHERE userID = ?`;
  try {
    const [result] = await db.query(sql, [id]);

    if (result.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }
    const user = result[0];
    res.status(200).send(user);
  } catch (e) {
    res.status(500).send({ error: "Database error!", e });
  }
});

router.get("/profile/address", auth, async (req, res) => {
  const { id } = req.user;
  const sql = `SELECT * FROM USER_ADDRESS WHERE userID = ?`;
  try {
    const [result] = await db.query(sql, [id]);

    if (result.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }
    const user = result[0];
    res.status(200).send(user);
  } catch (e) {
    res.status(500).send({ error: "Database error!", e });
  }
});

router.get("/all", async (req, res) => {
  const sql = `SELECT * FROM USERS`;
  try {
    const [results] = await db.query(sql);
    res.status(200).send({ results });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

router.patch("/update", auth, async (req, res) => {
  const { id } = req.user;
  const updates = req.body;
  const allowedUpdates = ["email", "passwd", "mobile_no"];

  try {
    const fields = Object.keys(updates).filter(field =>
      allowedUpdates.includes(field)
    );
    var values = Object.values(updates);

    if (fields.length === 0) {
      throw new Error({ error: "No valid fields to update" });
    }

    if (fields.includes("passwd")) {
      const hashedPassword = await bcrypt.hash(updates.passwd, 10);
      values[fields.indexOf("passwd")] = hashedPassword;
    }

    const setClause = fields.map(field => `${field}=?`).join(", ");
    const sql = `UPDATE USERS SET ${setClause} WHERE userID = ?`;

    const result = await db.query(sql, [...values, id]);
    res.status(200).send({ message: "User updated" });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

router.patch("/update/address", auth, async (req, res) => {
  const { id } = req.user;
  const updates = req.body;

  const fields = Object.keys(updates);
  const values = Object.values(updates);

  const setClause = fields.map(field => `${field}=?`).join(", ");
  const sql = `UPDATE USER_ADDRESS SET ${setClause} WHERE userID = ?`;

  try {
    await db.query(sql, [...values, id]);
    res.status(200).send({ message: "Address updated" });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

router.delete("/delete", auth, async (req, res) => {
  const { id, email } = req.user;
  const sql = `DELETE FROM USERS where userID = ?`;
  try {
    const [result] = await db.query(
      `SELECT firstName, lastName FROM USERS WHERE userID=?`,
      [id]
    );
    const name = result[0].firstName + " " + result[0].lastName;
    await db.query(sql, [id]);
    await sendCancellationEmail(name, email);
    res.status(200).send({ message: "User deleted" });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

router.post("/bank_details/create", auth, async (req, res) => {
  const { id } = req.user;
  const { type, bankDetails } = req.body;
  const accountID = id + "__bank";

  try {
    if (type === "bank") {
      const { accountNumber, ifsc, accountHolderName } = bankDetails;
      const { bank, branch, state } = await getBankDetails(ifsc);

      const sql = `INSERT INTO BANK_ACCOUNT (accountID, userID, accountNumber, ifsc, bank, accountHolderName) VALUES (?, ?, ?, ?, ?, ?)`;
      await db.query(sql, [
        accountID,
        id,
        accountNumber,
        ifsc,
        bank + ", " + branch + ", " + state,
        accountHolderName,
      ]);
      return res.status(201).send({ message: "Bank account details added" });
    } else if (type === "vpa") {
      const { vpa_id } = bankDetails;

      const sql = `INSERT INTO BANK_ACCOUNT (accountID, userID, vpaID) VALUES (?, ?, ?)`;
      await db.query(sql, [accountID, id, vpa_id]);
      return res.status(201).send({ message: "VPA details added" });
    }
  } catch (e) {
    res.status(500).send({ error: "Error adding account/vpa", e });
  }
});

router.get("/bank_details", auth, async (req, res) => {
  const { id } = req.user;
  const sql = `SELECT * FROM BANK_ACCOUNT WHERE userID=?`;
  try {
    const [result] = await db.query(sql, [id]);
    const bankAccount = result[0];
    res.status(200).send({ bankAccount });
  } catch (e) {
    res.status(500).send({ error: "Database error", e });
  }
});

router.patch("/bank_details/modify", auth, async (req, res) => {
  const { id } = req.user;
  const { type, bankDetails } = req.body;

  try {
    if (type === "bank") {
      const { accountNumber, ifsc, accountHolderName } = bankDetails;
      const { bank, branch, state } = await getBankDetails(ifsc);

      const sql = `UPDATE BANK_ACCOUNT SET accountNumber=?, ifsc=?, bank=?, accountHolderName=?, vpaID=? WHERE userID=?`;
      await db.query(sql, [
        accountNumber,
        ifsc,
        bank + ", " + branch + ", " + state,
        accountHolderName,
        null,
        id,
      ]);
      return res.status(200).send({ message: "Bank details updated!" });
    } else if (type === "vpa") {
      const { vpa_id } = bankDetails;

      const sql = `UPDATE BANK_ACCOUNT SET vpaID=?, accountNumber=?, ifsc=?, bank=?, accountHolderName=? WHERE userID=?`;
      await db.query(sql, [vpa_id, null, null, null, null, id]);
      return res.status(200).send({ message: "VPA details updated" });
    }
  } catch (e) {
    res.status(500).send({ error: "Error updating bank details", e });
  }
});

module.exports = router;
