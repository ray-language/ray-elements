// React wrapper factory for ray-elements custom elements (React 18 and 19).
//
// Declared properties are assigned as DOM properties (not attributes, so
// booleans, arrays and objects arrive intact) after every render; declared
// events (onRaySelect -> "ray-select") are attached with addEventListener.
// Everything else (className, style, id, slot, aria-*, data-*, onClick…)
// passes through to the element as usual.

import * as React from "react";

/**
 * @param {string} tagName                       custom element tag
 * @param {{ properties?: string[], events?: Record<string, string>, displayName?: string }} options
 *   events maps a React prop name to a DOM event name: { onRaySelect: "ray-select" }
 */
export function createComponent(tagName, { properties = [], events = {}, displayName } = {}) {
  const propSet = new Set(properties);
  const Component = React.forwardRef(function RayComponent(props, ref) {
    const elRef = React.useRef(null);
    const passthrough = {};
    const values = {};
    const handlers = {};
    for (const key of Object.keys(props)) {
      if (key === "children") continue;
      if (key in events) handlers[events[key]] = props[key];
      else if (propSet.has(key)) values[key] = props[key];
      else passthrough[key] = props[key];
    }

    // Properties: after each render, before paint.
    React.useLayoutEffect(() => {
      const el = elRef.current;
      if (!el) return;
      for (const key of Object.keys(values)) {
        if (!Object.is(el[key], values[key])) el[key] = values[key];
      }
    });

    // Events: one stable listener per event type, calling the latest handler.
    const handlersRef = React.useRef(handlers);
    handlersRef.current = handlers;
    const typesKey = Object.keys(handlers).sort().join(",");
    React.useLayoutEffect(() => {
      const el = elRef.current;
      if (!el || !typesKey) return undefined;
      const listeners = typesKey.split(",").map((type) => {
        const listener = (event) => handlersRef.current[type]?.(event);
        el.addEventListener(type, listener);
        return [type, listener];
      });
      return () => listeners.forEach(([type, listener]) => el.removeEventListener(type, listener));
    }, [typesKey]);

    const setRef = React.useCallback((el) => {
      elRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    }, [ref]);

    return React.createElement(tagName, { ...passthrough, ref: setRef, suppressHydrationWarning: true }, props.children);
  });
  Component.displayName = displayName ?? tagName;
  return Component;
}
