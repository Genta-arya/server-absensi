// utils/responseHandler.js
export const sendResponse = (res, statusCode, message, data = null) => {
    const responsePayload = {
      message,
    };
  
    // Jika data tidak null, tambahkan ke respons
    if (data) {
      responsePayload.data = data;
    }
  
    return res.status(statusCode).json(responsePayload);
  };
  