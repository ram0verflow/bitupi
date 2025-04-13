<script setup>
// Random facts about Bitcoin, UPI and Satoshi's vision
const facts = [
  "UPI transactions in India crossed 10 billion in volume in a single month in 2023, making it the world's largest real-time payment system.",
  "India is among the top 10 countries in Bitcoin adoption according to the Global Crypto Adoption Index.",
  "Over 325 banks in India are now part of the UPI ecosystem.",
  "UPI allows you to link multiple bank accounts to a single mobile application.",
  "Bitcoin transactions are recorded on a public ledger called the blockchain, ensuring transparency.",
  "In 2020, the Supreme Court of India lifted the banking ban on cryptocurrency, making it legal to trade Bitcoin.",
  "UPI's interoperability allows users to send money to any UPI ID regardless of the app they use.",
  "The Lightning Network allows Bitcoin transactions to be processed almost instantly with minimal fees.",
  "India's digital payment ecosystem is the fastest growing in the world, with UPI leading the charge.",
  "Bitcoin's total supply is limited to 21 million coins, making it a deflationary asset.",
  "Satoshi Nakamoto designed Bitcoin as a peer-to-peer electronic cash system without the need for trusted third parties.",
  "Bitcoin's whitepaper was published on October 31, 2008, during the global financial crisis.",
  "Every Bitcoin transaction since the beginning is stored on the blockchain, making it completely transparent.",
  "Bitcoin mining is the process of adding transaction records to Bitcoin's public ledger of past transactions.",
  "The term 'HODL' originated from a typo of 'hold' in a Bitcoin forum post, and now means 'Hold On for Dear Life'.",
  "The smallest unit of Bitcoin is called a 'satoshi' - there are 100 million satoshis in one Bitcoin.",
  "Bitcoin uses elliptic curve cryptography to secure transactions, the same technology used in other secure systems.",
  "The Satoshi whitepaper is only 9 pages long but revolutionized the concept of money and trust.",
  "Bitcoin's code is open source, meaning anyone can review it and suggest improvements.",
  "The first Bitcoin transaction was from Satoshi Nakamoto to Hal Finney in January 2009."
];

// Pick a random fact
const randomFact = facts[Math.floor(Math.random() * facts.length)];
</script>

<template>
  <div class="card border-l-4 border-l-india-blue bg-blue-50 p-4 my-6">
    <div class="flex items-start">
      <div class="bg-india-blue rounded-full p-1 text-white mr-3 mt-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      </div>
      <div>
        <h4 class="font-medium text-india-blue mb-1">Did You Know?</h4>
        <p class="text-gray-700">{{ randomFact }}</p>
        <p class="text-sm text-gray-500 mt-2">
          Learn more about Bitcoin fundamentals at 
          <a href="https://satoshinotebook.com" target="_blank" rel="noopener noreferrer" class="text-bitcoin-orange hover:underline">
            satoshinotebook.com
          </a>
        </p>
      </div>
    </div>
  </div>
</template>