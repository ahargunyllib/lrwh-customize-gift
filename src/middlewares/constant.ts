export const PROTECTED_ROUTES = [
	{
		path: /^\/dashboard/,
		roles: ["admin", "superadmin"],
	},
	{
		path: /^\/editor\/[^\/]+\/edit$/, // matches /editor/:id/edit
		roles: ["editor"],
	},
	{
		path: /^\/editor\/create$/, // matches /editor/create
	},
	{
		path: /^\/design-system/,
	},
];

export const DEV_ONLY_ROUTES = ["/design-system"];

export const ROUTE_REDIRECTS = {
	"/": "/templates/onboarding",
	"/dashboard": "/dashboard/profile",
} as const;
