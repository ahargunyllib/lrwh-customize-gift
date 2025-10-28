import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type FirstVisitStore = {
	hasVisitedTemplates: boolean;
	setVisited: () => void;
};

export const useFirstVisitStore = create<FirstVisitStore>()(
	persist(
		(set) => ({
			hasVisitedTemplates: false,
			setVisited: () => set({ hasVisitedTemplates: true }),
		}),
		{
			name: "first-visit-store",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);
