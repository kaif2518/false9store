const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    jersey: { type: mongoose.Schema.Types.ObjectId, ref: "Jersey", required: true },
    name: { type: String, required: true },
    team: { type: String, required: true },
    size: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    items: {
      type: [orderItemSchema],
      validate: (value) => value.length > 0,
    },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true },
      email: { type: String, trim: true, lowercase: true },
    },
    address: {
      line1: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true },
    },
    paymentMethod: { type: String, enum: ["cod", "razorpay"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    orderStatus: {
      type: String,
      enum: ["placed", "confirmed", "shipped", "delivered", "cancelled"],
      default: "placed",
    },
    itemsTotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);