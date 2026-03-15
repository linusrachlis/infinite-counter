"use strict";
document.addEventListener("DOMContentLoaded", function() {
    /**
     * Tracks the current amount for the purpose of the next requested
     * mathematical operation
     */
    let currentValue: number = 0;

    /**
        Track the currently displayed amount for the purpose of animating
        between values (i.e. it changes incrementally when animating beteween
        two values whose difference is >1).

        Initially null.
     */
    let transitionalValue: number | null = null;

    /**
     * Gets unset when timeout cleared
     */
    let transitionTimeoutId: number | null = null;

    const transitionStepDelayMs = 300;
    const middleTransitionStepDelayMs = 50;
    let shouldCount = false;
    const initialDelayMs = 600;
    const delayDecayFactor = 0.8;
    const minDelayMs = 50;

    const counterContainer = document.getElementById("counter-container");
    const plusButton = <HTMLButtonElement>document.getElementById("button_plus");
    const minusButton = <HTMLButtonElement>document.getElementById("button_minus");
    const timesButton = <HTMLButtonElement>document.getElementById("button_times");
    const divideButton = <HTMLButtonElement>document.getElementById("button_divide");
    const incrementField = <HTMLInputElement>document.getElementById("increment_field");

    function getIncrementValue() {
        let incrementValue = parseInt(incrementField.value);
        if (Number.isNaN(incrementValue)) incrementValue = 0;
        return incrementValue;
    }

    function createElementWithTextContent(tagName: string, textContent: string) {
        const element = document.createElement(tagName);
        element.innerHTML = textContent;
        return element;
    }

    /**
        Take transitionalValue one more step in the direction of the currentValue,
        and animate.
    */
    function stepTowardsCurrentValue(isFirstStep: boolean): void {
        // TODO: handle negative sign separately when number length is
        // changing (maybe have it slide over)

        // TODO: visualize discarding the remainder on division

        let nextValue: number;
        if (transitionalValue === null) {
            // Initialization
            nextValue = transitionalValue = currentValue;
        } else if (transitionalValue < currentValue) {
            nextValue = transitionalValue + 1;
        } else if (transitionalValue > currentValue) {
            nextValue = transitionalValue - 1;
        } else {
            // Shoudn't happen, just for robustness
            clearTimeout(transitionTimeoutId);
            transitionTimeoutId = null;
            return;
        }

        // We reverse the digit arrays because we want to compare them
        // from lowest to highest place
        const oldDigits = transitionalValue.toString().split("").reverse();
        const newDigits = nextValue.toString().split("").reverse();

        // These 3 arrays must be kept the same size
        const digitsLeaving: string[] = [];
        const digitsStaying: string[] = [];
        const digitsEntering: string[] = [];

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

        const animationClassPrefix = nextValue > transitionalValue ? "increment" : "decrement";
        const isLastStep = nextValue === currentValue;
        const additionalClassNames: string[] = [];

        if (isFirstStep && isLastStep) {
            additionalClassNames.push("only-step");
        } else if (isFirstStep) {
            additionalClassNames.push("first-step");
        } else if (isLastStep) {
            additionalClassNames.push("last-step");
        } else {
            additionalClassNames.push("middle-step");
        }

        const digitsEnteringElem = createElementWithTextContent("div", digitsEntering.join(""));
        digitsEnteringElem.classList.add(
            `${animationClassPrefix}-entering`,
            ...additionalClassNames
        );

        const digitsStayingElem = createElementWithTextContent("div", digitsStaying.join(""));

        const digitsLeavingElem = createElementWithTextContent("div", digitsLeaving.join(""));
        digitsLeavingElem.classList.add(
            `${animationClassPrefix}-leaving`,
            ...additionalClassNames
        );

        counterContainer.replaceChildren(digitsEnteringElem, digitsStayingElem, digitsLeavingElem);

        transitionalValue = nextValue;
        if (transitionalValue !== currentValue) {
            const stepDelay = (isFirstStep || isLastStep) ? transitionStepDelayMs : middleTransitionStepDelayMs;
            transitionTimeoutId = setTimeout(
                stepTowardsCurrentValue,
                stepDelay,
                false
            );
        }
    }

    function updateCurrentValue(newValue: number): void {
        currentValue = newValue;
        if (transitionTimeoutId) clearTimeout(transitionTimeoutId);
        stepTowardsCurrentValue(true);
    }

    function addToValue(mult: number): void {
        updateCurrentValue(currentValue + getIncrementValue() * mult);
    }

    function multiplyValue(): void {
        updateCurrentValue(currentValue * getIncrementValue());
    }

    function divideValue(): void {
        updateCurrentValue(Math.round(currentValue / getIncrementValue()));
    }

    function startCounting(callback: () => void): void {
        shouldCount = true;
        count(callback, initialDelayMs);
    }

    function count(callback: () => void, delayMs: number): void {
        if (!shouldCount) return;

        callback();
        const nextDelayMs = Math.max(minDelayMs, delayMs * delayDecayFactor);
        setTimeout(count.bind(null, callback, nextDelayMs), delayMs);
    }

    function stopCounting(): void {
        shouldCount = false;
    }

    document.addEventListener("pointerdown", function(e) {
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

    document.addEventListener("pointerup", function(e) { stopCounting(); });
    document.addEventListener("pointercancel", function(e) { stopCounting(); });

    document.addEventListener("keydown", function(e) {
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

