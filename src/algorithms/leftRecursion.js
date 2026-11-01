
const EPSILON = "ε";

// Detect direct left recursion.
export function detectLeftRecursion(productions, nonTerminals) {
  const recursiveSymbols = [];

  nonTerminals.forEach((nonTerminal) => {
    const hasRecursion = productions.some(
      (production) =>
        production.left === nonTerminal &&
        production.right[0] === nonTerminal
    );

    if (hasRecursion) {
      recursiveSymbols.push(nonTerminal);
    }
  });

  return recursiveSymbols;
}

// Generate a new non-terminal name without conflicts.
function generateNewSymbol(symbol, existingSymbols) {
  let candidate = `${symbol}'`;
  let count = 1;

  while (existingSymbols.includes(candidate)) {
    candidate = `${symbol}_${count}`;
    count++;
  }

  existingSymbols.push(candidate);
  return candidate;
}

// Remove direct left recursion.
export function removeLeftRecursion(productions, nonTerminals) {
  const existingSymbols = [...nonTerminals];

  const groupedProductions = {};

  nonTerminals.forEach((symbol) => {
    groupedProductions[symbol] = [];
  });

  productions.forEach((production) => {
    groupedProductions[production.left].push(
      production.right
    );
  });

  const transformedProductions = [];
  const errors = [];
  const transformedSymbols = [];

  nonTerminals.forEach((nonTerminal) => {
    const alternatives = groupedProductions[nonTerminal];

    const recursive = [];
    const nonRecursive = [];

    alternatives.forEach((right) => {
      if (right[0] === nonTerminal) {
        const alpha = right.slice(1);

        if (alpha.length === 0) {
          errors.push(
            `${nonTerminal} -> ${nonTerminal} cannot be transformed by this method.`
          );
        } else {
          recursive.push(alpha);
        }
      } else {
        nonRecursive.push(right);
      }
    });

    // No direct left recursion.
    if (recursive.length === 0) {
      alternatives.forEach((right) => {
        transformedProductions.push({
          left: nonTerminal,
          right: [...right],
        });
      });

      return;
    }

    // A recursive production needs at least one
    // non-recursive alternative to terminate.
    if (nonRecursive.length === 0) {
      errors.push(
        `${nonTerminal} has left recursion but no non-recursive alternative.`
      );
      return;
    }

    const newSymbol = generateNewSymbol(
      nonTerminal,
      existingSymbols
    );

    transformedSymbols.push(newSymbol);

    // A -> beta A'
    nonRecursive.forEach((beta) => {
      const newRight =
        beta.length === 1 && beta[0] === EPSILON
          ? [newSymbol]
          : [...beta, newSymbol];

      transformedProductions.push({
        left: nonTerminal,
        right: newRight,
      });
    });

    // A' -> alpha A' | epsilon
    recursive.forEach((alpha) => {
      transformedProductions.push({
        left: newSymbol,
        right: [...alpha, newSymbol],
      });
    });

    transformedProductions.push({
      left: newSymbol,
      right: [EPSILON],
    });
  });

  if (errors.length > 0) {
    return {
      success: false,
      errors,
      productions: [],
      transformedSymbols: [],
    };
  }

  return {
    success: true,
    productions: transformedProductions,
    transformedSymbols,
    errors: [],
  };
}

// Convert productions into readable grammar text.
export function formatGrammar(productions) {
  const grouped = {};

  productions.forEach((production) => {
    if (!grouped[production.left]) {
      grouped[production.left] = [];
    }

    grouped[production.left].push(
      production.right.join(" ")
    );
  });

  return Object.entries(grouped)
    .map(
      ([left, alternatives]) =>
        `${left} -> ${alternatives.join(" | ")}`
    )
    .join("\n");
}
