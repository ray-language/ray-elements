# @ray-ds/vue

Web components for any app, with raylang extras (shadcn/ui + Mantine inspired).

Generated from [ray-ds](https://github.com/ray-language/ray-ds) (its `packages/vue`
directory): the components, their docs and the issues are there.

```
import "@ray-ds/elements/tokens.css";
import RayDs from "@ray-ds/vue";
app.use(RayDs);

<RayInput v-model="name" label="Name" />
<RayButton @click="save">Save</RayButton>
```
