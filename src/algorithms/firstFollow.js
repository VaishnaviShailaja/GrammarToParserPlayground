
const EPSILON = "ε";

// ------------------------------------
// FIRST SET ALGORITHM
// ------------------------------------

export function calculateFirst(productions, nonTerminals) {
  const first = {};

  nonTerminals.forEach((symbol) => {
    first[symbol] = new Set();
  });

  let changed = true;

  while (changed) {
    changed = false;

    productions.forEach((production) => {
      const left = production.left;
      const right = production.right;

      let canProduceEpsilon = true;

      for (const symbol of right) {
        if (symbol === EPSILON) {
          if (!first[left].has(EPSILON)) {
            first[left].add(EPSILON);
            changed = true;
          }

          break;
        }

        if (!nonTerminals.includes(symbol)) {
          if (!first[left].has(symbol)) {
            first[left].add(symbol);
            changed = true;
          }

          canProduceEpsilon = false;
          break;
        }

        first[symbol].forEach((item) => {
          if (
            item !== EPSILON &&
            !first[left].has(item)
          ) {
            first[left].add(item);
            changed = true;
          }
        });

        if (!first[symbol].has(EPSILON)) {
          canProduceEpsilon = false;
          break;
        }
      }

      if (
        canProduceEpsilon &&
        !first[left].has(EPSILON)
      ) {
        first[left].add(EPSILON);
        changed = true;
      }
    });
  }

  const result = {};

  Object.keys(first).forEach((symbol) => {
    result[symbol] = [...first[symbol]];
  });

  return result;
}

// ------------------------------------
// HELPER: FIRST OF A SEQUENCE
// ------------------------------------

function firstOfSequence(sequence, firstSets, nonTerminals) {
  const result = new Set();

  if (sequence.length === 0) {
    result.add(EPSILON);
    return result;
  }

  let allCanProduceEpsilon = true;

  for (const symbol of sequence) {
    // A terminal directly belongs to FIRST.
    if (!nonTerminals.includes(symbol)) {
      result.add(symbol);
      allCanProduceEpsilon = false;
      break;
    }

    const symbolFirst = firstSets[symbol] || [];

    symbolFirst.forEach((item) => {
      if (item !== EPSILON) {
        result.add(item);
      }
    });

    if (!symbolFirst.includes(EPSILON)) {
      allCanProduceEpsilon = false;
      break;
    }
  }

  if (allCanProduceEpsilon) {
    result.add(EPSILON);
  }

  return result;
}

// ------------------------------------
// FOLLOW SET ALGORITHM
// ------------------------------------

export function calculateFollow(
  productions,
  nonTerminals,
  firstSets,
  startSymbol
) {
  const follow = {};

  // Initially, all FOLLOW sets are empty.
  nonTerminals.forEach((symbol) => {
    follow[symbol] = new Set();
  });

  // Rule 1: Add $ to the start symbol.
  follow[startSymbol].add("$");

  let changed = true;

  // Repeat until no FOLLOW set changes.
  while (changed) {
    changed = false;

    productions.forEach((production) => {
      const left = production.left;
      const right = production.right;

      // Examine every symbol in the RHS.
      for (let i = 0; i < right.length; i++) {
        const currentSymbol = right[i];

        // FOLLOW is calculated only for non-terminals.
        if (!nonTerminals.includes(currentSymbol)) {
          continue;
        }

        // Get the symbols appearing after the current symbol.
        const beta = right.slice(i + 1);

        // Find FIRST(beta).
        const betaFirst = firstOfSequence(
          beta,
          firstSets,
          nonTerminals
        );

        // Rule 2: Add FIRST(beta) - epsilon.
        betaFirst.forEach((item) => {
          if (
            item !== EPSILON &&
            !follow[currentSymbol].has(item)
          ) {
            follow[currentSymbol].add(item);
            changed = true;
          }
        });

        // Rule 3:
        // If beta is empty or can produce epsilon,
        // add FOLLOW(left) to FOLLOW(currentSymbol).
        if (betaFirst.has(EPSILON)) {
          follow[left].forEach((item) => {
            if (!follow[currentSymbol].has(item)) {
              follow[currentSymbol].add(item);
              changed = true;
            }
          });
        }
      }
    });
  }

  // Convert Sets into arrays for React.
  const result = {};

  Object.keys(follow).forEach((symbol) => {
    result[symbol] = [...follow[symbol]];
  });

  return result;
}
