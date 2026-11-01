
const EPSILON = "ε";

/**
 * Calculates FIRST of a production's RHS.
 */
function getFirstOfSequence(sequence, firstSets, nonTerminals) {
  const result = new Set();

  if (sequence.length === 0) {
    result.add(EPSILON);
    return result;
  }

  let allCanProduceEpsilon = true;

  for (const symbol of sequence) {
    if (symbol === EPSILON) {
      result.add(EPSILON);
      break;
    }

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

/**
 * Constructs the LL(1) parsing table.
 */
export function constructLL1Table(
  productions,
  nonTerminals,
  terminals,
  firstSets,
  followSets
) {
  const table = {};
  const errors = [];

  // Create an empty table.
  nonTerminals.forEach((nonTerminal) => {
    table[nonTerminal] = {};

    [...terminals, "$"].forEach((terminal) => {
      table[nonTerminal][terminal] = [];
    });
  });

  // Process every production.
  productions.forEach((production) => {
    const left = production.left;
    const right = production.right;

    const first = getFirstOfSequence(
      right,
      firstSets,
      nonTerminals
    );

    // Rule 1: Add A -> α under every terminal in FIRST(α).
    first.forEach((terminal) => {
      if (terminal !== EPSILON) {
        table[left][terminal].push(right);
      }
    });

    // Rule 2: If ε belongs to FIRST(α),
    // add A -> α under every symbol in FOLLOW(A).
    if (first.has(EPSILON)) {
      (followSets[left] || []).forEach((terminal) => {
        table[left][terminal].push(right);
      });
    }
  });

  // Check for conflicts.
  nonTerminals.forEach((nonTerminal) => {
    Object.keys(table[nonTerminal]).forEach((terminal) => {
      if (table[nonTerminal][terminal].length > 1) {
        errors.push(
          `Conflict at [${nonTerminal}, ${terminal}]`
        );
      }
    });
  });

  return {
    table,
    isLL1: errors.length === 0,
    errors,
  };
}
