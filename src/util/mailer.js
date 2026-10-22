const nodemailer = require("nodemailer");

const MAIL_USER = process.env.MAIL_USER;
// Gmail: Google Account → Security → 2-Step Verification → App passwords.
const MAIL_APP_PASSWORD = (process.env.MAIL_APP_PASSWORD || "").replace(/\s/g, "");
const MAIL_HOST = process.env.MAIL_HOST || "smtp.gmail.com";
const MAIL_PORT = parseInt(process.env.MAIL_PORT) || 465;
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || "Gully Fame";

let transporter = null;

const isConfigured = () => Boolean(MAIL_USER && MAIL_APP_PASSWORD);

// Lazily built so the server boots without mail credentials.
const getTransporter = () => {
  if (!isConfigured()) {
    throw new Error("mail_not_configured");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: MAIL_PORT,
      secure: MAIL_PORT === 465,
      auth: { user: MAIL_USER, pass: MAIL_APP_PASSWORD },
    });
  }
  return transporter;
};

const sendMail = async ({ to, subject, text, html }) => {
  return getTransporter().sendMail({
    from: `"${MAIL_FROM_NAME}" <${MAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

module.exports = { isConfigured, sendMail };
