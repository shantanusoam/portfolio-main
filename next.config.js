/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      "*.wgsl": {
        loaders: ["@vgpu/wgsl/loader-webpack"],
        as: "*.js",
      },
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Next 13 expects ignoreDuringBuilds (ignoreBuildErrors is invalid here).
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.wgsl$/i,
      use: ["@vgpu/wgsl/loader-webpack"],
    });

    // Add file-loader for .wav files
    config.module.rules.push({
      test: /\.(ogg|mp3|wav|mpe?g)$/i,
      use: [
        {
          loader: "file-loader",
          options: {
            publicPath: "/_next/static/sounds/", // Specify the public path where the files will be served from
            outputPath: "static/sounds/", // Specify the output path in the build directory
            name: "[name].[ext]", // Preserve the original file name and extension
          },
        },
      ],
    });

    return config;
  },
};

module.exports = nextConfig;
