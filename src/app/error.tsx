"use client";

/** Anything that throws under the root layout lands here, with a way to try again. */
export default function RouteError({
  reset,
}: Readonly<{ error: Error; reset: () => void }>) {
  return (
    <main className="grid min-h-screen place-items-center gap-6 p-6 text-center">
      <div className="grid gap-6">
        <h1>Something broke</h1>
        <p className="type-body">The scene failed to load.</p>
        <button type="button" className="btn-primary" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
