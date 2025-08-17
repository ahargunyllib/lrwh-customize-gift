"use client";

import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import { ArrowLeftIcon, InfoIcon, Loader } from "lucide-react";
import Image from "next/image";
import { useOnboardingForm } from "../hooks/use-onboarding-form";

export default function OnboardingForm() {
	const form = useOnboardingForm();

	return (
		<Form {...form}>
			<form onSubmit={form.onSubmitHandler} className="space-y-6">
				<FormField
					control={form.control}
					name="orderNumber"
					render={({ field }) => (
						<FormItem>
							<div className="flex flex-row items-center justify-between">
								<FormLabel
									htmlFor="orderID"
									className="text-[#1D2939] font-medium text-base"
								>
									Order ID
									<span className="text-red-500">*</span>
								</FormLabel>
								<OrderNumberDialogTip />
							</div>
							<FormControl>
								<Input
									{...field}
									type="text"
									placeholder="Masukkan order ID"
									className="w-full"
									id="orderID"
									name="orderID"
								/>
							</FormControl>
							<FormDescription className="text-[#344054] text-xs font-medium">
								Salin kode No. Pesanan shopee pada bagian rincian
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem>
							<div className="flex flex-row items-center justify-between">
								<FormLabel
									htmlFor="username"
									className="text-[#1D2939] font-medium text-base"
								>
									Username Shopee<span className="text-red-500">*</span>
								</FormLabel>
								<UsernameDialogTip />
							</div>
							<FormControl>
								<Input
									{...field}
									type="text"
									placeholder="Masukkan username"
									className="w-full"
									id="username"
								/>
							</FormControl>
							<FormDescription className="text-[#344054] text-xs font-medium">
								Masukan username sesuai dengan yang ada di shopee
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button
					type="submit"
					disabled={form.isLoading}
					className="w-full bg-[#2854AD] hover:bg-[#2854AD]/80 px-8 py-4 h-fit"
				>
					{form.isLoading ? (
						<Loader className="animate-spin" />
					) : (
						"Mulai Desain"
					)}
				</Button>
			</form>
		</Form>
	);
}

function OrderNumberDialogTip() {
	const isMobile = useIsMobile();
	const tab = isMobile ? "aplikasi" : "website";

	return (
		<Dialog>
			<DialogTrigger asChild>
				<InfoIcon className="text-[#2854AD] size-4" />
			</DialogTrigger>
			<DialogContent
				showCloseButton={false}
				className={cn(
					tab === "website" && "sm:max-w-[39rem]",
					tab === "aplikasi" && "sm:max-w-[27rem]",
				)}
			>
				<DialogHeader className="text-left">
					<DialogClose asChild>
						<ArrowLeftIcon className="absolute top-6 left-4 size-6 text-[#292D32]" />
					</DialogClose>
					<DialogTitle className="text-center text-base font-bold text-[#1D2939]">
						Cara cek order ID kamu
					</DialogTitle>
					<ul className="list-disc pl-4 text-[#737373] text-sm">
						<li>Pilih dulu pesanan yang mau kamu lihat</li>
						<li>
							Terus scroll ke bawah sampai ketemu bagian "Rincian Pesanan"
						</li>
						<li>
							Nah, di situ kamu bisa lihat detail, termasuk Nomor Pesanan atau
							Order ID-nya
						</li>
					</ul>
				</DialogHeader>
				{isMobile ? (
					<div className="relative bg-muted w-full h-[14rem]">
						<Image
							src="/imgs/order-number-mobile-tip.png"
							alt="Order Number Mobile Tips"
							fill
							className="object-contain"
						/>
					</div>
				) : (
					<div className="relative bg-muted w-[36rem] h-[8rem]">
						<Image
							src="/imgs/order-number-website-tip.png"
							alt="Order Number Website Tips"
							fill
							className="object-contain"
						/>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

function UsernameDialogTip() {
	const isMobile = useIsMobile();
	const tab = isMobile ? "aplikasi" : "website";

	return (
		<Dialog>
			<DialogTrigger asChild>
				<InfoIcon className="text-[#2854AD] size-4" />
			</DialogTrigger>
			<DialogContent
				showCloseButton={false}
				className={cn(
					tab === "website" && "sm:max-w-[39rem]",
					tab === "aplikasi" && "sm:max-w-[27rem]",
				)}
			>
				<DialogHeader className="text-left">
					<DialogClose asChild>
						<ArrowLeftIcon className="absolute top-6 left-4 size-6 text-[#292D32]" />
					</DialogClose>
					<DialogTitle className="text-center text-base font-bold text-[#1D2939]">
						Cara cek username kamu
					</DialogTitle>
					<ul className="list-disc pl-4 text-[#737373] text-sm">
						<li>Masuk dulu ke halaman profil.</li>
						<li>
							Terus scroll ke bawah sampai ketemu bagian "Informasi Akun".
						</li>
						<li>
							Nah, di situ kamu bisa lihat detailnya, termasuk username kamu.
						</li>
					</ul>
				</DialogHeader>
				{isMobile ? (
					<div className="relative bg-muted w-full h-[14rem]">
						<Image
							src="/imgs/username-mobile-tip.png"
							alt="Username Mobile Tips"
							fill
							className="object-contain"
						/>
					</div>
				) : (
					<div className="relative bg-muted w-[36rem] h-[8rem]">
						<Image
							src="/imgs/username-website-tip.png"
							alt="Username Website Tips"
							fill
							className="object-contain"
						/>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
