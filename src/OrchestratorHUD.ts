// src/OrchestratorHUD.ts
import { setupFocusTracker, getLastActiveElement } from './FocusTracker';

export interface Preset {
  label: string;
  prompt: string;
}

export interface OrchestratorOptions {
  gatewayUrl?: string;
  model?: string;
  theme?: 'dark' | 'brutalist-light' | 'custom';
  presets?: Record<string, Preset[]>;
  systemInstructions?: Record<string, string> | ((caseName: string) => string);
  applyTargets?: Record<string, string | string[]> | ((caseName: string, content: string) => HTMLElement | HTMLElement[] | null);
  detectCase?: () => string;
  onToolCall?: (name: string, args: any) => Promise<any>;
}

let hudEl: HTMLElement | null = null;
let isRecording = false;
let recognition: any = null;
let canvasAnimId: number | null = null;
let logs: Array<{ speaker: string; text: string; className: string }> = [];
let detectedCase = "general";

// Default options
let activeOptions: OrchestratorOptions = {
  gatewayUrl: "http://127.0.0.1:8090",
  model: "text/qwen2.5-coder-7b-instruct-4bit",
  theme: "brutalist-light"
};

// Generic fallback presets
const DEFAULT_PRESETS: Record<string, Preset[]> = {
  "general": [
    { label: "Refine Text", prompt: "Refine this text to be clearer, more concise, and professional." },
    { label: "Summarize", prompt: "Summarize this content in three brief bullet points." },
    { label: "Draft Reply", prompt: "Draft a brief, professional reply based on this context." }
  ]
};

// Initialize Speech Recognition
const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
if (SpeechRec) {
  recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";
}

/**
 * Inject the OrchestratorHUD CSS Stylesheet into document head
 */
function injectHUDStyles(): void {
  if (document.getElementById("hud-styles")) return;

  const style = document.createElement("style");
  style.id = "hud-styles";
  style.innerHTML = `
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
  `;
  document.head.appendChild(style);
}

/**
 * Renders the Visualizer Animation loop on the canvas
 */
function startVisualizerLoop(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  };
  resize();

  const draw = () => {
    if (!canvasAnimId) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const bars = 45;
    const barW = (w / bars) - 2;
    const time = Date.now() * 0.005;

    const activeColor = getComputedStyle(document.documentElement).getPropertyValue('--status-red').trim() || '#8a3030';
    const baseColor = getComputedStyle(document.documentElement).getPropertyValue('--status-blue').trim() || '#3d6e96';
    ctx.fillStyle = isRecording ? activeColor : baseColor;

    for (let i = 0; i < bars; i++) {
      let noiseVal = 0.1;
      if (isRecording) {
        noiseVal = Math.abs(Math.sin(i * 0.25 + time * 3.5) * Math.cos(i * 0.1) * 0.7) + 0.1;
      } else {
        noiseVal = Math.abs(Math.sin(i * 0.1 + time) * Math.cos(i * 0.05) * 0.2) + 0.05;
      }

      const barH = noiseVal * (h * 0.75) + 3;
      const x = i * (barW + 2);
      const y = (h - barH) / 2;
      ctx.fillRect(x, y, barW, barH);
    }

    canvasAnimId = requestAnimationFrame(draw);
  };

  canvasAnimId = requestAnimationFrame(draw);
  window.addEventListener("resize", resize);
}

function stopVisualizerLoop(): void {
  if (canvasAnimId) {
    cancelAnimationFrame(canvasAnimId);
    canvasAnimId = null;
  }
}

/**
 * Triggers voice speech recognition
 */
function toggleSpeechRecognition(micBtn: HTMLElement | null, inputField: HTMLInputElement | null): void {
  if (!recognition) {
    appendLog("SYSTEM", "Speech recognition is not supported in this browser.", "hud-log-system");
    return;
  }

  if (isRecording) {
    recognition.stop();
  } else {
    isRecording = true;
    if (micBtn) {
      micBtn.classList.add("active");
      micBtn.innerHTML = `ON`;
    }
    const label = document.getElementById("hud-viz-status-label");
    if (label) label.textContent = "LISTENING... SPEAK NOW";
    
    recognition.start();

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      if (inputField) inputField.value = resultText;
      appendLog("USER (VOICE)", resultText, "hud-log-in");
      handleOrchestration(resultText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      appendLog("SYSTEM", `Mic error: ${event.error}`, "hud-log-system");
      stopListening();
    };

    recognition.onend = () => {
      stopListening();
    };
  }

  function stopListening() {
    isRecording = false;
    if (micBtn) {
      micBtn.classList.remove("active");
      micBtn.innerHTML = `REC`;
    }
    const label = document.getElementById("hud-viz-status-label");
    if (label) label.textContent = `ORCHESTRATOR HUD // CASE: ${detectedCase.toUpperCase()}`;
  }
}

/**
 * Add log entries to the HUD console
 */
function appendLog(speaker: string, text: string, className: string): void {
  const consoleEl = document.getElementById("hud-console-log");
  if (!consoleEl) return;

  const entry = document.createElement("div");
  entry.innerHTML = `<span class="${className}">[${speaker}]</span> ${text}`;
  consoleEl.appendChild(entry);
  consoleEl.scrollTop = consoleEl.scrollHeight;

  logs.push({ speaker, text, className });
}

/**
 * Gateway / LLM call handler with robust fallback and tool calling logic
 */
export async function handleOrchestration(query: string): Promise<void> {
  const applyContainer = document.getElementById("hud-apply-container");
  const applyTextarea = document.getElementById("hud-apply-textarea") as HTMLTextAreaElement | null;

  if (!query || !query.trim()) return;

  let systemInstruction = "You are the Orchestrator HUD, a floating helper interface. Use prompting rules based on research to help the operator design structured prompts or scripts. Do NOT write conversational replies or wrap outputs in markdown code blocks. Output ONLY the raw content directly.";

  if (activeOptions.systemInstructions) {
    if (typeof activeOptions.systemInstructions === "function") {
      systemInstruction = activeOptions.systemInstructions(detectedCase);
    } else {
      systemInstruction = activeOptions.systemInstructions[detectedCase] || activeOptions.systemInstructions["general"] || systemInstruction;
    }
  }

  appendLog("SYSTEM", "Querying local LLM node...", "hud-log-system");
  
  try {
    let content = "";
    let useGatewayFallback = false;

    // 1. Try host /api/mlx/chat
    try {
      const res = await fetch("/api/mlx/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query, systemInstruction })
      });
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        content = data.content;
      } else {
        useGatewayFallback = true;
      }
    } catch (e) {
      useGatewayFallback = true;
    }

    // 2. Try Gateway direct fallback
    if (useGatewayFallback) {
      const res = await fetch(`${activeOptions.gatewayUrl}/v1/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: activeOptions.model,
          input: query,
          instructions: systemInstruction,
          stream: false
        })
      });
      if (!res.ok) throw new Error(`Upstream error: HTTP ${res.status}`);
      const data = await res.json();
      const first = data?.output?.[0]?.content;
      // Local patch: accept the standard Responses shape (content parts / output_text) as well as a plain string
      content = typeof first === "string"
        ? first
        : (typeof data?.output_text === "string" && data.output_text) ||
          (Array.isArray(first) ? first.map((part: any) => part?.text || "").join("") : "");
    }

    if (!content) {
      throw new Error("Empty response returned from LLM.");
    }

    // Check if output represents a tool call (JSON format)
    let isToolCallExecuted = false;
    if (content.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.tool && activeOptions.onToolCall) {
          isToolCallExecuted = true;
          appendLog("SYSTEM", `Tool call detected: ${parsed.tool}...`, "hud-log-system");
          const toolResult = await activeOptions.onToolCall(parsed.tool, parsed.args || {});
          appendLog("SYSTEM", `Tool response received. Resuming...`, "hud-log-system");
          
          // Re-route back to LLM with the tool result injected
          const contextualPrompt = `${query}\n\n[SYSTEM] Tool "${parsed.tool}" returned result:\n${JSON.stringify(toolResult)}`;
          await handleOrchestration(contextualPrompt);
          return;
        }
      } catch (err) {
        // Not valid JSON or tool format, treat as standard response text
      }
    }

    if (!isToolCallExecuted) {
      appendLog("ORCHESTRATOR", content, "hud-log-out");

      // Load generated text into the apply buffer
      if (applyTextarea && applyContainer) {
        applyTextarea.value = content;
        applyContainer.classList.remove("hidden");
      }
    }
  } catch (err: any) {
    appendLog("ERROR", err.message || "Failed to reach LLM node.", "hud-log-system");
  }
}

/**
 * Automatically applies the generated response to the correct case elements in the host page
 */
function applyResponse(mode: 'overwrite' | 'append'): void {
  const applyTextarea = document.getElementById("hud-apply-textarea") as HTMLTextAreaElement | null;
  if (!applyTextarea || !applyTextarea.value) return;
  const content = applyTextarea.value;

  let targets: HTMLElement[] = [];

  // Check if custom applyTargets mapping or function is provided
  if (activeOptions.applyTargets) {
    if (typeof activeOptions.applyTargets === "function") {
      const res = activeOptions.applyTargets(detectedCase, content);
      if (res) {
        targets = Array.isArray(res) ? res : [res];
      }
    } else {
      const selector = activeOptions.applyTargets[detectedCase];
      if (selector) {
        const selectors = Array.isArray(selector) ? selector : [selector];
        selectors.forEach(sel => {
          const el = document.querySelector(sel);
          if (el) targets.push(el as HTMLElement);
        });
      }
    }
  }

  // Fallback: If no targets resolved, use the last active focused element
  const lastActive = getLastActiveElement();
  if (targets.filter(Boolean).length === 0 && lastActive) {
    targets.push(lastActive);
  }

  // Filter out duplicates and nulls
  targets = Array.from(new Set(targets.filter(Boolean)));

  if (targets.length === 0) {
    appendLog("SYSTEM", "No active target field found. Copying to clipboard instead.", "hud-log-system");
    navigator.clipboard.writeText(content);
    return;
  }

  // Apply to targets
  targets.forEach(target => {
    const isEditableSpan = target.contentEditable === "true" || target.getAttribute?.("contenteditable") === "true" || target.getAttribute?.("contenteditable") === "plaintext-only";
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      const input = target as HTMLInputElement | HTMLTextAreaElement;
      if (mode === "append" && input.value.trim()) {
        const sep = input.value.endsWith(";") || input.value.endsWith(",") ? " " : "\n";
        input.value = input.value.trim() + sep + content;
      } else {
        input.value = content;
      }
    } else if (isEditableSpan) {
      if (mode === "append" && target.textContent?.trim()) {
        target.textContent = target.textContent.trim() + "\n" + content;
      } else {
        target.textContent = content;
      }
    }
    
    // Dispatch events so host frameworks pick up modifications
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    target.dispatchEvent(new Event("blur", { bubbles: true }));
  });

  appendLog("SYSTEM", `Applied content to ${targets.map(t => t.id || t.tagName).join(", ")}.`, "hud-log-system");
  
  // Clean buffer
  applyTextarea.value = "";
  const applyContainer = document.getElementById("hud-apply-container");
  if (applyContainer) applyContainer.classList.add("hidden");
  
  // Auto-hide HUD on success after 1 second
  setTimeout(() => {
    hideHUD();
  }, 1000);
}

/**
 * Resolves case category from window state or override options
 */
function detectRoom(): string {
  if (activeOptions.detectCase) {
    return activeOptions.detectCase();
  }
  const bodyCase = document.body.dataset.case;
  if (bodyCase) return bodyCase;
  return "general";
}

/**
 * Open Orchestrator HUD
 */
export function showHUD(x: number, y: number): void {
  injectHUDStyles();
  detectedCase = detectRoom();

  if (!hudEl) {
    hudEl = document.createElement("div");
    hudEl.className = "hud-panel";
    hudEl.id = "orchestrator-hud-panel";
    document.body.appendChild(hudEl);
  }

  // Populate presets map merging defaults and overrides
  const customPresets = activeOptions.presets || {};
  const mergedPresets = { ...DEFAULT_PRESETS, ...customPresets };
  const actionPresets = mergedPresets[detectedCase] || mergedPresets["general"] || DEFAULT_PRESETS["general"];
  
  hudEl.innerHTML = `
    <div class="hud-header" id="hud-header-drag">
      <div class="hud-title">
        ORCHESTRATOR HUD
      </div>
      <button class="hud-close-btn" id="hud-close-btn">CLOSE [X]</button>
    </div>
    <div class="hud-body">
      <div class="hud-viz-container">
        <div class="hud-viz-status" id="hud-viz-status-label">
          ORCHESTRATOR HUD // CASE: ${detectedCase.toUpperCase()}
        </div>
        <canvas id="hud-visualizer-canvas"></canvas>
      </div>

      <div class="hud-console" id="hud-console-log">
        <div><span class="hud-log-system">[SYSTEM]</span> Ready. Right-click anywhere to summon. Input voice command or request prompt details.</div>
      </div>

      <!-- Quick Action Presets -->
      <div class="hud-actions-grid">
        ${actionPresets.map((preset) => `
          <button class="hud-action-btn" data-preset-prompt="${preset.prompt}" title="${preset.prompt}">
            ${preset.label}
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

  // Position Panel
  const hudW = 440;
  const hudH = 520;
  let posX = x - hudW / 2;
  let posY = y - 30;

  // Clamp inside screen bounds
  if (posX + hudW > window.innerWidth) posX = window.innerWidth - hudW - 20;
  if (posX < 20) posX = 20;
  if (posY + hudH > window.innerHeight) posY = window.innerHeight - hudH - 20;
  if (posY < 20) posY = 20;

  hudEl.style.left = `${posX}px`;
  hudEl.style.top = `${posY}px`;

  // Show panel
  setTimeout(() => {
    if (hudEl) hudEl.classList.add("active");
  }, 50);

  // Bind Event Listeners
  const closeBtn = hudEl.querySelector("#hud-close-btn") as HTMLElement;
  const micBtn = hudEl.querySelector("#hud-mic-btn") as HTMLElement;
  const inputField = hudEl.querySelector("#hud-input-field") as HTMLInputElement;
  const canvas = hudEl.querySelector("#hud-visualizer-canvas") as HTMLCanvasElement;
  const headerDrag = hudEl.querySelector("#hud-header-drag") as HTMLElement;

  closeBtn.addEventListener("click", hideHUD);
  
  micBtn.addEventListener("click", () => {
    toggleSpeechRecognition(micBtn, inputField);
  });

  inputField.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      const val = inputField.value.trim();
      if (val) {
        appendLog("USER", val, "hud-log-in");
        inputField.value = "";
        handleOrchestration(val);
      }
    }
  });

  // Bind Quick Presets
  hudEl.querySelectorAll(".hud-action-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const element = btn as HTMLElement;
      const pr = element.dataset.presetPrompt || "";
      appendLog("USER (PRESET)", pr, "hud-log-in");
      handleOrchestration(pr);
    });
  });

  // Bind Apply Actions
  const overwriteBtn = hudEl.querySelector("#hud-btn-apply-overwrite") as HTMLElement;
  const appendBtn = hudEl.querySelector("#hud-btn-apply-append") as HTMLElement;

  overwriteBtn.addEventListener("click", () => applyResponse("overwrite"));
  appendBtn.addEventListener("click", () => applyResponse("append"));

  // Set up dragging
  setupHUDDragging(headerDrag, hudEl);

  // Restore history log rendering
  const consoleLog = hudEl.querySelector("#hud-console-log");
  if (consoleLog && logs.length > 0) {
    consoleLog.innerHTML = "";
    logs.forEach(log => {
      const entry = document.createElement("div");
      entry.innerHTML = `<span class="${log.className}">[${log.speaker}]</span> ${log.text}`;
      consoleLog.appendChild(entry);
    });
    consoleLog.scrollTop = consoleLog.scrollHeight;
  }

  // Visualizer Canvas Loop
  startVisualizerLoop(canvas);

  // Focus Input
  setTimeout(() => {
    if (inputField) inputField.focus();
  }, 100);
}

/**
 * Close Orchestrator HUD
 */
export function hideHUD(): void {
  if (hudEl) {
    hudEl.classList.remove("active");
    stopVisualizerLoop();
  }
}

/**
 * Setup dragging behavior for the floating HUD
 */
function setupHUDDragging(header: HTMLElement, panel: HTMLElement): void {
  let offsetXX = 0;
  let offsetYY = 0;
  let isDragging = false;

  const dragStart = (e: MouseEvent | TouchEvent) => {
    if ((e.target as HTMLElement).closest("#hud-close-btn")) return;

    isDragging = true;
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
    
    offsetXX = clientX - panel.offsetLeft;
    offsetYY = clientY - panel.offsetTop;

    document.addEventListener("mousemove", dragMove);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("touchmove", dragMove, { passive: false });
    document.addEventListener("touchend", dragEnd);
  };

  const dragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();

    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

    let nextX = clientX - offsetXX;
    let nextY = clientY - offsetYY;

    const hudW = panel.offsetWidth;
    const hudH = panel.offsetHeight;

    if (nextX < 10) nextX = 10;
    if (nextX + hudW > window.innerWidth - 10) nextX = window.innerWidth - hudW - 10;
    if (nextY < 10) nextY = 10;
    if (nextY + hudH > window.innerHeight - 10) nextY = window.innerHeight - hudH - 10;

    panel.style.left = `${nextX}px`;
    panel.style.top = `${nextY}px`;
  };

  const dragEnd = () => {
    isDragging = false;
    document.removeEventListener("mousemove", dragMove);
    document.removeEventListener("mouseup", dragEnd);
    document.removeEventListener("touchmove", dragMove);
    document.removeEventListener("touchend", dragEnd);
  };

  header.addEventListener("mousedown", dragStart);
  header.addEventListener("touchstart", dragStart, { passive: true });
}

/**
 * Set up global right-click context menu summon listener.
 */
export function initRightClickOrchestration(options?: OrchestratorOptions): void {
  if (options) {
    activeOptions = { ...activeOptions, ...options };
  }

  setupFocusTracker([
    "hud-input-field",
    "sparkle-instructions",
    "sparkle-result"
  ]);

  window.addEventListener("contextmenu", (e) => {
    const target = e.composedPath()[0] || e.target;
    const element = target as HTMLElement;
    const isEditable = element.tagName === "INPUT" ||
                       element.tagName === "TEXTAREA" ||
                       element.contentEditable === "true" ||
                       element.getAttribute?.("contenteditable") === "true" ||
                       element.getAttribute?.("contenteditable") === "plaintext-only";
    if (isEditable) {
      return;
    }

    e.preventDefault();
    showHUD(e.clientX, e.clientY);
  });

  // Left click on empty space hides HUD
  window.addEventListener("click", (e) => {
    if (hudEl && hudEl.classList.contains("active")) {
      const target = e.composedPath()[0] || e.target;
      const element = target as HTMLElement;
      if (!hudEl.contains(element) && !element.closest?.(".sparkle-overlay")) {
        hideHUD();
      }
    }
  });
}
