import './styles/main.scss';

document.addEventListener('DOMContentLoaded', () => {
	const MOBILE_BREAKPOINT = 768;
	const TRANSITION_DURATION = 300;
	const SCROLLBAR_COMPENSATION_CLASS = 'has-scrollbar-compensation';

	const docElement = document.documentElement;
	const body = document.body;
	const header = document.getElementById('main-header');
	const sentinel = document.getElementById('header-observer-sentinel');
	const menuContainer = document.getElementById('megaMenu');
	const menuToggleButton = document.querySelector(
		'.menu-toggle[aria-controls="megaMenu"]'
	);

	const panelSelector = '.mega-menu__panel';
	const rootPanelSelector = '.mega-menu__panel--root-categories';
	const entryPanelSelector = '.mega-menu__panel--entry';
	const panelTriggerSelector = '.mega-menu__nav-link[data-opens-panel]';
	const backButtonSelector = '.mega-menu__back-button';
	const activeTriggerClass = 'is-active-trigger';
	const visiblePanelClass = 'is-visible';
	const slidingOutClass = 'is-sliding-out-left';
	const menuActiveClass = 'is-active';
	const buttonActiveClass = 'menu-toggle--active';
	const headerStuckClass = 'header--is-stuck';

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
	}
	if (!sentinel) {
		console.warn(
			'Header observer sentinel (#header-observer-sentinel) not found.'
		);
	}

	const hideDelay = parseInt(menuContainer?.dataset.hoverDelay || '200', 10);
	let leaveTimeout = null;
	const navigationStack = ['entry'];
	let headerHeight = 0;
	let isTouchDevice = false;

	const getScrollbarWidth = () => {
		const outer = document.createElement('div');
		outer.style.visibility = 'hidden';
		outer.style.overflow = 'scroll';
		outer.style.msOverflowStyle = 'scrollbar';
		document.body.appendChild(outer);
		const inner = document.createElement('div');
		outer.appendChild(inner);
		const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
		outer.parentNode.removeChild(outer);
		return scrollbarWidth;
	};

	const checkTouchDevice = () => {
		return window.matchMedia('(pointer: coarse)').matches;
	};
	isTouchDevice = checkTouchDevice();

	const compensateScrollbar = (addPadding) => {
		if (
			!isTouchDevice &&
			document.body.scrollHeight !== window.innerHeight
		) {
			const scrollbarWidth = getScrollbarWidth();
			if (addPadding) {
				body.style.paddingRight = `${scrollbarWidth}px`;
				body.classList.add(SCROLLBAR_COMPENSATION_CLASS);
			} else {
				body.style.paddingRight = '';
				body.classList.remove(SCROLLBAR_COMPENSATION_CLASS);
			}
		}
	};

	const updatePositions = () => {
		if (!header || !menuContainer) return;
		headerHeight = header.offsetHeight;
		docElement.style.setProperty('--header-height', `${headerHeight}px`);
		menuContainer.style.top = `${headerHeight}px`;
	};

	const resetMobileMenuState = () => {
		navigationStack.length = 1;
		navigationStack[0] = 'entry';
		menuContainer.querySelectorAll(panelSelector).forEach((p) => {
			const isEntry = p.dataset.panelId === 'entry';
			p.classList.remove(visiblePanelClass, slidingOutClass);
			p.style.transform = '';
			p.hidden = !isEntry;
			if (isEntry) p.classList.add(visiblePanelClass);
		});
	};

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
		menuContainer
			.querySelectorAll(`${rootPanelSelector} .${activeTriggerClass}`)
			.forEach((trigger) => trigger.classList.remove(activeTriggerClass));
	};

	const showPanelDesktop = (panelId) => {
		const targetPanel = menuContainer.querySelector(
			`${panelSelector}[data-panel-id="${panelId}"]`
		);
		if (!targetPanel || panelId === 'entry') return;

		const categoriesPanel = menuContainer.querySelector(rootPanelSelector);
		if (
			categoriesPanel &&
			!categoriesPanel.classList.contains(visiblePanelClass)
		) {
			categoriesPanel.hidden = false;
			categoriesPanel.classList.add(visiblePanelClass);
		}

		hideNonCorePanels();

		targetPanel.hidden = false;
		targetPanel.classList.add(visiblePanelClass);
	};

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

		nextPanel.hidden = false;
		nextPanel.classList.remove(slidingOutClass);
		nextPanel.style.transform = '';

		if (currentPanel && currentPanel !== nextPanel) {
			currentPanel.classList.remove(visiblePanelClass);
			currentPanel.style.transform = isBack
				? 'translateX(100%)'
				: 'translateX(-100%)';
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
	};

	const goBackMobile = () => {
		if (navigationStack.length > 1) {
			const panelToHideId = navigationStack.pop();
			const previousPanelId = navigationStack[navigationStack.length - 1];
			showPanelMobile(previousPanelId, true, panelToHideId);
		} else {
			closeMenu();
		}
	};

	const openMenu = () => {
		resetMobileMenuState();
		hideNonCorePanels();
		updatePositions();

		menuContainer.classList.add(menuActiveClass);
		if (menuToggleButton) {
			menuToggleButton.classList.add(buttonActiveClass);
			menuToggleButton.setAttribute('aria-expanded', 'true');
		}
		compensateScrollbar(true);
		body.style.overflow = 'hidden';

		const panelToShowOnInit =
			window.innerWidth < MOBILE_BREAKPOINT
				? entryPanelSelector
				: rootPanelSelector;
		const initialPanel = menuContainer.querySelector(panelToShowOnInit);
		if (initialPanel) {
			initialPanel.hidden = false;
			initialPanel.classList.add(visiblePanelClass);
			initialPanel.style.transform = '';
		}
	};

	const closeMenu = () => {
		menuContainer.classList.remove(menuActiveClass);
		if (menuToggleButton) {
			menuToggleButton.classList.remove(buttonActiveClass);
			menuToggleButton.setAttribute('aria-expanded', 'false');
		}
		compensateScrollbar(false);
		body.style.overflow = '';

		setTimeout(() => {
			hideNonCorePanels();
			menuContainer
				.querySelectorAll(`${entryPanelSelector}, ${rootPanelSelector}`)
				.forEach((p) => {
					p.classList.remove(visiblePanelClass);
					p.hidden = true;
				});
			resetMobileMenuState();
		}, TRANSITION_DURATION);
	};

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

	menuContainer.addEventListener('click', (e) => {
		if (window.innerWidth >= MOBILE_BREAKPOINT) return;

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
	});

	menuContainer.addEventListener('mouseover', (e) => {
		if (window.innerWidth < MOBILE_BREAKPOINT) return;
		const triggerLink = e.target.closest(panelTriggerSelector);
		if (!triggerLink) return;

		clearTimeout(leaveTimeout);
		const panelIdToShow = triggerLink.dataset.opensPanel;
		const parentPanel = triggerLink.closest(panelSelector);
		if (!parentPanel || parentPanel.matches(entryPanelSelector)) return;

		showPanelDesktop(panelIdToShow);

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
		leaveTimeout = setTimeout(hideNonCorePanels, hideDelay);
	});

	menuContainer.addEventListener('mouseenter', () => {
		if (window.innerWidth < MOBILE_BREAKPOINT) return;
		clearTimeout(leaveTimeout);
	});
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
				updatePositions();
			});
		};
		const observer = new IntersectionObserver(
			observerCallback,
			observerOptions
		);
		observer.observe(sentinel);
	}

	let resizeTimer;
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			updatePositions();
		}, 100);
	});

	updatePositions();
});
