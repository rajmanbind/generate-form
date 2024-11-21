const express = require("express");
const {
  loginUser,
  registerUser,
  logoutUser,
} = require("../controllers/auth.controller.js");
const verifyJWT = require("../middlewares/auth.middleware.js");
const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);
// protected route
router.post("/logout", verifyJWT,logoutUser);
module.exports = router;
