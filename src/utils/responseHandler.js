// utils/responseHandler.js
export const sendResponse = (res, statusCode, message, data = null) => {
    const responsePayload = {
      message,
    };
  
    
    if (data) {
      responsePayload.data = data;
    }
  
    return res.status(statusCode).json(responsePayload);
  };
  