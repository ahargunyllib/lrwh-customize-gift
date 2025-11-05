import { fontVariables } from "@/shared/lib/fonts";
import type { Metadata } from "next";
import Provider from "../shared/components/providers";
import "../shared/styles/globals.css";
import "../shared/styles/fonts.css";

export const metadata: Metadata = {
	title: "LRWH Kustomisasi Hadiah",
	description:
		"Sesuaikan hadiah sempurna Anda dengan editor template LRWH yang intuitif. Personalisasi desain, tambahkan teks dan gambar, dan buat hadiah berkesan dengan mudah.",
	keywords: ["kustomisasi", "hadiah", "editor template", "LRWH"],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${fontVariables} antialiased`}>
				<Provider>{children}</Provider>
			</body>
		</html>
	);
}
