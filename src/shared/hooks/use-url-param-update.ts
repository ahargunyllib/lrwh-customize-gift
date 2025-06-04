import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useUrlParamUpdate() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	function updateSearchParam(paramName: string, value: string | null) {
		const params = new URLSearchParams(searchParams.toString());

		if (value) {
			params.set(paramName, value);
		} else {
			params.delete(paramName);
		}

		const url = new URL(pathname, window.location.origin);
		url.search = params.toString();
		router.push(url.toString());
	}

	return { updateSearchParam };
}
