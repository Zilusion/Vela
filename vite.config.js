import { defineConfig } from 'vite';
import pugPlugin from 'vite-plugin-pug';
import ViteSvgSpritePlugin from './plugins/vite-svg-sprite';
import { resolve } from 'path';

const options = { pretty: true };
const locals = { name: 'My Pug' };

export default {
	base: './',
	plugins: [
		ViteSvgSpritePlugin({
			iconsDir: resolve(__dirname, 'public/assets/icons'),
			outputSpriteMono: resolve(__dirname, 'public/icon-sprite-symbol.svg'),
			outputSpriteColor: resolve(
				__dirname,
				'public/icon-sprite-stack.svg'
			),
		}),
		pugPlugin(options, locals),
	],
};
