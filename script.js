const currentDisplay =
    document.getElementById("currentDisplay");

const previousDisplay =
    document.getElementById("previousDisplay");

const statusText =
    document.getElementById("statusText");

const angleText =
    document.getElementById("angleText");

const scientificToggle =
    document.getElementById("scientificToggle");

const scientificPanel =
    document.getElementById("scientificPanel");

const angleMode =
    document.getElementById("angleMode");

let expression = "";
let lastExpression = "";
let lastResult = "";
let degreeMode = true;


/* =========================
   HISTORY
========================= */

let history =
    JSON.parse(localStorage.getItem("calcxHistory")) || [];


/* =========================
   DISPLAY
========================= */

function updateDisplay() {
    currentDisplay.textContent =
        expression || "0";
}


function setStatus(text) {
    statusText.textContent = text;
}


/* =========================
   INPUT
========================= */

function addValue(value) {

    expression += value;

    setStatus("EDITING");

    updateDisplay();
}


function clearCalculator() {

    expression = "";
    lastExpression = "";
    lastResult = "";

    previousDisplay.textContent = "";

    setStatus("READY");

    updateDisplay();
}


function deleteLast() {

    expression =
        expression.slice(0, -1);

    setStatus("EDITING");

    updateDisplay();
}


/* =========================
   SCIENTIFIC
========================= */

scientificToggle.addEventListener(
    "click",
    () => {

        scientificPanel.classList.toggle(
            "open"
        );

    }
);


scientificPanel.addEventListener(
    "click",
    event => {

        const button = event.target;

        if (button.dataset.value) {
            addValue(button.dataset.value);
        }

    }
);


/* =========================
   DEG / RAD
========================= */

angleMode.addEventListener(
    "click",
    () => {

        degreeMode = !degreeMode;

        const mode =
            degreeMode ? "DEG" : "RAD";

        angleMode.textContent = mode;
        angleText.textContent = mode;

    }
);


/* =========================
   KEYPAD
========================= */

document
    .querySelector(".keypad")
    .addEventListener(
        "click",
        event => {

            const button =
                event.target;

            if (button.dataset.value) {
                addValue(
                    button.dataset.value
                );
            }

            if (
                button.dataset.action ===
                "clear"
            ) {
                clearCalculator();
            }

            if (
                button.dataset.action ===
                "delete"
            ) {
                deleteLast();
            }

            if (
                button.dataset.action ===
                "calculate"
            ) {
                calculate();
            }

        }
    );


/* =========================
   FACTORIAL
========================= */

function factorial(number) {

    if (
        number < 0 ||
        !Number.isInteger(number)
    ) {
        throw new Error(
            "Invalid factorial"
        );
    }

    let result = 1;

    for (
        let i = 2;
        i <= number;
        i++
    ) {
        result *= i;
    }

    return result;
}


/* =========================
   PREPARE EXPRESSION
========================= */

function prepareExpression(input) {

    let result = input;


    /* Constants */

    result =
        result.replace(
            /pi/g,
            "Math.PI"
        );

    result =
        result.replace(
            /\be\b/g,
            "Math.E"
        );


    /* Functions */

    result =
        result.replace(
            /sqrt\(/g,
            "Math.sqrt("
        );

    result =
        result.replace(
            /log\(/g,
            "Math.log10("
        );

    result =
        result.replace(
            /ln\(/g,
            "Math.log("
        );


    /* Power */

    result =
        result.replace(
            /\^/g,
            "**"
        );


    /* Percentage */

    result =
        result.replace(
            /(\d+(?:\.\d+)?)%/g,
            "($1/100)"
        );


    /* Trigonometry */

    if (degreeMode) {

        result =
            result.replace(
                /sin\(([^()]*)\)/g,
                "Math.sin(($1)*Math.PI/180)"
            );

        result =
            result.replace(
                /cos\(([^()]*)\)/g,
                "Math.cos(($1)*Math.PI/180)"
            );

        result =
            result.replace(
                /tan\(([^()]*)\)/g,
                "Math.tan(($1)*Math.PI/180)"
            );

    } else {

        result =
            result.replace(
                /sin\(([^()]*)\)/g,
                "Math.sin($1)"
            );

        result =
            result.replace(
                /cos\(([^()]*)\)/g,
                "Math.cos($1)"
            );

        result =
            result.replace(
                /tan\(([^()]*)\)/g,
                "Math.tan($1)"
            );

    }


    /* Factorial */

    while (result.includes("!")) {

        result =
            result.replace(
                /(\d+(?:\.\d+)?)!/,
                "factorial($1)"
            );

    }


    return result;
}


/* =========================
   VALIDATION
========================= */

function validateExpression(input) {

    if (!input.trim()) {
        throw new Error("Empty");
    }


    if (
        !/^[0-9+\-*/%^().,\sA-Za-z_]+$/
            .test(input)
    ) {
        throw new Error("Invalid");
    }


    let balance = 0;

    for (const char of input) {

        if (char === "(") {
            balance++;
        }

        if (char === ")") {
            balance--;
        }

        if (balance < 0) {
            throw new Error(
                "Parentheses"
            );
        }
    }


    if (balance !== 0) {
        throw new Error(
            "Parentheses"
        );
    }

}


/* =========================
   CALCULATE
========================= */

function calculate() {

    if (!expression) {
        return;
    }

    try {

        validateExpression(
            expression
        );

        const prepared =
            prepareExpression(
                expression
            );


        const result =
            Function(
                "factorial",
                `"use strict";
                 return (${prepared})`
            )(factorial);


        if (!Number.isFinite(result)) {
            throw new Error(
                "Invalid calculation"
            );
        }


        const formatted =
            Number.isInteger(result)
                ? result.toString()
                : Number(
                    result.toFixed(10)
                  ).toString();


        lastExpression =
            expression;

        lastResult =
            formatted;


        previousDisplay.textContent =
            expression + " =";

        expression =
            formatted;


        setStatus("CALCULATED");

        updateDisplay();


        addHistory(
            lastExpression,
            lastResult
        );


    } catch (error) {

        currentDisplay.textContent =
            "Error";

        setStatus(
            "CHECK INPUT"
        );


        setTimeout(() => {

            expression = "";

            previousDisplay.textContent =
                "";

            setStatus("READY");

            updateDisplay();

        }, 1200);

    }

}


/* =========================
   HISTORY
========================= */

function saveHistory() {

    localStorage.setItem(
        "calcxHistory",
        JSON.stringify(history)
    );

}


function addHistory(
    expressionValue,
    resultValue
) {

    history.unshift({

        expression:
            expressionValue,

        result:
            resultValue,

        time:
            new Date()
                .toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )

    });


    history =
        history.slice(0, 30);

    saveHistory();

    renderHistory();

}


function renderHistory() {

    const list =
        document.getElementById(
            "historyList"
        );


    if (history.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                <span>∅</span>
                <p>No calculations yet.</p>
                <small>
                    Your calculations will appear here.
                </small>
            </div>
        `;

        return;
    }


    list.innerHTML =
        history.map(
            (item, index) => `

            <div
                class="history-item"
                data-index="${index}"
            >

                <div class="history-expression">
                    ${escapeHTML(
                        item.expression
                    )}
                </div>

                <div class="history-result">
                    = ${escapeHTML(
                        item.result
                    )}
                </div>

                <div class="history-time">
                    ${escapeHTML(
                        item.time
                    )}
                </div>

            </div>

        `
        ).join("");

}


/* =========================
   HISTORY DRAWER
========================= */

const historyBtn =
    document.getElementById(
        "historyBtn"
    );

const historyDrawer =
    document.getElementById(
        "historyDrawer"
    );

const closeHistory =
    document.getElementById(
        "closeHistory"
    );

const drawerOverlay =
    document.getElementById(
        "drawerOverlay"
    );


function openHistory() {

    renderHistory();

    historyDrawer.classList.add(
        "open"
    );

    drawerOverlay.classList.add(
        "open"
    );

}


function closeHistoryDrawer() {

    historyDrawer.classList.remove(
        "open"
    );

    drawerOverlay.classList.remove(
        "open"
    );

}


historyBtn.addEventListener(
    "click",
    openHistory
);

closeHistory.addEventListener(
    "click",
    closeHistoryDrawer
);

drawerOverlay.addEventListener(
    "click",
    closeHistoryDrawer
);


/* =========================
   REUSE HISTORY
========================= */

document
    .getElementById("historyList")
    .addEventListener(
        "click",
        event => {

            const item =
                event.target.closest(
                    ".history-item"
                );

            if (!item) {
                return;
            }


            const selected =
                history[
                    Number(
                        item.dataset.index
                    )
                ];


            expression =
                selected.expression;

            previousDisplay.textContent =
                "";

            setStatus("RELOADED");

            updateDisplay();

            closeHistoryDrawer();

        }
    );


/* =========================
   CLEAR HISTORY
========================= */

document
    .getElementById("clearHistory")
    .addEventListener(
        "click",
        () => {

            history = [];

            saveHistory();

            renderHistory();

        }
    );


/* =========================
   EXPLAIN
========================= */

const explainModal =
    document.getElementById(
        "explainModal"
    );

const explainContent =
    document.getElementById(
        "explainContent"
    );


document
    .getElementById("explainBtn")
    .addEventListener(
        "click",
        () => {

            if (
                !lastExpression ||
                !lastResult
            ) {

                showToast(
                    "Calculate something first"
                );

                return;
            }


            let explanation =
                "The expression is evaluated using standard arithmetic rules.";


            if (
                lastExpression.includes("+")
            ) {

                explanation =
                    "Addition combines the values using the + operator.";

            }

            else if (
                lastExpression.includes("-")
            ) {

                explanation =
                    "Subtraction finds the difference between the values.";

            }

            else if (
                lastExpression.includes("*")
            ) {

                explanation =
                    "Multiplication combines the values.";

            }

            else if (
                lastExpression.includes("/")
            ) {

                explanation =
                    "Division divides one value by another.";

            }

            else if (
                lastExpression.includes("sqrt(")
            ) {

                explanation =
                    "The square-root function finds the number that produces the input when multiplied by itself.";

            }

            else if (
                lastExpression.includes("sin(")
            ) {

                explanation =
                    `Sine was calculated in ${
                        degreeMode
                            ? "degree"
                            : "radian"
                    } mode.`;

            }

            else if (
                lastExpression.includes("cos(")
            ) {

                explanation =
                    `Cosine was calculated in ${
                        degreeMode
                            ? "degree"
                            : "radian"
                    } mode.`;

            }

            else if (
                lastExpression.includes("tan(")
            ) {

                explanation =
                    `Tangent was calculated in ${
                        degreeMode
                            ? "degree"
                            : "radian"
                    } mode.`;

            }

            else if (
                lastExpression.includes("^")
            ) {

                explanation =
                    "The base is raised to the specified exponent.";

            }

            else if (
                lastExpression.includes("!")
            ) {

                explanation =
                    "Factorial multiplies all positive integers up to the given number.";

            }


            explainContent.innerHTML = `

                <div class="explain-expression">
                    ${escapeHTML(
                        lastExpression
                    )}
                </div>

                <div class="explain-step">
                    ${escapeHTML(
                        explanation
                    )}
                </div>

                <div class="explain-answer">
                    Answer: ${escapeHTML(
                        lastResult
                    )}
                </div>

            `;


            explainModal.classList.remove(
                "hidden"
            );

        }
    );


function closeExplainModal() {

    explainModal.classList.add(
        "hidden"
    );

}


document
    .getElementById("closeExplain")
    .addEventListener(
        "click",
        closeExplainModal
    );


document
    .getElementById("closeExplainBottom")
    .addEventListener(
        "click",
        closeExplainModal
    );


/* =========================
   COPY
========================= */

document
    .getElementById("copyBtn")
    .addEventListener(
        "click",
        async () => {

            const value =
                currentDisplay.textContent;

            if (
                !value ||
                value === "0" ||
                value === "Error"
            ) {

                showToast(
                    "Nothing to copy"
                );

                return;
            }


            try {

                await navigator.clipboard
                    .writeText(value);

                showToast(
                    "Answer copied"
                );

            } catch {

                showToast(
                    "Copy unavailable"
                );

            }

        }
    );


/* =========================
   THEME
========================= */

const themeBtn =
    document.getElementById(
        "themeBtn"
    );


themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "light"
        );

        const isLight =
            document.body.classList.contains(
                "light"
            );

        localStorage.setItem(
            "calcxTheme",
            isLight
                ? "light"
                : "dark"
        );

        themeBtn.textContent =
            isLight
                ? "☀"
                : "◐";

    }
);


/* =========================
   KEYBOARD
========================= */

document.addEventListener(
    "keydown",
    event => {

        const key =
            event.key;


        if (
            /^[0-9.]$/.test(key)
        ) {

            addValue(key);

        }

        else if (
            [
                "+",
                "-",
                "*",
                "/",
                "%",
                "(",
                ")",
                "^"
            ].includes(key)
        ) {

            addValue(key);

        }

        else if (
            key === "Enter" ||
            key === "="
        ) {

            event.preventDefault();

            calculate();

        }

        else if (
            key === "Backspace"
        ) {

            deleteLast();

        }

        else if (
            key === "Escape"
        ) {

            clearCalculator();

        }

    }
);


/* =========================
   HELPER
========================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
/* =========================
   INITIALIZE
========================= */

if (
    localStorage.getItem(
        "calcxTheme"
    ) === "light"
) {

    document.body.classList.add(
        "light"
    );

    themeBtn.textContent = "☀";

}
renderHistory();
updateDisplay();
