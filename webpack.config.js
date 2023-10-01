const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Before the module.exports statement
const createDistDirectory = () => {
  const distAssetsPath = path.resolve(__dirname, 'dist/assets');
  if (!fs.existsSync(distAssetsPath)) {
    fs.mkdirSync(distAssetsPath, { recursive: true });
  }
};

createDistDirectory();

module.exports = {
  mode: 'development',
  entry: {
    index: './src/frontend/index.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Dashboard',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/frontend/assets/imgs', to: 'imgs' },
        { from: 'src/frontend/assets/fonts', to: 'fonts' },
      ],
    }),
  ],
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
  },
  optimization: {
    runtimeChunk: 'single',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]',
          publicPath: 'assets/imgs/',
          outputPath: 'assets/imgs/',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },
};
