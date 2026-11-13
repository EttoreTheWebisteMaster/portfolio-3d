"use client";

import "./globals.css";

/** The last resort: the root layout itself failed, so this brings its own document. */
export default function GlobalError({
  reset,
}: Readonly<{ error: Error; reset: () => void }>) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center gap-6 p-6 text-center">
          <div className="grid gap-6">
            <h1>Something broke</h1>
            <button type="button" className="btn-primary" onClick={reset}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
