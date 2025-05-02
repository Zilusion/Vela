import './styles/main.scss';

document.addEventListener('DOMContentLoaded', () => {
	// --- Константы и Настройки ---
	const MOBILE_BREAKPOINT = 768; // Пиксели
	const TRANSITION_DURATION = 300; // мс, должно совпадать с CSS transition

	// --- Переменные для кэширования DOM элементов ---
	const header = document.getElementById('main-header');
	const sentinel = document.getElementById('header-observer-sentinel');
	const menuContainer = document.getElementById('megaMenu');
	// Ожидаем ОДНУ кнопку для открытия/закрытия меню
	const menuToggleButton = document.querySelector(
		'.menu-toggle[aria-controls="megaMenu"]'
	); // Используем querySelector

	// Селекторы для элементов ВНУТРИ меню
	const panelSelector = '.mega-menu__panel';
	const rootPanelSelector = '.mega-menu__panel--root-categories'; // Панель с основными категориями (бывший root)
	const entryPanelSelector = '.mega-menu__panel--entry'; // Панель входа для мобильных
	const panelTriggerSelector = '.mega-menu__nav-link[data-opens-panel]';
	const backButtonSelector = '.mega-menu__back-button';
	const activeTriggerClass = 'is-active-trigger';
	const visiblePanelClass = 'is-visible';
	const slidingOutClass = 'is-sliding-out-left';
	const menuActiveClass = 'is-active'; // Класс для активного .mega-menu
	const buttonActiveClass = 'menu-toggle--active'; // Класс для активной кнопки меню
	const headerStuckClass = 'header--is-stuck'; // Класс для "залипшего" хедера

	// --- Проверка наличия основных элементов ---
	if (!header) {
		console.error('Header element (#main-header) not found.');
		return;
	}
	if (!menuContainer) {
		console.error('Mega menu container (#megaMenu) not found.');
		return;
	}
	if (!menuToggleButton) {
		console.warn(
			'Menu toggle button (.menu-toggle[aria-controls="megaMenu"]) not found.'
		);
		// Не прерываем выполнение, т.к. sticky header может работать независимо
	}
	if (!sentinel && header) {
		// Sentinel нужен только если есть header
		console.warn(
			'Header observer sentinel (#header-observer-sentinel) not found. Sticky behavior might not work correctly.'
		);
	}

	// --- Состояние Меню ---
	const hideDelay = parseInt(menuContainer?.dataset.hoverDelay || '200', 10);
	let leaveTimeout = null;
	const navigationStack = ['entry']; // Начинаем с 'entry' для мобильных

	// --- Переменные для динамической позиции меню ---
	let headerHeight = 0; // Будет обновляться

	// ==========================================================================
	// Функции Управления Меню (Открытие/Закрытие/Панели)
	// ==========================================================================

	/** Обновляет CSS переменную с высотой хедера и позицию меню */
	const updatePositions = () => {
		if (!header || !menuContainer) return;
		headerHeight = header.offsetHeight;
		// Устанавливаем CSS переменную для использования в SCSS/CSS, если нужно
		document.documentElement.style.setProperty(
			'--header-height',
			`${headerHeight}px`
		);
		// Устанавливаем top для абсолютно позиционированного десктопного меню
		// На мобильных position: fixed, top: 0 (из CSS), это не повлияет
		menuContainer.style.top = `${headerHeight}px`;
		console.log(`Header height updated: ${headerHeight}px`);
	};

	/** Сброс состояния мобильного меню к начальному 'entry' */
	const resetMobileMenuState = () => {
		navigationStack.length = 1;
		navigationStack[0] = 'entry';
		menuContainer.querySelectorAll(panelSelector).forEach((p) => {
			const isEntry = p.dataset.panelId === 'entry';
			p.classList.remove(visiblePanelClass, slidingOutClass);
			p.style.transform = '';
			p.hidden = !isEntry; // Видима только entry
			if (isEntry) {
				p.classList.add(visiblePanelClass); // Убедимся что у entry есть класс visible
			}
		});
		console.log('[Reset] Stack:', [...navigationStack]);
	};

	/** Скрывает все панели, кроме 'entry' и 'root-categories' */
	const hideNonCorePanels = () => {
		menuContainer
			.querySelectorAll(
				`${panelSelector}:not(${entryPanelSelector}):not(${rootPanelSelector}).${visiblePanelClass}`
			)
			.forEach((panel) => {
				panel.classList.remove(visiblePanelClass);
				panel.hidden = true;
				panel
					.querySelectorAll(`.${activeTriggerClass}`)
					.forEach((trigger) =>
						trigger.classList.remove(activeTriggerClass)
					);
			});
		// Убираем подсветку и с триггеров в панели категорий
		menuContainer
			.querySelectorAll(`${rootPanelSelector} .${activeTriggerClass}`)
			.forEach((trigger) => trigger.classList.remove(activeTriggerClass));
	};

	/** Показывает панель для Desktop Hover */
	const showPanelDesktop = (panelId) => {
		const targetPanel = menuContainer.querySelector(
			`${panelSelector}[data-panel-id="${panelId}"]`
		);
		if (!targetPanel || panelId === 'entry') return;

		const categoriesPanel = menuContainer.querySelector(rootPanelSelector);
		// Всегда показываем панель категорий на десктопе
		if (
			categoriesPanel &&
			!categoriesPanel.classList.contains(visiblePanelClass)
		) {
			categoriesPanel.hidden = false;
			categoriesPanel.classList.add(visiblePanelClass);
		}

		hideNonCorePanels(); // Скрываем другие sub-панели

		targetPanel.hidden = false;
		targetPanel.classList.add(visiblePanelClass);
	};

	/** Показывает панель для Mobile Click с анимацией */
	const showPanelMobile = (
		panelToShowId,
		isBack = false,
		panelToHideId = null
	) => {
		const currentVisiblePanelId = isBack
			? panelToHideId
			: navigationStack[navigationStack.length - 1];
		const currentPanel = currentVisiblePanelId
			? menuContainer.querySelector(
					`${panelSelector}[data-panel-id="${currentVisiblePanelId}"]`
			  )
			: null;
		const nextPanel = menuContainer.querySelector(
			`${panelSelector}[data-panel-id="${panelToShowId}"]`
		);

		if (!nextPanel || (currentPanel === nextPanel && !isBack)) return;

		console.log(
			`Mobile Nav: Show panel '${panelToShowId}' ${
				isBack ? '<-- Back From' : '--> From'
			} '${currentVisiblePanelId || 'Start'}'`
		);
		console.log(`Mobile Stack Before action:`, [...navigationStack]);

		nextPanel.hidden = false;
		nextPanel.classList.remove(slidingOutClass);
		nextPanel.style.transform = '';

		if (currentPanel && currentPanel !== nextPanel) {
			currentPanel.classList.remove(visiblePanelClass);
			currentPanel.style.transform = isBack
				? 'translateX(100%)'
				: 'translateX(-100%)'; // Класс is-sliding-out-left не нужен
			setTimeout(() => {
				currentPanel.style.transform = '';
				currentPanel.hidden = true;
			}, TRANSITION_DURATION);
		}

		nextPanel.style.transform = isBack
			? 'translateX(-100%)'
			: 'translateX(100%)';
		requestAnimationFrame(() => {
			nextPanel.classList.add(visiblePanelClass);
			requestAnimationFrame(() => {
				nextPanel.style.transform = 'translateX(0)';
			});
		});

		if (
			!isBack &&
			navigationStack[navigationStack.length - 1] !== panelToShowId
		) {
			navigationStack.push(panelToShowId);
		}
		console.log(`Mobile Stack After:`, [...navigationStack]);
	};

	/** Обработка кнопки "Назад" на мобильных */
	const goBackMobile = () => {
		console.log('Go Back Called. Stack Before Pop:', [...navigationStack]);
		if (navigationStack.length > 1) {
			const panelToHideId = navigationStack.pop();
			const previousPanelId = navigationStack[navigationStack.length - 1];
			console.log(
				`Going back to panel: '${previousPanelId}', Hiding panel: '${panelToHideId}'`
			);
			showPanelMobile(previousPanelId, true, panelToHideId);
		} else {
			console.log('Already at entry, closing menu.');
			closeMenu(); // Закрываем меню, если вернулись к 'entry'
		}
	};

	/** Открывает меню */
	const openMenu = () => {
		resetMobileMenuState(); // Сброс мобильного стека
		hideNonCorePanels(); // Сброс десктопных панелей

		updatePositions(); // Обновляем позицию перед показом

		menuContainer.classList.add(menuActiveClass);
		if (menuToggleButton) {
			menuToggleButton.classList.add(buttonActiveClass);
			menuToggleButton.setAttribute('aria-expanded', 'true');
		}
		document.body.style.overflow = 'hidden';

		// Показываем стартовую панель в зависимости от режима
		const panelToShowOnInit =
			window.innerWidth < MOBILE_BREAKPOINT
				? entryPanelSelector
				: rootPanelSelector;
		const initialPanel = menuContainer.querySelector(panelToShowOnInit);
		if (initialPanel) {
			initialPanel.hidden = false;
			initialPanel.classList.add(visiblePanelClass);
			initialPanel.style.transform = ''; // Убедимся, что она на месте
		}

		console.log('Menu Opened. Initial Stack:', [...navigationStack]);
	};

	/** Закрывает меню */
	const closeMenu = () => {
		menuContainer.classList.remove(menuActiveClass);
		if (menuToggleButton) {
			menuToggleButton.classList.remove(buttonActiveClass);
			menuToggleButton.setAttribute('aria-expanded', 'false');
		}
		document.body.style.overflow = '';

		// Сброс состояния панелей ПОСЛЕ анимации закрытия
		setTimeout(() => {
			hideNonCorePanels();
			// Скрываем обе стартовые панели
			menuContainer
				.querySelectorAll(`${entryPanelSelector}, ${rootPanelSelector}`)
				.forEach((p) => {
					p.classList.remove(visiblePanelClass);
					p.hidden = true;
				});
			resetMobileMenuState();
		}, TRANSITION_DURATION);
		console.log('Menu Closed');
	};

	// ==========================================================================
	// Обработчики Событий
	// ==========================================================================

	// --- Клик по основной кнопке меню ---
	if (menuToggleButton) {
		menuToggleButton.addEventListener('click', (e) => {
			e.preventDefault();
			if (menuContainer.classList.contains(menuActiveClass)) {
				closeMenu();
			} else {
				openMenu();
			}
		});
	}

	// --- Клики ВНУТРИ меню (для мобильной навигации) ---
	menuContainer.addEventListener('click', (e) => {
		if (window.innerWidth >= MOBILE_BREAKPOINT) return; // Только мобильные

		const triggerLink = e.target.closest(panelTriggerSelector);
		const backButton = e.target.closest(backButtonSelector);

		if (backButton) {
			e.preventDefault();
			goBackMobile();
		} else if (triggerLink) {
			e.preventDefault();
			const panelIdToShow = triggerLink.dataset.opensPanel;
			if (panelIdToShow) {
				showPanelMobile(panelIdToShow);
			} else {
				console.warn(
					'Trigger link clicked, but data-opens-panel is missing.'
				);
			}
		}
		// Опционально: закрыть меню при клике на конечную ссылку
		// else if (e.target.closest('a:not([data-opens-panel])')) {
		//     closeMenu();
		// }
	});

	// --- Логика Desktop Hover ---
	menuContainer.addEventListener('mouseover', (e) => {
		if (window.innerWidth < MOBILE_BREAKPOINT) return;
		const triggerLink = e.target.closest(panelTriggerSelector);
		if (!triggerLink) return;

		clearTimeout(leaveTimeout);
		const panelIdToShow = triggerLink.dataset.opensPanel;
		const parentPanel = triggerLink.closest(panelSelector);
		// Игнорируем ховер в мобильной entry панели на десктопе
		if (!parentPanel || parentPanel.matches(entryPanelSelector)) return;

		showPanelDesktop(panelIdToShow);

		// Подсветка триггера
		parentPanel
			.querySelectorAll(`.${activeTriggerClass}`)
			.forEach((activeTrigger) => {
				if (activeTrigger !== triggerLink)
					activeTrigger.classList.remove(activeTriggerClass);
			});
		triggerLink.classList.add(activeTriggerClass);
	});

	menuContainer.addEventListener('mouseleave', () => {
		if (window.innerWidth < MOBILE_BREAKPOINT) return;
		clearTimeout(leaveTimeout);
		leaveTimeout = setTimeout(hideNonCorePanels, hideDelay); // Скрываем только подпанели
	});

	menuContainer.addEventListener('mouseenter', () => {
		if (window.innerWidth < MOBILE_BREAKPOINT) return;
		clearTimeout(leaveTimeout); // Отменяем скрытие, если мышь вернулась
	});

	// --- Логика "Залипания" Хедера (IntersectionObserver) ---
	if (sentinel && header) {
		const observerOptions = {
			root: null,
			rootMargin: '0px',
			threshold: [0],
		};
		const observerCallback = (entries) => {
			entries.forEach((entry) => {
				const isStuck =
					!entry.isIntersecting && entry.boundingClientRect.top < 0;
				header.classList.toggle(headerStuckClass, isStuck);
				// Обновляем позицию меню при изменении состояния sticky,
				// если это может повлиять на видимую высоту хедера
				updatePositions(); // Вызываем здесь
			});
		};
		const observer = new IntersectionObserver(
			observerCallback,
			observerOptions
		);
		observer.observe(sentinel);
	}

	// --- Обработка Resize ---
	let resizeTimer;
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			console.log('Window resized');
			updatePositions(); // Обновляем позицию меню при ресайзе
			// Сбрасываем состояние меню, ЕСЛИ оно открыто, чтобы избежать
			// некорректного отображения при пересечении брейкпоинта
			if (menuContainer.classList.contains(menuActiveClass)) {
				console.log('Resetting menu state on resize while active');
				// Определяем, какая панель ДОЛЖНА быть видна
				const targetVisiblePanelSelector =
					window.innerWidth < MOBILE_BREAKPOINT
						? entryPanelSelector
						: rootPanelSelector;
				hideNonCorePanels(); // Скрываем все sub
				resetMobileMenuState(); // Сбрасываем стек на entry
				// Показываем нужную стартовую панель
				const targetPanel = menuContainer.querySelector(
					targetVisiblePanelSelector
				);
				if (targetPanel) {
					targetPanel.hidden = false;
					targetPanel.classList.add(visiblePanelClass);
				}
				// Скрываем другую стартовую панель
				const otherStartPanelSelector =
					targetVisiblePanelSelector === entryPanelSelector
						? rootPanelSelector
						: entryPanelSelector;
				const otherStartPanel = menuContainer.querySelector(
					otherStartPanelSelector
				);
				if (otherStartPanel) {
					otherStartPanel.classList.remove(visiblePanelClass);
					otherStartPanel.hidden = true;
				}
			}
		}, 100); // Небольшой дебаунс для resize
	});

	// --- Финальная Инициализация ---
	updatePositions(); // Вычисляем высоту хедера и позицию меню при загрузке
	// Начальное состояние панелей устанавливается при открытии/закрытии меню
}); // Конец DOMContentLoaded
