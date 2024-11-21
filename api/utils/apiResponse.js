const ApiResponse = (statusCode, data, message = "Success") => {
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    return {
      message,
      success: statusCode < 400,
    };
  }
  return {
    statusCode,
    data,
    message,
    success: statusCode < 400,
  };
};

module.exports = ApiResponse;
