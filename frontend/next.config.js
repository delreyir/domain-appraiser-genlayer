/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_CONTRACT_ADDRESS: "0x8cdD6aB8A60F5f3096bD275bA7E33917A52d88A9" },
};
module.exports = nextConfig;
