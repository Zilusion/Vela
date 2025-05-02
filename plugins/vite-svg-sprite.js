// // import fs from 'fs';
// // import path from 'path';
// // import { promisify } from 'util';
// // import SVGSpriter from 'svg-sprite';

// // const readFileAsync = promisify(fs.readFile);
// // const writeFileAsync = promisify(fs.writeFile);

// // export default function ViteSvgSpritePlugin(options = {}) {
// // 	const iconsDir =
// // 		options.iconsDir || path.resolve(process.cwd(), 'public', 'icons');
// // 	const outputSprite =
// // 		options.outputSprite ||
// // 		path.resolve(process.cwd(), 'public', 'icon-sprite.svg');

// // 	const config = {
// // 		dest: '.',
// // 		mode: {
// // 			symbol: {
// // 				inline: true,
// // 				sprite: 'icon-sprite.svg',
// // 			},
// // 		},
// // 	};

// // 	const plugin = {
// // 		name: 'vite-svg-sprite',
// // 		async buildStart() {
// // 			const spriter = new SVGSpriter(config);
// // 			try {
// // 				const files = await fs.promises.readdir(iconsDir);
// // 				for (const file of files) {
// // 					if (file.endsWith('.svg')) {
// // 						const filePath = path.join(iconsDir, file);
// // 						const content = await readFileAsync(filePath, 'utf8');
// // 						spriter.add(filePath, file, content);
// // 					}
// // 				}
// // 				const compileAsync = promisify(spriter.compile.bind(spriter));
// // 				const result = await compileAsync();
// // 				const spriteContent = result.symbol.sprite.contents;
// // 				await writeFileAsync(outputSprite, spriteContent);
// // 				console.log('SVG sprite generated at:', outputSprite);
// // 			} catch (error) {
// // 				console.error('Error generating SVG sprite:', error);
// // 			}
// // 		},
// // 		configureServer(server) {
// // 			server.watcher.add(iconsDir);
// // 			server.watcher.on('all', async (event, changedPath) => {
// // 				if (!changedPath.endsWith('.svg')) return;
// // 				if (path.resolve(changedPath) === path.resolve(outputSprite))
// // 					return;
// // 				if (['add', 'change', 'unlink'].includes(event)) {
// // 					console.log(
// // 						`SVG file ${event}: ${changedPath}. Regenerating sprite...`,
// // 					);
// // 					await plugin.buildStart();
// // 				}
// // 			});
// // 		},
// // 	};

// // 	return plugin;
// // }
// import fs from 'fs';
// import path from 'path';
// import { promisify } from 'util';
// import SVGSpriter from 'svg-sprite';

// const readFileAsync = promisify(fs.readFile);
// const writeFileAsync = promisify(fs.writeFile);
// // Убедимся, что директории создаются рекурсивно, если их нет
// const ensureDirExists = async (filePath) => {
// 	const dirname = path.dirname(filePath);
// 	try {
// 		await fs.promises.access(dirname);
// 	} catch (error) {
// 		// Директория не существует, создаем ее
// 		if (error.code === 'ENOENT') {
// 			await fs.promises.mkdir(dirname, { recursive: true });
// 		} else {
// 			throw error; // Другая ошибка доступа
// 		}
// 	}
// };

// export default function ViteSvgSpritePlugin(options = {}) {
// 	const iconsDir =
// 		options.iconsDir || path.resolve(process.cwd(), 'public', 'icons'); // Пример пути, измените на свой
// 	const outputSprite =
// 		options.outputSprite ||
// 		path.resolve(process.cwd(), 'public', 'icon-sprite.svg'); // Пример пути, измените на свой

// 	// Конфигурация для svg-sprite
// 	const config = {
// 		// dest: '.', // Не указываем здесь, т.к. пишем файл напрямую
// 		log: 'info', // Можно установить 'verbose' для отладки
// 		shape: {
// 			transform: [
// 				{
// 					// Используем svgo для оптимизации
// 					svgo: {
// 						// Передаем конфигурацию для svgo
// 						plugins: [
// 							// Используем пресет по умолчанию, он включает много полезных оптимизаций
// 							{
// 								name: 'preset-default',
// 								params: {
// 									overrides: {
// 										// Важно: не удаляем viewBox, он нужен для <symbol>
// 										removeViewBox: false,
// 										// Можно отключить другие плагины по умолчанию если нужно
// 										// cleanupIDs: false,
// 									},
// 								},
// 							},
// 							// Добавляем плагин для удаления конкретных атрибутов
// 							{
// 								name: 'removeAttrs',
// 								params: {
// 									attrs: [
// 										'fill',
// 										'stroke',
// 										'fill-rule', // Часто тоже можно убрать для стилизации CSS
// 										'clip-rule', // Иногда тоже можно убрать
// 										'fill-opacity'
// 										// 'class' // Можно и классы убирать, если не нужны
// 									],
// 								},
// 							},
// 							// Дополнительные полезные плагины (некоторые могут быть в preset-default)
// 							'cleanupListOfValues',
// 							'sortAttrs', // Сортирует атрибуты для лучшего сжатия gzip
// 						],
// 						// multipass: true, // Можно включить для лучшей оптимизации, но дольше работает
// 					},
// 				},
// 			],
// 			// Можно добавить другие опции shape при необходимости
// 			// id: { separator: '--' },
// 			// dimension: { attributes: false }, // Не добавлять width/height на сами <symbol> - это делает svg.dimensionAttributes
// 			// spacing: { padding: 0 }
// 		},
// 		svg: {
// 			// Опции для корневого SVG спрайта
// 			xmlDeclaration: false, // Обычно не нужно для инлайн спрайтов
// 			doctypeDeclaration: false, // Обычно не нужно для инлайн спрайтов
// 			namespaceIDs: false, // Упрощает ID, если не боитесь конфликтов
// 			dimensionAttributes: false, // Не добавлять width/height на корневой <svg> спрайта
// 		},
// 		mode: {
// 			// Режим symbol - самый популярный для современных спрайтов
// 			symbol: {
// 				// dest: '.', // Не нужно, т.к. outputSprite указан явно
// 				sprite: path.basename(outputSprite), // Имя файла спрайта
// 				inline: true, // Оптимизирует для инлайна (удаляет лишнее)
// 				// example: true // Можно сгенерировать HTML пример использования
// 			},
// 			// Можно добавить другие режимы (css, defs, stack, view) если нужно
// 		},
// 	};

// 	const plugin = {
// 		name: 'vite-svg-sprite',
// 		// Используем buildStart для генерации при старте сборки
// 		async buildStart() {
// 			// Создаем новый экземпляр спрайтера КАЖДЫЙ раз при пересборке
// 			// Это важно, т.к. spriter хранит состояние
// 			const spriter = new SVGSpriter(config);
// 			console.log(
// 				`[vite-svg-sprite] Starting sprite generation from: ${iconsDir}`
// 			);

// 			try {
// 				const files = await fs.promises.readdir(iconsDir);
// 				let count = 0;
// 				for (const file of files) {
// 					if (file.endsWith('.svg')) {
// 						const filePath = path.join(iconsDir, file);
// 						const content = await readFileAsync(filePath, 'utf8');
// 						// Добавляем файл в спрайтер.
// 						// Третий аргумент (name) необязателен, spriter возьмет имя из filePath.
// 						// Четвертый - сам контент SVG.
// 						spriter.add(filePath, null, content);
// 						count++;
// 					}
// 				}

// 				if (count === 0) {
// 					console.log(
// 						`[vite-svg-sprite] No SVG files found in ${iconsDir}`
// 					);
// 					return;
// 				}

// 				// Компилируем спрайт асинхронно
// 				const { result } = await spriter.compileAsync();

// 				// Получаем контент для режима symbol
// 				const spriteContent = result.symbol.sprite.contents;

// 				// Убеждаемся, что директория для спрайта существует
// 				await ensureDirExists(outputSprite);

// 				// Записываем спрайт в файл
// 				await writeFileAsync(outputSprite, spriteContent);
// 				console.log(
// 					`[vite-svg-sprite] SVG sprite generated successfully at: ${outputSprite} (${count} icons)`
// 				);
// 			} catch (error) {
// 				console.error(
// 					'[vite-svg-sprite] Error generating SVG sprite:',
// 					error
// 				);
// 				// В режиме разработки можно вывести более подробную ошибку
// 				if (process.env.NODE_ENV === 'development') {
// 					console.error(error.stack);
// 				}
// 			}
// 		},
// 		// Обработка изменений в dev режиме
// 		configureServer(server) {
// 			// Добавляем директорию с иконками в наблюдение Vite
// 			server.watcher.add(iconsDir);

// 			// Функция для перегенерации спрайта с дебаунсингом
// 			let debounceTimer;
// 			const regenerateSprite = async (event, changedPath) => {
// 				// Игнорируем сам файл спрайта
// 				if (path.resolve(changedPath) === path.resolve(outputSprite))
// 					return;
// 				// Обрабатываем только SVG файлы
// 				if (!changedPath.endsWith('.svg') && event !== 'unlink') return;
// 				// Игнорируем файлы не из нашей директории (на всякий случай)
// 				if (!changedPath.startsWith(path.resolve(iconsDir))) return;

// 				console.log(
// 					`[vite-svg-sprite] SVG file ${event}: ${path.relative(
// 						process.cwd(),
// 						changedPath
// 					)}. Debouncing sprite regeneration...`
// 				);

// 				clearTimeout(debounceTimer);
// 				debounceTimer = setTimeout(async () => {
// 					console.log('[vite-svg-sprite] Regenerating sprite...');
// 					try {
// 						// Вызываем buildStart для перегенерации
// 						await plugin.buildStart();
// 						// Опционально: Перезагрузить страницу или HMR, если настроено
// 						// server.ws.send({ type: 'full-reload', path: '*' });
// 					} catch (error) {
// 						console.error(
// 							'[vite-svg-sprite] Error regenerating sprite:',
// 							error
// 						);
// 					}
// 				}, 300); // Задержка в 300 мс для предотвращения множественных запусков
// 			};

// 			// Слушаем события добавления, изменения и удаления файлов
// 			server.watcher.on('add', (changedPath) =>
// 				regenerateSprite('added', changedPath)
// 			);
// 			server.watcher.on('change', (changedPath) =>
// 				regenerateSprite('changed', changedPath)
// 			);
// 			server.watcher.on('unlink', (changedPath) =>
// 				regenerateSprite('deleted', changedPath)
// 			);

// 			// Первичная генерация при запуске сервера разработки
// 			plugin
// 				.buildStart()
// 				.catch((err) =>
// 					console.error(
// 						'[vite-svg-sprite] Initial generation failed:',
// 						err
// 					)
// 				);
// 		},
// 	};

// 	return plugin;
// }
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import SVGSpriter from 'svg-sprite';
// lodash/cloneDeep может понадобиться для чистого копирования конфига,
// но здесь попробуем обойтись простым созданием двух конфигов.
// import cloneDeep from 'lodash.clonedeep'; // Если понадобится: npm i --save-dev lodash.clonedeep

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const ensureDirExists = async (filePath) => {
	const dirname = path.dirname(filePath);
	try {
		await fs.promises.access(dirname);
	} catch (error) {
		if (error.code === 'ENOENT') {
			await fs.promises.mkdir(dirname, { recursive: true });
		} else {
			throw error;
		}
	}
};

// --- Конфигурации SVGO ---
const svgoBasePlugins = [
	{
		name: 'preset-default',
		params: {
			overrides: {
				removeViewBox: false, // Очень важно для <symbol>
				// removeUnknownsAndDefaults: { // Оставляем этот плагин включенным по умолчанию в preset-default
				//     keepDataAttrs: false, // Можно убрать data-* атрибуты, если не нужны
				// },
				// removeUselessStrokeAndFill: { // Этот плагин из preset-default может мешать цветной версии, если fill="none" указан явно. Возможно, его нужно отключить для цветной версии.
				//     removeNone: true,
				// }
			},
		},
	},
	'cleanupListOfValues',
	'sortAttrs',
];

const svgoMonoTransform = {
	svgo: {
		plugins: [
			...svgoBasePlugins,
			// Плагин для удаления атрибутов цвета
			{
				name: 'removeAttrs',
				params: {
					attrs: [
						'(fill|stroke|fill-opacity|stroke-opacity|fill-rule|clip-rule|color|stop-color|flood-color|lighting-color)', // Удаляем все атрибуты, связанные с цветом
						// 'style', // Можно и style убирать, если там только цвета
					],
				},
			},
		],
		// multipass: true, // Можно включить для mono
	},
};

const svgoColorTransform = {
	svgo: {
		plugins: [
			// Возможно, потребуется кастомизировать preset-default, чтобы он НЕ удалял fill="none" или другие нужные атрибуты
			{
				name: 'preset-default',
				params: {
					overrides: {
						removeViewBox: false,
						// Отключаем плагин, который может удалить невидимые элементы, если они важны для цветной версии
						// removeUselessStrokeAndFill: false,
						// removeHiddenElems: false, // Иногда скрытые элементы могут быть нужны
					},
				},
			},
			'cleanupListOfValues', // Эти можно оставить
			'sortAttrs',
		],
		// multipass: true, // Можно включить и для цветной
	},
};
// --- Конец конфигураций SVGO ---

export default function ViteSvgSpritePlugin(options = {}) {
	const iconsDir =
		options.iconsDir || path.resolve(process.cwd(), 'public', 'icons');
	// Новые опции для имен файлов
	const outputSpriteMono =
		options.outputSpriteMono ||
		path.resolve(process.cwd(), 'public', 'icon-sprite-mono.svg');
	const outputSpriteColor =
		options.outputSpriteColor ||
		path.resolve(process.cwd(), 'public', 'icon-sprite-color.svg');

	// Базовая конфигурация SVGSpriter (общая для обоих)
	const baseConfig = {
		log: 'info',
		svg: {
			xmlDeclaration: false,
			doctypeDeclaration: false,
			namespaceIDs: false,
			dimensionAttributes: false,
		},
		mode: {
			symbol: {
				inline: true,
				// Имя файла спрайта будет разным для каждого вызова
				// sprite: 'placeholder.svg' // Будет перезаписано ниже
			},
		},
		// shape опции будут разными
	};

	// --- Конфигурации для каждого типа спрайта ---
	const configMono = {
		...baseConfig,
		shape: {
			transform: [svgoMonoTransform], // Применяем трансформацию для монохрома
		},
		mode: {
			// Указываем имя файла для монохромного спрайта
			symbol: {
				...baseConfig.mode.symbol,
				sprite: path.basename(outputSpriteMono),
			},
		},
	};

	const configColor = {
		...baseConfig,
		shape: {
			transform: [svgoColorTransform], // Применяем трансформацию (или её отсутствие) для цветного
		},
		mode: {
			// Указываем имя файла для цветного спрайта
			symbol: {
				...baseConfig.mode.symbol,
				sprite: path.basename(outputSpriteColor),
			},
		},
	};
	// --- Конец конфигураций ---

	const plugin = {
		name: 'vite-svg-sprite',
		async buildStart() {
			console.log(
				`[vite-svg-sprite] Starting sprite generation from: ${iconsDir}`
			);

			let filesData = []; // Хранилище для прочитанных файлов
			let iconCount = 0;

			try {
				const files = await fs.promises.readdir(iconsDir);
				for (const file of files) {
					if (file.endsWith('.svg')) {
						const filePath = path.join(iconsDir, file);
						const content = await readFileAsync(filePath, 'utf8');
						filesData.push({
							path: filePath,
							name: file,
							content: content,
						});
						iconCount++;
					}
				}

				if (iconCount === 0) {
					console.log(
						`[vite-svg-sprite] No SVG files found in ${iconsDir}`
					);
					return;
				}
				console.log(`[vite-svg-sprite] Found ${iconCount} icons.`);
			} catch (error) {
				console.error(
					'[vite-svg-sprite] Error reading icon directory:',
					error
				);
				return; // Прерываем, если не можем прочитать файлы
			}

			// --- Функция для компиляции и записи спрайта ---
			const compileAndWriteSprite = async (
				spriterConfig,
				outputPath,
				type
			) => {
				console.log(`[vite-svg-sprite] Compiling ${type} sprite...`);
				const spriter = new SVGSpriter(spriterConfig);

				// Добавляем все файлы в текущий спрайтер
				filesData.forEach((file) => {
					spriter.add(file.path, file.name, file.content);
				});

				try {
					const { result } = await spriter.compileAsync();
					const spriteContent = result.symbol.sprite.contents;

					await ensureDirExists(outputPath);
					await writeFileAsync(outputPath, spriteContent);
					console.log(
						`[vite-svg-sprite] ${type} sprite generated successfully at: ${outputPath}`
					);
				} catch (compileError) {
					console.error(
						`[vite-svg-sprite] Error generating ${type} sprite:`,
						compileError
					);
					if (process.env.NODE_ENV === 'development') {
						console.error(compileError.stack);
					}
				}
			};
			// --- Конец функции ---

			// Запускаем генерацию для обоих типов спрайтов
			await Promise.all([
				compileAndWriteSprite(
					configMono,
					outputSpriteMono,
					'Monochrome'
				),
				compileAndWriteSprite(configColor, outputSpriteColor, 'Color'),
			]);
		},

		configureServer(server) {
			server.watcher.add(iconsDir);
			let debounceTimer;

			// --- Модифицированный обработчик изменений ---
			const regenerateSprites = async (event, changedPath) => {
				// Игнорируем ОБА файла спрайта
				const resolvedChangedPath = path.resolve(changedPath);
				if (
					resolvedChangedPath === path.resolve(outputSpriteMono) ||
					resolvedChangedPath === path.resolve(outputSpriteColor)
				) {
					return;
				}
				if (!changedPath.endsWith('.svg') && event !== 'unlink') return;
				if (!changedPath.startsWith(path.resolve(iconsDir))) return;

				console.log(
					`[vite-svg-sprite] SVG file ${event}: ${path.relative(
						process.cwd(),
						changedPath
					)}. Debouncing sprites regeneration...`
				);

				clearTimeout(debounceTimer);
				debounceTimer = setTimeout(async () => {
					console.log('[vite-svg-sprite] Regenerating sprites...');
					try {
						// Просто перезапускаем buildStart, он сгенерирует оба спрайта
						await plugin.buildStart();
						// Можно уведомить о перезагрузке, если нужно
						server.ws.send({ type: 'full-reload', path: '*' });
					} catch (error) {
						console.error(
							'[vite-svg-sprite] Error regenerating sprites:',
							error
						);
					}
				}, 300);
			};
			// --- Конец обработчика ---

			server.watcher.on('add', (changedPath) =>
				regenerateSprites('added', changedPath)
			);
			server.watcher.on('change', (changedPath) =>
				regenerateSprites('changed', changedPath)
			);
			server.watcher.on('unlink', (changedPath) =>
				regenerateSprites('deleted', changedPath)
			);

			plugin
				.buildStart()
				.catch((err) =>
					console.error(
						'[vite-svg-sprite] Initial generation failed:',
						err
					)
				);
		},
	};

	return plugin;
}