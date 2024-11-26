const Form = require("../models/form.model.js");
const User = require("../models/user.model.js");
const ApiResponse = require("../utils/apiResponse");
const mongoose = require("mongoose");
//generate form
const generateForm = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json(
          ApiResponse(401, null, "Unauthorized: User is not authenticated")
        );
    }

    // Fetch user details using the authenticated user ID
    const userDetails = await User.findById(req.user._id);
    if (!userDetails) {
      return res.status(404).json(ApiResponse(404, null, "User not found"));
    }

    // Define the current form data
    const currentFormData = {
      name: userDetails.username,
      email: userDetails.email,
      phone: userDetails.phone,
      address: userDetails.address,
    };

    // Check if the user already has an associated form
    let form = await Form.findById(userDetails.formId);

    if (form) {
      // Compare the current form data with the existing form data
      if (JSON.stringify(form.formData) === JSON.stringify(currentFormData)) {
        return res
          .status(200)
          .json(
            ApiResponse(
              200,
              { form },
              "No changes detected. Form update skipped."
            )
          );
      }

      // Update the existing form with the new data
      form.formData = currentFormData;
      await form.save();
    } else {
      // If no form exists, create a new one
      form = new Form({ formData: currentFormData });
      await form.save();

      // Associate the new form with the user
      userDetails.formId = form._id;
      await userDetails.save();
    }

    // Return success response with the updated/created form
    return res
      .status(200)
      .json(ApiResponse(200, { form }, "Form updated successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(ApiResponse(500, null, "Internal Server Error"));
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
    return res
      .status(200)
      .json(ApiResponse(200, formData, "Form details fetched successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(ApiResponse(500, null, "Internal Server Error"));
  }
};

module.exports = { generateForm, viewForm };
