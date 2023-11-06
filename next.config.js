/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreBuildErrors: true,
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Add file-loader for .wav files
    config.module.rules.push({
      test: /\.(ogg|mp3|wav|mpe?g)$/i,
      use: [
        {
          loader: 'file-loader',
          options: {
            publicPath: '/_next/static/sounds/', // Specify the public path where the files will be served from
            outputPath: 'static/sounds/', // Specify the output path in the build directory
            name: '[name].[ext]', // Preserve the original file name and extension
          },
        },
      ],
    });

    return config;
  },
};

module.exports = nextConfig;
