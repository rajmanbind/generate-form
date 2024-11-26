const User = require("../models/user.model.js");
const ApiResponse = require("../utils/apiResponse.js");
const jwt = require("jsonwebtoken");
const verifyJWT = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    // console.log(req.header("Authorization"));
    console.log("token,",req.header("Authorization"))
    if (!token) {
      return res.status(401).json(ApiResponse(401, {}, "Unauthorized Token"));
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      //Todo discuss about frontend
      return res.status(401).json(ApiResponse(401, {}, "Invalid Access Token"));
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json(ApiResponse(401, {}, error?.message || "Invalid Access Token"));
  }
};

module.exports = verifyJWT;
