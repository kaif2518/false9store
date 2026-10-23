require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/jerseys", require("./routes/jerseyRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/uploads", require("./routes/uploadRoutes"));

app.get("/", (req, res) => {
  res.json({ message: "Jersey store API is running" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});