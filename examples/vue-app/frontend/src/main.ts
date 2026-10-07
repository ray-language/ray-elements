import { createApp } from "vue";
import "@ray-ds/elements/tokens.css";
import "@ray-ds/elements/base.css";
import RayDs from "@ray-ds/vue";
import "./app.css";
import App from "./App.vue";

createApp(App).use(RayDs).mount("#app");
