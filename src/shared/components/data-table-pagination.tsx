import { Button } from "@/shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { usePagination } from "@/shared/hooks/use-pagination";
import { cn } from "@/shared/lib/utils";
import {
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-react";

type Props = {
	currentPage: number;
	totalPages: number;
	limit: number;
	paginationItemsToDisplay?: number;
};

export default function DataTablePagination({
	currentPage,
	totalPages,
	limit,
	paginationItemsToDisplay = 5,
}: Props) {
	const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
		currentPage,
		totalPages,
		paginationItemsToDisplay,
	});

	return (
		<div className="flex flex-row items-center justify-between">
			<div className="flex flex-row items-center gap-6">
				<Button
					disabled={currentPage === 1}
					variant="ghost"
					onClick={() => {
						if (currentPage > 1) {
							const url = new URL(window.location.href);
							url.searchParams.set("page", String(currentPage - 1));
							window.location.href = url.toString();
						}
					}}
				>
					<ChevronLeftIcon className="size-4" />
				</Button>
				<div className="flex flex-row items-center gap-2">
					{showLeftEllipsis && <Button variant="ghost">...</Button>}
					{pages.map((page) => (
						<Button
							key={page}
							variant="ghost"
							className={cn(
								"text-sm font-medium",
								currentPage === page
									? "text-foreground"
									: "text-muted-foreground",
							)}
							onClick={() => {
								const url = new URL(window.location.href);
								url.searchParams.set("page", String(page));
								window.location.href = url.toString();
							}}
						>
							{page}
						</Button>
					))}
					{showRightEllipsis && <Button variant="ghost">...</Button>}
				</div>
				<Button
					disabled={currentPage === totalPages}
					variant="ghost"
					onClick={() => {
						if (currentPage < totalPages) {
							const url = new URL(window.location.href);
							url.searchParams.set("page", String(currentPage + 1));
							window.location.href = url.toString();
						}
					}}
				>
					<ChevronRightIcon className="size-4" />
				</Button>
			</div>

			<div className="flex flex-row items-center gap-2">
				<div className="text-sm text-[#667085]">Rows per page:</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline">
							<ChevronDownIcon className="size-4" />
							{limit}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{[10, 20, 50, 100].map((limit) => (
							<DropdownMenuItem
								key={limit}
								onClick={() => {
									const url = new URL(window.location.href);
									url.searchParams.set("limit", String(limit));
									url.searchParams.set("page", "1");
									window.location.href = url.toString();
								}}
								className="cursor-pointer"
							>
								{limit}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
