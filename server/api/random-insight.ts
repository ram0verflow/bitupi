import { defineEventHandler } from 'h3';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for insights
const insightsCache: any[] = [];

/**
 * Load the philosophical insights from JSON file
 */
async function loadInsights() {
  try {
    // Path to the JSON file (relative to the current file)
    const jsonPath = path.resolve(__dirname, '../../satoshinotebook.com/content.json');

    // Read the file
    const fileContent = await fs.readFile(jsonPath, 'utf-8');

    // Parse JSON
    const content = JSON.parse(fileContent);

    if (content.data && Array.isArray(content.data)) {
      // Cache the insights
      insightsCache.splice(0, insightsCache.length, ...content.data);

      console.log(`Loaded ${insightsCache.length} philosophical insights from JSON`);
    } else {
      console.error('Invalid JSON structure in content.json');
    }
  } catch (error) {
    console.error('Error loading philosophical insights:', error);
  }
}

// Load insights when the server starts
loadInsights();

export default defineEventHandler(async () => {
  try {
    // If insights haven't been loaded yet, try loading them
    if (insightsCache.length === 0) {
      await loadInsights();
    }

    // If still no insights, return error
    if (insightsCache.length === 0) {
      return {
        success: false,
        message: 'No insights available'
      };
    }

    // Get a random insight
    const randomIndex = Math.floor(Math.random() * insightsCache.length);
    const insight = insightsCache[randomIndex];

    return {
      success: true,
      heading: insight.heading,
      insight: insight.sentence
    };
  } catch (error) {
    console.error('Error getting random insight:', error);

    return {
      success: false,
      message: 'Failed to get random insight'
    };
  }
});