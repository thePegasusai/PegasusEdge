
# Pegasus Edge 🚀✨

**The Ultimate AI Co-Producer for Streamers & YouTubers**

Pegasus Edge is a cutting-edge, frontend application designed to provide content creators with a sophisticated suite of AI-powered tools. It aims to streamline the creative process, from ideation and branding to script outlines and audio concepts, all wrapped in a modern, premium "playboy esque" user interface. The flagship tool, **Creator's Edge Studio**, guides users through a multi-step workflow to generate a comprehensive "Content Kickstart Pack."

The application also showcases a conceptual integration of a subscription model using Stripe, allowing users to experience different access tiers.

## Table of Contents

- [Key Features](#key-features)
- [Flagship Tool: Creator's Edge Studio](#flagship-tool-creators-edge-studio)
- [Other AI Tools](#other-ai-tools)
- [Subscription Model (Conceptual)](#subscription-model-conceptual)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Running the Application](#running-the-application)
- [Important Notes](#important-notes)

## Key Features

*   **Modern & Sophisticated UI/UX:** A "modern playboy esque" dark theme with gold, purple, and pink accents, designed for an inspiring and premium user experience.
*   **Targeted for Creators:** Tools and workflows specifically tailored to the needs of streamers and YouTubers.
*   **AI-Powered Generation:** Leverages the Google Gemini API for text and image generation, chat, and search-grounded insights.
*   **Modular Tool Arsenal:** A collection of distinct AI tools accessible through a unified interface.
*   **Conceptual Subscription & Payments:** Demonstrates a frontend framework for handling subscriptions (free first use, pay-per-use, monthly, lifetime) with mock Stripe integration.
*   **Responsive Design:** Built to be usable across various screen sizes.

## Flagship Tool: Creator's Edge Studio

The heart of Pegasus Edge, this multi-step AI co-producer helps creators generate a full content pack:

1.  **The Vision:** Define channel niche, video topic, and content style to get AI-generated titles, unique angles, and target audience personas.
2.  **Visual Signature:** Based on the vision, AI suggests color palettes, font pairings, and thumbnail concepts.
3.  **Content Blueprint:** AI drafts key talking points, intro hooks, call-to-action phrases, and interactive segment ideas.
4.  **Audio Alchemy:** Generates AI concepts for background music, jingles, sound effects, and voiceover tones, with a nod to future integration of models like AudioCraft.
5.  **Your Edge Pack:** A consolidated summary of all generated assets.

## Other AI Tools

*   **Rapid Text Crafter:** For generating various text-based content (scripts, descriptions, etc.).
*   **Visual Spark Generator:** For creating AI-generated images from prompts.
*   **AI Creative Consultant:** An interactive chatbot for brainstorming, refining ideas, and getting AI-driven advice.
*   **Trend Spotter:** Uses Google Search grounding to provide AI insights on current events, trending topics, and up-to-date information.

## Subscription Model (Conceptual)

Pegasus Edge implements a frontend simulation of a subscription model:

*   **Free First Use:** The first full run of the Creator's Edge Studio is free.
*   **Pay-Per-Use:** After the free run, subsequent uses of the Creator's Edge Studio (or other individual tools) cost $1 (simulated).
*   **Pegasus Pro Monthly:** $20/month for unlimited access to all tools.
*   **Pegasus Edge Lifetime:** $999 one-time payment for lifetime unlimited access.

User subscription status is managed using React Context and persisted in `localStorage` for demonstration purposes. Payment modals and subscription card interactions simulate calls to a Stripe backend (which would be required for a live application).

## Technology Stack

*   **React 19:** For building the user interface.
*   **TypeScript:** For static typing and improved code quality.
*   **Tailwind CSS:** For utility-first styling and rapid UI development.
*   **Google Gemini API (@google/genai):** For all AI generation capabilities.
*   **React Router DOM (v6):** For client-side routing.
*   **ES Modules with Import Maps:** For managing dependencies directly in the browser.

## Project Structure

```
.
├── public/
│   └── index.html        # Main HTML entry point
├── src/
│   ├── App.tsx             # Main application component, routing, SubscriptionContext
│   ├── index.tsx           # React root rendering
│   ├── constants.tsx       # App-wide constants (models, text, icons, mock data)
│   ├── types.ts            # TypeScript type definitions
│   ├── services/
│   │   └── geminiService.ts  # Service for interacting with Google Gemini API
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── ToolsPage.tsx
│   │   └── SubscriptionPage.tsx
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── FeatureCard.tsx
│   │   ├── SubscriptionPlanCard.tsx
│   │   └── tools/            # Directory for individual AI tool components
│   │       ├── CreatorsEdgeStudioTool.tsx
│   │       ├── TextGeneratorTool.tsx
│   │       ├── ImageGeneratorTool.tsx
│   │       ├── ChatbotTool.tsx
│   │       └── SearchGroundingTool.tsx
├── metadata.json           # Application metadata
└── README.md               # This file
```

## Getting Started

### Prerequisites

1.  **Web Browser:** A modern web browser (Chrome, Firefox, Edge, Safari).
2.  **Google Gemini API Key:**
    *   The application requires a valid Google Gemini API key to function.
    *   This key **must** be available as an environment variable named `API_KEY` in the execution context where the JavaScript runs (i.e., `process.env.API_KEY`).
    *   The `App.tsx` component checks for this key upon initialization. If it's not found, the app will display an error message and will not be usable.
    *   **For local development without a server-side build process:** You might need to manually make this key available to the browser's `process.env` object before the application loads, or use a local development server that supports injecting environment variables. One common way for simple local serving is to modify `index.html` to temporarily set this, but **this is NOT secure for production or shared environments.**
        ```html
        <!-- In index.html, before your script tags - FOR LOCAL DEV ONLY -->
        <script>
          if (typeof process === 'undefined') {
            window.process = { env: {} };
          } else if (typeof process.env === 'undefined') {
            window.process.env = {};
          }
          // Make sure to replace YOUR_API_KEY_HERE with your actual key
          // DO NOT COMMIT THIS WITH YOUR ACTUAL KEY
          // process.env.API_KEY = 'YOUR_API_KEY_HERE';
        </script>
        ```
        **Warning:** Be extremely careful not to expose your API key in client-side code that gets committed to version control or deployed publicly. The recommended way is to have a build process that handles environment variables securely or use a backend proxy.

### Running the Application

1.  **Clone the repository (if applicable) or ensure all files are in a local directory.**
2.  **Set up your Google Gemini API Key:** Ensure `process.env.API_KEY` is accessible as described above.
3.  **Serve `index.html`:**
    *   You can use a simple HTTP server. If you have Python installed:
        ```bash
        python -m http.server
        ```
        Then open `http://localhost:8000` (or the port shown) in your browser.
    *   Alternatively, use an extension like "Live Server" in VS Code, which will serve the `index.html` file and often handle hot reloading.

## Important Notes

*   **API Key Security:** The current setup relies on `process.env.API_KEY` being available on the client side. For a production application, this is generally insecure. Consider using a backend proxy to make API calls to Google Gemini, where the API key can be stored securely.
*   **Stripe Integration:** The Stripe payment and subscription functionality is **purely conceptual and frontend-simulated**. Real payment processing requires a secure backend to interact with the Stripe API, manage customer data, and handle webhooks.
*   **Error Handling:** While basic error handling is in place, a production application would require more robust error management and user feedback.
*   **Performance:** For larger applications, consider code splitting and other optimization techniques.
*   **Accessibility (A11y):** While some ARIA attributes might be present, a full accessibility audit and implementation would be necessary for production.

---

Pegasus Edge - *Unleash Your Creative Edge.*
```
