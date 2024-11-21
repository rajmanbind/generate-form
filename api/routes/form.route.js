const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware.js");
const { generateForm, viewForm } = require("../controllers/form.controller.js");
const router = express.Router();

// Generate Form
router.post("/generate-form", authMiddleware, generateForm);
// View Form
router.get("/form/:id", authMiddleware, viewForm);

module.exports = router;
