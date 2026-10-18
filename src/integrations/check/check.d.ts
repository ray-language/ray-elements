// Types of @raylang/elements/check: the markup checker behind `ray-elements check`.

export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  severity: "error" | "warning";
  rule: keyof typeof RULES;
  message: string;
}

export interface CheckOptions {
  /** custom-elements.json, parsed (several: yours too). */
  manifest: object | object[];
  /** The registered icon names; without them icons are not checked. */
  icons?: string[];
  /** The icon names that have a filled version (iconNames({ filled: true })); without them filled is not checked. */
  filledIcons?: string[];
  /** More values of an attribute, for every element: an app's own variant, { variant: ["brand"] }. */
  allow?: Record<string, string[]>;
  /** Reported in the diagnostics; its extension picks the language. */
  file?: string;
  lang?: "html" | "vue" | "jsx";
}

/** The rules and what each reports. */
export declare const RULES: {
  "unknown-element": string;
  "unknown-attribute": string;
  "property-only": string;
  "invalid-value": string;
  "boolean-value": string;
  "unknown-slot": string;
  "unknown-event": string;
  "unknown-icon": string;
  "missing-label": string;
  "literal-color": string;
};

/** Checks one file's markup against the manifest. */
export declare function checkMarkup(source: string, options: CheckOptions): Diagnostic[];

/** The values an app adds to attributes in its CSS, from selectors such as [variant="brand"]. */
export declare function customValues(source: string): Record<string, string[]>;

/** The language of a file by its extension. */
export declare function languageOf(file: string): "html" | "vue" | "jsx";
