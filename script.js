"use strict";
document.addEventListener("DOMContentLoaded", function () {
    let currentValue = 0;
    let transitionalValue = 0;
    let shouldCount = false;
    const initialDelayMs = 600;
    const delayDecayFactor = 0.8;
    const minDelayMs = 50;

    const counterContainer = document.getElementById("counter-container");
    const plusButton = document.getElementById("button_plus");
    const minusButton = document.getElementById("button_minus");
    const timesButton = document.getElementById("button_times");
    const divideButton = document.getElementById("button_divide");
    const incrementField = document.getElementById("increment_field");

    function getIncrementValue() {
        let incrementValue = parseInt(incrementField.value);
        if (Number.isNaN(incrementValue)) incrementValue = 0;
        return incrementValue;
    }

    function createElementWithTextContent(tagName, textContent) {
        const element = document.createElement(tagName);
        element.innerHTML = textContent;
        return element;
    }

    function updateCurrentValue(newValue) {
        // TODO: handle negative sign separately when number length is
        // changing (maybe have it slide over)

        // We reverse the digit arrays because we want to compare them
        // from lowest to highest place
        const oldDigits = currentValue.toString().split("").reverse();
        const newDigits = newValue.toString().split("").reverse();

        // These 3 arrays must be kept the same size
        const digitsLeaving = [];
        const digitsStaying = [];
        const digitsEntering = [];

        for (let i = 0; i < newDigits.length; i++) {
            if (i < oldDigits.length) {
                // There is a previous digit in the same place
                if (oldDigits[i] === newDigits[i]) {
                    // It's the same digit, so it's staying
                    digitsLeaving.unshift("&nbsp;");
                    digitsStaying.unshift(newDigits[i]);
                    digitsEntering.unshift("&nbsp;");
                } else {
                    // It's a different digit, so add old digit to
                    // leaving group and new digit to entering group
                    digitsLeaving.unshift(oldDigits[i]);
                    digitsStaying.unshift("&nbsp;");
                    digitsEntering.unshift(newDigits[i]);
                }
            } else {
                // There is no previous digit in the same place, so add
                // new digit to the entering group
                digitsLeaving.unshift("&nbsp;");
                digitsStaying.unshift("&nbsp;");
                digitsEntering.unshift(newDigits[i]);
            }
        }
        for (let i = newDigits.length; i < oldDigits.length; i++) {
            // If the number shrunk to a shorter length (i.e. oldDigits
            // is longer than newDigits), add remaining oldDigits to
            // the leaving group.
            digitsLeaving.unshift(oldDigits[i]);
            digitsStaying.unshift("&nbsp;");
            digitsEntering.unshift("&nbsp;");
        }

        const animationClassPrefix = newValue > currentValue ? "increment" : "decrement";
        const digitsEnteringElem = createElementWithTextContent("div", digitsEntering.join(""));
        digitsEnteringElem.classList.add(`${animationClassPrefix}-entering`);
        const digitsStayingElem = createElementWithTextContent("div", digitsStaying.join(""));
        const digitsLeavingElem = createElementWithTextContent("div", digitsLeaving.join(""));
        digitsLeavingElem.classList.add(`${animationClassPrefix}-leaving`);

        counterContainer.replaceChildren(digitsEnteringElem, digitsStayingElem, digitsLeavingElem);
        currentValue = newValue;
    }

    function addToValue(mult) {
        updateCurrentValue(currentValue + getIncrementValue() * mult);
    }

    function multiplyValue() {
        updateCurrentValue(currentValue * getIncrementValue());
    }

    function divideValue() {
        updateCurrentValue(Math.round(currentValue / getIncrementValue()));
    }

    function startCounting(callback) {
        shouldCount = true;
        count(callback, initialDelayMs);
    }

    function count(callback, delayMs) {
        if (!shouldCount) return;

        callback();
        const nextDelayMs = Math.max(minDelayMs, delayMs * delayDecayFactor);
        setTimeout(count.bind(null, callback, nextDelayMs), delayMs);
    }

    function stopCounting() {
        shouldCount = false;
    }

    document.addEventListener("pointerdown", function (e) {
        switch (e.target) {
            case plusButton:
                startCounting(addToValue.bind(null, 1));
                break;
            case minusButton:
                startCounting(addToValue.bind(null, -1));
                break;
            case timesButton:
                startCounting(multiplyValue);
                break;
            case divideButton:
                startCounting(divideValue);
                break;
        }
    });

    document.addEventListener("pointerup", function (e) {stopCounting();});
    document.addEventListener("pointercancel", function (e) {stopCounting();});

    document.addEventListener("keydown", function (e) {
        switch (e.key) {
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
                break;
            case "=":
            case "+":
                addToValue(1);
                e.preventDefault();
                break;
            case "-":
                addToValue(-1);
                e.preventDefault();
                break;
            case "*":
                multiplyValue();
                e.preventDefault();
                break;
            case "/":
                divideValue();
                e.preventDefault();
                break;
        }
    });

    addToValue(0);
});

