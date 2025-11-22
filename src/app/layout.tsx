import { fontVariables } from "@/shared/lib/fonts";
import type { Metadata } from "next";
import Provider from "../shared/components/providers";
import "../shared/styles/globals.css";
import "../shared/styles/fonts.css";

export const metadata: Metadata = {
	title: "LRWH Kustomisasi Hadiah - Kado Custom untuk Orang Spesial",
	description:
		"Sesuaikan hadiah sempurna Anda dengan editor template LRWH yang intuitif. Personalisasi desain, tambahkan teks dan gambar, dan buat hadiah berkesan dengan mudah. Special gift for special one.",
	keywords: ["kustomisasi", "hadiah", "editor template", "LRWH", "kado custom", "personalisasi hadiah", "special gift"],
	icons: {
		icon: "/icon.jpeg",
		apple: "/icon.jpeg",
	},
	openGraph: {
		title: "LRWH Kustomisasi Hadiah - Kado Custom untuk Orang Spesial",
		description:
			"Sesuaikan hadiah sempurna Anda dengan editor template LRWH yang intuitif. Personalisasi desain, tambahkan teks dan gambar, dan buat hadiah berkesan dengan mudah.",
		images: ["/icon.jpeg"],
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "LRWH Kustomisasi Hadiah - Kado Custom untuk Orang Spesial",
		description:
			"Sesuaikan hadiah sempurna Anda dengan editor template LRWH yang intuitif. Personalisasi design dan buat hadiah berkesan.",
		images: ["/icon.jpeg"],
	},
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
