"use client";

import type React from "react";

import GlobalDialog from "../../hooks/use-dialog";
import GlobalSheet from "../../hooks/use-sheet";
import { Toaster } from "../ui/sonner";
import NuqsProvider from "./nuqs-provider";
import ReactQueryProvider from "./react-query-provider";
import { ThemeProvider } from "./theme-provider";

export default function Provider({ children }: React.PropsWithChildren) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="light"
			enableSystem
			forcedTheme="light"
		>
			<ReactQueryProvider>
				<NuqsProvider>
					{children}
					<GlobalDialog />
					<GlobalSheet />
					<Toaster />
				</NuqsProvider>
			</ReactQueryProvider>
		</ThemeProvider>
	);
}
