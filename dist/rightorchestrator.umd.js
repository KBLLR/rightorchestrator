(function(v,w){typeof exports=="object"&&typeof module<"u"?w(exports):typeof define=="function"&&define.amd?define(["exports"],w):(v=typeof globalThis<"u"?globalThis:v||self,w(v.RightOrchestrator={}))})(this,function(v){"use strict";let w=null;function $(){return w}function I(o=[]){const r=n=>{var i,d;if(!n)return;if(n.tagName==="INPUT"||n.tagName==="TEXTAREA"||n.contentEditable==="true"||((i=n.getAttribute)==null?void 0:i.call(n,"contenteditable"))==="true"||((d=n.getAttribute)==null?void 0:d.call(n,"contenteditable"))==="plaintext-only"){if(o.includes(n.id))return;w=n}};document.addEventListener("focusin",n=>{const t=n.composedPath()[0]||n.target;r(t)}),document.addEventListener("click",n=>{const t=n.composedPath()[0]||n.target;r(t)})}let l=null,L=!1,g=null,T=null,A=[],y="general",f={gatewayUrl:"http://127.0.0.1:8090",model:"text/qwen2.5-coder-7b-instruct-4bit",theme:"brutalist-light"};const M={general:[{label:"Refine Text",prompt:"Refine this text to be clearer, more concise, and professional."},{label:"Summarize",prompt:"Summarize this content in three brief bullet points."},{label:"Draft Reply",prompt:"Draft a brief, professional reply based on this context."}]},O=window.SpeechRecognition||window.webkitSpeechRecognition;O&&(g=new O,g.continuous=!1,g.interimResults=!1,g.lang="en-US");function N(){if(document.getElementById("hud-styles"))return;const o=document.createElement("style");o.id="hud-styles",o.innerHTML=`
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
  `,document.head.appendChild(o)}function Y(o){if(!o)return;const r=o.getContext("2d");if(!r)return;const n=()=>{const i=o.getBoundingClientRect();o.width=i.width,o.height=i.height};n();const t=()=>{if(!T)return;const i=o.width,d=o.height;r.clearRect(0,0,i,d);const e=45,u=i/e-2,a=Date.now()*.005,c=getComputedStyle(document.documentElement).getPropertyValue("--status-red").trim()||"#8a3030",p=getComputedStyle(document.documentElement).getPropertyValue("--status-blue").trim()||"#3d6e96";r.fillStyle=L?c:p;for(let s=0;s<e;s++){let h=.1;L?h=Math.abs(Math.sin(s*.25+a*3.5)*Math.cos(s*.1)*.7)+.1:h=Math.abs(Math.sin(s*.1+a)*Math.cos(s*.05)*.2)+.05;const x=h*(d*.75)+3,S=s*(u+2),H=(d-x)/2;r.fillRect(S,H,u,x)}T=requestAnimationFrame(t)};T=requestAnimationFrame(t),window.addEventListener("resize",n)}function D(){T&&(cancelAnimationFrame(T),T=null)}function X(o,r){if(!g){m("SYSTEM","Speech recognition is not supported in this browser.","hud-log-system");return}if(L)g.stop();else{L=!0,o&&(o.classList.add("active"),o.innerHTML="ON");const t=document.getElementById("hud-viz-status-label");t&&(t.textContent="LISTENING... SPEAK NOW"),g.start(),g.onresult=i=>{const d=i.results[0][0].transcript;r&&(r.value=d),m("USER (VOICE)",d,"hud-log-in"),k(d)},g.onerror=i=>{console.error("Speech recognition error:",i.error),m("SYSTEM",`Mic error: ${i.error}`,"hud-log-system"),n()},g.onend=()=>{n()}}function n(){L=!1,o&&(o.classList.remove("active"),o.innerHTML="REC");const t=document.getElementById("hud-viz-status-label");t&&(t.textContent=`ORCHESTRATOR HUD // CASE: ${y.toUpperCase()}`)}}function m(o,r,n){const t=document.getElementById("hud-console-log");if(!t)return;const i=document.createElement("div");i.innerHTML=`<span class="${n}">[${o}]</span> ${r}`,t.appendChild(i),t.scrollTop=t.scrollHeight,A.push({speaker:o,text:r,className:n})}async function k(o){var i,d;const r=document.getElementById("hud-apply-container"),n=document.getElementById("hud-apply-textarea");if(!o||!o.trim())return;let t="You are the Orchestrator HUD, a floating helper interface. Use prompting rules based on research to help the operator design structured prompts or scripts. Do NOT write conversational replies or wrap outputs in markdown code blocks. Output ONLY the raw content directly.";f.systemInstructions&&(typeof f.systemInstructions=="function"?t=f.systemInstructions(y):t=f.systemInstructions[y]||f.systemInstructions.general||t),m("SYSTEM","Querying local LLM node...","hud-log-system");try{let e="",u=!1;try{const c=await fetch("/api/mlx/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:o,systemInstruction:t})}),p=c.headers.get("content-type")||"";c.ok&&p.includes("application/json")?e=(await c.json()).content:u=!0}catch{u=!0}if(u){const c=await fetch(`${f.gatewayUrl}/v1/responses`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:f.model,input:o,instructions:t,stream:!1})});if(!c.ok)throw new Error(`Upstream error: HTTP ${c.status}`);const p=await c.json();e=((d=(i=p==null?void 0:p.output)==null?void 0:i[0])==null?void 0:d.content)||""}if(!e)throw new Error("Empty response returned from LLM.");let a=!1;if(e.trim().startsWith("{"))try{const c=JSON.parse(e);if(c.tool&&f.onToolCall){a=!0,m("SYSTEM",`Tool call detected: ${c.tool}...`,"hud-log-system");const p=await f.onToolCall(c.tool,c.args||{});m("SYSTEM","Tool response received. Resuming...","hud-log-system");const s=`${o}

[SYSTEM] Tool "${c.tool}" returned result:
${JSON.stringify(p)}`;await k(s);return}}catch{}a||(m("ORCHESTRATOR",e,"hud-log-out"),n&&r&&(n.value=e,r.classList.remove("hidden")))}catch(e){m("ERROR",e.message||"Failed to reach LLM node.","hud-log-system")}}function z(o){const r=document.getElementById("hud-apply-textarea");if(!r||!r.value)return;const n=r.value;let t=[];if(f.applyTargets)if(typeof f.applyTargets=="function"){const e=f.applyTargets(y,n);e&&(t=Array.isArray(e)?e:[e])}else{const e=f.applyTargets[y];e&&(Array.isArray(e)?e:[e]).forEach(a=>{const c=document.querySelector(a);c&&t.push(c)})}const i=$();if(t.filter(Boolean).length===0&&i&&t.push(i),t=Array.from(new Set(t.filter(Boolean))),t.length===0){m("SYSTEM","No active target field found. Copying to clipboard instead.","hud-log-system"),navigator.clipboard.writeText(n);return}t.forEach(e=>{var a,c,p;const u=e.contentEditable==="true"||((a=e.getAttribute)==null?void 0:a.call(e,"contenteditable"))==="true"||((c=e.getAttribute)==null?void 0:c.call(e,"contenteditable"))==="plaintext-only";if(e.tagName==="INPUT"||e.tagName==="TEXTAREA"){const s=e;if(o==="append"&&s.value.trim()){const h=s.value.endsWith(";")||s.value.endsWith(",")?" ":`
`;s.value=s.value.trim()+h+n}else s.value=n}else u&&(o==="append"&&((p=e.textContent)!=null&&p.trim())?e.textContent=e.textContent.trim()+`
`+n:e.textContent=n);e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),e.dispatchEvent(new Event("blur",{bubbles:!0}))}),m("SYSTEM",`Applied content to ${t.map(e=>e.id||e.tagName).join(", ")}.`,"hud-log-system"),r.value="";const d=document.getElementById("hud-apply-container");d&&d.classList.add("hidden"),setTimeout(()=>{C()},1e3)}function W(){if(f.detectCase)return f.detectCase();const o=document.body.dataset.case;return o||"general"}function U(o,r){N(),y=W(),l||(l=document.createElement("div"),l.className="hud-panel",l.id="orchestrator-hud-panel",document.body.appendChild(l));const n=f.presets||{},t={...M,...n},i=t[y]||t.general||M.general;l.innerHTML=`
    <div class="hud-header" id="hud-header-drag">
      <div class="hud-title">
        ORCHESTRATOR HUD
      </div>
      <button class="hud-close-btn" id="hud-close-btn">CLOSE [X]</button>
    </div>
    <div class="hud-body">
      <div class="hud-viz-container">
        <div class="hud-viz-status" id="hud-viz-status-label">
          ORCHESTRATOR HUD // CASE: ${y.toUpperCase()}
        </div>
        <canvas id="hud-visualizer-canvas"></canvas>
      </div>

      <div class="hud-console" id="hud-console-log">
        <div><span class="hud-log-system">[SYSTEM]</span> Ready. Right-click anywhere to summon. Input voice command or request prompt details.</div>
      </div>

      <!-- Quick Action Presets -->
      <div class="hud-actions-grid">
        ${i.map(b=>`
          <button class="hud-action-btn" data-preset-prompt="${b.prompt}" title="${b.prompt}">
            ${b.label}
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
  `;const d=440,e=520;let u=o-d/2,a=r-30;u+d>window.innerWidth&&(u=window.innerWidth-d-20),u<20&&(u=20),a+e>window.innerHeight&&(a=window.innerHeight-e-20),a<20&&(a=20),l.style.left=`${u}px`,l.style.top=`${a}px`,setTimeout(()=>{l&&l.classList.add("active")},50);const c=l.querySelector("#hud-close-btn"),p=l.querySelector("#hud-mic-btn"),s=l.querySelector("#hud-input-field"),h=l.querySelector("#hud-visualizer-canvas"),x=l.querySelector("#hud-header-drag");c.addEventListener("click",C),p.addEventListener("click",()=>{X(p,s)}),s.addEventListener("keydown",b=>{if(b.key==="Enter"){const E=s.value.trim();E&&(m("USER",E,"hud-log-in"),s.value="",k(E))}}),l.querySelectorAll(".hud-action-btn").forEach(b=>{b.addEventListener("click",()=>{const P=b.dataset.presetPrompt||"";m("USER (PRESET)",P,"hud-log-in"),k(P)})});const S=l.querySelector("#hud-btn-apply-overwrite"),H=l.querySelector("#hud-btn-apply-append");S.addEventListener("click",()=>z("overwrite")),H.addEventListener("click",()=>z("append")),j(x,l);const R=l.querySelector("#hud-console-log");R&&A.length>0&&(R.innerHTML="",A.forEach(b=>{const E=document.createElement("div");E.innerHTML=`<span class="${b.className}">[${b.speaker}]</span> ${b.text}`,R.appendChild(E)}),R.scrollTop=R.scrollHeight),Y(h),setTimeout(()=>{s&&s.focus()},100)}function C(){l&&(l.classList.remove("active"),D())}function j(o,r){let n=0,t=0,i=!1;const d=a=>{if(a.target.closest("#hud-close-btn"))return;i=!0;const c=a instanceof MouseEvent?a.clientX:a.touches[0].clientX,p=a instanceof MouseEvent?a.clientY:a.touches[0].clientY;n=c-r.offsetLeft,t=p-r.offsetTop,document.addEventListener("mousemove",e),document.addEventListener("mouseup",u),document.addEventListener("touchmove",e,{passive:!1}),document.addEventListener("touchend",u)},e=a=>{if(!i)return;a.cancelable&&a.preventDefault();const c=a instanceof MouseEvent?a.clientX:a.touches[0].clientX,p=a instanceof MouseEvent?a.clientY:a.touches[0].clientY;let s=c-n,h=p-t;const x=r.offsetWidth,S=r.offsetHeight;s<10&&(s=10),s+x>window.innerWidth-10&&(s=window.innerWidth-x-10),h<10&&(h=10),h+S>window.innerHeight-10&&(h=window.innerHeight-S-10),r.style.left=`${s}px`,r.style.top=`${h}px`},u=()=>{i=!1,document.removeEventListener("mousemove",e),document.removeEventListener("mouseup",u),document.removeEventListener("touchmove",e),document.removeEventListener("touchend",u)};o.addEventListener("mousedown",d),o.addEventListener("touchstart",d,{passive:!0})}function q(o){o&&(f={...f,...o}),I(["hud-input-field","sparkle-instructions","sparkle-result"]),window.addEventListener("contextmenu",r=>{var d,e;const t=r.composedPath()[0]||r.target;t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.contentEditable==="true"||((d=t.getAttribute)==null?void 0:d.call(t,"contenteditable"))==="true"||((e=t.getAttribute)==null?void 0:e.call(t,"contenteditable"))==="plaintext-only"||(r.preventDefault(),U(r.clientX,r.clientY))}),window.addEventListener("click",r=>{var n;if(l&&l.classList.contains("active")){const i=r.composedPath()[0]||r.target;!l.contains(i)&&!((n=i.closest)!=null&&n.call(i,".sparkle-overlay"))&&C()}})}v.hideHUD=C,v.initRightOrchestration=q,v.showHUD=U,Object.defineProperty(v,Symbol.toStringTag,{value:"Module"})});
