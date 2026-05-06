import { useState } from "react";

const C = {
  bg: "#0f0f0f", surface: "#1a1a1a", card: "#222", border: "#2e2e2e",
  accent: "#f97316", accentMuted: "#7c3a12", text: "#f5f5f5", muted: "#888",
  green: "#22c55e", red: "#ef4444", blue: "#3b82f6", blueMuted: "#1e3a5f",
};

const CLIENTS = [
  { id: 1, name: "Carlos Mendoza", age: 28, goal: "Ganar músculo", weight: 78, kcalGoal: 3000, avatar: "CM" },
  { id: 2, name: "Laura Vega", age: 24, goal: "Perder peso", weight: 65, kcalGoal: 1800, avatar: "LV" },
  { id: 3, name: "Rodrigo Silva", age: 32, goal: "Resistencia", weight: 82, kcalGoal: 2500, avatar: "RS" },
];

const INIT_EX = {
  1: [{ id: 1, name: "Press de banca", sets: 4, reps: 10, rest: 60 }, { id: 2, name: "Sentadilla", sets: 4, reps: 12, rest: 90 }, { id: 3, name: "Peso muerto", sets: 3, reps: 8, rest: 120 }],
  2: [{ id: 1, name: "Cardio elíptica", sets: 1, reps: 30, rest: 0 }, { id: 2, name: "Zancadas", sets: 3, reps: 15, rest: 60 }],
  3: [{ id: 1, name: "Burpees", sets: 4, reps: 20, rest: 30 }, { id: 2, name: "Remo con barra", sets: 3, reps: 12, rest: 60 }],
};

const INIT_KCAL = {
  1: [2800, 3100, 2950, 3050, 2900, 0, 0],
  2: [1700, 1850, 1780, 1600, 1900, 0, 0],
  3: [2400, 2600, 2500, 2450, 0, 0, 0],
};

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const QUESTIONS = [
  { q: "¿Cumpliste la rutina completa esta semana?", type: "opts", opts: ["Sí", "No", "Parcial"] },
  { q: "¿Cómo fue tu energía esta semana? (1-5)", type: "stars" },
  { q: "¿Tuviste alguna lesión o molestia?", type: "opts", opts: ["No", "Leve", "Moderada"] },
  { q: "¿Descansaste adecuadamente (7-8h por noche)?", type: "opts", opts: ["Sí", "No", "A veces"] },
  { q: "Comentarios o notas:", type: "text" },
];

const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const inp = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, padding: "8px 12px", width: "100%", boxSizing: "border-box", outline: "none" };
const btn = (v = "primary") => ({ background: v === "primary" ? C.accent : v === "blue" ? C.blue : "transparent", color: v === "outline" ? C.accent : "#fff", border: `1px solid ${v === "outline" ? C.accent : v === "blue" ? C.blue : C.accent}`, borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%" });
const card = { background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "14px 16px", marginBottom: 12 };
const navBtn = (a) => ({ flex: 1, padding: "12px 4px", background: "transparent", border: "none", color: a ? C.accent : C.muted, fontSize: 10, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 });
const subTab = (a) => ({ flex: 1, padding: "11px 0", background: "transparent", border: "none", borderBottom: a ? `2px solid ${C.accent}` : "2px solid transparent", color: a ? C.accent : C.muted, fontSize: 12, fontWeight: 500, cursor: "pointer" });
const avatar = (color = C.accentMuted, text = C.accent) => ({ width: 42, height: 42, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: text, flexShrink: 0 });
const kcalBar = (pct) => ({ height: 6, borderRadius: 3, background: C.border, position: "relative", overflow: "hidden", marginTop: 6 });
const kcalFill = (pct) => ({ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min(pct, 100)}%`, background: pct > 100 ? C.red : pct > 80 ? C.green : C.accent, borderRadius: 3 });

export default function App() {
  const [mode, setMode] = useState(null); // null=login, "coach", "client"
  const [clientUser, setClientUser] = useState(null); // logged in client id
  const [tab, setTab] = useState("clients");
  const [selectedClient, setSelectedClient] = useState(null);
  const [exercises, setExercises] = useState(INIT_EX);
  const [kcal, setKcal] = useState(INIT_KCAL);
  const [answers, setAnswers] = useState({});
  const [showAddEx, setShowAddEx] = useState(false);
  const [newEx, setNewEx] = useState({ name: "", sets: 3, reps: 10, rest: 60 });
  const [editingKcal, setEditingKcal] = useState(null);
  const [tempKcal, setTempKcal] = useState("");
  const [clientTab, setClientTab] = useState("rutina");
  const [editingClient, setEditingClient] = useState(null);
  const [clientData, setClientData] = useState(CLIENTS.reduce((a, c) => ({ ...a, [c.id]: { ...c } }), {}));

  const client = selectedClient ? clientData[selectedClient] : null;
  const cKcal = (id) => kcal[id] || [0,0,0,0,0,0,0];
  const cEx = (id) => exercises[id] || [];

  function removeEx(exId) {
    setExercises(p => ({ ...p, [client.id]: p[client.id].filter(e => e.id !== exId) }));
  }
  function addEx() {
    if (!newEx.name) return;
    setExercises(p => ({ ...p, [client.id]: [...p[client.id], { ...newEx, id: Date.now(), sets: +newEx.sets, reps: +newEx.reps, rest: +newEx.rest }] }));
    setNewEx({ name: "", sets: 3, reps: 10, rest: 60 }); setShowAddEx(false);
  }
  function saveKcal(cid, idx) {
    const val = parseInt(tempKcal) || 0;
    setKcal(p => { const a = [...(p[cid] || [0,0,0,0,0,0,0])]; a[idx] = val; return { ...p, [cid]: a }; });
    setEditingKcal(null);
  }
  function saveClientEdit(fields) {
    setClientData(p => ({ ...p, [editingClient]: { ...p[editingClient], ...fields } }));
    setEditingClient(null);
  }

  // ── LOGIN SCREEN ──
  if (!mode) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>💪</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: C.accent, marginBottom: 4 }}>GymCoach Pro</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 40 }}>¿Quién eres?</div>
      <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 12 }}>
        <button onClick={() => { setMode("coach"); setTab("clients"); setSelectedClient(null); }} style={{ ...btn("primary"), padding: "14px 16px", fontSize: 15 }}>
          🏋️ Entrar como Entrenador
        </button>
        <div style={{ fontSize: 12, color: C.muted, textAlign: "center", margin: "4px 0" }}>o entra como cliente</div>
        {CLIENTS.map(c => (
          <button key={c.id} onClick={() => { setMode("client"); setClientUser(c.id); setClientTab("rutina"); }} style={{ ...btn("outline"), padding: "12px 16px", fontSize: 14 }}>
            {c.avatar} — {c.name}
          </button>
        ))}
      </div>
    </div>
  );

  // ── CLIENT VIEW ──
  if (mode === "client") {
    const me = clientData[clientUser];
    const myKcal = cKcal(clientUser);
    const myEx = cEx(clientUser);
    const todayKcal = myKcal[todayIdx];
    const pct = todayKcal > 0 ? (todayKcal / me.kcalGoal) * 100 : 0;

    return (
      <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 390, margin: "0 auto", fontFamily: "system-ui, sans-serif", color: C.text }}>
        <div style={{ background: C.surface, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{me.name}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{me.goal} · {me.weight} kg</div>
          </div>
          <button onClick={() => setMode(null)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>Salir</button>
        </div>

        <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          {["rutina", "kcal", "cuestionario"].map(t => (
            <button key={t} style={subTab(clientTab === t)} onClick={() => setClientTab(t)}>
              {t === "rutina" ? "Mi rutina" : t === "kcal" ? "Calorías" : "Cuestionario"}
            </button>
          ))}
        </div>

        <div style={{ padding: 16, paddingBottom: 32 }}>

          {/* RUTINA - solo lectura */}
          {clientTab === "rutina" && (
            <>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, fontWeight: 500 }}>Tu rutina de esta semana</div>
              <div style={card}>
                {myEx.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 12 }}>Sin ejercicios asignados aún</div>}
                {myEx.map((ex, i) => (
                  <div key={ex.id} style={{ padding: "11px 0", borderBottom: i < myEx.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{ex.name}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                      {[`${ex.sets} series`, `${ex.reps} reps`, ex.rest > 0 ? `${ex.rest}s descanso` : "sin descanso"].map(lbl => (
                        <span key={lbl} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, padding: "2px 8px", color: C.muted }}>{lbl}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: C.accentMuted + "55", border: `1px solid ${C.accentMuted}`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: C.accent }}>
                La rutina es asignada por tu entrenador. ¡Sigue el plan!
              </div>
            </>
          )}

          {/* KCAL - cliente puede editar */}
          {clientTab === "kcal" && (
            <>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, fontWeight: 500 }}>Registro de calorías</div>
              <div style={{ ...card, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, color: C.muted }}>Meta diaria</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.accent }}>{me.kcalGoal} kcal</div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: C.accent, fontWeight: 500 }}>Hoy</span>
                    <span style={{ color: C.muted }}>{todayKcal > 0 ? `${todayKcal} kcal` : "Sin registro"}</span>
                  </div>
                  <div style={kcalBar(pct)}><div style={kcalFill(pct)} /></div>
                  {todayKcal > 0 && <div style={{ fontSize: 10, color: C.muted, marginTop: 2, textAlign: "right" }}>{Math.round(pct)}% de la meta</div>}
                </div>
              </div>
              <div style={card}>
                {DAYS.map((day, i) => {
                  const val = myKcal[i];
                  const p2 = val > 0 ? (val / me.kcalGoal) * 100 : 0;
                  const isToday = i === todayIdx;
                  return (
                    <div key={day} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: isToday ? 600 : 400, color: isToday ? C.accent : C.text }}>
                          {day}{isToday && <span style={{ fontSize: 10, color: C.accent }}> · hoy</span>}
                        </div>
                        {editingKcal === i ? (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <input style={{ ...inp, width: 90, padding: "4px 8px" }} type="number" value={tempKcal} onChange={e => setTempKcal(e.target.value)} autoFocus />
                            <button onClick={() => saveKcal(clientUser, i)} style={{ background: C.accent, border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>✓</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: val > 0 ? C.text : C.muted }}>{val > 0 ? `${val} kcal` : "—"}</span>
                            <button onClick={() => { setEditingKcal(i); setTempKcal(val || ""); }} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>editar</button>
                          </div>
                        )}
                      </div>
                      <div style={kcalBar(p2)}><div style={kcalFill(p2)} /></div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* CUESTIONARIO - cliente lo llena */}
          {clientTab === "cuestionario" && (
            <>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, fontWeight: 500 }}>Cuestionario semanal</div>
              <div style={card}>
                {QUESTIONS.map(({ q, type, opts }, i) => {
                  const key = `${clientUser}_${i}`;
                  return (
                    <div key={i} style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{q}</div>
                      {type === "opts" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          {opts.map(o => (
                            <button key={o} onClick={() => setAnswers(p => ({ ...p, [key]: o }))} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${answers[key] === o ? C.accent : C.border}`, background: answers[key] === o ? C.accentMuted : "transparent", color: answers[key] === o ? C.accent : C.muted, fontSize: 12, cursor: "pointer" }}>{o}</button>
                          ))}
                        </div>
                      )}
                      {type === "stars" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          {[1,2,3,4,5].map(n => (
                            <button key={n} onClick={() => setAnswers(p => ({ ...p, [key]: n }))} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${answers[key] === n ? C.accent : C.border}`, background: answers[key] === n ? C.accentMuted : "transparent", color: answers[key] === n ? C.accent : C.muted, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>{n}</button>
                          ))}
                        </div>
                      )}
                      {type === "text" && (
                        <textarea style={{ ...inp, height: 72, resize: "none" }} placeholder="Escribe aquí..." value={answers[key] || ""} onChange={e => setAnswers(p => ({ ...p, [key]: e.target.value }))} />
                      )}
                    </div>
                  );
                })}
                <button style={btn("primary")}>Enviar cuestionario</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── COACH VIEW ──
  const coachClients = Object.values(clientData);

  // Edit client modal
  if (editingClient) {
    const ec = clientData[editingClient];
    const [fields, setFields] = useState({ name: ec.name, age: ec.age, goal: ec.goal, weight: ec.weight, kcalGoal: ec.kcalGoal });
    return (
      <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 390, margin: "0 auto", fontFamily: "system-ui, sans-serif", color: C.text }}>
        <div style={{ background: C.surface, padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Editar cliente</div>
        </div>
        <div style={{ padding: 16 }}>
          {[["Nombre", "name", "text"], ["Edad", "age", "number"], ["Objetivo", "goal", "text"], ["Peso (kg)", "weight", "number"], ["Meta kcal/día", "kcalGoal", "number"]].map(([lbl, key, type]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{lbl}</div>
              <input style={inp} type={type} value={fields[key]} onChange={e => setFields(p => ({ ...p, [key]: type === "number" ? +e.target.value : e.target.value }))} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button style={{ ...btn("primary"), flex: 1 }} onClick={() => saveClientEdit(fields)}>Guardar</button>
            <button style={{ ...btn("outline"), flex: 1 }} onClick={() => setEditingClient(null)}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  // Client detail (coach)
  if (selectedClient) {
    const activeTab = clientTab;
    const setActiveTab = setClientTab;
    const ex = cEx(client.id);
    const kc = cKcal(client.id);

    return (
      <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 390, margin: "0 auto", fontFamily: "system-ui, sans-serif", color: C.text }}>
        <div style={{ background: C.surface, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{client.name}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{client.goal} · {client.weight} kg · Meta: {client.kcalGoal} kcal</div>
          </div>
          <div style={avatar()}>{client.avatar}</div>
        </div>

        <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          {["rutina", "kcal", "cuestionario", "perfil"].map(t => (
            <button key={t} style={{ ...subTab(activeTab === t), fontSize: 11 }} onClick={() => setActiveTab(t)}>
              {t === "rutina" ? "Rutina" : t === "kcal" ? "Kcal" : t === "cuestionario" ? "Encuesta" : "Perfil"}
            </button>
          ))}
        </div>

        <div style={{ padding: 16, paddingBottom: 80 }}>
          <button style={{ background: "transparent", border: "none", color: C.accent, fontSize: 13, cursor: "pointer", padding: "0 0 12px", display: "flex", alignItems: "center", gap: 4 }} onClick={() => setSelectedClient(null)}>← Volver</button>

          {/* RUTINA - coach puede editar */}
          {activeTab === "rutina" && (
            <>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, fontWeight: 500 }}>Ejercicios asignados</div>
              <div style={card}>
                {ex.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 12 }}>Sin ejercicios</div>}
                {ex.map((e, i) => (
                  <div key={e.id} style={{ padding: "10px 0", borderBottom: i < ex.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{e.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{e.sets} series · {e.reps} reps · {e.rest > 0 ? `${e.rest}s` : "sin descanso"}</div>
                    </div>
                    <button onClick={() => removeEx(e.id)} style={{ background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 16, padding: "4px 8px" }}>✕</button>
                  </div>
                ))}
              </div>
              {showAddEx ? (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Nuevo ejercicio</div>
                  <input style={{ ...inp, marginBottom: 8 }} placeholder="Nombre" value={newEx.name} onChange={e => setNewEx(p => ({ ...p, name: e.target.value }))} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[["Series", "sets"], ["Reps", "reps"]].map(([lbl, key]) => (
                      <div key={key}><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{lbl}</div><input style={inp} type="number" value={newEx[key]} onChange={e => setNewEx(p => ({ ...p, [key]: e.target.value }))} /></div>
                    ))}
                  </div>
                  <div style={{ marginTop: 8 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Descanso (seg)</div><input style={inp} type="number" value={newEx.rest} onChange={e => setNewEx(p => ({ ...p, rest: e.target.value }))} /></div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button style={{ ...btn("primary"), flex: 1 }} onClick={addEx}>Agregar</button>
                    <button style={{ ...btn("outline"), flex: 1 }} onClick={() => setShowAddEx(false)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <button style={btn("outline")} onClick={() => setShowAddEx(true)}>+ Agregar ejercicio</button>
              )}
            </>
          )}

          {/* KCAL */}
          {activeTab === "kcal" && (
            <>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, fontWeight: 500 }}>Registro de calorías</div>
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: C.muted }}>Meta diaria</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>{client.kcalGoal} kcal</span>
                </div>
                {DAYS.map((day, i) => {
                  const val = kc[i]; const p2 = val > 0 ? (val / client.kcalGoal) * 100 : 0; const isToday = i === todayIdx;
                  return (
                    <div key={day} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: isToday ? 600 : 400, color: isToday ? C.accent : C.text }}>{day}{isToday && <span style={{ fontSize: 10, color: C.accent }}> · hoy</span>}</div>
                        {editingKcal === i ? (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <input style={{ ...inp, width: 90, padding: "4px 8px" }} type="number" value={tempKcal} onChange={e => setTempKcal(e.target.value)} autoFocus />
                            <button onClick={() => saveKcal(client.id, i)} style={{ background: C.accent, border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>✓</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: val > 0 ? C.text : C.muted }}>{val > 0 ? `${val} kcal` : "—"}</span>
                            <button onClick={() => { setEditingKcal(i); setTempKcal(val || ""); }} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>editar</button>
                          </div>
                        )}
                      </div>
                      <div style={kcalBar(p2)}><div style={kcalFill(p2)} /></div>
                      {val > 0 && <div style={{ fontSize: 10, color: C.muted, marginTop: 2, textAlign: "right" }}>{Math.round(p2)}% de la meta</div>}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* CUESTIONARIO - coach ve respuestas */}
          {activeTab === "cuestionario" && (
            <>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, fontWeight: 500 }}>Respuestas del cliente</div>
              <div style={card}>
                {QUESTIONS.map(({ q }, i) => {
                  const key = `${client.id}_${i}`; const ans = answers[key];
                  return (
                    <div key={i} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: i < QUESTIONS.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{q}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: ans ? C.text : C.muted }}>{ans ? String(ans) : "Sin respuesta"}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* PERFIL - coach edita */}
          {activeTab === "perfil" && (
            <>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, fontWeight: 500 }}>Datos del cliente</div>
              <div style={card}>
                {[["Nombre", client.name], ["Edad", `${client.age} años`], ["Objetivo", client.goal], ["Peso", `${client.weight} kg`], ["Meta calórica", `${client.kcalGoal} kcal/día`]].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 13, color: C.muted }}>{lbl}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{val}</span>
                  </div>
                ))}
              </div>
              <button style={btn("outline")} onClick={() => setEditingClient(client.id)}>Editar datos del cliente</button>
            </>
          )}
        </div>

        <div style={{ display: "flex", background: C.surface, borderTop: `1px solid ${C.border}`, position: "sticky", bottom: 0 }}>
          <button style={navBtn(true)} onClick={() => setSelectedClient(null)}>
            <span style={{ fontSize: 18 }}>👥</span><span>Clientes</span>
          </button>
          <button style={navBtn(false)} onClick={() => { setSelectedClient(null); setTab("stats"); }}>
            <span style={{ fontSize: 18 }}>📊</span><span>Stats</span>
          </button>
          <button style={{ ...navBtn(false), color: C.red }} onClick={() => setMode(null)}>
            <span style={{ fontSize: 18 }}>🚪</span><span>Salir</span>
          </button>
        </div>
      </div>
    );
  }

  // COACH - clients list / stats
  return (
    <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 390, margin: "0 auto", fontFamily: "system-ui, sans-serif", color: C.text }}>
      <div style={{ background: C.surface, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.accent }}>GymCoach Pro</div>
          <div style={{ fontSize: 11, color: C.muted }}>Vista del entrenador</div>
        </div>
        <button onClick={() => setMode(null)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>Salir</button>
      </div>

      <div style={{ padding: 16, paddingBottom: 80 }}>
        {tab === "clients" && (
          <>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, fontWeight: 500 }}>Mis clientes</div>
            {coachClients.map(c => (
              <div key={c.id} style={{ ...card, cursor: "pointer" }} onClick={() => { setSelectedClient(c.id); setClientTab("rutina"); setShowAddEx(false); setEditingKcal(null); }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={avatar()}>{c.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{c.age} años · {c.weight} kg</div>
                    <div style={{ display: "inline-block", background: C.accentMuted, color: C.accent, fontSize: 10, borderRadius: 6, padding: "2px 8px", marginTop: 4 }}>{c.goal}</div>
                  </div>
                  <div style={{ color: C.muted, fontSize: 18 }}>›</div>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "stats" && (
          <>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, fontWeight: 500 }}>Resumen general</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[["Clientes", coachClients.length], ["Sesiones", 12], ["Cumplimiento", "87%"], ["Pendientes", 3]].map(([lbl, val]) => (
                <div key={lbl} style={{ background: C.surface, borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 22, fontWeight: 600 }}>{val}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{lbl}</div>
                </div>
              ))}
            </div>
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Progreso kcal semanal</div>
              {coachClients.map(c => {
                const arr = cKcal(c.id).filter(v => v > 0);
                const avg = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
                const p2 = avg > 0 ? (avg / c.kcalGoal) * 100 : 0;
                return (
                  <div key={c.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span>{c.name.split(" ")[0]}</span>
                      <span style={{ color: C.muted }}>{avg > 0 ? `${avg} / ${c.kcalGoal} kcal` : "Sin datos"}</span>
                    </div>
                    <div style={kcalBar(p2)}><div style={kcalFill(p2)} /></div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", background: C.surface, borderTop: `1px solid ${C.border}`, position: "sticky", bottom: 0 }}>
        <button style={navBtn(tab === "clients")} onClick={() => setTab("clients")}>
          <span style={{ fontSize: 18 }}>👥</span><span>Clientes</span>
        </button>
        <button style={navBtn(tab === "stats")} onClick={() => setTab("stats")}>
          <span style={{ fontSize: 18 }}>📊</span><span>Estadísticas</span>
        </button>
        <button style={{ ...navBtn(false), color: C.red }} onClick={() => setMode(null)}>
          <span style={{ fontSize: 18 }}>🚪</span><span>Salir</span>
        </button>
      </div>
    </div>
  );
}