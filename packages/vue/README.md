# @raylang/vue

Web components for any app, with raylang extras (shadcn/ui + Mantine inspired).

Generated from [ray-elements](https://github.com/ray-language/ray-elements) (its `packages/vue`
directory): the components, their docs and the issues are there.

```
import "@raylang/elements/tokens.css";
import RayDs from "@raylang/vue";
app.use(RayDs);

<RayInput v-model="name" label="Name" />
<RayButton @click="save">Save</RayButton>
```
