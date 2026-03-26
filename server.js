import express from "express";
import mongoose from "mongoose";

const app = express();

// ✅ ADD BOTH (VERY IMPORTANT)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/portfolioDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Schema
const Contact = mongoose.model("Contact", {
  name: String,
  email: String,
  subject: String,
  message: String
});

// Route
app.post("/contact", async (req, res) => {
  try {
    console.log(req.body); // 👈 DEBUG (see data)
    await Contact.create(req.body);
    res.send("Message Saved ✅");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error ❌");
  }
});

// Server
app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});