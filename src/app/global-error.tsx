"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#09090b" }}>
          <h1 style={{ fontSize: "6rem", fontWeight: "bold", color: "#27272a" }}>500</h1>
          <h2 style={{ marginTop: "1rem", fontSize: "1.5rem", fontWeight: "600", color: "#fff" }}>Something went wrong</h2>
          <button
            onClick={reset}
            style={{ marginTop: "1.5rem", padding: "0.75rem 1.5rem", backgroundColor: "#fff", color: "#09090b", borderRadius: "0.5rem", border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
