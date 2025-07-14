export function handleDbError(err) {
  // Duplicate key error (e.g., email or username)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return {
      status: 400,
      message: `${field} already exists`,
    };
  }

  // Validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(val => val.message);
    return {
      status: 400,
      message: messages.join(", "),
    };
  }

  // Cast error (e.g., invalid ObjectId)
  if (err.name === "CastError") {
    return {
      status: 400,
      message: `Invalid ${err.path}: ${err.value}`,
    };
  }

  // Unknown DB error
  return {
    status: 500,
    message: "Database error occurred",
  };
}

