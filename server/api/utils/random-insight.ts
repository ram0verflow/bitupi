import { defineEventHandler } from 'h3';

/**
 * Direct embedding of all insights from content.json
 * This completely eliminates file loading and JSON parsing
 * Access is O(1) with minimal memory overhead
 */
const INSIGHTS = [
  { heading: "The Given Reality", sentence: "Humanity exists within a shared reality defined by physical constraints and inherent scarcity. Bitcoin addresses this by providing a universal, digital system for coordinating value and exchange, transcending physical limitations and offering a mathematical foundation for economic interaction in our interconnected world." },
  { heading: "The Embodied Condition", sentence: "Our physical bodies impose fundamental needs and limitations, driving the quest for efficiency and cooperation. Bitcoin, as pure digital information, allows value to transcend physical constraints, enabling weightless, instantaneous global transfer and storage of human energy, unbound by biology or geography." },
  { heading: "The Time Bind", sentence: "We experience reality through the inescapable flow of time, making value preservation across durations a critical challenge. Bitcoin's immutable ledger and fixed supply offer a solution, providing a reliable store of value that resists temporal decay, unlike traditional systems eroded by inflation." },
  { heading: "The Consciousness Paradox", sentence: "Human awareness of our condition and limitations drives the search for better systems and solutions. Bitcoin represents a conscious choice, leveraging mathematical truth and code to create a trustless monetary system, moving beyond fallible human intermediaries and subjective rules." },
  { heading: "The Shared Experience", sentence: "We are not isolated; our existence is shared, necessitating cooperation and common frameworks. Bitcoin provides a neutral, global protocol for value, accessible to all regardless of location or identity, fostering a unified economic layer for our shared digital and physical experiences." },
  { heading: "The Drive to Overcome", sentence: "Awareness of constraints fuels the human drive to innovate, solve problems, and transcend limitations. Bitcoin embodies this drive by solving the long-standing problem of digital scarcity and trustless exchange, overcoming the limitations inherent in previous monetary technologies." },
  { heading: "The Basis for Cooperation", sentence: "Our shared condition and the need to overcome scarcity form the foundation for societal cooperation and complex exchange. Bitcoin enhances this cooperation by providing a trust-minimized platform, reducing friction and enabling collaboration on a global scale without central authorities." },
  { heading: "The Emergence of Exchange", sentence: "The need to coordinate collective energy in a constrained reality necessitates systems of exchange. Bitcoin represents the next evolution in exchange mechanisms, offering a purely digital, globally accessible, and incorruptible protocol for transferring stored human energy (value)." },
  { heading: "The Paradox of Existence", sentence: "Scarcity isn't a flaw but the fundamental principle defining existence, creating value and meaning through limitation. Bitcoin embraces this paradox, establishing absolute, verifiable digital scarcity with its 21 million limit, providing a stable monetary foundation mirroring this core aspect of reality." },
  { heading: "The Birth of Space", sentence: "Physical embodiment creates the concept of space and its constraints on interaction and value transfer. Bitcoin transcends physical space, allowing value to move instantly across the globe as weightless information, collapsing financial distance and creating a unified value-space." },
  { heading: "The Nature of Time", sentence: "Time flows from limitation, driving change and creating the need to store value reliably across durations. Bitcoin's immutable, time-stamped ledger (the blockchain) provides unprecedented temporal integrity, ensuring value stored today remains intact and verifiable far into the future." },
  { heading: "Nature's Design", sentence: "Scarcity and limitation are inherent in natural systems, shaping evolution and driving efficiency. Bitcoin aligns with this design by implementing programmable, absolute scarcity, creating a monetary system grounded in mathematical principles rather than artificial abundance." },
  { heading: "Embodied Freedom", sentence: "True freedom arises not from absence of limits, but from operating within well-defined, reliable constraints. Bitcoin provides such a framework for economic activity, offering freedom through predictable rules, immutable supply, and transparent processes, liberating users from arbitrary monetary control." },
  { heading: "The Value Principle", sentence: "Scarcity is the source of value and meaning; overcoming challenges requires effort, which creates value. Bitcoin directly links value to the expenditure of energy (proof-of-work), making the cost and thus the value of money explicit and anchoring digital value to real-world thermodynamic cost." },
  { heading: "Economic Reality", sentence: "Scarcity defines our economic existence, forcing choices and driving the need for efficient resource allocation. Bitcoin provides a stable unit of account and store of value based on absolute scarcity, offering a clearer signal for economic calculation and long-term planning amidst this reality." },
  { heading: "The Universal Exchange", sentence: "Human interaction, from markets to conversations, is fundamentally based on exchange; society *is* exchange. Bitcoin enhances this universal activity by providing a global, neutral, and efficient protocol for value exchange, facilitating frictionless interaction across all domains." },
  { heading: "The Scarcity Imperative", sentence: "Reality's constraints and inherent scarcity drive our economic nature and the need for systems of exchange. Bitcoin addresses this imperative directly by creating perfect, verifiable digital scarcity, providing a reliable foundation for economic systems operating under these constraints." },
  { heading: "The Human Condition", sentence: "Humans uniquely specialize and engage in complex exchange, shaping our progress and societal structure. Bitcoin amplifies this unique human capacity by providing a universally accessible, efficient, and incorruptible medium for facilitating these intricate exchanges worldwide." },
  { heading: "The Exchange Matrix", sentence: "All human activity, from material trade to idea sharing, can be understood as forms of exchange within a complex matrix. Bitcoin serves as a foundational layer for this matrix, offering a universal value protocol that can underpin and streamline all types of exchanges." },
  { heading: "The Network Effect", sentence: "Efficient trade and exchange create compounding benefits, leading to network effects where value increases with participation. Bitcoin leverages powerful network effects, becoming more secure, useful, and valuable as more users, miners, and developers join the ecosystem." }
];

// Pre-calculate array length for faster random selection
const INSIGHTS_COUNT = INSIGHTS.length;

/**
 * Get a random insight with O(1) complexity
 * No file loading, no JSON parsing, instant access
 */
export default defineEventHandler(() => {
  // Get a random insight using a single Math.random() call
  const randomIndex = Math.floor(Math.random() * INSIGHTS_COUNT);
  const insight = INSIGHTS[randomIndex];
  
  // Return immediately with properly cleaned response
  return {
    success: true,
    heading: insight.heading,
    insight: insight.sentence.replace(/\[\d+\]/g, ''), // Remove citation markers like [1]
    source: "satoshinotebook.com"
  };
});