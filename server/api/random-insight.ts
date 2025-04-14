import { defineEventHandler } from 'h3';

/**
 * This endpoint is intentionally disabled to improve performance.
 * The philosophical insights feature is currently disabled.
 */
export default defineEventHandler(async (event) => {
  return {
    success: false,
    disabled: true,
    message: 'Random insights feature is currently disabled'
  };
});