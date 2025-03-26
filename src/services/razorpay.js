const Razorpay = require("razorpay");
const axios = require("axios");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const BASE_URL = "https://api.razorpay.com/v1";

const createContact = async (name, email, contact) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/contacts`,
      {
        name,
        email,
        contact,
        type: "customer",
      },
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET,
        },
      }
    );
    return response.data.id;
  } catch (e) {
    console.error(e);
    throw new Error(e);
  }
};

const createFundAccountBank = async (
  name,
  contact_id,
  bank_account_number,
  ifs_code
) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/fund_accounts`,
      {
        contact_id,
        account_type: "bank_account",
        bank_account: {
          name,
          ifsc: ifs_code,
          account_number: bank_account_number,
        },
      },
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET,
        },
      }
    );
    return response.data.id;
  } catch (e) {
    throw new Error(e);
  }
};

const createFundAccountVPA = async (contact_id, vpa_id) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/fund_accounts`,
      {
        contact_id,
        account_type: "vpa",
        vpa: {
          address: vpa_id,
        },
      },
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET,
        },
      }
    );
    return response.data.id;
  } catch (e) {
    throw new Error(e);
  }
};

const makePayoutBank = async (fund_account_id, amount) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/payouts`,
      {
        accountNumber: process.env.RAZORPAY_ACCOUNT_NUMBER,
        fund_account_id,
        amount: amount * 100,
        currency: "INR",
        mode: "IMPS",
        purpose: "payout",
        queue_if_low_balance: true,
      },
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET,
        },
      }
    );
    return response.data.id;
  } catch (e) {
    console.error(e);
    throw new Error(e);
  }
};

const makePayoutVPA = async (fund_account_id, amount) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/payouts`,
      {
        accountNumber: process.env.RAZORPAY_ACCOUNT_NUMBER,
        fund_account_id,
        amount: amount * 100,
        currency: "INR",
        mode: "VPA",
        purpose: "payout",
        queue_if_low_balance: true,
      },
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET,
        },
      }
    );
    return response.data.id;
  } catch (e) {
    console.error(e);
    throw new Error(e);
  }
};

module.exports = {
  createContact,
  createFundAccountBank,
  createFundAccountVPA,
  makePayoutBank,
  makePayoutVPA,
};
