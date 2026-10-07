<!-- Compile-time checks of the generated Vue types (`npm run typecheck`); never rendered.
     Each @vue-expect-error must hit a real error, or vue-tsc fails. -->
<script setup lang="ts">
import { ref } from "vue";
const name = ref("");
const on = ref(false);
const level = ref(3);
</script>

<template>
  <RayInput v-model="name" size="sm" />
  <!-- @vue-expect-error size is a union -->
  <RayInput size="xxl" />
  <RaySwitch v-model="on" />
  <!-- @vue-expect-error variant only takes the documented values -->
  <RayButton variant="huge" />
  <RayMenu @ray-select="(e: CustomEvent<{ value: string }>) => e.detail.value" />
  <RaySlider v-model="level" :min="0" :max="10" />
  <RayTable :columns="[{ key: 'a', label: 'A', sortable: true }]" :data="[]" />
  <!-- @vue-expect-error align only takes left | center | right -->
  <RayTable :columns="[{ key: 'a', align: 'middle' }]" />
</template>
