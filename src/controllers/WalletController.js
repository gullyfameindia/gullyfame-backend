const WalletService = require("../services/WalletService");
const PaymentService = require("../services/PaymentService");
const Reel = require("../models/Reel");

module.exports = () => {
  const getWallet = async (req, res, next) => {
    console.log("WalletController => getWallet");
    const { userId } = req.body;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const [wallet, transactions] = await Promise.all([
      WalletService().getOrCreateWallet(userId),
      WalletService().listTransactions(userId, page, limit),
    ]);

    req.rData = {
      balance: wallet.balance,
      ...transactions,
    };
    req.msg = "success";
    next();
  };

  // Step 1 of a recharge: create a Razorpay order. The wallet is credited only
  // after the payment is verified (verifyRecharge) or the webhook confirms it.
  const recharge = async (req, res, next) => {
    console.log("WalletController => recharge");
    const { userId } = req.body;
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      req.rCode = 0;
      req.msg = "invalid_amount";
      return next();
    }

    req.rData = await PaymentService().createRechargeOrder(userId, amount);
    req.msg = "payment_order_created";
    next();
  };

  // Step 2: the app sends back what Razorpay Checkout returned on success.
  const verifyRecharge = async (req, res, next) => {
    console.log("WalletController => verifyRecharge");
    const {
      userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    req.rData = await PaymentService().verifyRecharge(userId, {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    req.msg = "wallet_recharged";
    next();
  };

  const rechargeStatus = async (req, res, next) => {
    console.log("WalletController => rechargeStatus");
    const { userId } = req.body;

    req.rData = await PaymentService().getOrderStatus(
      userId,
      req.params.orderId,
    );
    req.msg = "success";
    next();
  };

  const tipCreator = async (req, res, next) => {
    console.log("WalletController => tipCreator");
    const { userId, amount } = req.body;
    const { reelId } = req.params;

    if (!amount || amount <= 0) {
      req.rCode = 0;
      req.msg = "invalid_amount";
      return next();
    }

    const reel = await Reel.findOne({ _id: reelId, isDeleted: { $ne: true } });
    if (!reel) {
      req.rCode = 5;
      req.msg = "reel_not_found";
      return next();
    }

    const data = await WalletService().tip(
      userId,
      reel.author,
      reelId,
      amount,
    );

    req.rData = data;
    req.msg = "tip_sent";
    next();
  };

  return { getWallet, recharge, verifyRecharge, rechargeStatus, tipCreator };
};
