import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  C, CAT, KIT_LABEL, CHALLENGES, FOCUS, SESSION_SHAPE,
  type Challenge,
} from "./data/challenges";
import {
  loadRecords, saveRecords, computeStreak, toISODate,
  type Records,
} from "./lib/storage";

// ---- helpers ---------------------------------------------------------------
const mono = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif";

function sample(arr: Challenge[], n: number, exclude: Set<string> = new Set()): Challenge[] {
  const pool = arr.filter((c) => !exclude.has(c.id));
  const out: Challenge[] = [];
  while (out.length < n && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ---- Scorer ----------------------------------------------------------------
interface ScorerProps {
  c: Challenge;
  counts: Record<string, number>;
  streaks: Record<string, number>;
  rates: Record<string, number>;
  done: Record<string, boolean>;
  setCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setStreaks: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setRates: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setDone: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  bestFor: (id: string) => number;
  pushBest: (id: string, val: number) => void;
}

function Scorer({ c, counts, streaks, rates, done, setCounts, setStreaks, setRates, setDone, bestFor, pushBest }: ScorerProps) {
  if (c.mode === "streak") {
    const cur = streaks[c.id] || 0;
    const best = Math.max(bestFor(c.id), cur);
    return (
      <div style={sx.scorer}>
        <div style={sx.streakWrap}>
          <div>
            <div style={sx.miniLabel}>Streak</div>
            <div style={sx.bigNum}>{cur}</div>
          </div>
          <div>
            <div style={sx.miniLabel}>Best</div>
            <div style={{ ...sx.bigNum, color: C.amber }}>{best}</div>
          </div>
          {c.target && (
            <div>
              <div style={sx.miniLabel}>Target</div>
              <div style={{ ...sx.bigNum, color: C.mute }}>{c.target}</div>
            </div>
          )}
        </div>
        <div style={sx.btnRow}>
          <button
            style={{ ...sx.scoreBtn, borderColor: C.green, color: C.green }}
            onClick={() => {
              const v = cur + 1;
              setStreaks((s) => ({ ...s, [c.id]: v }));
              pushBest(c.id, v);
            }}
          >
            Pured +1
          </button>
          <button
            style={{ ...sx.scoreBtn, borderColor: C.red, color: C.red }}
            onClick={() => setStreaks((s) => ({ ...s, [c.id]: 0 }))}
          >
            Missed — reset
          </button>
        </div>
      </div>
    );
  }

  if (c.mode === "count") {
    const v = counts[c.id] || 0;
    return (
      <div style={sx.scorer}>
        <div style={sx.streakWrap}>
          <div>
            <div style={sx.miniLabel}>Tally</div>
            <div style={sx.bigNum}>
              {v}
              <span style={{ color: C.mute, fontSize: 20 }}> / {c.target}</span>
            </div>
          </div>
        </div>
        <div style={sx.pipWrap}>
          {Array.from({ length: c.target ?? 0 }).map((_, i) => (
            <button
              key={i}
              aria-label={`rep ${i + 1}`}
              onClick={() => setCounts((s) => ({ ...s, [c.id]: i + 1 }))}
              style={{
                ...sx.pip,
                background: i < v ? C.green : "transparent",
                borderColor: i < v ? C.green : C.line2,
              }}
            />
          ))}
        </div>
        <button
          style={{ ...sx.scoreBtn, borderColor: C.line2, color: C.mute, marginTop: 8 }}
          onClick={() => setCounts((s) => ({ ...s, [c.id]: 0 }))}
        >
          Clear
        </button>
      </div>
    );
  }

  if (c.mode === "rate") {
    const v = rates[c.id] || 0;
    return (
      <div style={sx.scorer}>
        <div style={sx.miniLabel}>Self-rate the set</div>
        <div style={sx.btnRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRates((s) => ({ ...s, [c.id]: n }))}
              style={{
                ...sx.rateBtn,
                borderColor: v === n ? C.amber : C.line2,
                color: v === n ? C.bg : C.text,
                background: v === n ? C.amber : "transparent",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // reps
  const d = done[c.id];
  return (
    <div style={sx.scorer}>
      <button
        onClick={() => setDone((s) => ({ ...s, [c.id]: !d }))}
        style={{
          ...sx.scoreBtn,
          borderColor: d ? C.green : C.line2,
          color: d ? C.green : C.text,
        }}
      >
        {d ? "✓ Done" : "Mark done"}
      </button>
    </div>
  );
}

// ---- Card ------------------------------------------------------------------
interface CardProps {
  c: Challenge;
  index: number | null;
  onReshuffle?: () => void;
  counts: Record<string, number>;
  streaks: Record<string, number>;
  rates: Record<string, number>;
  done: Record<string, boolean>;
  setCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setStreaks: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setRates: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setDone: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  bestFor: (id: string) => number;
  pushBest: (id: string, val: number) => void;
  splitTime?: string | null;
}

function Card({ c, index, onReshuffle, counts, streaks, rates, done, setCounts, setStreaks, setRates, setDone, bestFor, pushBest, splitTime }: CardProps) {
  return (
    <div style={sx.card}>
      <div style={sx.cardHead}>
        <span style={{ ...sx.catTag, color: CAT[c.cat] }}>
          {index != null ? `${index} · ` : ""}
          {c.cat}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {splitTime && (
            <span style={{ ...sx.modeTag, color: C.teal, borderColor: C.teal }}>
              {splitTime}
            </span>
          )}
          <span style={sx.modeTag}>{c.mode}</span>
          {onReshuffle && (
            <button
              style={sx.reshuffleBtn}
              onClick={onReshuffle}
              title="Reshuffle this challenge"
              aria-label="Reshuffle this challenge"
            >
              ↻
            </button>
          )}
        </div>
      </div>
      <div style={sx.cardName}>{c.name}</div>
      <p style={sx.do}>{c.do}</p>
      <div style={sx.row2}>
        <div>
          <div style={sx.miniLabel}>How you know</div>
          <p style={sx.sub}>{c.feel}</p>
        </div>
        <div>
          <div style={sx.miniLabel}>Why it helps</div>
          <p style={sx.sub}>{c.helps}</p>
        </div>
      </div>
      {c.kit.length > 0 && (
        <div style={sx.kitRow}>
          {c.kit.map((k) => (
            <span key={k} style={sx.kitChip}>
              {KIT_LABEL[k]}
            </span>
          ))}
        </div>
      )}
      <Scorer
        c={c}
        counts={counts}
        streaks={streaks}
        rates={rates}
        done={done}
        setCounts={setCounts}
        setStreaks={setStreaks}
        setRates={setRates}
        setDone={setDone}
        bestFor={bestFor}
        pushBest={pushBest}
      />
    </div>
  );
}

// ---- App -------------------------------------------------------------------
// Bucket labels for reshuffle logic
type Bucket = "warm" | "tech" | "fin";

interface SessionCard {
  challenge: Challenge;
  bucket: Bucket;
}

export default function App() {
  const [kit, setKit] = useState<Record<string, boolean>>({
    spray: true, tape: true, towel: true, tee: true, stick: true,
  });
  const [focus, setFocus] = useState("Mixed");
  const [mins, setMins] = useState(20);
  const [dealt, setDealt] = useState<Challenge | null>(null);
  const [session, setSession] = useState<SessionCard[]>([]);
  const [showAllDrills, setShowAllDrills] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [rollFace, setRollFace] = useState("Strike");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [rates, setRates] = useState<Record<string, number>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [records, setRecords] = useState<Records>(() => loadRecords());

  // P4 — session timer
  const [timerSecs, setTimerSecs] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [splits, setSplits] = useState<(string | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const haveKit = useCallback((c: Challenge) => c.kit.every((k) => kit[k]), [kit]);
  const focusCats = FOCUS[focus];
  const inFocus = useCallback((c: Challenge) => !focusCats || focusCats.includes(c.cat), [focusCats]);

  const dealPool = useMemo(
    () => CHALLENGES.filter((c) => haveKit(c) && inFocus(c)),
    [haveKit, inFocus]
  );

  // Timer tick
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSecs((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  function bestFor(id: string) {
    return records.best[id] || 0;
  }

  function pushBest(id: string, val: number) {
    setRecords((r) => {
      const cur = r.best[id] || 0;
      if (val <= cur) return r;
      const next = { ...r, best: { ...r.best, [id]: val } };
      saveRecords(next);
      return next;
    });
  }

  function dealOne() {
    setSession([]);
    stopTimer();
    const pool = dealPool;
    if (!pool.length) { setDealt(null); return; }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setDealt(pick); return; }
    setRolling(true);
    if (rollTimer.current) clearInterval(rollTimer.current);
    const cats = Object.keys(CAT);
    let n = 0;
    rollTimer.current = setInterval(() => {
      setRollFace(cats[Math.floor(Math.random() * cats.length)]);
      n++;
      if (n > 9) {
        clearInterval(rollTimer.current!);
        setRolling(false);
        setDealt(pick);
      }
    }, 70);
  }

  function buildSession() {
    setDealt(null);
    stopTimer();
    setSplits([]);
    const shape = SESSION_SHAPE[mins];
    const have = CHALLENGES.filter(haveKit);
    const warm = have.filter((c) => c.cat === "Warm-up");
    const fin = have.filter((c) => ["Pressure", "Routine"].includes(c.cat));
    let tech = have.filter((c) => !["Warm-up", "Pressure", "Routine"].includes(c.cat));
    if (focusCats) tech = tech.filter((c) => focusCats.includes(c.cat));

    const used = new Set<string>();
    const out: SessionCard[] = [];

    const take = (arr: Challenge[], n: number, bucket: Bucket) => {
      const picked = sample(arr, n, used);
      picked.forEach((c) => { used.add(c.id); out.push({ challenge: c, bucket }); });
    };

    take(warm, shape.warm, "warm");
    take(tech, shape.tech, "tech");
    take(fin, shape.fin, "fin");

    const wanted = shape.warm + shape.tech + shape.fin;
    if (out.length < wanted) take(have, wanted - out.length, "tech");

    setSession(out);
    setSplits(new Array(out.length).fill(null));
    setCounts({});
    setStreaks({});
    setRates({});
    setDone({});
  }

  function stopTimer() {
    setTimerRunning(false);
    setTimerSecs(0);
  }

  function startStopTimer() {
    setTimerRunning((r) => !r);
  }

  function recordSplit(idx: number) {
    setSplits((prev) => {
      const next = [...prev];
      next[idx] = fmtTime(timerSecs);
      return next;
    });
  }

  // P4 — reshuffle one card within its bucket, no duplicates
  function reshuffleCard(idx: number) {
    const card = session[idx];
    if (!card) return;
    const bucket = card.bucket;

    const inSession = new Set(session.map((s) => s.challenge.id));
    const have = CHALLENGES.filter(haveKit);

    let pool: Challenge[];
    if (bucket === "warm") {
      pool = have.filter((c) => c.cat === "Warm-up");
    } else if (bucket === "fin") {
      pool = have.filter((c) => ["Pressure", "Routine"].includes(c.cat));
    } else {
      pool = have.filter((c) => !["Warm-up", "Pressure", "Routine"].includes(c.cat));
      if (focusCats) pool = pool.filter((c) => focusCats.includes(c.cat));
    }

    // Exclude everything already in the session
    const candidates = pool.filter((c) => !inSession.has(c.id));
    if (!candidates.length) return; // nothing else available

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    setSession((prev) => {
      const next = [...prev];
      next[idx] = { challenge: pick, bucket };
      return next;
    });
    // Clear scorer state for the old card, leave others intact
    setCounts((s) => { const n = { ...s }; delete n[card.challenge.id]; return n; });
    setStreaks((s) => { const n = { ...s }; delete n[card.challenge.id]; return n; });
    setRates((s) => { const n = { ...s }; delete n[card.challenge.id]; return n; });
    setDone((s) => { const n = { ...s }; delete n[card.challenge.id]; return n; });
  }

  function logSession() {
    const today = toISODate(new Date());
    setRecords((r) => {
      const practiceDays = [...new Set([...(r.practiceDays || []), today])];
      const streak = computeStreak(practiceDays);
      const lastDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const next: Records = {
        ...r,
        sessions: (r.sessions || 0) + 1,
        lastDate,
        practiceDays,
        streak,
      };
      saveRecords(next);
      return next;
    });
    setSession([]);
    setSplits([]);
    setCounts({});
    setStreaks({});
    setRates({});
    setDone({});
    stopTimer();
  }

  function resetRecords() {
    const fresh: Records = { sessions: 0, lastDate: null, best: {}, streak: 0, practiceDays: [] };
    setRecords(fresh);
    saveRecords(fresh);
  }

  // Auto-deal on first load
  useEffect(() => {
    const t = setTimeout(() => dealOne(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dayStreak = computeStreak(records.practiceDays || []);

  return (
    <div style={sx.root}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${C.bg}; }
        button { font-family: inherit; cursor: pointer; transition: transform .08s, background .15s, border-color .15s; }
        button:active { transform: scale(0.97); }
        button:focus-visible { outline: 2px solid ${C.amber}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { button { transition: none; } }
      `}</style>

      <div style={sx.header}>
        <div>
          <div style={sx.brand}>THE NET</div>
          <div style={sx.tagline}>Garden-net practice. No flight, all feel.</div>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={sx.headStat}>
            <div style={sx.miniLabel}>Sessions logged</div>
            <div style={sx.bigNum}>
              {records.sessions || 0}
              {records.lastDate && (
                <span style={{ fontSize: 12, color: C.mute }}>&nbsp;last {records.lastDate}</span>
              )}
            </div>
          </div>
          <div style={sx.headStat}>
            <div style={sx.miniLabel}>Days streak</div>
            <div style={{ ...sx.bigNum, color: dayStreak > 0 ? C.amber : C.mute }}>
              {dayStreak}
              <span style={{ fontSize: 12, color: C.mute }}>&nbsp;days</span>
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div style={sx.controls}>
        <div>
          <div style={sx.miniLabel}>Kit I have</div>
          <div style={sx.chipRow}>
            {Object.keys(KIT_LABEL).map((k) => (
              <button
                key={k}
                onClick={() => setKit((s) => ({ ...s, [k]: !s[k] }))}
                style={{
                  ...sx.chip,
                  borderColor: kit[k] ? C.teal : C.line2,
                  color: kit[k] ? C.bg : C.mute,
                  background: kit[k] ? C.teal : "transparent",
                }}
              >
                {KIT_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        <div style={sx.controlRow}>
          <div>
            <div style={sx.miniLabel}>Focus</div>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              style={sx.select}
            >
              {Object.keys(FOCUS).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={sx.miniLabel}>Session length</div>
            <div style={sx.chipRow}>
              {[5, 10, 20, 30].map((m) => (
                <button
                  key={m}
                  onClick={() => setMins(m)}
                  style={{
                    ...sx.chip,
                    borderColor: mins === m ? C.green : C.line2,
                    color: mins === m ? C.bg : C.mute,
                    background: mins === m ? C.green : "transparent",
                  }}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* actions */}
      <div style={sx.actions}>
        <button style={sx.dealBtn} onClick={dealOne} disabled={rolling}>
          {rolling ? `${rollFace}…` : "Deal a challenge"}
        </button>
        <button style={sx.sessionBtn} onClick={buildSession}>
          Build a {mins}-min session
        </button>
        <button style={sx.libraryBtn} onClick={() => setShowAllDrills(true)}>
          All drills · {CHALLENGES.length}
        </button>
      </div>

      {dealPool.length === 0 && !session.length && (
        <div style={sx.empty}>
          No challenges match that kit and focus. Turn a kit item back on, or set focus to Mixed.
        </div>
      )}

      {/* session output */}
      {session.length > 0 ? (
        <div>
          <div style={{ ...sx.sectionLabel, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{mins}-minute session · warm-up → work → finisher</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontFamily: mono, fontSize: 16, color: timerRunning ? C.green : C.amber, letterSpacing: "0.08em" }}>
                {fmtTime(timerSecs)}
              </span>
              <button
                style={{ ...sx.timerBtn, borderColor: timerRunning ? C.red : C.green, color: timerRunning ? C.red : C.green }}
                onClick={startStopTimer}
              >
                {timerRunning ? "Pause" : timerSecs > 0 ? "Resume" : "Start timer"}
              </button>
            </div>
          </div>
          {session.map((sc, i) => (
            <div key={`${sc.challenge.id}-${i}`}>
              <Card
                c={sc.challenge}
                index={i + 1}
                onReshuffle={() => reshuffleCard(i)}
                counts={counts}
                streaks={streaks}
                rates={rates}
                done={done}
                setCounts={setCounts}
                setStreaks={setStreaks}
                setRates={setRates}
                setDone={setDone}
                bestFor={bestFor}
                pushBest={pushBest}
                splitTime={splits[i]}
              />
              <button
                style={sx.splitBtn}
                onClick={() => recordSplit(i)}
                title="Record split time for this challenge"
              >
                {splits[i] ? `Split: ${splits[i]}` : "Record split"}
              </button>
            </div>
          ))}
          <button style={sx.logBtn} onClick={logSession}>
            Log session as done
          </button>
        </div>
      ) : (
        dealt && (
          <Card
            c={dealt}
            index={null}
            counts={counts}
            streaks={streaks}
            rates={rates}
            done={done}
            setCounts={setCounts}
            setStreaks={setStreaks}
            setRates={setRates}
            setDone={setDone}
            bestFor={bestFor}
            pushBest={pushBest}
          />
        )
      )}

      {/* all-drills overlay */}
      {showAllDrills && (
        <div style={sx.overlay}>
          <div style={sx.overlayHead}>
            <button style={sx.backBtn} onClick={() => setShowAllDrills(false)}>
              ← Back
            </button>
            <div>
              <div style={sx.miniLabel}>Library</div>
              <div style={sx.bigNum}>{CHALLENGES.length} drills</div>
            </div>
          </div>
          {Object.keys(CAT).map((cat) => {
            const drills = CHALLENGES.filter((c) => c.cat === cat);
            if (!drills.length) return null;
            return (
              <div key={cat} style={sx.catSection}>
                <div style={{ ...sx.catSectionLabel, color: CAT[cat] }}>{cat}</div>
                {drills.map((c) => (
                  <div key={c.id} style={sx.drillRow}>
                    <div style={sx.drillRowTop}>
                      <span style={sx.drillName}>{c.name}</span>
                      <span style={sx.modeTag}>{c.mode}</span>
                    </div>
                    {c.kit.length > 0 && (
                      <div style={{ ...sx.kitRow, marginTop: 6, marginBottom: 0 }}>
                        {c.kit.map((k) => (
                          <span key={k} style={sx.kitChip}>{KIT_LABEL[k]}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* records footer */}
      <div style={sx.footer}>
        <div style={sx.miniLabel}>Best streaks</div>
        {Object.keys(records.best || {}).length === 0 ? (
          <p style={sx.sub}>Nothing banked yet. Go and pure five in a row.</p>
        ) : (
          <div style={sx.bestList}>
            {Object.entries(records.best)
              .sort((a, b) => b[1] - a[1])
              .map(([id, v]) => {
                const ch = CHALLENGES.find((x) => x.id === id);
                return (
                  <div key={id} style={sx.bestRow}>
                    <span style={{ color: C.text }}>{ch ? ch.name : id}</span>
                    <span style={{ color: C.amber, fontFamily: mono }}>{v}</span>
                  </div>
                );
              })}
          </div>
        )}
        <button style={sx.reset} onClick={resetRecords}>
          Reset records
        </button>
      </div>
    </div>
  );
}

// ---- styles ----------------------------------------------------------------
const sx: Record<string, React.CSSProperties> = {
  root: {
    background: C.bg,
    color: C.text,
    fontFamily: sans,
    padding: "22px 20px 28px",
    borderRadius: 0,
    maxWidth: 820,
    margin: "0 auto",
    lineHeight: 1.5,
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    paddingBottom: 18,
    borderBottom: `1px solid ${C.line}`,
  },
  brand: { fontSize: 26, fontWeight: 800, letterSpacing: "0.16em", color: C.text },
  tagline: { fontSize: 13, color: C.mute, marginTop: 4 },
  headStat: { textAlign: "right" },
  miniLabel: {
    fontSize: 10.5,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: C.mute,
    marginBottom: 5,
  },
  bigNum: { fontFamily: mono, fontSize: 28, fontWeight: 700, color: C.text },

  controls: { padding: "18px 0", borderBottom: `1px solid ${C.line}`, display: "grid", gap: 16 },
  controlRow: { display: "flex", gap: 24, flexWrap: "wrap" },
  chipRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  chip: {
    border: "1px solid",
    borderRadius: 999,
    padding: "7px 13px",
    fontSize: 12.5,
    fontWeight: 600,
    background: "transparent",
  },
  select: {
    background: C.surface,
    color: C.text,
    border: `1px solid ${C.line2}`,
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13.5,
    fontFamily: sans,
    minWidth: 170,
  },

  actions: { display: "flex", gap: 12, flexWrap: "wrap", margin: "20px 0 8px" },
  dealBtn: {
    flex: "1 1 240px",
    background: C.amber,
    color: C.bg,
    border: "none",
    borderRadius: 12,
    padding: "16px 20px",
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    minWidth: 200,
  },
  sessionBtn: {
    flex: "1 1 200px",
    background: "transparent",
    color: C.green,
    border: `1.5px solid ${C.green}`,
    borderRadius: 12,
    padding: "16px 20px",
    fontSize: 14.5,
    fontWeight: 700,
    minWidth: 180,
  },

  sectionLabel: {
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: C.mute,
    margin: "20px 0 12px",
  },

  timerBtn: {
    background: "transparent",
    border: "1.5px solid",
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },

  splitBtn: {
    marginTop: 6,
    marginBottom: 2,
    background: "transparent",
    color: C.mute,
    border: `1px dashed ${C.line2}`,
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 12,
    width: "100%",
  },

  card: {
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 14,
    padding: "18px 20px",
    marginTop: 14,
  },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  catTag: {
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  modeTag: {
    fontSize: 10.5,
    color: C.mute,
    fontFamily: mono,
    border: `1px solid ${C.line2}`,
    borderRadius: 6,
    padding: "2px 7px",
  },
  reshuffleBtn: {
    background: "transparent",
    border: `1px solid ${C.line2}`,
    borderRadius: 6,
    color: C.mute,
    fontSize: 16,
    padding: "1px 7px",
    lineHeight: 1,
  },
  cardName: { fontSize: 22, fontWeight: 800, margin: "8px 0 8px", color: C.text },
  do: { fontSize: 14.5, color: C.text, margin: "0 0 14px" },
  row2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginBottom: 12,
  },
  sub: { fontSize: 13, color: C.mute, margin: 0 },
  kitRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  kitChip: {
    fontSize: 11,
    color: C.teal,
    border: `1px solid ${C.teal}`,
    borderRadius: 6,
    padding: "3px 9px",
    opacity: 0.9,
  },

  scorer: { marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.line}` },
  streakWrap: { display: "flex", gap: 28, marginBottom: 14 },
  btnRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  scoreBtn: {
    background: "transparent",
    border: "1.5px solid",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 700,
  },
  pipWrap: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  pip: { width: 26, height: 26, borderRadius: 7, border: "1.5px solid", padding: 0 },
  rateBtn: {
    width: 46,
    height: 44,
    border: "1.5px solid",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    fontFamily: mono,
    background: "transparent",
  },

  logBtn: {
    marginTop: 16,
    width: "100%",
    background: C.green,
    color: C.bg,
    border: "none",
    borderRadius: 12,
    padding: "14px",
    fontSize: 15,
    fontWeight: 800,
  },

  empty: {
    marginTop: 18,
    padding: "16px 18px",
    border: `1px dashed ${C.line2}`,
    borderRadius: 12,
    color: C.mute,
    fontSize: 14,
  },

  footer: { marginTop: 26, paddingTop: 18, borderTop: `1px solid ${C.line}` },
  bestList: { display: "grid", gap: 8, marginBottom: 14 },
  bestRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    paddingBottom: 6,
    borderBottom: `1px solid ${C.line}`,
  },
  reset: {
    background: "transparent",
    color: C.mute,
    border: `1px solid ${C.line2}`,
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 12.5,
  },

  libraryBtn: {
    flex: "0 0 auto",
    background: "transparent",
    color: C.mute,
    border: `1px solid ${C.line2}`,
    borderRadius: 12,
    padding: "12px 18px",
    fontSize: 13,
    fontWeight: 600,
    alignSelf: "stretch",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    background: C.bg,
    overflowY: "auto",
    padding: "22px 20px 40px",
  },

  overlayHead: {
    display: "flex",
    alignItems: "flex-start",
    gap: 20,
    paddingBottom: 18,
    borderBottom: `1px solid ${C.line}`,
    marginBottom: 8,
  },

  backBtn: {
    background: "transparent",
    color: C.mute,
    border: `1px solid ${C.line2}`,
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    flexShrink: 0,
    marginTop: 4,
  },

  catSection: {
    marginTop: 20,
  },

  catSectionLabel: {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    marginBottom: 8,
  },

  drillRow: {
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 6,
  },

  drillRowTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  drillName: {
    fontSize: 15,
    fontWeight: 700,
    color: C.text,
  },
};
