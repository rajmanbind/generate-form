const User = require("../models/user.model.js");
const ApiResponse = require("../utils/apiResponse.js");
const jwt = require("jsonwebtoken")
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

const registerUser = async (req, res) => {
  const { username, email, password, phone, address } = req.body;
  console.log(username, email, password);
  if (!email || !username || !password) {
    return res
      .status(400)
      .json(ApiResponse(400, null, "All fields are required!"));
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    return res
      .status(500)
      .json(
        ApiResponse(409, null, "User with email or username already exist!")
      );
  }

  const user = await User.create({
    email,
    password,
    username,
    phone,
    address,
    roles: ['User'], 
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    return res
      .status(500)
      .json(
        ApiResponse(
          500,
          null,
          "Something went wrong while registering the user"
        )
      );
  }

  return res
    .status(201)
    .json(ApiResponse(200, createdUser, "User registerd successfully!"));
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
            refreshToken,accessToken
          },
          "User logged In Successfully"
        )
      );
  } catch (error) {
    return res.status(500).json(ApiResponse(500, null, error.message));
  }
};

const logoutUser = async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(ApiResponse(200, null, "user logged out"));
};

const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  console.log("Incoming Refresh Token: ",incomingRefreshToken);
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

const getCurrentUser = async (req, res) => {
  return res
    .status(200)
    .json(ApiResponse(200, req.user, "User fetched successfully"));
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
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    return res
      .status(400)
      .json(ApiResponse(400, null, "All fields are required"));
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

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
