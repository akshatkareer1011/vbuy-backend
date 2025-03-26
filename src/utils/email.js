require("dotenv").config();
const OTPgen = require("otp-generator");
const SibApiV3Sdk = require("sib-api-v3-sdk");

const genOTP = () => {
  const otp = OTPgen.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  return otp;
};

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.EMAIL_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const sendOTPemail = async (name, email) => {
  const otp = genOTP();
  const message = `<html><head></head><body><h5>${name},</h5><br><p>Thank you for joining VBuy! Use this code to verify yourself: ${otp}</p><br><p style="font-style: italic">This OTP is valid for 5 minutes!</p><br><br><br><p><strong>Team VBuy</strong></p><p style="font-size: 12px">Give Your Old Books A New Life</p></body></html>`;
  const emailData = {
    sender: { name: "VBuy", email: "crypticopgaming@gmail.com" },
    to: [{ email }],
    subject: "Verify your account",
    textContent: message,
  };

  try {
    await emailApi.sendTransacEmail(emailData);
    const expires_at = Date.now() + 5 * 60 * 1000;
    return { otp, expires_at };
  } catch (e) {
    console.error(
      "Error creating order:",
      e.response ? e.response.data : e.message
    );
    throw new Error(e);
  }
};

const sendWelcomeEmail = async (name, email) => {
  const message = `<html><head></head><body><h5>${name},</h5><br><p>Welcome to VBuy. We are happy to have you here.</p><br><br><br><p><strong>Team VBuy</strong></p><p style="font-size: 12px">Give Your Old Books A New Life</p></body></html>`;
  const emailData = {
    sender: { name: "VBuy", email: "crypticopgaming@gmail.com" },
    to: [{ email }],
    subject: "Welcome to VBuy",
    textContent: message,
  };

  try {
    await emailApi.sendTransacEmail(emailData);
  } catch (e) {
    throw new Error(e);
  }
};

const sendCancellationEmail = async (name, email) => {
  const message = `<html><head></head><body><h5>${name},</h5><br><p>Your VBuy account has been deleted successfully. We are sorry to see you go.</p><br><p>Hope to serve you in the future!</p><br><br><br><p><strong>Team VBuy</strong></p><p style="font-size: 12px">Give Your Old Books A New Life</p></body></html>`;
  const emailData = {
    sender: { name: "VBuy", email: "crypticopgaming@gmail.com" },
    to: [{ email }],
    subject: "VBuy account deleted",
    textContent: message,
  };

  try {
    await emailApi.sendTransacEmail(emailData);
  } catch (e) {
    throw new Error(e);
  }
};

const supportEmail = async (name, email, ticketID) => {
  const message = `<html><head></head><body><h5>${name},</h5><br><p>We have received your issue. Your ticket ID is ${ticketID}.</p><br><p>Note that resolution of your issue may take up to 48 hours. We are trying our best to resolve your issue at the earliest.</p><br><br><br><p><strong>Team VBuy</strong></p><p style="font-size: 12px">Give Your Old Books A New Life</p></body></html>`;
  const emailData = {
    sender: { name: "VBuy", email: "crypticopgaming@gmail.com" },
    to: [{ email }],
    subject: `Ticket ${ticketID} raised`,
    textContent: message,
  };

  try {
    await emailApi.sendTransacEmail(emailData);
  } catch (e) {
    throw new Error(e);
  }
};

const supportReply = async (name, email, reply, ticketID) => {
  const message = `<html><head></head><body><h5>${name},</h5><br><p>${reply}</p><br><br><br><p><strong>Team VBuy</strong></p><p style="font-size: 12px">Give Your Old Books A New Life</p></body></html>`;
  const emailData = {
    sender: { name: "VBuy", email: "crypticopgaming@gmail.com" },
    to: [{ email }],
    subject: `Reply: Ticket ${ticketID} resolved!`,
    textContent: message,
  };

  try {
    await emailApi.sendTransacEmail(emailData);
  } catch (e) {
    throw new Error(e);
  }
};

const orderEmail = async (purpose, name, email, order_id) => {
  var message;
  var subject;
  if (purpose === "order_confirm") {
    subject = `Order confirmed - ${order_id}`;
    message = `<html><head></head><body><h5>${name},</h5><br><p>Thank you for placing your order ${order_id}. Your order has been confirmed!</p><br><p>You can track the order from the website.</p><br><br><br><p><strong>Team VBuy</strong></p><p style="font-size: 12px">Give Your Old Books A New Life</p></body></html>`;
  } else if (purpose === "order_cancel") {
    subject = `Order cancelled - ${order_id}`;
    message = `<html><head></head><body><h5>${name},</h5><br><p>Your order ${order_id} has been cancelled!</p><br><br><br><p><strong>Team VBuy</strong></p><p style="font-size: 12px">Give Your Old Books A New Life</p></body></html>`;
  }
  const emailData = {
    sender: { name: "VBuy", email: "crypticopgaming@gmail.com" },
    to: [{ email }],
    subject: subject,
    textContent: message,
  };

  try {
    await emailApi.sendTransacEmail(emailData);
  } catch (e) {
    throw new Error(e);
  }
};

module.exports = {
  sendOTPemail,
  sendWelcomeEmail,
  sendCancellationEmail,
  supportEmail,
  supportReply,
  orderEmail,
};
