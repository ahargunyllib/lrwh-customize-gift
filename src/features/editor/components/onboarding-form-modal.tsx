"use client";

import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { useState } from "react";
import { useOnboardingForm } from "../hooks/use-onboarding-form";

type Props = {
	defaultOpen: boolean;
};

export default function OnboardingFormModal({ defaultOpen }: Props) {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const form = useOnboardingForm({
		closeDialog: () => setIsOpen(false),
	});

	return (
		<Dialog open={isOpen}>
			<DialogContent
				showCloseButton={false}
				overlayClassName="backdrop-blur-xs"
			>
				<DialogHeader>
					<DialogTitle>Welcome to LRWH Customize Gift Card Editor!</DialogTitle>
					<DialogDescription>
						Please input your order number and username to start choosing a
						template.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.onSubmitHandler} className="space-y-4">
						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Username</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="text"
											placeholder="Enter your username"
											className="w-full"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="orderNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Order Number</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="text"
											placeholder="Enter your order number"
											className="w-full"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end">
							<Button type="submit" disabled={form.isLoading}>
								{form.isLoading ? "Verifying..." : "Verify Order"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
