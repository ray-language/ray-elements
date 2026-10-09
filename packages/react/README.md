# @ray-ds/react

Web components for any app, with raylang extras (shadcn/ui + Mantine inspired).

Generated from [ray-ds](https://github.com/ray-language/ray-ds) (its `packages/react`
directory): the components, their docs and the issues are there.

```
import "@ray-ds/elements/tokens.css";
import { RayButton, RayInput } from "@ray-ds/react";

<RayInput label="Name" value={name} onInput={(e) => setName(e.currentTarget.value)} />
<RayButton onClick={save}>Save</RayButton>
```
