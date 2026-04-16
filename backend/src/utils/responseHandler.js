const successResponse = (res, {
  statusCode = 200,
  message = 'Success',
  data = null,
}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, {
  statusCode = 500,
  message = 'Internal server error',
  details = null,
}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    details,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
