const path = require('path');
// const ExtractTextPlugin = require('extract-text-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	mode: 'development',
	// config root of source file
	context: path.resolve(__dirname, 'src'),
	entry: {
		install: './install.js',
		sw: './service-worker.js',
		app: './index.js'
	},
	devServer: {
		// for webpack-dev-server root
        contentBase: path.join(__dirname, 'dist'),
	},
	module: {
		// loader to entry js
		rules: [
			{
				test: /\.(html)$/,
				use: [
					'file-loader?name=[name].[ext]',
					'extract-loader',
					{
						loader: 'html-loader', // let webpack understand html file
						options: {
							attrs: [':data-src'],
							minimize: false,
							removeComments: false,
							collapseWhitespace: false
						}
					}
				]
			},
			{
				test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
				use: [
				  {
					loader: 'file-loader',
					options: {
						name: '[name].[ext]',
						outputPath: 'fonts/'
					}
				  }
				]
			},
			{
				test: /\.(scss|sass)$/,
				use: [
					MiniCssExtractPlugin.loader, // use plugin loader
					// 'style-loader', // css style goes into <style> tag
					'css-loader', // let webpack understand css file
					'sass-loader', // transfer sass/scss to css
				]
			},
			// {
            //     test: /\.(scss|sass)$/,
            //     use: [
            //         'style-loader',
            //         'css-loader',
            //         'sass-loader'
            //     ]
			// },
		]
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: '[name].css',
			// chunkFilename: '[id]_[hash].css'
		})
	],
	output: {
		/*
		 * for output ./dist/app.js
		 */
		path: path.resolve('./dist/pwa-calculator'),
		filename: '[name].js'
	}	
}
