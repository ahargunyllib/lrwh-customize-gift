export type TLineElement =
	| "line-thin"
	| "line-medium"
	| "line-thick"
	| "line-dashed"
	| "line-dotted"
	| "line-arrow";

export interface LineElement {
	id: string;
	type: TLineElement;
}
