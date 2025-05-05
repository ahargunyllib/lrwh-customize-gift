/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placecats.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
