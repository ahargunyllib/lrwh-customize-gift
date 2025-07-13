import { Input } from "@/shared/components/ui/input";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { useUrlParamUpdate } from "@/shared/hooks/use-url-param-update";
import { useEffect, useState } from "react";

export default function SearchFilter() {
	type TSearchFilter = string | null;

	const { updateSearchParam } = useUrlParamUpdate();
	const [searchTerm, setSearchTerm] = useState<TSearchFilter>(null);
	const debouncedSearchTerm = useDebounce<TSearchFilter>(searchTerm, 500);
	function handleSearchChange(value: TSearchFilter) {
		updateSearchParam("search", value);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: ignoring this because the effect is only dependent on the debounced search term
	useEffect(() => {
		handleSearchChange(debouncedSearchTerm);
	}, [debouncedSearchTerm]);

	return (
		<Input
			placeholder="Search"
			onChange={(e) => setSearchTerm(e.target.value)}
			className="max-w-sm"
		/>
	);
}
