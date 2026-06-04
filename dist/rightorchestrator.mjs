let z = null;
function $() {
  return z;
}
function I(o = []) {
  const r = (n) => {
    var a, l;
    if (!n) return;
    if (n.tagName === "INPUT" || n.tagName === "TEXTAREA" || n.contentEditable === "true" || ((a = n.getAttribute) == null ? void 0 : a.call(n, "contenteditable")) === "true" || ((l = n.getAttribute) == null ? void 0 : l.call(n, "contenteditable")) === "plaintext-only") {
      if (o.includes(n.id)) return;
      z = n;
    }
  };
  document.addEventListener("focusin", (n) => {
    const t = n.composedPath()[0] || n.target;
    r(t);
  }), document.addEventListener("click", (n) => {
    const t = n.composedPath()[0] || n.target;
    r(t);
  });
}
let d = null, S = !1, g = null, w = null, k = [], v = "general", h = {
  gatewayUrl: "http://127.0.0.1:8090",
  model: "text/qwen2.5-coder-7b-instruct-4bit",
  theme: "brutalist-light"
};
const M = {
  general: [
    { label: "Refine Text", prompt: "Refine this text to be clearer, more concise, and professional." },
    { label: "Summarize", prompt: "Summarize this content in three brief bullet points." },
    { label: "Draft Reply", prompt: "Draft a brief, professional reply based on this context." }
  ]
}, H = window.SpeechRecognition || window.webkitSpeechRecognition;
H && (g = new H(), g.continuous = !1, g.interimResults = !1, g.lang = "en-US");
function P() {
  if (document.getElementById("hud-styles")) return;
  const o = document.createElement("style");
  o.id = "hud-styles", o.innerHTML = `
    .hud-panel {
      position: fixed;
      width: 440px;
      height: 520px;
      background: rgba(209, 209, 208, 0.65); /* Warm-beige glassy backdrop blur */
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border, #9a9a9a);
      box-shadow: 0 12px 24px rgba(16, 18, 16, 0.15);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      font-family: var(--font-body, system-ui, sans-serif);
      color: var(--fg1, #2d2824);
      box-sizing: border-box;
      opacity: 0;
      transform: scale(0.95);
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
      border-radius: 0px !important; /* HARD RULE: no rounded corners */
    }

    .hud-panel.active {
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }

    .hud-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4, 8px) var(--space-5, 10px);
      border-bottom: 1px dashed var(--border, #9a9a9a);
      background: rgba(209, 209, 208, 0.35);
      cursor: move;
      user-select: none;
    }

    .hud-title {
      font-family: var(--font-heading, "Chakra Petch", sans-serif);
      font-weight: 700;
      font-size: var(--text-sm, 11px);
      letter-spacing: var(--track-brand, 0.14em);
      color: var(--fg1, #2d2824);
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .hud-close-btn {
      background: transparent;
      border: none;
      color: var(--fg2, #6b6560);
      cursor: pointer;
      font-family: var(--font-mono, monospace);
      font-size: var(--text-xs, 10px);
      transition: color 0.15s;
      text-transform: uppercase;
      letter-spacing: var(--track-mono, 0.05em);
    }

    .hud-close-btn:hover {
      color: var(--status-red, #8a3030);
    }

    .hud-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: var(--space-5, 10px);
      gap: var(--space-4, 8px);
    }

    /* Canvas visualizer layer */
    .hud-viz-container {
      height: 90px;
      position: relative;
      background: rgba(0, 0, 0, 0.05);
      border: 1px dashed var(--border-light, #b5b5b3);
      border-radius: 0px !important;
      overflow: hidden;
    }

    .hud-viz-container canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    .hud-viz-status {
      position: absolute;
      top: 8px;
      left: 8px;
      font-family: var(--font-mono, monospace);
      font-size: 9px;
      color: var(--fg2, #6b6560);
      text-transform: uppercase;
      pointer-events: none;
      letter-spacing: var(--track-mono, 0.05em);
    }

    /* Logs & LLM output console */
    .hud-console {
      flex: 1;
      background: rgba(255, 255, 255, 0.25);
      border: 1px solid var(--border-light, #b5b5b3);
      border-radius: 0px !important;
      padding: var(--space-4, 8px);
      overflow-y: auto;
      font-family: var(--font-mono, monospace);
      font-size: 10px;
      line-height: 1.5;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-height: 0;
      color: var(--fg1, #2d2824);
    }

    .hud-log-in {
      color: var(--status-blue, #3d6e96);
      font-weight: bold;
    }

    .hud-log-out {
      color: var(--fg1, #2d2824);
      white-space: pre-wrap;
    }

    .hud-log-system {
      color: var(--fg2, #6b6560);
      font-weight: bold;
    }

    /* Action bar controls */
    .hud-actions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-3, 6px);
    }

    .hud-action-btn {
      background: rgba(255, 255, 255, 0.35);
      border: 1px solid var(--border-light, #b5b5b3);
      border-radius: 0px !important;
      color: var(--fg1, #2d2824);
      font-family: var(--font-mono, monospace);
      font-size: 9px;
      padding: var(--space-3, 6px);
      cursor: pointer;
      text-transform: uppercase;
      text-align: center;
      transition: all 0.15s ease;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: var(--track-mono, 0.05em);
    }

    .hud-action-btn:hover {
      background: rgba(45, 40, 36, 0.08);
      border-color: var(--accent, #2d2824);
      color: var(--fg1, #2d2824);
    }

    /* LLM persistence and apply controls */
    .hud-apply-bar {
      display: flex;
      gap: var(--space-3, 6px);
    }

    .hud-apply-btn {
      flex: 1;
      padding: var(--space-4, 8px);
      font-size: 10px;
      text-transform: uppercase;
      font-family: var(--font-heading, "Chakra Petch", sans-serif);
      font-weight: bold;
      border-radius: 0px !important;
    }

    /* Command input module */
    .hud-input-group {
      display: flex;
      align-items: center;
      background: var(--bg-input, rgba(255, 255, 255, 0.35));
      border: 1px solid var(--border, #9a9a9a);
      border-radius: 0px !important;
      padding: 2px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .hud-input-group:focus-within {
      border-color: var(--accent, #2d2824);
      box-shadow: 0 0 8px rgba(45, 40, 36, 0.1);
    }

    .hud-input-field {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--fg1, #2d2824);
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      padding: var(--space-3, 6px) var(--space-4, 8px);
    }

    .hud-mic-btn {
      background: rgba(255, 255, 255, 0.45);
      border: 1px solid var(--border-light, #b5b5b3);
      border-radius: 0px !important;
      color: var(--fg1, #2d2824);
      cursor: pointer;
      padding: var(--space-2, 4px) var(--space-3, 6px);
      font-family: var(--font-mono, monospace);
      font-size: var(--text-xs, 10px);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      letter-spacing: var(--track-mono, 0.05em);
    }

    .hud-mic-btn:hover {
      background: rgba(45, 40, 36, 0.05);
      border-color: var(--accent, #2d2824);
    }

    .hud-mic-btn.active {
      background: var(--status-red, #8a3030);
      color: #ffffff;
      border-color: var(--status-red, #8a3030);
      animation: hud-pulse-glow 1.5s infinite;
    }

    @keyframes hud-pulse-glow {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `, document.head.appendChild(o);
}
function U(o) {
  if (!o) return;
  const r = o.getContext("2d");
  if (!r) return;
  const n = () => {
    const a = o.getBoundingClientRect();
    o.width = a.width, o.height = a.height;
  };
  n();
  const t = () => {
    if (!w) return;
    const a = o.width, l = o.height;
    r.clearRect(0, 0, a, l);
    const e = 45, u = a / e - 2, i = Date.now() * 5e-3, c = getComputedStyle(document.documentElement).getPropertyValue("--status-red").trim() || "#8a3030", p = getComputedStyle(document.documentElement).getPropertyValue("--status-blue").trim() || "#3d6e96";
    r.fillStyle = S ? c : p;
    for (let s = 0; s < e; s++) {
      let f = 0.1;
      S ? f = Math.abs(Math.sin(s * 0.25 + i * 3.5) * Math.cos(s * 0.1) * 0.7) + 0.1 : f = Math.abs(Math.sin(s * 0.1 + i) * Math.cos(s * 0.05) * 0.2) + 0.05;
      const y = f * (l * 0.75) + 3, E = s * (u + 2), R = (l - y) / 2;
      r.fillRect(E, R, u, y);
    }
    w = requestAnimationFrame(t);
  };
  w = requestAnimationFrame(t), window.addEventListener("resize", n);
}
function N() {
  w && (cancelAnimationFrame(w), w = null);
}
function Y(o, r) {
  if (!g) {
    b("SYSTEM", "Speech recognition is not supported in this browser.", "hud-log-system");
    return;
  }
  if (S)
    g.stop();
  else {
    S = !0, o && (o.classList.add("active"), o.innerHTML = "ON");
    const t = document.getElementById("hud-viz-status-label");
    t && (t.textContent = "LISTENING... SPEAK NOW"), g.start(), g.onresult = (a) => {
      const l = a.results[0][0].transcript;
      r && (r.value = l), b("USER (VOICE)", l, "hud-log-in"), L(l);
    }, g.onerror = (a) => {
      console.error("Speech recognition error:", a.error), b("SYSTEM", `Mic error: ${a.error}`, "hud-log-system"), n();
    }, g.onend = () => {
      n();
    };
  }
  function n() {
    S = !1, o && (o.classList.remove("active"), o.innerHTML = "REC");
    const t = document.getElementById("hud-viz-status-label");
    t && (t.textContent = `ORCHESTRATOR HUD // CASE: ${v.toUpperCase()}`);
  }
}
function b(o, r, n) {
  const t = document.getElementById("hud-console-log");
  if (!t) return;
  const a = document.createElement("div");
  a.innerHTML = `<span class="${n}">[${o}]</span> ${r}`, t.appendChild(a), t.scrollTop = t.scrollHeight, k.push({ speaker: o, text: r, className: n });
}
async function L(o) {
  var a, l;
  const r = document.getElementById("hud-apply-container"), n = document.getElementById("hud-apply-textarea");
  if (!o || !o.trim()) return;
  let t = "You are the Orchestrator HUD, a floating helper interface. Use prompting rules based on research to help the operator design structured prompts or scripts. Do NOT write conversational replies or wrap outputs in markdown code blocks. Output ONLY the raw content directly.";
  h.systemInstructions && (typeof h.systemInstructions == "function" ? t = h.systemInstructions(v) : t = h.systemInstructions[v] || h.systemInstructions.general || t), b("SYSTEM", "Querying local LLM node...", "hud-log-system");
  try {
    let e = "", u = !1;
    try {
      const c = await fetch("/api/mlx/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: o, systemInstruction: t })
      }), p = c.headers.get("content-type") || "";
      c.ok && p.includes("application/json") ? e = (await c.json()).content : u = !0;
    } catch {
      u = !0;
    }
    if (u) {
      const c = await fetch(`${h.gatewayUrl}/v1/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: h.model,
          input: o,
          instructions: t,
          stream: !1
        })
      });
      if (!c.ok) throw new Error(`Upstream error: HTTP ${c.status}`);
      const p = await c.json();
      e = ((l = (a = p == null ? void 0 : p.output) == null ? void 0 : a[0]) == null ? void 0 : l.content) || "";
    }
    if (!e)
      throw new Error("Empty response returned from LLM.");
    let i = !1;
    if (e.trim().startsWith("{"))
      try {
        const c = JSON.parse(e);
        if (c.tool && h.onToolCall) {
          i = !0, b("SYSTEM", `Tool call detected: ${c.tool}...`, "hud-log-system");
          const p = await h.onToolCall(c.tool, c.args || {});
          b("SYSTEM", "Tool response received. Resuming...", "hud-log-system");
          const s = `${o}

[SYSTEM] Tool "${c.tool}" returned result:
${JSON.stringify(p)}`;
          await L(s);
          return;
        }
      } catch {
      }
    i || (b("ORCHESTRATOR", e, "hud-log-out"), n && r && (n.value = e, r.classList.remove("hidden")));
  } catch (e) {
    b("ERROR", e.message || "Failed to reach LLM node.", "hud-log-system");
  }
}
function O(o) {
  const r = document.getElementById("hud-apply-textarea");
  if (!r || !r.value) return;
  const n = r.value;
  let t = [];
  if (h.applyTargets)
    if (typeof h.applyTargets == "function") {
      const e = h.applyTargets(v, n);
      e && (t = Array.isArray(e) ? e : [e]);
    } else {
      const e = h.applyTargets[v];
      e && (Array.isArray(e) ? e : [e]).forEach((i) => {
        const c = document.querySelector(i);
        c && t.push(c);
      });
    }
  const a = $();
  if (t.filter(Boolean).length === 0 && a && t.push(a), t = Array.from(new Set(t.filter(Boolean))), t.length === 0) {
    b("SYSTEM", "No active target field found. Copying to clipboard instead.", "hud-log-system"), navigator.clipboard.writeText(n);
    return;
  }
  t.forEach((e) => {
    var i, c, p;
    const u = e.contentEditable === "true" || ((i = e.getAttribute) == null ? void 0 : i.call(e, "contenteditable")) === "true" || ((c = e.getAttribute) == null ? void 0 : c.call(e, "contenteditable")) === "plaintext-only";
    if (e.tagName === "INPUT" || e.tagName === "TEXTAREA") {
      const s = e;
      if (o === "append" && s.value.trim()) {
        const f = s.value.endsWith(";") || s.value.endsWith(",") ? " " : `
`;
        s.value = s.value.trim() + f + n;
      } else
        s.value = n;
    } else u && (o === "append" && ((p = e.textContent) != null && p.trim()) ? e.textContent = e.textContent.trim() + `
` + n : e.textContent = n);
    e.dispatchEvent(new Event("input", { bubbles: !0 })), e.dispatchEvent(new Event("change", { bubbles: !0 })), e.dispatchEvent(new Event("blur", { bubbles: !0 }));
  }), b("SYSTEM", `Applied content to ${t.map((e) => e.id || e.tagName).join(", ")}.`, "hud-log-system"), r.value = "";
  const l = document.getElementById("hud-apply-container");
  l && l.classList.add("hidden"), setTimeout(() => {
    C();
  }, 1e3);
}
function D() {
  if (h.detectCase)
    return h.detectCase();
  const o = document.body.dataset.case;
  return o || "general";
}
function X(o, r) {
  P(), v = D(), d || (d = document.createElement("div"), d.className = "hud-panel", d.id = "orchestrator-hud-panel", document.body.appendChild(d));
  const n = h.presets || {}, t = { ...M, ...n }, a = t[v] || t.general || M.general;
  d.innerHTML = `
    <div class="hud-header" id="hud-header-drag">
      <div class="hud-title">
        ORCHESTRATOR HUD
      </div>
      <button class="hud-close-btn" id="hud-close-btn">CLOSE [X]</button>
    </div>
    <div class="hud-body">
      <div class="hud-viz-container">
        <div class="hud-viz-status" id="hud-viz-status-label">
          ORCHESTRATOR HUD // CASE: ${v.toUpperCase()}
        </div>
        <canvas id="hud-visualizer-canvas"></canvas>
      </div>

      <div class="hud-console" id="hud-console-log">
        <div><span class="hud-log-system">[SYSTEM]</span> Ready. Right-click anywhere to summon. Input voice command or request prompt details.</div>
      </div>

      <!-- Quick Action Presets -->
      <div class="hud-actions-grid">
        ${a.map((m) => `
          <button class="hud-action-btn" data-preset-prompt="${m.prompt}" title="${m.prompt}">
            ${m.label}
          </button>
        `).join("")}
      </div>

      <!-- Apply Actions (Hidden by default, shown when LLM responds) -->
      <div class="form-group hidden" id="hud-apply-container" style="display: flex; flex-direction: column; gap: 6px;">
        <textarea id="hud-apply-textarea" style="display: none;"></textarea>
        <div class="hud-apply-bar">
          <button class="btn btn-primary hud-apply-btn" id="hud-btn-apply-overwrite">Apply (Overwrite)</button>
          <button class="btn btn-ghost hud-apply-btn" id="hud-btn-apply-append">Append</button>
        </div>
      </div>

      <!-- Input box -->
      <div class="hud-input-group">
        <input type="text" class="hud-input-field" id="hud-input-field" placeholder="ASK ORCHESTRATOR..." autocomplete="off" />
        <button class="hud-mic-btn" id="hud-mic-btn" title="Toggle voice command dictation">REC</button>
      </div>
    </div>
  `;
  const l = 440, e = 520;
  let u = o - l / 2, i = r - 30;
  u + l > window.innerWidth && (u = window.innerWidth - l - 20), u < 20 && (u = 20), i + e > window.innerHeight && (i = window.innerHeight - e - 20), i < 20 && (i = 20), d.style.left = `${u}px`, d.style.top = `${i}px`, setTimeout(() => {
    d && d.classList.add("active");
  }, 50);
  const c = d.querySelector("#hud-close-btn"), p = d.querySelector("#hud-mic-btn"), s = d.querySelector("#hud-input-field"), f = d.querySelector("#hud-visualizer-canvas"), y = d.querySelector("#hud-header-drag");
  c.addEventListener("click", C), p.addEventListener("click", () => {
    Y(p, s);
  }), s.addEventListener("keydown", (m) => {
    if (m.key === "Enter") {
      const x = s.value.trim();
      x && (b("USER", x, "hud-log-in"), s.value = "", L(x));
    }
  }), d.querySelectorAll(".hud-action-btn").forEach((m) => {
    m.addEventListener("click", () => {
      const A = m.dataset.presetPrompt || "";
      b("USER (PRESET)", A, "hud-log-in"), L(A);
    });
  });
  const E = d.querySelector("#hud-btn-apply-overwrite"), R = d.querySelector("#hud-btn-apply-append");
  E.addEventListener("click", () => O("overwrite")), R.addEventListener("click", () => O("append")), W(y, d);
  const T = d.querySelector("#hud-console-log");
  T && k.length > 0 && (T.innerHTML = "", k.forEach((m) => {
    const x = document.createElement("div");
    x.innerHTML = `<span class="${m.className}">[${m.speaker}]</span> ${m.text}`, T.appendChild(x);
  }), T.scrollTop = T.scrollHeight), U(f), setTimeout(() => {
    s && s.focus();
  }, 100);
}
function C() {
  d && (d.classList.remove("active"), N());
}
function W(o, r) {
  let n = 0, t = 0, a = !1;
  const l = (i) => {
    if (i.target.closest("#hud-close-btn")) return;
    a = !0;
    const c = i instanceof MouseEvent ? i.clientX : i.touches[0].clientX, p = i instanceof MouseEvent ? i.clientY : i.touches[0].clientY;
    n = c - r.offsetLeft, t = p - r.offsetTop, document.addEventListener("mousemove", e), document.addEventListener("mouseup", u), document.addEventListener("touchmove", e, { passive: !1 }), document.addEventListener("touchend", u);
  }, e = (i) => {
    if (!a) return;
    i.cancelable && i.preventDefault();
    const c = i instanceof MouseEvent ? i.clientX : i.touches[0].clientX, p = i instanceof MouseEvent ? i.clientY : i.touches[0].clientY;
    let s = c - n, f = p - t;
    const y = r.offsetWidth, E = r.offsetHeight;
    s < 10 && (s = 10), s + y > window.innerWidth - 10 && (s = window.innerWidth - y - 10), f < 10 && (f = 10), f + E > window.innerHeight - 10 && (f = window.innerHeight - E - 10), r.style.left = `${s}px`, r.style.top = `${f}px`;
  }, u = () => {
    a = !1, document.removeEventListener("mousemove", e), document.removeEventListener("mouseup", u), document.removeEventListener("touchmove", e), document.removeEventListener("touchend", u);
  };
  o.addEventListener("mousedown", l), o.addEventListener("touchstart", l, { passive: !0 });
}
function j(o) {
  o && (h = { ...h, ...o }), I([
    "hud-input-field",
    "sparkle-instructions",
    "sparkle-result"
  ]), window.addEventListener("contextmenu", (r) => {
    var l, e;
    const t = r.composedPath()[0] || r.target;
    t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.contentEditable === "true" || ((l = t.getAttribute) == null ? void 0 : l.call(t, "contenteditable")) === "true" || ((e = t.getAttribute) == null ? void 0 : e.call(t, "contenteditable")) === "plaintext-only" || (r.preventDefault(), X(r.clientX, r.clientY));
  }), window.addEventListener("click", (r) => {
    var n;
    if (d && d.classList.contains("active")) {
      const a = r.composedPath()[0] || r.target;
      !d.contains(a) && !((n = a.closest) != null && n.call(a, ".sparkle-overlay")) && C();
    }
  });
}
export {
  C as hideHUD,
  j as initRightOrchestration,
  X as showHUD
};
