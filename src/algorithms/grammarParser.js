
const EPSILON = "ε";

function isValidNonTerminal(symbol) {
  return /^[A-Za-z_][A-Za-z0-9_']*$/.test(symbol);
}

export function parseGrammar(grammarText) {
  const errors = [];
  const productions = [];

  const lines = grammarText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      success: false,
      errors: ["Grammar cannot be empty."],
    };
  }

  lines.forEach((line, index) => {
    const parts = line.split("->");

    if (parts.length !== 2) {
      errors.push(
        `Line ${index + 1}: Invalid production. Use ->`
      );
      return;
    }

    const left = parts[0].trim();
    const right = parts[1].trim();

    if (!isValidNonTerminal(left)) {
      errors.push(
        `Line ${index + 1}: Invalid non-terminal '${left}'.`
      );
      return;
    }

    if (!right) {
      errors.push(
        `Line ${index + 1}: Production cannot have an empty RHS. Use ε instead.`
      );
      return;
    }

    const alternatives = right.split("|");

    alternatives.forEach((alternative) => {
      const trimmed = alternative.trim();

      if (trimmed === "") {
        errors.push(
          `Line ${index + 1}: Empty alternative found.`
        );
        return;
      }

      const symbols = trimmed.split(/\s+/);

      const normalizedSymbols = symbols.map((symbol) =>
        symbol.toLowerCase() === "epsilon"
          ? EPSILON
          : symbol
      );

      if (
        normalizedSymbols.includes(EPSILON) &&
        normalizedSymbols.length !== 1
      ) {
        errors.push(
          `Line ${index + 1}: ε cannot appear with other symbols in the same alternative.`
        );
        return;
      }

      productions.push({
        left,
        right: normalizedSymbols,
      });
    });
  });

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  const nonTerminals = [
    ...new Set(productions.map((p) => p.left)),
  ];

  const startSymbol = productions[0].left;

  const terminals = new Set();

  productions.forEach((production) => {
    production.right.forEach((symbol) => {
      if (
        !nonTerminals.includes(symbol) &&
        symbol !== EPSILON
      ) {
        terminals.add(symbol);
      }
    });
  });

  return {
    success: true,
    startSymbol,
    nonTerminals,
    terminals: [...terminals],
    productions,
    errors: [],
  };
}
