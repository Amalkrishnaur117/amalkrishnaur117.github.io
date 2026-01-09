# Project Overview

The **Deep Learning Intuition & Debugging Platform** is a single-page interactive web application designed to teach deep learning concepts and debugging methodologies through visualization and gamification. The project operates entirely client-side, using vanilla web technologies to simulate training dynamics and present debugging scenarios.

## Architecture

This project is a **Single File Application**, meaning the entire codebase (HTML, CSS, and JavaScript) resides within `index.html`.

*   **Type:** Static Web Application (Client-Side Only)
*   **Languages:** HTML5, CSS3, Vanilla JavaScript (ES6+)
*   **Dependencies (CDN):**
    *   **Chart.js:** For real-time training loss visualization.
    *   **MathJax:** For rendering LaTeX mathematical equations (e.g., gradient derivations).
    *   **FontAwesome:** For UI icons.

## Key Features

1.  **Gradient Lab:** An interactive simulator where users can adjust sample sizes (benign vs. attack), weights, and SMOTE settings to visualize how these factors affect gradient calculation and model training stability.
2.  **Debugging Game:** A gamified experience with 10 specific scenarios (e.g., "The Double Correction Bug", "Shuffle Catastrophe"). Each scenario follows a strict scientific workflow:
    *   **Investigate:** Inspect batch composition, gradients, and loss curves.
    *   **Hypothesize:** Select the root cause from a list of options.
    *   **Derive:** View the mathematical proof explaining why the issue occurs.
    *   **Fix:** Apply the correct configuration change to resolve the bug.
3.  **First-Principles Focus:** The tool emphasizes mathematical derivations ("Show Me The Math") to ground intuition in theory.

## Usage

Since there is no build step or backend server, the application is ready to run immediately.

### Running the App
*   **Local:** simply open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).
*   **Hosted:** As this is a GitHub Pages repository (`.github.io`), it is likely accessible via `https://amalkrishnaur117.github.io/`.

## Development

*   **File:** All modifications should be made directly in `index.html`.
*   **State Management:** The application uses a global `state` object in JavaScript to track user progress, scenario configurations, and simulation parameters.
*   **Scenarios:** New debugging scenarios can be added by appending to the `scenarios` array in the JavaScript section.
