
const EPSILON = "ε";
const END_MARKER = "$";

export function simulatePredictiveParser(
  inputString,
  startSymbol,
  nonTerminals,
  parsingTable
) {
  // Convert input into grammar symbols.
  const input = inputString.trim()
    ? inputString.trim().split(/\s+/)
    : [];

  input.push(END_MARKER);

  // Initialize the parsing stack.
  const stack = [END_MARKER, startSymbol];

  const steps = [];
  let inputIndex = 0;
  let accepted = false;
  let error = null;

  // Prevent infinite loops.
  let iterations = 0;
  const maxIterations = 1000;

  while (stack.length > 0 && iterations < maxIterations) {
    iterations++;

    const stackBefore = [...stack].reverse().join(" ");
    const remainingInput = input.slice(inputIndex).join(" ");

    const top = stack[stack.length - 1];
    const currentInput = input[inputIndex];

    if (top === END_MARKER && currentInput === END_MARKER) {
      steps.push({
        stack: stackBefore,
        input: remainingInput,
        action: "Accept",
      });

      accepted = true;
      break;
    }

    // Case 1: Stack top is a terminal.
    if (!nonTerminals.includes(top) && top !== END_MARKER) {
      if (top === currentInput) {
        steps.push({
          stack: stackBefore,
          input: remainingInput,
          action: `Match ${top}`,
        });

        stack.pop();
        inputIndex++;
      } else {
        error = `Expected '${top}', but found '${currentInput}'.`;
        steps.push({
          stack: stackBefore,
          input: remainingInput,
          action: `Error: ${error}`,
        });
        break;
      }
    }

    // Case 2: Stack top is a non-terminal.
    else if (nonTerminals.includes(top)) {
      const production =
        parsingTable[top]?.[currentInput];

      if (!production || production.length === 0) {
        error = `No production found for [${top}, ${currentInput}].`;

        steps.push({
          stack: stackBefore,
          input: remainingInput,
          action: `Error: ${error}`,
        });

        break;
      }

      if (production.length > 1) {
        error = `Parsing conflict at [${top}, ${currentInput}].`;

        steps.push({
          stack: stackBefore,
          input: remainingInput,
          action: `Error: ${error}`,
        });

        break;
      }

      const rightSide = production[0];

      steps.push({
        stack: stackBefore,
        input: remainingInput,
        action: `${top} → ${rightSide.join(" ")}`,
      });

      stack.pop();

      // Push RHS symbols in reverse order.
      if (!(rightSide.length === 1 && rightSide[0] === EPSILON)) {
        for (let i = rightSide.length - 1; i >= 0; i--) {
          stack.push(rightSide[i]);
        }
      }
    }

    // Unexpected end marker.
    else {
      error = "Unexpected end of input.";

      steps.push({
        stack: stackBefore,
        input: remainingInput,
        action: `Error: ${error}`,
      });

      break;
    }
  }

  if (!accepted && !error && iterations >= maxIterations) {
    error = "Maximum parsing steps exceeded.";
  }

  return {
    accepted,
    error,
    steps,
  };
}
