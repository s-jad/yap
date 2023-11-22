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
    login: './src/frontend/login.js',
    main: './src/frontend/main.js'
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
        'process.env.SERVER_URL': JSON.stringify(process.env.SERVER_URL),
    }),
    new HtmlWebpackPlugin({
      title: 'Welcome to Yapp',
      template: './src/frontend/login.html',
      filename: 'login.html',
      chunks: ['login'],
    }),
    new HtmlWebpackPlugin({
      title: 'Yapp',
      template: './src/frontend/main.html',
      filename: 'main.html',
      chunks: ['main'],
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
        friends: {
          test: /[\\/]friends[\\/]/,
          name: 'friends',
          chunks: 'all',
          priority: 10,
          enforce: true,
        },
        notifications: {
          test: /[\\/]notifications[\\/]/,
          name: 'notifications',
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
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer"),
      "url": require.resolve("url"),
      "util": require.resolve("util")
    }
  },
};
