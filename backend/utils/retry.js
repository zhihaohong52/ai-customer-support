// backend/utils/retry.js

/**
 * Retries a function with exponential backoff.
 * @param {Function} fn - The function to retry.
 * @param {number} retries - Number of retries.
 * @param {number} delay - Initial delay in milliseconds.
 * @returns {Promise<any>} - The result of the function.
 */
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      console.log(`Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
    }
  };

  export default retryWithBackoff;
