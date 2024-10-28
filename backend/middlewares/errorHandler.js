// backend/middlewares/errorHandler.js

import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
};

export default errorHandler;
