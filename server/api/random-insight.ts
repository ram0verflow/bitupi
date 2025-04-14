import { defineEventHandler } from 'h3';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Preloaded insights cache
let insightsCache: Array<{ heading: string; sentence: string }> = [];
let isLoading = false;
let lastLoadAttempt = 0;
const LOAD_COOLDOWN = 10000; // 10 seconds between load attempts

// Define a smaller subset of insights to use when the full set isn't loaded yet
const fallbackInsights = [
  {
    heading: "The Value Principle",
    sentence: "Scarcity creates meaning through constraints, establishing a hierarchy of choices. Bitcoin's supply limit transforms digital space into a truly scarce resource, ending the era of infinite digital replication and enabling real digital ownership."
  },
  {
    heading: "The Foundation for Money",
    sentence: "The exchange language of scarcity provides the evolutionary foundation for money, enabling coordination among vast numbers of strangers. Bitcoin represents the most mathematically perfect expression of this language ever created."
  },
  {
    heading: "The Consciousness Paradox",
    sentence: "Human awareness of our condition and limitations drives the search for better systems and solutions. Bitcoin represents a conscious choice, leveraging mathematical truth and code to create a trustless monetary system, moving beyond fallible human intermediaries and subjective rules."
  }
];

/**
 * Load the philosophical insights from JSON file
 * Returns a promise that resolves when loading is complete
 */
async function loadInsights(): Promise<boolean> {
  // Don't allow multiple concurrent loads or frequent retries
  const now = Date.now();
  if (isLoading || (lastLoadAttempt > 0 && now - lastLoadAttempt < LOAD_COOLDOWN)) {
    return false;
  }
  
  isLoading = true;
  lastLoadAttempt = now;
  
  try {
    // Path to the JSON file (relative to the current file)
    const jsonPath = path.resolve(__dirname, '../../../satoshinotebook.com/content.json');
    
    // Read the file with a timeout
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('File read timeout')), 5000); // 5 second timeout
    });
    
    const readPromise = fs.readFile(jsonPath, 'utf-8');
    const fileContent = await Promise.race([readPromise, timeoutPromise]) as string;
    
    // Quick validation before full parse
    if (!fileContent || fileContent.trim().length < 10) {
      throw new Error('Invalid or empty file content');
    }
    
    // Parse JSON
    const content = JSON.parse(fileContent);
    
    if (content.data && Array.isArray(content.data) && content.data.length > 0) {
      // Only load valid insights with both heading and sentence
      const validInsights = content.data.filter(
        (item: any) => item && typeof item.heading === 'string' && typeof item.sentence === 'string'
      );
      
      // Cache the insights
      insightsCache = validInsights;
      
      console.log(`Successfully loaded ${insightsCache.length} philosophical insights`);
      return true;
    } else {
      console.error('Invalid JSON structure in content.json');
      return false;
    }
  } catch (error) {
    console.error('Error loading philosophical insights:', error);
    return false;
  } finally {
    isLoading = false;
  }
}

// Try to load insights at startup, but don't block server initialization
(async () => {
  try {
    await loadInsights();
  } catch (err) {
    console.error('Initial insights loading failed:', err);
    // Will use fallback insights
  }
})();

export default defineEventHandler(async (event) => {
  try {
    // Use cached insights if available, otherwise use fallbacks
    const insights = insightsCache.length > 0 ? insightsCache : fallbackInsights;
    
    // If cache is empty, trigger background reload but don't wait for it
    if (insightsCache.length === 0) {
      loadInsights().catch(err => console.error('Background insights loading failed:', err));
    }
    
    // Get a random insight
    const randomIndex = Math.floor(Math.random() * insights.length);
    const insight = insights[randomIndex];
    
    return {
      success: true,
      heading: insight.heading,
      insight: insight.sentence,
      cached: insightsCache.length > 0
    };
  } catch (error) {
    console.error('Error getting random insight:', error);
    
    // Even if an error occurs, try to return a fallback insight
    if (fallbackInsights.length > 0) {
      const fallback = fallbackInsights[Math.floor(Math.random() * fallbackInsights.length)];
      return {
        success: true,
        heading: fallback.heading,
        insight: fallback.sentence,
        cached: false,
        fallback: true
      };
    }
    
    return {
      success: false,
      message: 'Failed to get random insight'
    };
  }
});