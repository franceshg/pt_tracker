// wrapper for async middleware. Elimindates the need for try/catch blocks to catch errors
const catchError = handler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

module.exports = catchError;