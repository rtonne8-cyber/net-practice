# net-practice
Personal golf PWA. Garden-net practice challenge generator. No flight data — strike/low-point/tempo/routine/start-line drills only.
Stack: React + Vite + TS + vite-plugin-pwa. Deploy: GitHub Pages.
Source of truth for logic + challenge library: net_practice_challenge_generator.jsx (do not redesign, only port + extend).
Rules: British English. Keep challenge data in src/data/challenges.ts so the library grows without touching logic.
Never use window.storage (Claude-artifact API only) — persistence is localStorage.
