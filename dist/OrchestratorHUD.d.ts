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
/**
 * Gateway / LLM call handler with robust fallback and tool calling logic
 */
export declare function handleOrchestration(query: string): Promise<void>;
/**
 * Open Orchestrator HUD
 */
export declare function showHUD(x: number, y: number): void;
/**
 * Close Orchestrator HUD
 */
export declare function hideHUD(): void;
/**
 * Set up global right-click context menu summon listener.
 */
export declare function initRightClickOrchestration(options?: OrchestratorOptions): void;
