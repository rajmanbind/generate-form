const User = require("../models/user.model.js");
const ApiResponse = require("../utils/apiResponse.js");

const generateToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken };
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

    const { refreshToken } = await generateToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res.status(200).json(
      ApiResponse(
        200,
        {
          user: loggedInUser,
          refreshToken,
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

  return res.status(200).json(ApiResponse(200, null, "user logged out"));
};

module.exports = { registerUser, loginUser, logoutUser };
