"use client";

import type React from "react";

import GlobalDialog from "../../hooks/use-dialog";
import { Toaster } from "../ui/sonner";
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
				{children}
				<GlobalDialog />
				<Toaster />
			</ReactQueryProvider>
		</ThemeProvider>
	);
}
