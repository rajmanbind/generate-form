const Form = require("../models/form.model.js");
const User = require("../models/user.model.js");
const ApiResponse = require("../utils/apiResponse");
const mongoose = require("mongoose");

// Helper function to handle unauthorized access
const handleUnauthorized = (res) => {
  return res.status(401).json(ApiResponse(401, null, "Unauthorized: User is not authenticated"));
};

// Generate Form API
const generateForm = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user || !req.user._id) {
      return handleUnauthorized(res);
    }

    // Fetch user details using the authenticated user ID
    const userDetails = await User.findById(req.user._id);
    if (!userDetails) {
      return res.status(404).json(ApiResponse(404, null, "User not found"));
    }

    // Create a new form with user details
    const form = new Form({
      formData: { name: userDetails.username, email: userDetails.email ,phone:userDetails.phone,address:userDetails.address},
    });

    // Save the form and associate it with the user
    userDetails.formId = form._id;
    await Promise.all([userDetails.save(), form.save()]);

    // Return success response
    return res.status(201).json(ApiResponse(200, { form }, "Form generated successfully"));

  } catch (error) {
    console.error(error);
    return res.status(500).json(ApiResponse(500, null, "Internal Server Error"));
  }
};

// View Form API
const viewForm = async (req, res) => {
  try {
    // Validate form ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json(ApiResponse(400, null, "Invalid ID format"));
    }

    // Fetch form data by ID
    const formData = await Form.findById(req.params.id);
    if (!formData) {
      return res.status(404).json(ApiResponse(404, null, "Form not found"));
    }

    // Return form data
    return res.status(200).json(ApiResponse(200, formData, "Form details fetched successfully"));

  } catch (error) {
    console.error(error);
    return res.status(500).json(ApiResponse(500, null, "Internal Server Error"));
  }
};

module.exports = { generateForm, viewForm };
