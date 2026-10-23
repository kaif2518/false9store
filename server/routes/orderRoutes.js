const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Jersey = require("../models/Jersey");
const Order = require("../models/Order");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Delivery charge in rupees. Change this one number when you decide it.
const SHIPPING_FEE = 10;

const ORDER_STATUSES = ["placed", "confirmed", "shipped", "delivered", "cancelled"];

// Which status an order may move to next
const NEXT_STATUSES = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const makeOrderNumber = () =>
  `F9-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;

// Creates the Razorpay client only when it is needed, with a clear error if keys are missing
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are missing in server/.env");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// Puts stock back for a list of lines (each line has jersey, size, quantity)
const putStockBack = async (lines) => {
  for (const line of lines) {
    await Jersey.updateOne(
      { _id: line.jersey, "sizes.size": line.size },
      { $inc: { "sizes.$.stock": line.quantity } }
    );
  }
};

// PLACE an order (public: customers do not need to log in)
router.post("/", async (req, res) => {
  const { items, customer, address, paymentMethod } = req.body;

  // 1. check what the customer typed
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Your cart is empty" });
  }
  if (!items.every((i) => mongoose.isValidObjectId(i.jerseyId))) {
    return res.status(400).json({ message: "Invalid jersey in your cart" });
  }
  if (paymentMethod !== "cod" && paymentMethod !== "razorpay") {
    return res.status(400).json({ message: "Please choose a valid payment method" });
  }

  const problems = [];
  if (!customer?.name?.trim()) problems.push("Name is required");
  if (!/^[6-9]\d{9}$/.test(customer?.phone || "")) {
    problems.push("Enter a valid 10-digit mobile number");
  }
  if (!address?.line1?.trim()) problems.push("Address is required");
  if (!address?.city?.trim()) problems.push("City is required");
  if (!address?.state?.trim()) problems.push("State is required");
  if (!/^\d{6}$/.test(address?.pincode || "")) {
    problems.push("Enter a valid 6-digit pincode");
  }
  if (problems.length) return res.status(400).json({ message: problems[0] });

  const taken = []; // stock we have already removed, in case we must put it back
  let createdOrder = null; // the saved order, in case we must delete it

  try {
    // 2. read the real price and stock from the database
    const ids = items.map((i) => i.jerseyId);
    const jerseys = await Jersey.find({ _id: { $in: ids } });
    const lines = [];

    for (const item of items) {
      const jersey = jerseys.find((j) => j._id.toString() === item.jerseyId);
      const quantity = Number(item.quantity);

      if (!jersey) throw new Error("A jersey in your cart is no longer available");
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Invalid quantity");
      }

      const sizeRow = jersey.sizes.find((s) => s.size === item.size);
      if (!sizeRow || sizeRow.stock < quantity) {
        throw new Error(`${jersey.name} (${item.size}) is not available in that quantity`);
      }

      const price =
        jersey.salePrice && jersey.salePrice < jersey.price
          ? jersey.salePrice
          : jersey.price;

      lines.push({
        jersey: jersey._id,
        name: jersey.name,
        team: jersey.team,
        size: item.size,
        price,
        quantity,
      });
    }

    // 3. take the stock, one line at a time, only if enough is still there
    for (const line of lines) {
      const result = await Jersey.updateOne(
        {
          _id: line.jersey,
          sizes: { $elemMatch: { size: line.size, stock: { $gte: line.quantity } } },
        },
        { $inc: { "sizes.$.stock": -line.quantity } }
      );

      if (result.modifiedCount === 0) {
        throw new Error(`${line.name} (${line.size}) just sold out`);
      }
      taken.push(line);
    }

    // 4. save the order
    const itemsTotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

    const order = await Order.create({
      orderNumber: makeOrderNumber(),
      items: lines,
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      },
      address: {
        line1: address.line1,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      },
      paymentMethod,
      itemsTotal,
      shippingFee: SHIPPING_FEE,
      total: itemsTotal + SHIPPING_FEE,
    });
    createdOrder = order;

    // 5. for online payment, ask Razorpay to create a payment order for the real total
    let razorpay = null;

    if (paymentMethod === "razorpay") {
      let rzpOrder;
      try {
        rzpOrder = await getRazorpay().orders.create({
          amount: Math.round(order.total * 100), // paise
          currency: "INR",
          receipt: order.orderNumber,
        });
      } catch (rzpError) {
        console.error("Razorpay order error:", rzpError?.error || rzpError);
        throw new Error(
          "Could not start online payment. Please try again or choose cash on delivery."
        );
      }

      order.razorpayOrderId = rzpOrder.id;
      await order.save();

      razorpay = {
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      };
    }

    res.status(201).json({
      _id: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod,
      razorpay,
    });
  } catch (error) {
    // something failed: delete the saved order (if any) and put back the stock we took
    if (createdOrder) {
      await Order.deleteOne({ _id: createdOrder._id });
    }
    await putStockBack(taken);
    res.status(400).json({ message: error.message });
  }
});

// VERIFY an online payment (public: the signature itself is the proof)
router.post("/verify", async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (
    !mongoose.isValidObjectId(orderId) ||
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    return res.status(400).json({ message: "Invalid payment details" });
  }

  try {
    const order = await Order.findById(orderId);

    if (
      !order ||
      order.paymentMethod !== "razorpay" ||
      order.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({ message: "Payment details do not match this order" });
    }

    // already verified earlier: just confirm again
    if (order.paymentStatus === "paid") {
      return res.json({ _id: order._id, orderNumber: order.orderNumber, total: order.total });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({ message: "This order was cancelled" });
    }

    // recompute the signature with the secret key, then compare
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const given = Buffer.from(razorpay_signature, "utf8");
    const wanted = Buffer.from(expected, "utf8");
    const valid = given.length === wanted.length && crypto.timingSafeEqual(given, wanted);

    if (!valid) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    order.paymentStatus = "paid";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    res.json({ _id: order._id, orderNumber: order.orderNumber, total: order.total });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ message: "Could not verify the payment" });
  }
});

// CANCEL an unpaid online order (customer closed the payment window)
router.post("/cancel", async (req, res) => {
  const { orderId } = req.body;

  if (!mongoose.isValidObjectId(orderId)) {
    return res.status(400).json({ message: "Invalid order" });
  }

  try {
    // claim the order in one step, so the stock is put back only once
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        paymentMethod: "razorpay",
        paymentStatus: "pending",
        orderStatus: "placed",
      },
      { paymentStatus: "failed", orderStatus: "cancelled" },
      { new: true }
    );

    if (!order) {
      return res.json({ message: "Nothing to cancel" });
    }

    await putStockBack(order.items);
    res.json({ message: "Order cancelled" });
  } catch (error) {
    console.error("Cancel error:", error);
    res.status(500).json({ message: "Could not cancel the order" });
  }
});

// ---------- ADMIN ROUTES (protect + admin) ----------

// LIST orders: newest first. Query: status, q (order number or phone), page, limit
router.get("/", protect, admin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);

    const filter = {};
    if (ORDER_STATUSES.includes(req.query.status)) {
      filter.orderStatus = req.query.status;
    }

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q) {
      filter.$or = [
        { orderNumber: new RegExp(escapeRegex(q), "i") },
        { "customer.phone": q },
      ];
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      orders,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      total,
    });
  } catch (error) {
    console.error("List orders error:", error);
    res.status(500).json({ message: "Could not load the orders" });
  }
});

// ONE order
router.get("/:id", protect, admin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid order" });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Could not load the order" });
  }
});

// CHANGE the order status
router.put("/:id/status", protect, admin, async (req, res) => {
  const { orderStatus } = req.body;

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid order" });
  }
  if (!ORDER_STATUSES.includes(orderStatus)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const allowed = NEXT_STATUSES[order.orderStatus] || [];
    if (!allowed.includes(orderStatus)) {
      return res.status(400).json({
        message: `An order that is ${order.orderStatus} cannot be changed to ${orderStatus}`,
      });
    }

    const changes = { orderStatus };

    // cash on delivery: the cash is collected when the order is delivered
    if (orderStatus === "delivered" && order.paymentMethod === "cod") {
      changes.paymentStatus = "paid";
    }
    // an online order that was never paid is now a failed payment
    if (
      orderStatus === "cancelled" &&
      order.paymentMethod === "razorpay" &&
      order.paymentStatus === "pending"
    ) {
      changes.paymentStatus = "failed";
    }

    // claim the change in one step, so two clicks cannot both succeed
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, orderStatus: order.orderStatus },
      changes,
      { new: true }
    );

    if (!updated) {
      return res
        .status(409)
        .json({ message: "This order was just changed. Please reload the page." });
    }

    if (orderStatus === "cancelled") {
      await putStockBack(updated.items);
    }

    let note = "";
    if (
      orderStatus === "cancelled" &&
      updated.paymentMethod === "razorpay" &&
      updated.paymentStatus === "paid"
    ) {
      note = "This order was paid online. Please refund the customer from the Razorpay dashboard.";
    }

    res.json({ order: updated, note });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: "Could not update the order" });
  }
});

module.exports = router;