import { defineEventHandler } from 'h3';

/**
 * Minimal insights data embedded directly in code to avoid file loading
 * This significantly improves performance compared to reading from file
 */
const embeddedInsights = [
  {
    heading: "The Value Principle",
    sentence: "Scarcity creates meaning through constraints. Bitcoin's supply limit transforms digital space into a truly scarce resource, ending the era of infinite digital replication and enabling real digital ownership."
  },
  {
    heading: "The Foundation for Money",
    sentence: "The exchange language of scarcity provides the evolutionary foundation for money. Bitcoin represents the most mathematically perfect expression of this language ever created."
  },
  {
    heading: "The Consciousness Paradox", 
    sentence: "Human awareness drives the search for better systems. Bitcoin represents a conscious choice, leveraging mathematical truth to create a trustless monetary system, moving beyond fallible human intermediaries."
  },
  {
    heading: "Money is Energy",
    sentence: "Just as Einstein showed us that matter and energy are interchangeable, money serves as the mechanism for converting human energy into a storable, transferable form that others recognize and value."
  },
  {
    heading: "Bitcoin is Honesty",
    sentence: "The reason Bitcoin is truly 'sound money' is not simply its fixed supply, but that it enforces honesty about resources and reality in a way that no previous monetary system has ever achieved."
  }
];

export default defineEventHandler(async () => {
  // Get a random insight from our embedded array (no file loading)
  const randomIndex = Math.floor(Math.random() * embeddedInsights.length);
  const insight = embeddedInsights[randomIndex];
  
  return {
    success: true,
    heading: insight.heading,
    insight: insight.sentence,
    source: "satoshinotebook.com"
  };
});