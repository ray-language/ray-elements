// The bridge std/ui injects into the page (window.ray).
export {};

declare global {
  interface Window {
    ray?: {
      /** Sends a value to the raylang program; resolves with its ui.reply. */
      request(value: string): Promise<string>;
      /** Fire-and-forget message to the raylang program. */
      send(value: string): void;
    };
  }
}
