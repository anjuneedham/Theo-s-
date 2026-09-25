"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <h1 className="text-3xl">Something went wrong</h1>
        <p className="mt-2 text-night-600">Please try again. If the problem continues, call us and we&apos;ll take your order by phone.</p>
        <button onClick={reset} className="mt-6 rounded-full bg-ember-500 px-6 py-3 font-semibold text-white">Try again</button>
      </div>
    </div>
  );
}
