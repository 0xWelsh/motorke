// src/lib/luxury.js
// Shared definition of what counts as a "luxury" car on BIDGARI.
// A car is luxury when it comes from a premium make OR is priced at or
// above LUXURY_MIN_PRICE_KES.
export const LUXURY_MAKES = [
  "BMW",
  "MERCEDES-BENZ",
  "AUDI",
  "LEXUS",
  "PORSCHE",
  "RANGE ROVER",
  "LAND ROVER",
  "JAGUAR",
  "MASERATI",
  "VOLVO",
  "BENTLEY",
  "ROLLS-ROYCE",
  "ASTON MARTIN",
  "FERRARI",
  "LAMBORGHINI",
  "CADILLAC",
  "LINCOLN",
];

export const LUXURY_MIN_PRICE_KES = 5000000;

// Prisma `where` fragment that selects luxury cars.
export function luxuryWhereClause() {
  return {
    OR: [{ make: { in: LUXURY_MAKES } }, { price: { gte: LUXURY_MIN_PRICE_KES } }],
  };
}
