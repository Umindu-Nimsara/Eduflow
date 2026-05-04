/**
 * Price Formatter Utility
 * Formats prices in LKR (Sri Lankan Rupees)
 */

/**
 * Format price in LKR with proper formatting
 * @param {number} price - Price amount
 * @param {string} currency - Currency type ('FREE' or 'LKR')
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, currency = 'FREE') => {
  if (currency === 'FREE' || price === 0) {
    return 'FREE';
  }

  // Format number with commas (e.g., 2500 → 2,500)
  const formattedNumber = price.toLocaleString('en-US');
  
  return `Rs. ${formattedNumber}`;
};

/**
 * Format price with full currency name
 * @param {number} price - Price amount
 * @param {string} currency - Currency type
 * @returns {string} Formatted price with currency name
 */
export const formatPriceWithCurrency = (price, currency = 'FREE') => {
  if (currency === 'FREE' || price === 0) {
    return 'FREE';
  }

  const formattedNumber = price.toLocaleString('en-US');
  
  return `LKR ${formattedNumber}`;
};

/**
 * Parse price input (removes commas and Rs.)
 * @param {string} priceString - Price string (e.g., "Rs. 2,500")
 * @returns {number} Numeric price value
 */
export const parsePrice = (priceString) => {
  if (!priceString || priceString === 'FREE') {
    return 0;
  }

  // Remove Rs., LKR, commas, and spaces
  const cleaned = priceString.replace(/Rs\.|LKR|,|\s/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Check if course is free
 * @param {object} course - Course object
 * @returns {boolean} True if course is free
 */
export const isCourseFree = (course) => {
  return course.isFree || course.currency === 'FREE' || course.price === 0;
};

/**
 * Get price badge color
 * @param {object} course - Course object
 * @returns {string} Color for price badge
 */
export const getPriceBadgeColor = (course) => {
  if (isCourseFree(course)) {
    return '#10b981'; // Green for FREE
  }
  return '#f59e0b'; // Orange for paid
};

/**
 * Format price for display in course cards
 * @param {object} course - Course object
 * @returns {string} Formatted price for display
 */
export const formatCoursePrice = (course) => {
  if (!course) return 'FREE';
  
  if (course.isFree || course.currency === 'FREE' || course.price === 0) {
    return 'FREE';
  }

  return formatPrice(course.price, course.currency);
};

// Common price presets for Sri Lankan education
export const PRICE_PRESETS = {
  FREE: 0,
  BASIC: 1000,
  STANDARD: 2500,
  PREMIUM: 5000,
  ADVANCED: 10000,
};

// Price range labels
export const PRICE_RANGES = [
  { label: 'Free', min: 0, max: 0 },
  { label: 'Under Rs. 1,000', min: 1, max: 1000 },
  { label: 'Rs. 1,000 - Rs. 2,500', min: 1000, max: 2500 },
  { label: 'Rs. 2,500 - Rs. 5,000', min: 2500, max: 5000 },
  { label: 'Above Rs. 5,000', min: 5000, max: 999999 },
];

export default {
  formatPrice,
  formatPriceWithCurrency,
  parsePrice,
  isCourseFree,
  getPriceBadgeColor,
  formatCoursePrice,
  PRICE_PRESETS,
  PRICE_RANGES,
};
