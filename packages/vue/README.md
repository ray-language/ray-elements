# @raylang/vue

Web components for any app, with raylang extras (shadcn/ui + Mantine inspired).

Generated from [ray-elements](https://github.com/ray-language/ray-elements) (its `packages/vue`
directory): the components, their docs and the issues are there.

```
import "@raylang/elements/tokens.css";
import RayElements from "@raylang/vue";
app.use(RayElements);

<RayInput v-model="name" label="Name" />
<RayButton @click="save">Save</RayButton>
```
