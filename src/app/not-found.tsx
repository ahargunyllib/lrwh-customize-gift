"use client";

import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../shared/components/ui/card";
import { HelpCircleIcon } from "lucide-react";

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
			<Card className="max-w-sm">
				<CardHeader>
					<HelpCircleIcon className="mx-auto h-16 w-16 text-muted-foreground" />
				</CardHeader>
				<CardContent className="text-center space-y-2">
					<CardTitle>Halaman Tidak Ditemukan</CardTitle>
					<CardDescription>
						Maaf, halaman yang Anda cari tidak ada. Silakan kembali ke beranda.
					</CardDescription>
				</CardContent>
				<CardFooter>
					<Link href="/" className="w-full">
						<Button className="w-full bg-[#2854AD] hover:bg-[#2854AD]/80 px-8 py-4 h-fit">
							Kembali ke Beranda
						</Button>
					</Link>
				</CardFooter>
			</Card>
		</div>
	);
}
