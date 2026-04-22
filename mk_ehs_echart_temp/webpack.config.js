const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { execSync } = require('child_process');

// 自定义插件：在构建完成后创建tar.gz文件
class CreateTarGzPlugin {
  constructor(options = {}) {
    this.options = {
      filename: 'mk_ehs_echart_temp.tar.gz',
      ...options
    };
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('CreateTarGzPlugin', (compilation, callback) => {
      try {
        const distPath = path.resolve(__dirname, 'dist');
        const tarPath = path.resolve(__dirname, this.options.filename);
        
        // 使用tar命令创建压缩包
        execSync(`cd ${distPath} && tar -czf ${tarPath} .`, { stdio: 'inherit' });
        
        console.log(`✅ 成功创建压缩包: ${this.options.filename}`);
        callback();
      } catch (error) {
        console.error('❌ 创建压缩包失败:', error.message);
        callback(error);
      }
    });
  }
}

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
    publicPath: '/ekp_mkpass/mk_ehs_echart_temp/',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.tsx', '.ts', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/, // 添加对 TypeScript 的支持
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript' // 添加 TypeScript preset
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),
    new CreateTarGzPlugin({
      filename: 'mk_ehs_echart_temp.tar.gz',
    }),
  ],
  devServer: {
    static: './dist',
    port: 3000,
    open: true,
    hot: true,
    historyApiFallback: true, // 添加对前端路由的支持
  },
};