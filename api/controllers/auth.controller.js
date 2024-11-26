const User = require("../models/user.model.js");
const ApiResponse = require("../utils/apiResponse.js");
const jwt = require("jsonwebtoken");
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = await user.generateRefreshToken();
    const accessToken = await user.generateAccessToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json(ApiResponse(500, null, "Internal server error"));
  }
};
const bcrypt = require("bcrypt");

const registerUser = async (req, res) => {
  const { username, email, password, phone, address } = req.body;

  // Validate required fields
  if (!email || !username || !password) {
    return res
      .status(400)
      .json(ApiResponse(400, null, "All fields are required!"));
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json(ApiResponse(409, null, "User with this email already exists!"));
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const user = await User.create({
      email,
      password: hashedPassword,
      username,
      phone,
      address,
      roles: ["User"],
    });

    // Prepare response object without sensitive data
    const { _id, roles } = user;
    const createdUser = { _id, username, email, phone, address, roles };

    return res
      .status(200)
      .json(ApiResponse(201, createdUser, "User registered successfully!"));
  } catch (error) {
    console.error(`Error during user registration: ${error.message}`, error);
    return res
      .status(500)
      .json(
        ApiResponse(500, null, "Internal server error. Please try again later.")
      );
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json(ApiResponse(400, null, "All fields are required!"));
    }
    const user = await User.findOne({ email });

    // console.log(user);
    if (!user) {
      return res
        .status(401)
        .json(ApiResponse(401, null, "user does not exist!"));
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json(ApiResponse(401, null, "Invalid user credentials"));
    }

    const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        ApiResponse(
          200,
          {
            user: loggedInUser,
            refreshToken,
            accessToken,
          },
          "User logged In Successfully"
        )
      );
  } catch (error) {
    return res.status(500).json(ApiResponse(500, null, error.message));
  }
};
const logoutUser = async (req, res) => {
  try {
    // Clear the user's refresh token in the database
    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { refreshToken: undefined } }, // Unset refreshToken instead of setting it to undefined
      { new: true }
    );

    // Define cookie options
    const options = {
      httpOnly: true,
      secure: true, // Ensure cookies are secure in production
      sameSite: "strict", // Prevent CSRF attacks
    };

    // Clear cookies and respond with success message
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(ApiResponse(200, null, "User logged out successfully"));
  } catch (error) {
    console.error("Error logging out user:", error);

    // Return internal server error response
    return res
      .status(500)
      .json(ApiResponse(500, null, "Internal server error. Please try again."));
  }
};

const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  console.log("Incoming Refresh Token: ", incomingRefreshToken);
  if (!incomingRefreshToken) {
    return res.status(401).json(ApiResponse(401, null, "unauthorized request"));
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return res
        .status(401)
        .json(ApiResponse(401, null, "Invalid refresh token"));
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      return res
        .status(401)
        .json(ApiResponse(401, null, "Refresh token is expired or used"));
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    return res
      .status(401)
      .json(ApiResponse(401, null, error?.message || "Invalid refresh token"));
  }
};
const getCurrentUser = (req, res) => {
  const currentUser = req.user; // The decoded user info added by verifyJWT middleware

  if (!currentUser) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({ user: currentUser });
};

const changeCurrentPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json(ApiResponse(400, null, "All fields are required!"));
    }

    // Find user by ID
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json(ApiResponse(404, null, "User not found!"));
    }

    // Validate old password
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json(ApiResponse(400, null, "Invalid old password"));
    }

    // Update password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(ApiResponse(200, null, "Password changed successfully!"));
  } catch (error) {
    console.error("Error changing password:", error.message);
    return res
      .status(500)
      .json(ApiResponse(500, null, "Internal server error"));
  }
};

const updateAccountDetails = async (req, res) => {
  // const { username, email } = req.body;

  // if (!username || !email) {
  //   return res
  //     .status(400)
  //     .json(ApiResponse(400, null, "All fields are required"));
  // }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username,
        email: email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(ApiResponse(200, user, "Account details updated successfully"));
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
};
