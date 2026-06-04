# RightOrchestrator

An unintrusive, private, and context-aware floating HUD and client console for agentic web applications. 

RightOrchestrator intercepts right-click gestures on non-editable viewport space to summon a movable, glassmorphic control console. It tracks user focus across normal and Shadow DOM elements (e.g., LitElement, custom web components) and routes contextually optimized inputs to local MLX models or any OpenAI-compatible API gateway.

---

## Key Features

- **Unintrusive HUD Console**: Summoned dynamically via right-click. Designed to stay out of the way of standard browser inputs, copy-paste workflows, and default context menus.
- **Privacy First & Local Inference**: Connects directly to local MLX services, local gateways, or private model nodes, ensuring all prompt engineering and agent commands remain entirely client-side/local.
- **Shadow-DOM Focus Tracker**: Automatically preserves target element focus (inputs, textareas, and contenteditables) across shadow-roots, allowing seamless prompt injection into custom elements.
- **Draggable Glassmorphic UI**: High-contrast, minimalist brutalist aesthetics with hard 0px corners, HSL tailored variables, and canvas wave visualizers.
- **Custom Case Presets & Rules**: Fully configurable preset banks, custom prompt instructions, and injection target mapping to adapt to the active app workspace or path.
- **Client-Side Tool Call Loop (onToolCall)**: Wire local JS actions or browser capabilities to your agentic flow. If the backend model returns a structured JSON tool call, RightOrchestrator executes it on the client and feeds the output back into the generation loop.

---

## Installation

```bash
npm install rightorchestrator
```

---

## Quick Start

Import and initialize the orchestrator:

```javascript
import { initRightOrchestration } from 'rightorchestrator';

initRightOrchestration({
  gatewayUrl: 'http://127.0.0.1:8090',
  model: 'text/qwen2.5-coder-7b-instruct-4bit',
  theme: 'brutalist-light',
  
  // Custom case resolution
  detectCase: () => {
    return window.location.pathname.includes('/editor') ? 'editor' : 'general';
  },

  // Custom presets per case
  presets: {
    editor: [
      { label: "Refine Code", prompt: "Optimize this javascript snippet for efficiency." },
      { label: "Add Types", prompt: "Convert this plain object to a typescript interface." }
    ],
    general: [
      { label: "Summary", prompt: "Summarize this page in three key points." }
    ]
  },

  // Callback to execute client-side tools requested by the model
  onToolCall: async (name, args) => {
    if (name === 'fetch_document') {
      const doc = await fetch(`/api/docs/${args.id}`);
      return doc.text();
    }
    return null;
  }
});
```

---

## Configuration API

The `initRightOrchestration` function accepts an `OrchestratorOptions` configuration object:

```typescript
export interface Preset {
  label: string;
  prompt: string;
}

export interface OrchestratorOptions {
  // Upstream Gateway configuration
  gatewayUrl?: string; // Default: 'http://127.0.0.1:8090'
  model?: string;       // Default: 'text/qwen2.5-coder-7b-instruct-4bit'
  theme?: 'dark' | 'brutalist-light' | 'custom'; // Default: 'brutalist-light'

  // Presets mapping per case
  presets?: Record<string, Preset[]>;

  // System instructions mapping per case (or dynamic callback)
  systemInstructions?: Record<string, string> | ((caseName: string) => string);

  // Targets to apply responses to. Supports custom mappings or callbacks returning HTML Elements
  applyTargets?: Record<string, string | string[]> | ((caseName: string, content: string) => HTMLElement | HTMLElement[] | null);

  // Callback to determine the current case name
  detectCase?: () => string;

  // Intercept tool outputs and return data to resume generation
  onToolCall?: (name: string, args: any) => Promise<any>;
}
```

---

## Styling Integration

RightOrchestrator uses zero external stylesheet dependencies. CSS styling rules are automatically injected into the document head at runtime, ensuring a frictionless setup. You can customize the look and feel by targeting class variables or overriding the theme selector.

---

## License

MIT License. Free for open source and private deployments.
