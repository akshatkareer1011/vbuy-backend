const axios = require("axios");
require("dotenv").config();

const email = process.env.SHIPROCKET_EMAIL;
const password = process.env.SHIPROCKET_PASS;
const base_url = "https://apiv2.shiprocket.in/v1/external";

const getAuthTokenSR = async (req, res, next) => {
  let SRtoken = "";
  try {
    if (!SRtoken) {
      const response = await axios.post(`${base_url}/auth/login`, {
        email,
        password,
      });
      SRtoken = response.data.token;
    }
    req.SRtoken = SRtoken;
    next();
  } catch (e) {
    throw new Error(`Hello!!!! ${e}`);
  }
};

const SRTokenLogout = async token => {
  try {
    await axios.post(`${base_url}/orders/create`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    throw new Error(e);
  }
};

const createOrder = async (token, orderDetails) => {
  try {
    const response = await axios.post(
      `${base_url}/orders/create/adhoc`,
      orderDetails,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (e) {
    console.error("Error creating order:", e.response.data);
    throw new Error(e.response ? JSON.stringify(e.response.data) : e.message);
  }
};

const cancelOrder = async (token, order_id) => {
  try {
    const response = await axios.post(
      `${base_url}/orders/cancel`,
      { ids: order_id },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (e) {
    throw new Error(e);
  }
};

const generateShipment = async (token, shipment_id) => {
  try {
    const response = await axios.post(
      `${base_url}/courier/assign/awb`,
      { shipment_id, status: "reassign" },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (e) {
    console.error(e);
    throw new Error(e);
  }
};

const cancelShipment = async (token, awbs) => {
  try {
    const response = await axios.post(
      `${base_url}/orders/cancel/shipment/awbs`,
      { awbs: [awbs] },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (e) {
    console.error(e);
    throw new Error(e);
  }
};

const generateInvoice = async (token, order_id) => {
  try {
    const response = await axios.post(
      `${base_url}/orders/print/invoice`,
      { ids: order_id },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (e) {
    throw new Error(e);
  }
};

module.exports = {
  getAuthTokenSR,
  SRTokenLogout,
  createOrder,
  cancelOrder,
  generateShipment,
  cancelShipment,
  generateInvoice,
};
