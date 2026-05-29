/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from "react-dom/client";

import "@/ui/pixi/extend";
import "@/ui/css/index.css";

const elem = document.getElementById("root")!;
const root = import.meta.hot?.data.root ?? createRoot(elem);

if (import.meta.hot) {
  import.meta.hot.data.root = root;
}

async function mount() {
  if (import.meta.env.DEV) {
    const { DevRouter } = await import("./ui/app/DevRouter");
    root.render(<DevRouter />);
    return;
  }

  const { App } = await import("./ui/app/App");
  root.render(<App />);
}

// https://bun.com/docs/bundler/hot-reloading#import-meta-hot-data
void mount();
