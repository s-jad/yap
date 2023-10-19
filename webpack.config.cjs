const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
//
// const fs = require('fs');
// const CopyWebpackPlugin = require('copy-webpack-plugin');

// Before the module.exports statement
// const createDistDirectory = () => {
//   const distAssetsPath = path.resolve(__dirname, 'dist/assets');
//   if (!fs.existsSync(distAssetsPath)) {
//     fs.mkdirSync(distAssetsPath, { recursive: true });
//   }
// };

// createDistDirectory();

module.exports = {
  mode: 'development',
  entry: {
    index: './src/frontend/index.js',
  },
  plugins: [
    new webpack.DefinePlugin({
        'process.env.SERVER_URL': JSON.stringify(process.env.SERVER_URL),
    }),
    new HtmlWebpackPlugin({
      title: 'Yapp',
    }),
  ],
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
    historyApiFallback: true,
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        reportUserForm: {
          test: /[\\/]report-user-form[\\/]/,
          name: 'report-user-form',
          chunks: 'all',
          priority: 10,
          enforce: true,
        },
        joinTribe: {
          test: /[\\/]join-a-tribe[\\/]/,
          name: 'join-a-tribe',
          chunks: 'all',
          priority: 10,
          enforce: true,
        },
        createTribe: {
          test: /[\\/]create-a-tribe[\\/]/,
          name: 'create-a-tribe',
          chunks: 'all',
          priority: 10,
          enforce: true,
        },
        inbox: {
          test: /[\\/]inbox[\\/]/,
          name: 'inbox',
          chunks: 'all',
          priority: 10,
          enforce: true,
        },
        tribeChat: {
          test: /[\\/]get-tribe-chatroom[\\/]/,
          name: 'get-tribe-chatroom',
          chunks: 'all',
          priority: 10,
          enforce: true,
        },
      },
    },
  runtimeChunk: 'single',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: 'auto',
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
        generator: {
          filename: '[name][ext]',
          publicPath: 'assets/fonts/',
          outputPath: 'assets/fonts/',
        },
      },
    ],
  },
};
