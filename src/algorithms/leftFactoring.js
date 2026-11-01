// ------------------------------------
// LEFT FACTORING ALGORITHM
// ------------------------------------

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

// Find the longest common prefix.
function findCommonPrefix(alternatives) {
  if (alternatives.length < 2) {
    return [];
  }

  let prefix = [...alternatives[0]];

  for (let i = 1; i < alternatives.length; i++) {
    let j = 0;

    while (
      j < prefix.length &&
      j < alternatives[i].length &&
      prefix[j] === alternatives[i][j]
    ) {
      j++;
    }

    prefix = prefix.slice(0, j);

    if (prefix.length === 0) {
      break;
    }
  }

  return prefix;
}

// Apply left factoring to the grammar.
export function performLeftFactoring(
  productions,
  nonTerminals
) {
  let currentProductions = productions.map((production) => ({
    left: production.left,
    right: [...production.right],
  }));

  const existingSymbols = [...nonTerminals];
  const transformedSymbols = [];

  let changed = true;
  let iterations = 0;
  const maxIterations = 100;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    const grouped = {};

    currentProductions.forEach((production) => {
      if (!grouped[production.left]) {
        grouped[production.left] = [];
      }

      grouped[production.left].push(production.right);
    });

    const newProductions = [];

    for (const nonTerminal of Object.keys(grouped)) {
      const alternatives = grouped[nonTerminal];
      const prefix = findCommonPrefix(alternatives);

      if (prefix.length === 0) {
        alternatives.forEach((right) => {
          newProductions.push({
            left: nonTerminal,
            right: [...right],
          });
        });

        continue;
      }

      changed = true;

      const matching = [];
      const remaining = [];

      alternatives.forEach((right) => {
        const hasPrefix = prefix.every(
          (symbol, index) => right[index] === symbol
        );

        if (hasPrefix) {
          matching.push(right);
        } else {
          remaining.push(right);
        }
      });

      // Only factor when at least two alternatives match.
      if (matching.length < 2) {
        alternatives.forEach((right) => {
          newProductions.push({
            left: nonTerminal,
            right: [...right],
          });
        });

        changed = false;
        continue;
      }

      const newSymbol = generateNewSymbol(
        nonTerminal,
        existingSymbols
      );

      transformedSymbols.push(newSymbol);

      remaining.forEach((right) => {
        newProductions.push({
          left: nonTerminal,
          right: [...right],
        });
      });

      newProductions.push({
        left: nonTerminal,
        right: [...prefix, newSymbol],
      });

      matching.forEach((right) => {
        const suffix = right.slice(prefix.length);

        newProductions.push({
          left: newSymbol,
          right: suffix.length === 0 ? ["ε"] : suffix,
        });
      });
    }

    currentProductions = newProductions;
  }

  return {
    success: true,
    productions: currentProductions,
    transformedSymbols,
    errors: [],
  };
}