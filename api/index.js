const dotenv = require('dotenv');
const express = require('express');
const connectDB = require('./config/db.js');
const cors =require("cors")
const authRoutes = require('./routes/auth.route.js');
const formRoutes = require('./routes/form.route.js');

dotenv.config();
const app = express();
connectDB();

app.use(express.json()); // To parse JSON
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded data
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/form", formRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));