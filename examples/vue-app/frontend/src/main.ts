import { createApp } from "vue";
import "@raylang/elements/tokens.css";
import "@raylang/elements/base.css";
import RayElements from "@raylang/vue";
import "./app.css";
import App from "./App.vue";

createApp(App).use(RayElements).mount("#app");
