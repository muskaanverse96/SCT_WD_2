// ===============================
// CALCX — Glass Lab Calculator
// ===============================

const display = document.getElementById("display");
const previousDisplay = document.getElementById("previousDisplay");
const statusText = document.getElementById("statusText");
const angleMode = document.getElementById("angleMode");

const keypad = document.getElementById("keypad");
const scientificToggle = document.getElementById("scientificToggle");
const scientificPanel = document.getElementById("scientificPanel");

const historyButton = document.getElementById("historyButton");
const historyDrawer = document.getElementById("historyDrawer");
const closeHistory = document.getElementById("closeHistory");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistory");

const explainButton = document.getElementById("explainButton");
const explainModal = document.getElementById("explainModal");
const closeExplain = document.getElementById("closeExplain");
const explainContent = document.getElementById("explainContent");

const copyButton = document.getElementById("copyButton");
const themeButton = document.getElementById("themeButton");
const toast = document.getElementById("toast");

let expression = "";
let lastExpression = "";
let lastResult = "";
let degreeMode = true;

let history = JSON.parse(localStorage.getItem("calcxHistory")) || [];


// ===============================
// DISPLAY
// ===============================

function updateDisplay() {
    display.textContent = expression || "0";
    previousDisplay.textContent = lastExpression || "";
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}


// ===============================
// FACTORIAL
// ===============================

function factorial(n) {
    if (!Number.isFinite(n)) {
        throw new Error("Invalid factorial");
    }

    if (n < 0) {
        throw new Error("Factorial requires a non-negative number");
    }

    if (!Number.isInteger(n)) {
        throw new Error("Factorial requires a whole number");
    }

    if (n > 170) {
        throw new Error("Number too large");
    }

    let result = 1;

    for (let i = 2; i <= n; i++) {
        result *= i;
    }

    return result;
}


// ===============================
// DEG / RAD
// ===============================

function toRadians(value) {
    return value * Math.PI / 180;
}

function sin(value) {
    return degreeMode
        ? Math.sin(toRadians(value))
        : Math.sin(value);
}

function cos(value) {
    return degreeMode
        ? Math.cos(toRadians(value))
        : Math.cos(value);
}

function tan(value) {
    return degreeMode
        ? Math.tan(toRadians(value))
        : Math.tan(value);
}


// ===============================
// ADD VALUE TO EXPRESSION
// ===============================

function addToExpression(value) {
    expression += value;
    updateDisplay();
}


// ===============================
// CLEAR
// ===============================

function clearCalculator() {
    expression = "";
    lastExpression = "";
    lastResult = "";

    statusText.textContent = "READY";
    updateDisplay();

    explainButton.disabled = true;
}


// ===============================
// DELETE LAST CHARACTER
// ===============================

function deleteLast() {
    expression = expression.slice(0, -1);
    updateDisplay();
}


// ===============================
// PREPARE EXPRESSION
// ===============================

function prepareExpression(input) {
    let prepared = input;

    // Remove spaces
    prepared = prepared.replace(/\s+/g, "");

    // Replace constants
    prepared = prepared.replace(/π/g, "Math.PI");
    prepared = prepared.replace(/\bpi\b/gi, "Math.PI");

    prepared = prepared.replace(/\be\b/g, "Math.E");

    // Square root
    prepared = prepared.replace(/√/g, "sqrt");

    // Logarithms
    prepared = prepared.replace(/\blog\(/gi, "log10(");
    prepared = prepared.replace(/\bln\(/gi, "ln(");

    // Powers
    prepared = prepared.replace(/\^/g, "**");

    // Percentage
    prepared = prepared.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");

    // Factorial
    // Supports:
    // 5!
    // 10!
    // 3.0! will correctly fail because factorial needs integer
    prepared = prepared.replace(
        /(\d+(?:\.\d+)?)!/g,
        "factorial($1)"
    );

    // Trigonometric functions
    prepared = prepared.replace(/\bsin\(/gi, "sin(");
    prepared = prepared.replace(/\bcos\(/gi, "cos(");
    prepared = prepared.replace(/\btan\(/gi, "tan(");

    return prepared;
}


// ===============================
// VALIDATE EXPRESSION
// ===============================

function validateExpression(input) {
    if (!input) {
        throw new Error("Enter an expression");
    }

    // Only allow calculator characters
    const allowedCharacters =
        /^[0-9+\-*/().,%!^π√\sA-Za-z_]+$/;

    if (!allowedCharacters.test(input)) {
        throw new Error("Invalid characters");
    }

    // Check parentheses
    let balance = 0;

    for (const char of input) {
        if (char === "(") balance++;
        if (char === ")") balance--;

        if (balance < 0) {
            throw new Error("Check parentheses");
        }
    }

    if (balance !== 0) {
        throw new Error("Check parentheses");
    }
}


// ===============================
// CALCULATE
// ===============================

function calculate() {
    if (!expression) return;

    try {
        validateExpression(expression);

        const prepared = prepareExpression(expression);

        /*
         * Important:
         * factorial, sin, cos and tan are explicitly
         * passed into Function().
         */
        const calculateFunction = Function(
            "factorial",
            "sin",
            "cos",
            "tan",
            "sqrt",
            "log10",
            "ln",
            `"use strict"; return (${prepared});`
        );

        const result = calculateFunction(
            factorial,
            sin,
            cos,
            tan,
            Math.sqrt,
            Math.log10,
            Math.log
        );

        if (
            typeof result !== "number" ||
            !Number.isFinite(result)
        ) {
            throw new Error("Invalid result");
        }

        const formattedResult = formatResult(result);

        lastExpression = expression;
        lastResult = formattedResult;

        expression = formattedResult;

        statusText.textContent = "CALCULATED";

        explainButton.disabled = false;

        saveHistory(lastExpression, formattedResult);

        updateDisplay();

    } catch (error) {
        statusText.textContent = "ERROR";

        display.textContent = error.message || "Invalid expression";

        setTimeout(() => {
            if (statusText.textContent === "ERROR") {
                statusText.textContent = "READY";
                updateDisplay();
            }
        }, 1800);
    }
}


// ===============================
// FORMAT RESULT
// ===============================

function formatResult(value) {
    if (Number.isInteger(value)) {
        return String(value);
    }

    return Number(value.toFixed(10)).toString();
}


// ===============================
// HISTORY
// ===============================

function saveHistory(expressionValue, resultValue) {
    const item = {
        expression: expressionValue,
        result: resultValue,
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
    };

    history.unshift(item);

    if (history.length > 30) {
        history = history.slice(0, 30);
    }

    localStorage.setItem(
        "calcxHistory",
        JSON.stringify(history)
    );

    renderHistory();
}


// ===============================
// RENDER HISTORY
// ===============================

function renderHistory() {
    historyList.innerHTML = "";

    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                No calculations yet.
            </div>
        `;
        return;
    }

    history.forEach((item, index) => {
        const historyItem = document.createElement("div");

        historyItem.className = "history-item";

        historyItem.innerHTML = `
            <div class="history-expression">
                ${escapeHTML(item.expression)}
            </div>

            <div class="history-result">
                = ${escapeHTML(item.result)}
            </div>

            <div class="history-time">
                ${escapeHTML(item.time)}
            </div>
        `;

        historyItem.addEventListener("click", () => {
            expression = item.expression;
            lastExpression = "";
            statusText.textContent = "HISTORY";

            updateDisplay();
            closeHistoryDrawer();
        });

        historyList.appendChild(historyItem);
    });
}


// ===============================
// HISTORY DRAWER
// ===============================

function openHistoryDrawer() {
    historyDrawer.classList.add("open");
}

function closeHistoryDrawer() {
    historyDrawer.classList.remove("open");
}

historyButton.addEventListener(
    "click",
    openHistoryDrawer
);

closeHistory.addEventListener(
    "click",
    closeHistoryDrawer
);

clearHistoryButton.addEventListener(
    "click",
    () => {
        history = [];

        localStorage.removeItem("calcxHistory");

        renderHistory();

        showToast("History cleared");
    }
);


// ===============================
// SCIENTIFIC PANEL
// ===============================

scientificToggle.addEventListener("click", () => {
    scientificPanel.classList.toggle("open");

    scientificToggle.classList.toggle("active");
});


// ===============================
// DEG / RAD
// ===============================

angleMode.addEventListener("click", () => {
    degreeMode = !degreeMode;

    angleMode.textContent =
        degreeMode ? "DEG" : "RAD";

    showToast(
        degreeMode
            ? "Degree mode"
            : "Radian mode"
    );
});


// ===============================
// BASIC KEYPAD
// ===============================

keypad.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) return;

    const value = button.dataset.value;
    const action = button.dataset.action;

    if (action === "clear") {
        clearCalculator();
        return;
    }

    if (action === "delete") {
        deleteLast();
        return;
    }

    if (action === "calculate") {
        calculate();
        return;
    }

    if (value !== undefined) {
        addToExpression(value);
    }
});


// ===============================
// SCIENTIFIC BUTTONS
// ===============================

scientificPanel.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) return;

    const value = button.dataset.value;
    const action = button.dataset.action;

    if (action === "calculate") {
        calculate();
        return;
    }

    if (action === "clear") {
        clearCalculator();
        return;
    }

    if (action === "delete") {
        deleteLast();
        return;
    }

    if (value !== undefined) {
        addToExpression(value);
    }
});


// ===============================
// EXPLAIN
// ===============================

explainButton.addEventListener("click", () => {
    if (!lastExpression || !lastResult) {
        showToast("Calculate something first");
        return;
    }

    generateExplanation(
        lastExpression,
        lastResult
    );

    explainModal.classList.add("open");
});


closeExplain.addEventListener(
    "click",
    () => {
        explainModal.classList.remove("open");
    }
);


explainModal.addEventListener("click", (event) => {
    if (event.target === explainModal) {
        explainModal.classList.remove("open");
    }
});


// ===============================
// EXPLANATION GENERATOR
// ===============================

function generateExplanation(expressionValue, resultValue) {
    let explanation = "";

    if (expressionValue.includes("!")) {
        const number = expressionValue.replace("!", "");

        explanation = `
            <h3>Factorial</h3>
            <p>
                The factorial of ${escapeHTML(number)}
                is calculated by multiplying all positive
                integers from 1 up to that number.
            </p>

            <div class="explain-result">
                ${escapeHTML(number)}! = ${escapeHTML(resultValue)}
            </div>
        `;
    }

    else if (
        expressionValue.includes("+")
    ) {
        explanation = `
            <h3>Addition</h3>
            <p>
                The calculator adds the values in the
                expression and displays the final result.
            </p>

            <div class="explain-result">
                ${escapeHTML(expressionValue)}
                = ${escapeHTML(resultValue)}
            </div>
        `;
    }

    else if (
        expressionValue.includes("-")
    ) {
        explanation = `
            <h3>Subtraction</h3>
            <p>
                The calculator subtracts the values
                according to the given expression.
            </p>

            <div class="explain-result">
                ${escapeHTML(expressionValue)}
                = ${escapeHTML(resultValue)}
            </div>
        `;
    }

    else if (
        expressionValue.includes("*") ||
        expressionValue.includes("×")
    ) {
        explanation = `
            <h3>Multiplication</h3>
            <p>
                The calculator multiplies the given
                values according to standard arithmetic
                precedence.
            </p>

            <div class="explain-result">
                ${escapeHTML(expressionValue)}
                = ${escapeHTML(resultValue)}
            </div>
        `;
    }

    else if (
        expressionValue.includes("/") ||
        expressionValue.includes("÷")
    ) {
        explanation = `
            <h3>Division</h3>
            <p>
                The calculator divides the values in
                the expression and returns the result.
            </p>

            <div class="explain-result">
                ${escapeHTML(expressionValue)}
                = ${escapeHTML(resultValue)}
            </div>
        `;
    }

    else {
        explanation = `
            <h3>Calculation</h3>

            <p>
                The expression was parsed and evaluated
                using JavaScript arithmetic and the
                selected calculator functions.
            </p>

            <div class="explain-result">
                ${escapeHTML(expressionValue)}
                = ${escapeHTML(resultValue)}
            </div>
        `;
    }

    explainContent.innerHTML = explanation;
}


// ===============================
// COPY RESULT
// ===============================

copyButton.addEventListener("click", async () => {
    if (!lastResult && !expression) {
        showToast("Nothing to copy");
        return;
    }

    const valueToCopy =
        lastResult || expression;

    try {
        await navigator.clipboard.writeText(
            valueToCopy
        );

        showToast("Result copied");
    } catch {
        showToast("Copy failed");
    }
});


// ===============================
// THEME
// ===============================

themeButton.addEventListener("click", () => {
    document.body.classList.toggle("light");

    const isLight =
        document.body.classList.contains("light");

    localStorage.setItem(
        "calcxTheme",
        isLight ? "light" : "dark"
    );

    themeButton.textContent =
        isLight ? "☀" : "☾";
});


// Load saved theme
if (
    localStorage.getItem("calcxTheme") === "light"
) {
    document.body.classList.add("light");
    themeButton.textContent = "☀";
}


// ===============================
// KEYBOARD SUPPORT
// ===============================

document.addEventListener("keydown", (event) => {
    const key = event.key;

    // Numbers
    if (/^[0-9]$/.test(key)) {
        addToExpression(key);
        return;
    }

    // Decimal
    if (key === ".") {
        addToExpression(".");
        return;
    }

    // Operators
    if (
        key === "+" ||
        key === "-" ||
        key === "*" ||
        key === "/" ||
        key === "^"
    ) {
        addToExpression(key);
        return;
    }

    // Parentheses
    if (key === "(" || key === ")") {
        addToExpression(key);
        return;
    }

    // Percentage
    if (key === "%") {
        addToExpression("%");
        return;
    }

    // Factorial
    if (key === "!") {
        addToExpression("!");
        return;
    }

    // Enter
    if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
        return;
    }

    // Backspace
    if (key === "Backspace") {
        deleteLast();
        return;
    }

    // Escape
    if (key === "Escape") {
        clearCalculator();
    }
});


// ===============================
// ESCAPE HTML
// ===============================

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ===============================
// INITIALIZE
// ===============================

renderHistory();
updateDisplay();

statusText.textContent = "READY";
angleMode.textContent = "DEG";


// ===============================
// CLOSE DRAWER WITH ESCAPE
// ===============================

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        historyDrawer.classList.remove("open");
        explainModal.classList.remove("open");
    }
});