# @raylang/react

Web components for any app, with raylang extras (shadcn/ui + Mantine inspired).

Generated from [ray-elements](https://github.com/ray-language/ray-elements) (its `packages/react`
directory): the components, their docs and the issues are there.

```
import "@raylang/elements/tokens.css";
import { RayButton, RayInput } from "@raylang/react";

<RayInput label="Name" value={name} onInput={(e) => setName(e.currentTarget.value)} />
<RayButton onClick={save}>Save</RayButton>
```
