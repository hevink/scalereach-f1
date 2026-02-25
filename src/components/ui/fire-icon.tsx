"use client";

export function FireIcon({ className }: { className?: string }) {
    return (
        <>
            <style>{`
        @keyframes flicker {
          0%   { opacity: 1;    transform: scale(1)    rotate(-2deg); }
          25%  { opacity: 0.95; transform: scale(1.02) rotate(1deg);  }
          50%  { opacity: 0.92; transform: scale(0.98) rotate(-1deg); }
          75%  { opacity: 0.97; transform: scale(1.01) rotate(2deg);  }
          100% { opacity: 1;    transform: scale(0.99) rotate(-1deg); }
        }
        @keyframes float {
          0%   { opacity: 0;   transform: translateY(0)    translateX(0)               scale(1);   }
          10%  { opacity: 1;                                                                        }
          90%  { opacity: 0.5;                                                                      }
          100% { opacity: 0;   transform: translateY(-5em) translateX(var(--x-drift)) scale(0.3); }
        }
        .fire-flicker { animation: flicker 1s infinite alternate; filter: drop-shadow(0 0 0.5em rgba(255,100,0,0.8)); }
        .ember        { animation: float 3s ease-in infinite; font-size: 0.3em; }
      `}</style>
            <span className={`relative inline-block align-middle px-1 ${className ?? ""}`}>
                <span className="fire-flicker">🔥</span>
                {[
                    { delay: "0s", drift: "-0.5em", left: "40%" },
                    { delay: "0.5s", drift: "0.4em", left: "50%" },
                    { delay: "1s", drift: "-0.3em", left: "60%" },
                    { delay: "1.5s", drift: "0.6em", left: "45%" },
                    { delay: "2s", drift: "-0.4em", left: "55%" },
                    { delay: "2.5s", drift: "0.3em", left: "48%" },
                ].map(({ delay, drift, left }, i) => (
                    <span
                        key={i}
                        className="ember absolute opacity-0 pointer-events-none"
                        style={{ left, animationDelay: delay, ["--x-drift" as string]: drift }}
                    >✨</span>
                ))}
            </span>
        </>
    );
}
