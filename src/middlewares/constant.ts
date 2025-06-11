export const PROTECTED_ROUTES = [
	{
		path: /^\/dashboard/,
		roles: ["admin", "user"],
	},
	{
		path: /^\/editor\/[^\/]+\/edit$/, // matches /editor/:id/edit
		roles: ["editor"],
	},
	{
		path: /^\/design-system/,
	},
];

export const DEV_ONLY_ROUTES = ["/design-system"];

export const ROUTE_REDIRECTS = {
	"/dashboard": "/dashboard/profile",
} as const;
