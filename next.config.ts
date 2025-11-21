/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack(config: { module: { rules: { test: RegExp; use: string[] }[] } }) {
		config.module.rules.push({
			test: /\.svg$/,
			use: ["@svgr/webpack"],
		});

		return config;
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "placecats.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "is3.cloudhost.id",
			},
		],
	},
  output: 'standalone',
};

export default nextConfig;
