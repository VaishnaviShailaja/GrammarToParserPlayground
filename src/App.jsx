import { useState } from "react";
import "./App.css";

import { parseGrammar } from "./algorithms/grammarParser";
import {
  calculateFirst,
  calculateFollow,
} from "./algorithms/firstFollow";

import {
  detectLeftRecursion,
  removeLeftRecursion,
  formatGrammar,
} from "./algorithms/leftRecursion";

import { performLeftFactoring } from "./algorithms/leftFactoring";
import { constructLL1Table } from "./algorithms/ll1Table";
import { simulatePredictiveParser } from "./algorithms/predictiveParser";

function App() {
  const [grammar, setGrammar] = useState(
    "E -> T E'\nE' -> + T E' | ε\nT -> id"
  );

  const [activeTab, setActiveTab] = useState("Overview");
  const [analysis, setAnalysis] = useState(null);
  const [firstSets, setFirstSets] = useState(null);
  const [followSets, setFollowSets] = useState(null);
  const [transformation, setTransformation] = useState(null);
  const [recursionSymbols, setRecursionSymbols] = useState([]);
  const [factoringResult, setFactoringResult] = useState(null);
  const [ll1Result, setLl1Result] = useState(null);

  const [inputString, setInputString] = useState("id + id");
  const [parserResult, setParserResult] = useState(null);

  const tabs = [
    "Overview",
    "FIRST",
    "FOLLOW",
    "Transform",
    "LL(1) Table",
    "Parser",
  ];

  function handleAnalyze() {
    const result = parseGrammar(grammar);

    setAnalysis(result);
    setTransformation(null);
    setFactoringResult(null);
    setLl1Result(null);
    setParserResult(null);

    if (!result.success) {
      setFirstSets(null);
      setFollowSets(null);
      setRecursionSymbols([]);
      return;
    }

    const first = calculateFirst(
      result.productions,
      result.nonTerminals
    );

    const follow = calculateFollow(
      result.productions,
      result.nonTerminals,
      first,
      result.startSymbol
    );

    const recursion = detectLeftRecursion(
      result.productions,
      result.nonTerminals
    );

    const tableResult = constructLL1Table(
      result.productions,
      result.nonTerminals,
      result.terminals,
      first,
      follow
    );

    setFirstSets(first);
    setFollowSets(follow);
    setRecursionSymbols(recursion);
    setLl1Result(tableResult);
  }

  function handleClear() {
    setGrammar("");
    setAnalysis(null);
    setFirstSets(null);
    setFollowSets(null);
    setTransformation(null);
    setFactoringResult(null);
    setRecursionSymbols([]);
    setLl1Result(null);
    setInputString("");
    setParserResult(null);
  }

  function handleRemoveLeftRecursion() {
    if (!analysis?.success) return;

    const result = removeLeftRecursion(
      analysis.productions,
      analysis.nonTerminals
    );

    setTransformation(result);
  }

  function handleLeftFactoring() {
    if (!analysis?.success) return;

    const result = performLeftFactoring(
      analysis.productions,
      analysis.nonTerminals
    );

    setFactoringResult(result);
  }

  function handleParseInput() {
    if (!analysis?.success || !ll1Result) return;

    if (!ll1Result.isLL1) {
      setParserResult({
        accepted: false,
        error:
          "This grammar is not LL(1). Resolve parsing table conflicts first.",
        steps: [],
        parseTree: null,
      });

      return;
    }

    const result = simulatePredictiveParser(
      inputString,
      analysis.startSymbol,
      analysis.nonTerminals,
      ll1Result.table
    );

    setParserResult(result);
  }

  function renderSetResults(sets) {
    if (!sets) return null;

    return Object.entries(sets).map(([symbol, values]) => (
      <div className="production-item" key={symbol}>
        <strong>{symbol}</strong>
        <span>
          {" "}
          = {"{"} {values.join(", ")} {"}"}
        </span>
      </div>
    ));
  }

  function renderParseTree(node) {
    if (!node) return null;

    return (
      <div className="parse-tree-node">
        <div
          className={`parse-tree-symbol ${
            node.matched ? "parse-tree-terminal" : ""
          }`}
        >
          {node.symbol}
        </div>

        {node.children && node.children.length > 0 && (
          <div className="parse-tree-children">
            {node.children.map((child, index) => (
              <div className="parse-tree-child" key={index}>
                {renderParseTree(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderLL1Table() {
    if (!ll1Result || !analysis?.success) return null;

    const columns = [...analysis.terminals, "$"];

    return (
      <>
        <div className="table-status">
          <h3>
            {ll1Result.isLL1
              ? "Grammar is LL(1)"
              : "Grammar is NOT LL(1)"}
          </h3>

          <p>
            {ll1Result.isLL1
              ? "No parsing table conflicts were found."
              : "Multiple productions were found in one or more cells."}
          </p>
        </div>

        {ll1Result.errors.length > 0 && (
          <div className="warning-message">
            {ll1Result.errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        <div className="ll1-table-wrapper">
          <table className="ll1-table">
            <thead>
              <tr>
                <th>Non-terminal</th>

                {columns.map((terminal) => (
                  <th key={terminal}>{terminal}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {analysis.nonTerminals.map((nonTerminal) => (
                <tr key={nonTerminal}>
                  <th>{nonTerminal}</th>

                  {columns.map((terminal) => {
                    const entries =
                      ll1Result.table[nonTerminal][terminal];

                    return (
                      <td key={terminal}>
                        {entries.length === 0
                          ? "—"
                          : entries
                              .map(
                                (right) =>
                                  `${nonTerminal} → ${right.join(
                                    " "
                                  )}`
                              )
                              .join(" / ")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">C</div>

          <div>
            <h2>Compiler Lab</h2>
            <p>Grammar Playground</p>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">WORKSPACE</p>

          {tabs.map((tab) => (
            <button
              key={tab}
              className={`sidebar-link ${
                activeTab === tab ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <p>Compiler Design Project</p>
          <span>Interactive Learning Environment</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>Grammar to Parser Playground</h1>

            <p>
              Explore grammar analysis and parsing step by step.
            </p>
          </div>

          <div className="topbar-status">
            <span className="status-dot"></span>
            Learning Mode
          </div>
        </header>

        <section className="editor-section">
          <div className="section-heading">
            <div>
              <h2>Context-Free Grammar</h2>

              <p>
                Enter one production per line. Separate grammar
                symbols using spaces.
              </p>
            </div>
          </div>

          <textarea
            className="grammar-editor"
            value={grammar}
            onChange={(event) => setGrammar(event.target.value)}
            placeholder={"S -> A B\nA -> a | ε\nB -> b"}
            spellCheck="false"
          />

          <div className="editor-actions">
            <button
              className="primary-button"
              onClick={handleAnalyze}
            >
              Analyze Grammar
            </button>

            <button
              className="secondary-button"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </section>

        {analysis && (
          <section className="results-section">
            {!analysis.success ? (
              <div className="result-card">
                <h2>Grammar Errors</h2>

                {analysis.errors.map((error, index) => (
                  <p className="error-message" key={index}>
                    {error}
                  </p>
                ))}
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <span>Start Symbol</span>
                    <strong>{analysis.startSymbol}</strong>
                  </div>

                  <div className="stat-card">
                    <span>Non-terminals</span>
                    <strong>
                      {analysis.nonTerminals.length}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>Terminals</span>
                    <strong>{analysis.terminals.length}</strong>
                  </div>

                  <div className="stat-card">
                    <span>Productions</span>
                    <strong>
                      {analysis.productions.length}
                    </strong>
                  </div>
                </div>

                <nav className="result-tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      className={
                        activeTab === tab ? "active" : ""
                      }
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>

                <div className="result-card">
                  {activeTab === "Overview" && (
                    <>
                      <h2>Grammar Analysis</h2>

                      <h3>Non-terminals</h3>
                      <p>{analysis.nonTerminals.join(", ")}</p>

                      <h3>Terminals</h3>

                      <p>
                        {analysis.terminals.length
                          ? analysis.terminals.join(", ")
                          : "None"}
                      </p>

                      <h3>Production Rules</h3>

                      {analysis.productions.map(
                        (production, index) => (
                          <div
                            className="production-item"
                            key={index}
                          >
                            {production.left} →{" "}
                            {production.right.join(" ")}
                          </div>
                        )
                      )}
                    </>
                  )}

                  {activeTab === "FIRST" && (
                    <>
                      <h2>FIRST Sets</h2>

                      <p>
                        FIRST contains the terminals that can
                        appear first in strings derived from a
                        grammar symbol.
                      </p>

                      {renderSetResults(firstSets)}
                    </>
                  )}

                  {activeTab === "FOLLOW" && (
                    <>
                      <h2>FOLLOW Sets</h2>

                      <p>
                        FOLLOW contains the terminals that can
                        appear immediately after a non-terminal.
                      </p>

                      {renderSetResults(followSets)}
                    </>
                  )}

                  {activeTab === "Transform" && (
                    <>
                      <h2>Grammar Transformations</h2>

                      <h3>Direct Left Recursion</h3>

                      {recursionSymbols.length > 0 ? (
                        <p className="warning-message">
                          Direct left recursion detected in:{" "}
                          {recursionSymbols.join(", ")}
                        </p>
                      ) : (
                        <p>
                          No direct left recursion detected.
                        </p>
                      )}

                      <button
                        className="primary-button"
                        onClick={handleRemoveLeftRecursion}
                      >
                        Remove Direct Left Recursion
                      </button>

                      {transformation && (
                        <div className="transformation-output">
                          <h3>Transformed Grammar</h3>

                          {transformation.success ? (
                            <pre>
                              {formatGrammar(
                                transformation.productions
                              )}
                            </pre>
                          ) : (
                            transformation.errors.map(
                              (error, index) => (
                                <p
                                  className="error-message"
                                  key={index}
                                >
                                  {error}
                                </p>
                              )
                            )
                          )}
                        </div>
                      )}

                      <hr />

                      <h3>Left Factoring</h3>

                      <p>
                        Left factoring removes common prefixes
                        from production alternatives.
                      </p>

                      <button
                        className="primary-button"
                        onClick={handleLeftFactoring}
                      >
                        Perform Left Factoring
                      </button>

                      {factoringResult && (
                        <div className="transformation-output">
                          <h3>Left Factored Grammar</h3>

                          {factoringResult.success ? (
                            <pre>
                              {formatGrammar(
                                factoringResult.productions
                              )}
                            </pre>
                          ) : (
                            factoringResult.errors.map(
                              (error, index) => (
                                <p
                                  className="error-message"
                                  key={index}
                                >
                                  {error}
                                </p>
                              )
                            )
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === "LL(1) Table" && (
                    <>
                      <h2>LL(1) Parsing Table</h2>

                      <p>
                        The table is constructed using FIRST and
                        FOLLOW sets.
                      </p>

                      {renderLL1Table()}
                    </>
                  )}

                  {activeTab === "Parser" && (
                    <>
                      <h2>Predictive Parser</h2>

                      <p>
                        Enter an input string to check whether it
                        belongs to the grammar.
                      </p>

                      {!ll1Result?.isLL1 && (
                        <p className="warning-message">
                          Analyze an LL(1) grammar before parsing.
                        </p>
                      )}

                      <input
                        className="parser-input"
                        type="text"
                        value={inputString}
                        onChange={(event) => {
                          setInputString(event.target.value);
                          setParserResult(null);
                        }}
                        placeholder="Example: id + id"
                      />

                      <button
                        className="primary-button"
                        onClick={handleParseInput}
                        disabled={!ll1Result?.isLL1}
                      >
                        Parse Input
                      </button>

                      {parserResult && (
                        <div className="parser-results">
                          <h3
                            className={
                              parserResult.accepted
                                ? "parser-accepted"
                                : "parser-rejected"
                            }
                          >
                            {parserResult.accepted
                              ? "Input Accepted"
                              : "Input Rejected"}
                          </h3>

                          {parserResult.error && (
                            <p className="error-message">
                              {parserResult.error}
                            </p>
                          )}

                          {parserResult.steps.length > 0 && (
                            <div className="ll1-table-wrapper">
                              <table className="ll1-table">
                                <thead>
                                  <tr>
                                    <th>Step</th>
                                    <th>Stack</th>
                                    <th>Input</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {parserResult.steps.map(
                                    (step, index) => (
                                      <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{step.stack}</td>
                                        <td>{step.input}</td>
                                        <td>{step.action}</td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {parserResult.accepted &&
                            parserResult.parseTree && (
                              <div className="parse-tree-section">
                                <h3>Parse Tree</h3>

                                <p>
                                  Visual representation of how
                                  the input string was derived
                                  from the start symbol.
                                </p>

                                <div className="parse-tree-wrapper">
                                  {renderParseTree(
                                    parserResult.parseTree
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;