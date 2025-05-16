"use client";
import { Button } from "@/shared/components/ui/button";
import {
	AlignCenter,
	AlignHorizontalJustifyCenter,
	AlignVerticalJustifyCenter,
} from "lucide-react";

interface ElementControlsProps {
	onCenterX: () => void;
	onCenterY: () => void;
	onCenterBoth: () => void;
}

export default function ElementControls({
	onCenterX,
	onCenterY,
	onCenterBoth,
}: ElementControlsProps) {
	return (
		<div className="flex items-center gap-2 mt-2">
			<Button
				variant="outline"
				size="sm"
				onClick={onCenterX}
				title="Center horizontally"
			>
				<AlignHorizontalJustifyCenter className="h-4 w-4" />
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={onCenterY}
				title="Center vertically"
			>
				<AlignVerticalJustifyCenter className="h-4 w-4" />
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={onCenterBoth}
				title="Center both"
			>
				<AlignCenter className="h-4 w-4" />
			</Button>
		</div>
	);
}
