"use client";
import { Button } from "@/shared/components/ui/button";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../shared/components/ui/card";

export default function GlobalError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
			<Card className="max-w-sm">
				<CardHeader>
					<svg
						className="mx-auto h-16 w-16 text-destructive"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>Ikon Peringatan Kesalahan</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</CardHeader>
				<CardContent className="text-center space-y-2">
					<CardTitle>Terjadi Kesalahan</CardTitle>
					<CardDescription>
						Mohon maaf, terjadi kesalahan. Silakan buka URL lagi dan ulangi dari
						awal. Jika kesalahan terus berlanjut, mohon hubungi admin.
					</CardDescription>
				</CardContent>
				<CardFooter>
					<Button
						onClick={() => reset()}
						className="w-full bg-[#2854AD] hover:bg-[#2854AD]/80 px-8 py-4 h-fit"
					>
						Coba Lagi
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
