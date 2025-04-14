import { defineEventHandler } from 'h3';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const factsCache: any[] = [];

/**
 * Load the Bitcoin facts from CSV file
 */
async function loadFacts() {
  try {
    // Path to the CSV file (relative to the current file)
    const csvPath = path.resolve(__dirname, '../../../satoshinotebook.com/bitcoin-facts.csv');
    
    // Read the file
    const fileContent = await fs.readFile(csvPath, 'utf-8');
    
    // Parse CSV (simple implementation)
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // Skip header row
    const dataRows = lines.slice(1);
    
    // Parse each row and build facts array
    const facts = dataRows.map(row => {
      // Handle quoted CSV values
      const match = row.match(/^"([^"]*)","([^"]*)"$/);
      if (match) {
        return {
          fact: match[1],
          category: match[2]
        };
      }
      return null;
    }).filter(Boolean);
    
    // Cache the facts
    factsCache.splice(0, factsCache.length, ...facts);
    
    console.log(`Loaded ${factsCache.length} Bitcoin facts from CSV`);
  } catch (error) {
    console.error('Error loading Bitcoin facts:', error);
  }
}

// Load facts when the server starts
loadFacts();

export default defineEventHandler(async () => {
  try {
    // If facts haven't been loaded yet, try loading them
    if (factsCache.length === 0) {
      await loadFacts();
    }
    
    // If still no facts, return error
    if (factsCache.length === 0) {
      return {
        success: false,
        message: 'No facts available'
      };
    }
    
    // Get a random fact
    const randomIndex = Math.floor(Math.random() * factsCache.length);
    const fact = factsCache[randomIndex];
    
    return {
      success: true,
      fact: fact.fact,
      category: fact.category
    };
  } catch (error) {
    console.error('Error getting random fact:', error);
    
    return {
      success: false,
      message: 'Failed to get random fact'
    };
  }
});