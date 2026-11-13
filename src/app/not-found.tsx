import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center gap-6 p-6 text-center">
      <div className="grid gap-6">
        <h1>Lost the scene</h1>
        <p className="type-body">That page does not exist.</p>
        <Link href="/" className="btn-primary">
          Back to the start
        </Link>
      </div>
    </main>
  );
}
