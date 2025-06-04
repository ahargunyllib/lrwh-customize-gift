"use client";

import { create } from "zustand";
import { Dialog } from "../components/ui/dialog";

type DialogStore = {
	isOpen: boolean;
	openDialog: (props: { children: React.ReactNode }) => void;
	children: React.ReactNode;
	closeDialog: () => void;
};

export const useDialogStore = create<DialogStore>((set) => ({
	isOpen: false,
	openDialog: ({ children }) => {
		set({ isOpen: true, children });
	},
	closeDialog: () => {
		set({ isOpen: false, children: null });
	},
	children: null,
}));

export default function GlobalDialog() {
	const { isOpen, children, closeDialog } = useDialogStore();

	return (
		<Dialog open={isOpen} onOpenChange={() => closeDialog()}>
			{children}
		</Dialog>
	);
}
