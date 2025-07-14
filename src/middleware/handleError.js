import { ApiError } from "./ApiError.js";

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message
  });
};

export const notFound = (req, res, next) => {
  next(new ApiError(404, "Route not found"));
};