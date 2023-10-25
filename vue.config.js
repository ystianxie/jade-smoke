const { defineConfig } = require('@vue/cli-service')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

module.exports = defineConfig({
  pages: {
    index: {
      entry: 'src/main.js', // 入口文件
      title: '瑶烟'
    }
  },
  transpileDependencies: true,
  configureWebpack: {
    plugins: [
      new NodePolyfillPlugin(),
      require('unplugin-element-plus/webpack')({
        // options
      }),
    ],
  },
  publicPath: "./",
  devServer: {
    historyApiFallback: true,
  },
})
