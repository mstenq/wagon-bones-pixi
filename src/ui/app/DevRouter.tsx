import { App } from '@/ui/app/App';
import { PlaygroundLayout } from '@/ui/layout/PlaygroundLayout';

function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col gap-4 p-6">
      <header>
        <h1 className="m-0 text-2xl font-bold">Unknown route</h1>
      </header>
      <p className="m-0 text-sm text-zinc-300">Use one of the development routes below:</p>
      <nav className="flex flex-col gap-2 text-sm font-semibold">
        <a href="/">Game</a>
        <a href="/playground">Playground</a>
      </nav>
    </main>
  );
}

export function DevRouter() {
  const pathname = window.location.pathname;

  if (pathname === '/playground') {
    return <PlaygroundLayout />;
  }
  if (pathname === '/') {
    return <App />;
  }
  return <NotFoundPage />;
}
