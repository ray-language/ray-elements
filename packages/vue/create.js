// Vue 3 wrapper factory for ray-elements custom elements.
//
// Declared properties are assigned as DOM properties after mount and every
// update. With a `model` ({ prop, events }), the wrapper supports v-model:
// modelValue -> element[prop], and the events emit update:modelValue with
// the element's new value. Attributes and listeners (@ray-select, @click,
// class, slot…) fall through to the element: Vue maps onRaySelect to the
// "ray-select" event on its own.

import { defineComponent, h, mergeProps, onMounted, onUpdated, ref } from "vue";

/**
 * @param {string} name     component name (RayInput)
 * @param {string} tagName  custom element tag (ray-input)
 * @param {{ properties?: string[], booleans?: string[], model?: { prop: string, events: string[] } }} options
 *   booleans: the boolean properties, so a bare attribute (<RayInput required>) means true
 */
export function createComponent(name, tagName, { properties = [], booleans = [], model } = {}) {
  const props = {};
  // Boolean casting ("" -> true); default undefined keeps an absent prop off the element.
  for (const p of properties) props[p] = { type: booleans.includes(p) ? Boolean : null, default: undefined };
  if (model) props.modelValue = { type: null, default: undefined };

  return defineComponent({
    name,
    inheritAttrs: false,
    props,
    emits: model ? ["update:modelValue"] : [],
    setup(p, { attrs, slots, emit, expose }) {
      const el = ref(null);
      const sync = () => {
        const e = el.value;
        if (!e) return;
        for (const key of properties) {
          if (p[key] !== undefined && !Object.is(e[key], p[key])) e[key] = p[key];
        }
        if (model && p.modelValue !== undefined && !Object.is(e[model.prop], p.modelValue)) {
          e[model.prop] = p.modelValue;
        }
      };
      onMounted(sync);
      onUpdated(sync);
      expose({ el });

      const listeners = {};
      if (model) {
        for (const type of model.events) {
          const key = "on" + type.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");
          listeners[key] = (event) => {
            // Only the element's own event (not one bubbling from a child).
            if (event.target === el.value) emit("update:modelValue", el.value[model.prop]);
          };
        }
      }
      return () => h(tagName, mergeProps(attrs, listeners, { ref: el }), slots.default?.());
    },
  });
}

/** A plugin registering every component globally: app.use(RayDs). */
export function createPlugin(components) {
  return {
    install(app) {
      for (const [name, component] of Object.entries(components)) app.component(name, component);
    },
  };
}
