import { App } from "@/ui/app/App";
import { PlaygroundPage } from "@/ui/playground/PlaygroundPage";

function NotFoundPage() {
  return (
    <main className="playground-page">
      <header className="playground-header">
        <h1 className="playground-title">Unknown route</h1>
      </header>
      <p className="playground-help">Use one of the development routes below:</p>
      <nav className="playground-nav">
        <a href="/">Game</a>
        <a href="/playground">Playground</a>
      </nav>
    </main>
  );
}

export function DevRouter() {
  const pathname = window.location.pathname;

  if (pathname === "/playground") {
    return <PlaygroundPage />;
  }
  if (pathname === "/") {
    return <App />;
  }
  return <NotFoundPage />;
}
