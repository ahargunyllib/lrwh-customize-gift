export type Axis = "x" | "y" | "both";

export function triggerElementCenter(id: string, axis: Axis) {
	document.dispatchEvent(
		new CustomEvent("elementCenter", { detail: { id, axis } }),
	);
}
