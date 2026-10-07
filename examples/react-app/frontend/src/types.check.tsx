// Compile-time checks of the generated types (`npm run typecheck`); never rendered.
// Each @ts-expect-error must hit a real error, or tsc fails.
import { notify, confirmDialog, type RayMenuItem as MenuItemElement } from "@ray-ds/elements";
import { RayButton, RayMenu, RayDialog, RayInput, RayCheckbox, RayTable, RayCommandPalette, RaySplit, RaySlider } from "@ray-ds/react";
import type { TableColumn, CommandAction } from "@ray-ds/elements";

const columns: TableColumn[] = [{ key: "name", label: "Name", sortable: true, align: "right", render: (row) => String(row.name) }];
const actions: CommandAction[] = [{ label: "Run", group: "Raylang", shortcut: "⌘ R", onSelect: (a) => void a.label }];

export const checks = [
  // @ts-expect-error variant only takes the documented values
  <RayButton variant="huge" />,
  // @ts-expect-error size is a union
  <RayInput size="xxl" />,
  // @ts-expect-error checked is a boolean
  <RayCheckbox checked="yes" />,
  <RayMenu onRaySelect={(e) => { const v: string = e.detail.value; const item: MenuItemElement = e.detail.item; void v; void item; }} />,
  <RayDialog onRayClose={(e) => void e.detail.returnValue.toUpperCase()} />,
  // @ts-expect-error the detail of ray-close has no `value`
  <RayDialog onRayClose={(e) => void e.detail.value} />,
  <RayTable columns={columns} data={[{ id: 1, name: "a" }]} selectable onRayRowClick={(e) => void e.detail.index.toFixed()} onRaySort={(e) => void e.detail.direction} />,
  // @ts-expect-error align only takes left | center | right
  <RayTable columns={[{ key: "x", align: "middle" }]} />,
  <RayCommandPalette actions={actions} onRaySelect={(e) => void e.detail.action.label} />,
  <RaySplit position="30%" onRayResize={(e) => void e.detail.size.toFixed()} />,
  <RaySlider value={3} marks={[0, { value: 5, label: "five" }]} />,
  // @ts-expect-error slider value is a number
  <RaySlider value="3" />,
  // DOM attributes and React props still pass through.
  <RayButton className="x" style={{ margin: 0 }} id="b" slot="trigger" aria-label="Go" onClick={() => {}} />,
];

const id: string = notify({ title: "t", autoClose: false });
// @ts-expect-error autoClose is number | false
notify({ autoClose: "soon" });
const ok: Promise<boolean> = confirmDialog({ label: "Sure?" });
const tagged: HTMLElementTagNameMap["ray-button"] = document.createElement("ray-button");
tagged.variant = "outline";
// @ts-expect-error not a variant
tagged.variant = "nope";
export { id, ok };
