const PAYMENT_URL = 'https://c2c.cbrpay.ru/AS1I002E5DAN3MRN8KQP9R97693V67MF';
const TELEGRAM_URL = 'https://t.me/KVSemenov';

const PRICES = {
    single: 49,
    series: 199,
    anySix: 249,
    premium: 299,
    cats: 299,
    full: 490,
    personalization: 299
};

const PACKAGE_DEFS = {
    premium: {
        id: 'premium',
        title: 'Premium Pack',
        subtitle: '12 роликов: “Торт” + “Золотой день рождения”',
        price: PRICES.premium,
        seriesIds: ['04_cake', '05_golden']
    },
    cats: {
        id: 'cats',
        title: 'Cats Pack',
        subtitle: '12 роликов: “Котик с подарком” + “Котик-доставщик”',
        price: PRICES.cats,
        seriesIds: ['03_cat_gift', '07_cat_delivery']
    },
    full: {
        id: 'full',
        title: 'Полный набор “День рождения”',
        subtitle: 'Все 42 видео-открытки из каталога',
        price: PRICES.full,
        seriesIds: 'all'
    }
};

const CART_STORAGE_KEY = 'kvs_video_greetings_cart_v2';

function money(value) {
    return `${value.toLocaleString('ru-RU')} ₽`;
}

function escapeHtml(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getEmptyCart() {
    return {
        singles: [],
        series: [],
        packages: [],
        personalization: false
    };
}

function normalizeCart(cart) {
    return {
        singles: Array.isArray(cart?.singles) ? [...new Set(cart.singles)] : [],
        series: Array.isArray(cart?.series) ? [...new Set(cart.series)] : [],
        packages: Array.isArray(cart?.packages) ? [...new Set(cart.packages)].filter(id => PACKAGE_DEFS[id]) : [],
        personalization: Boolean(cart?.personalization)
    };
}

function loadCart() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        return raw ? normalizeCart(JSON.parse(raw)) : getEmptyCart();
    } catch (error) {
        return getEmptyCart();
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizeCart(cart)));
}

document.addEventListener('DOMContentLoaded', () => {
    const catalog = window.birthdayCatalog || { series: [], skus: [] };
    const skuById = new Map(catalog.skus.map(sku => [sku.id, sku]));
    const seriesById = new Map(catalog.series.map(series => [series.id, series]));
    const skusBySeries = catalog.series.reduce((acc, series) => {
        acc[series.id] = catalog.skus.filter(sku => sku.seriesId === series.id);
        return acc;
    }, {});

    let cart = loadCart();
    let focusReturnElement = null;

    initNavigation();
    initFaq();
    initMusicToggle();
    renderCatalog();
    initCartActions();
    initVideoModal();
    updateCartUI();

    function initNavigation() {
        document.querySelectorAll('a[href^="#"], [data-scroll-target]').forEach(control => {
            control.addEventListener('click', event => {
                const targetId = control.getAttribute('href') || control.getAttribute('data-scroll-target');
                if (!targetId || targetId === '#') return;
                const target = document.querySelector(targetId);
                if (!target) return;
                event.preventDefault();
                const headerOffset = 92;
                const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
                window.scrollTo({ top, behavior: 'smooth' });
            });
        });
    }

    function initFaq() {
        document.querySelectorAll('.faq-question').forEach(button => {
            button.addEventListener('click', () => {
                const item = button.closest('.faq-item');
                const expanded = button.getAttribute('aria-expanded') === 'true';
                document.querySelectorAll('.faq-item').forEach(other => {
                    if (other !== item) {
                        other.classList.remove('active');
                        const otherButton = other.querySelector('.faq-question');
                        if (otherButton) otherButton.setAttribute('aria-expanded', 'false');
                    }
                });
                item.classList.toggle('active', !expanded);
                button.setAttribute('aria-expanded', String(!expanded));
            });
        });
    }

    function renderCatalog() {
        const container = document.getElementById('catalog-container');
        if (!container || !catalog.series.length) return;

        const seriesCards = catalog.series.map(series => {
            const firstSku = skusBySeries[series.id]?.[0];
            return `
                <article class="series-tile">
                    <button class="series-tile-preview preview-btn" type="button" data-sku="${escapeHtml(firstSku?.id)}" data-video="${escapeHtml(firstSku?.video)}" aria-label="Смотреть пример серии ${escapeHtml(series.title)}">
                        <img src="${escapeHtml(firstSku?.poster)}" alt="${escapeHtml(series.title)}" loading="lazy" decoding="async">
                        <span class="play-small" aria-hidden="true"></span>
                    </button>
                    <div class="series-tile-info">
                        <h3>${escapeHtml(series.title)}</h3>
                        <p>${escapeHtml(series.seoDescription || series.desc)}</p>
                        <div class="series-tile-actions">
                            <button class="btn btn-light btn-sm" type="button" data-open-series="${escapeHtml(series.id)}">Смотреть SKU</button>
                            <button class="btn btn-dark btn-sm" type="button" data-add-series="${escapeHtml(series.id)}">Серия — 199 ₽</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        const seriesAccordions = catalog.series.map((series, index) => {
            const seriesSkus = skusBySeries[series.id] || [];
            const skuCards = seriesSkus.map(sku => `
                <article class="sku-card" id="sku-${escapeHtml(sku.id)}" data-sku-card="${escapeHtml(sku.id)}">
                    <div class="sku-visual" data-video="${escapeHtml(sku.video)}">
                        <img src="${escapeHtml(sku.poster)}" alt="${escapeHtml(sku.title)} — видео-открытка с Днём рождения" loading="lazy" decoding="async">
                    </div>
                    <div class="sku-info">
                        <div class="sku-meta"><span>${escapeHtml(sku.id)}</span><span>${escapeHtml(sku.duration)}</span></div>
                        <h4>${escapeHtml(sku.title)}</h4>
                        <p class="sku-series-name">${escapeHtml(sku.seriesTitle)}</p>
                        <p class="sku-description">${escapeHtml(sku.seoDescription || '')}</p>
                        <div class="sku-actions">
                            <button class="btn btn-light btn-sm preview-btn" type="button" data-sku="${escapeHtml(sku.id)}" data-video="${escapeHtml(sku.video)}">Смотреть пример</button>
                            <button class="btn btn-dark btn-sm" type="button" data-add-sku="${escapeHtml(sku.id)}">В корзину — 49 ₽</button>
                            <button class="btn btn-ghost btn-sm" type="button" data-add-sku-personal="${escapeHtml(sku.id)}">С именем +299 ₽</button>
                        </div>
                    </div>
                </article>
            `).join('');

            return `
                <article class="series-item" data-series-item="${escapeHtml(series.id)}" id="series-${escapeHtml(series.id)}">
                    <button class="series-header" type="button" aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="series-content-${index}">
                        <span>
                            <strong>${escapeHtml(String(index + 1).padStart(2, '0'))} — ${escapeHtml(series.title)}</strong>
                            <em>${escapeHtml(series.seoDescription || series.desc)}</em>
                        </span>
                        <b>+</b>
                    </button>
                    <div class="series-content" id="series-content-${index}" ${index === 0 ? '' : 'hidden'}>
                        <div class="series-toolbar">
                            <span>6 роликов одного стиля — <strong>199 ₽</strong></span>
                            <button class="btn btn-dark btn-sm" type="button" data-add-series="${escapeHtml(series.id)}">Добавить серию</button>
                        </div>
                        <div class="sku-grid">${skuCards}</div>
                    </div>
                </article>
            `;
        }).join('');

        container.insertAdjacentHTML('beforeend', `
            <div class="series-showcase">${seriesCards}</div>
            <div class="catalog-rules">
                <span>1 ролик — <strong>49 ₽</strong></span>
                <span>Серия 6 одного стиля — <strong>199 ₽</strong></span>
                <span>Любые 6 выбранных SKU — <strong>249 ₽</strong></span>
                <span>Полный набор — <strong>490 ₽</strong></span>
            </div>
            <div id="birthday-series" class="series-list">${seriesAccordions}</div>
            <div class="full-set-block" id="birthday-full-pack">
                <div>
                    <span class="eyebrow">42 SKU</span>
                    <h3>Полный набор “День рождения”</h3>
                    <p>Все 7 серий в одном заказе: сказочная книга, волшебный подарок, котики, торт, premium, космос и котик-доставщик.</p>
                </div>
                <strong>490 ₽</strong>
                <button class="btn btn-gold" type="button" data-add-package="full">Добавить полный набор</button>
            </div>
        `);

        initCatalogInteractions();
    }

    function initCatalogInteractions() {
        document.querySelectorAll('.sku-visual, img, video').forEach(el => {
            el.addEventListener('contextmenu', event => event.preventDefault());
        });

        document.querySelectorAll('[data-open-series]').forEach(button => {
            button.addEventListener('click', () => {
                const seriesId = button.getAttribute('data-open-series');
                const item = document.querySelector(`[data-series-item="${CSS.escape(seriesId)}"]`);
                if (!item) return;
                const header = item.querySelector('.series-header');
                const content = item.querySelector('.series-content');
                if (header && content && content.hidden) {
                    item.classList.add('active');
                    header.setAttribute('aria-expanded', 'true');
                    content.hidden = false;
                }
                const top = item.getBoundingClientRect().top + window.pageYOffset - 110;
                window.scrollTo({ top, behavior: 'smooth' });
            });
        });

        document.querySelectorAll('.series-header').forEach(button => {
            button.addEventListener('click', () => {
                const item = button.closest('.series-item');
                const content = item.querySelector('.series-content');
                const expanded = button.getAttribute('aria-expanded') === 'true';
                item.classList.toggle('active', !expanded);
                button.setAttribute('aria-expanded', String(!expanded));
                content.hidden = expanded;
            });
        });

        const canHoverPreview = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (!canHoverPreview) return;

        document.querySelectorAll('.sku-visual').forEach(visual => {
            visual.addEventListener('pointerenter', () => startHoverPreview(visual));
            visual.addEventListener('pointerleave', () => stopHoverPreview(visual));
        });
    }

    function startHoverPreview(visual) {
        const videoSrc = visual.getAttribute('data-video');
        if (!videoSrc) return;
        let video = visual.querySelector('video.site-preview-video');
        if (!video) {
            video = document.createElement('video');
            video.className = 'site-preview-video';
            video.muted = true;
            video.defaultMuted = true;
            video.loop = true;
            video.playsInline = true;
            video.autoplay = true;
            video.preload = 'metadata';
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.setAttribute('controlsList', 'nodownload');
            video.setAttribute('disablePictureInPicture', '');
            video.setAttribute('aria-hidden', 'true');
            video.addEventListener('contextmenu', event => event.preventDefault());
            video.src = videoSrc;
            visual.appendChild(video);
        }
        video.currentTime = 0;
        video.play().catch(() => {});
    }

    function stopHoverPreview(visual) {
        const video = visual.querySelector('video.site-preview-video');
        if (!video) return;
        video.pause();
        video.currentTime = 0;
    }

    function initVideoModal() {
        const modal = document.getElementById('video-modal');
        const modalVideo = document.getElementById('modal-video');
        const modalAddButton = modal?.querySelector('[data-modal-add-sku]');
        let modalSkuId = '';
        if (!modal || !modalVideo) return;

        document.addEventListener('click', event => {
            const previewButton = event.target.closest('.preview-btn');
            if (previewButton) {
                const videoSrc = previewButton.getAttribute('data-video');
                if (!videoSrc) return;
                event.preventDefault();
                stopMusic();
                focusReturnElement = previewButton;
                modalSkuId = previewButton.getAttribute('data-sku') || catalog.skus.find(sku => sku.video === videoSrc)?.id || '';
                if (modalAddButton) {
                    modalAddButton.disabled = !modalSkuId;
                    modalAddButton.textContent = modalSkuId ? 'В корзину — 49 ₽' : 'Открыть корзину';
                }
                modalVideo.src = videoSrc;
                modal.hidden = false;
                document.body.classList.add('modal-open');
                modalVideo.play().catch(() => {});
                modal.querySelector('[data-close-modal]')?.focus();
                return;
            }

            if (event.target.closest('[data-modal-add-sku]')) {
                event.preventDefault();
                if (modalSkuId) {
                    addSingle(modalSkuId);
                    closeModal(false);
                } else {
                    closeModal(false);
                    openCart();
                }
                return;
            }

            if (event.target.closest('[data-close-modal]')) {
                closeModal();
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !modal.hidden) closeModal();
        });

        function closeModal(restoreFocus = true) {
            modal.hidden = true;
            document.body.classList.remove('modal-open');
            modalVideo.pause();
            modalVideo.removeAttribute('src');
            modalVideo.load();
            modalSkuId = '';
            if (restoreFocus && focusReturnElement) focusReturnElement.focus();
        }
    }

    function initCartActions() {
        document.addEventListener('click', event => {
            const addSkuButton = event.target.closest('[data-add-sku]');
            if (addSkuButton) {
                addSingle(addSkuButton.getAttribute('data-add-sku'));
                return;
            }

            const addSkuPersonalButton = event.target.closest('[data-add-sku-personal]');
            if (addSkuPersonalButton) {
                addSingle(addSkuPersonalButton.getAttribute('data-add-sku-personal'), false);
                addPersonalization(false);
                showToast('Ролик и персонализация добавлены в корзину');
                openCart();
                updateCartUI();
                return;
            }

            const addSeriesButton = event.target.closest('[data-add-series]');
            if (addSeriesButton) {
                addSeries(addSeriesButton.getAttribute('data-add-series'));
                return;
            }

            const addPackageButton = event.target.closest('[data-add-package]');
            if (addPackageButton) {
                addPackage(addPackageButton.getAttribute('data-add-package'));
                return;
            }

            if (event.target.closest('[data-add-personalization]')) {
                addPersonalization();
                return;
            }

            if (event.target.closest('[data-open-cart]')) {
                event.preventDefault();
                openCart();
                return;
            }

            if (event.target.closest('[data-close-cart]')) {
                closeCart();
                return;
            }

            const removeButton = event.target.closest('[data-remove-cart]');
            if (removeButton) {
                removeCartItem(removeButton.getAttribute('data-remove-cart'), removeButton.getAttribute('data-id'));
                return;
            }

            if (event.target.closest('[data-copy-order]')) {
                copyOrderText();
            }
        });

        document.addEventListener('keydown', event => {
            const drawer = document.getElementById('cart-drawer');
            if (event.key === 'Escape' && drawer?.getAttribute('aria-hidden') === 'false') closeCart();
        });
    }

    function addSingle(skuId, notify = true) {
        if (!skuById.has(skuId)) return;
        if (cart.singles.includes(skuId)) {
            if (notify) showToast('Этот ролик уже есть в корзине');
            openCart();
            return;
        }
        cart.singles.push(skuId);
        saveCart(cart);
        updateCartUI();
        if (notify) showToast('Ролик добавлен в корзину');
        openCart();
    }

    function addSeries(seriesId) {
        if (!seriesById.has(seriesId)) return;
        if (cart.series.includes(seriesId)) {
            showToast('Эта серия уже есть в корзине');
            openCart();
            return;
        }
        cart.series.push(seriesId);
        saveCart(cart);
        updateCartUI();
        showToast('Серия добавлена в корзину');
        openCart();
    }

    function addPackage(packageId) {
        if (!PACKAGE_DEFS[packageId]) return;
        if (cart.packages.includes(packageId)) {
            showToast('Этот пакет уже есть в корзине');
            openCart();
            return;
        }
        cart.packages.push(packageId);
        saveCart(cart);
        updateCartUI();
        showToast('Пакет добавлен в корзину');
        openCart();
    }

    function addPersonalization(notify = true) {
        if (cart.personalization) {
            if (notify) showToast('Персонализация уже добавлена');
            openCart();
            return;
        }
        cart.personalization = true;
        saveCart(cart);
        updateCartUI();
        if (notify) showToast('Персонализация добавлена');
        openCart();
    }

    function removeCartItem(type, id) {
        if (type === 'single') cart.singles = cart.singles.filter(item => item !== id);
        if (type === 'series') cart.series = cart.series.filter(item => item !== id);
        if (type === 'package') cart.packages = cart.packages.filter(item => item !== id);
        if (type === 'personalization') cart.personalization = false;
        saveCart(cart);
        updateCartUI();
    }

    function calculateSinglesPrice(count) {
        const bundles = Math.floor(count / 6);
        const remainder = count % 6;
        return bundles * PRICES.anySix + remainder * PRICES.single;
    }

    function getSeriesSkus(seriesId) {
        return skusBySeries[seriesId] || [];
    }

    function getPackageSkus(packageId) {
        const packageDef = PACKAGE_DEFS[packageId];
        if (!packageDef) return [];
        if (packageDef.seriesIds === 'all') return catalog.skus;
        return packageDef.seriesIds.flatMap(seriesId => getSeriesSkus(seriesId));
    }

    function getCartSkuList() {
        const items = [];
        cart.singles.forEach(id => {
            const sku = skuById.get(id);
            if (sku) items.push(sku);
        });
        cart.series.forEach(seriesId => getSeriesSkus(seriesId).forEach(sku => items.push(sku)));
        cart.packages.forEach(packageId => getPackageSkus(packageId).forEach(sku => items.push(sku)));
        const unique = new Map();
        items.forEach(sku => unique.set(sku.id, sku));
        return [...unique.values()];
    }

    function getCartCount() {
        return cart.singles.length + cart.series.length + cart.packages.length + (cart.personalization ? 1 : 0);
    }

    function getCartTotal() {
        const singlesTotal = calculateSinglesPrice(cart.singles.length);
        const seriesTotal = cart.series.length * PRICES.series;
        const packagesTotal = cart.packages.reduce((sum, id) => sum + PACKAGE_DEFS[id].price, 0);
        const personalizationTotal = cart.personalization ? PRICES.personalization : 0;
        return singlesTotal + seriesTotal + packagesTotal + personalizationTotal;
    }

    function updateCartUI() {
        cart = normalizeCart(cart);
        saveCart(cart);

        const count = getCartCount();
        const total = getCartTotal();
        document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = count; });
        document.querySelectorAll('[data-cart-total]').forEach(el => { el.textContent = money(total); });

        const empty = document.querySelector('[data-cart-empty]');
        const linesContainer = document.querySelector('[data-cart-lines]');
        const skusContainer = document.querySelector('[data-cart-skus]');
        if (!empty || !linesContainer || !skusContainer) return;

        empty.hidden = count > 0;
        linesContainer.innerHTML = '';
        skusContainer.innerHTML = '';

        if (cart.singles.length) {
            const price = calculateSinglesPrice(cart.singles.length);
            const singleRows = cart.singles.map(id => {
                const sku = skuById.get(id);
                return `<li><span>${escapeHtml(id)} — ${escapeHtml(sku?.title || '')}</span><button class="mini-remove" type="button" data-remove-cart="single" data-id="${escapeHtml(id)}" aria-label="Удалить ${escapeHtml(id)}"></button></li>`;
            }).join('');
            const discountNote = cart.singles.length >= 6
                ? `<p class="cart-discount">Применена цена “любые 6”: ${Math.floor(cart.singles.length / 6)} × ${money(PRICES.anySix)}${cart.singles.length % 6 ? ` + ${cart.singles.length % 6} × ${money(PRICES.single)}` : ''}</p>`
                : `<p class="cart-discount muted">Добавьте ${6 - cart.singles.length} ролик(а), чтобы сработала цена “любые 6” — ${money(PRICES.anySix)}.</p>`;
            linesContainer.insertAdjacentHTML('beforeend', `
                <article class="cart-line">
                    <div>
                        <strong>Отдельные ролики</strong>
                        <span>${cart.singles.length} SKU</span>
                        ${discountNote}
                        <ul>${singleRows}</ul>
                    </div>
                    <b>${money(price)}</b>
                </article>
            `);
        }

        cart.series.forEach(seriesId => {
            const series = seriesById.get(seriesId);
            const ids = getSeriesSkus(seriesId).map(sku => sku.id).join(', ');
            linesContainer.insertAdjacentHTML('beforeend', `
                <article class="cart-line">
                    <div>
                        <strong>Серия: ${escapeHtml(series?.title)}</strong>
                        <span>6 роликов одного стиля</span>
                        <small>${escapeHtml(ids)}</small>
                    </div>
                    <b>${money(PRICES.series)}</b>
                    <button class="line-remove" type="button" data-remove-cart="series" data-id="${escapeHtml(seriesId)}" aria-label="Удалить серию"></button>
                </article>
            `);
        });

        cart.packages.forEach(packageId => {
            const packageDef = PACKAGE_DEFS[packageId];
            const skuCount = getPackageSkus(packageId).length;
            linesContainer.insertAdjacentHTML('beforeend', `
                <article class="cart-line">
                    <div>
                        <strong>${escapeHtml(packageDef.title)}</strong>
                        <span>${escapeHtml(packageDef.subtitle)}</span>
                        <small>${skuCount} SKU</small>
                    </div>
                    <b>${money(packageDef.price)}</b>
                    <button class="line-remove" type="button" data-remove-cart="package" data-id="${escapeHtml(packageId)}" aria-label="Удалить пакет"></button>
                </article>
            `);
        });

        cart.personalization && linesContainer.insertAdjacentHTML('beforeend', `
            <article class="cart-line">
                <div>
                    <strong>Персонализация</strong>
                    <span>Имя или свой текст — согласование в Telegram</span>
                </div>
                <b>${money(PRICES.personalization)}</b>
                <button class="line-remove" type="button" data-remove-cart="personalization" data-id="personalization" aria-label="Удалить персонализацию"></button>
            </article>
        `);

        const allSkus = getCartSkuList();
        if (allSkus.length) {
            const chips = allSkus.map(sku => `<span>${escapeHtml(sku.id)}</span>`).join('');
            skusContainer.innerHTML = `
                <strong>SKU в заказе</strong>
                <div class="sku-chips">${chips}</div>
            `;
        }
    }

    function getOrderLinesForText() {
        const lines = [];
        if (cart.singles.length) {
            lines.push(`Отдельные ролики (${cart.singles.length}): ${cart.singles.map(id => {
                const sku = skuById.get(id);
                return `${id} — ${sku?.title || ''}`;
            }).join('; ')}. Цена: ${money(calculateSinglesPrice(cart.singles.length))}`);
        }
        cart.series.forEach(seriesId => {
            const series = seriesById.get(seriesId);
            const ids = getSeriesSkus(seriesId).map(sku => sku.id).join(', ');
            lines.push(`Серия “${series?.title || seriesId}” — ${money(PRICES.series)}. SKU: ${ids}`);
        });
        cart.packages.forEach(packageId => {
            const packageDef = PACKAGE_DEFS[packageId];
            const skuIds = getPackageSkus(packageId).map(sku => sku.id).join(', ');
            lines.push(`${packageDef.title} — ${money(packageDef.price)}. ${packageDef.subtitle}. SKU: ${skuIds}`);
        });
        if (cart.personalization) {
            lines.push(`Персонализация имени/текста — ${money(PRICES.personalization)}. Текст пришлю отдельно.`);
        }
        return lines;
    }

    function buildOrderText() {
        const total = getCartTotal();
        const lines = getOrderLinesForText();
        if (!lines.length) {
            return 'Здравствуйте! Хочу заказать видео-открытку. Сейчас выберу состав заказа на сайте.';
        }
        return [
            'Здравствуйте! Хочу заказать видео-открытки.',
            '',
            'Состав заказа:',
            ...lines.map(line => `— ${line}`),
            '',
            `Итого: ${money(total)}.`,
            '',
            'Оплачу/оплатил(а) по СБП. Чек пришлю сюда.'
        ].join('\n');
    }

    async function copyOrderText() {
        const text = buildOrderText();
        try {
            await navigator.clipboard.writeText(text);
            showToast('Заказ скопирован для Telegram');
        } catch (error) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
            showToast('Заказ скопирован для Telegram');
        }
    }

    function openCart() {
        const drawer = document.getElementById('cart-drawer');
        if (!drawer) return;
        drawer.setAttribute('aria-hidden', 'false');
        document.body.classList.add('cart-open');
        drawer.querySelector('[data-close-cart]')?.focus();
    }

    function closeCart() {
        const drawer = document.getElementById('cart-drawer');
        if (!drawer) return;
        drawer.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cart-open');
    }

    function showToast(message) {
        const toast = document.querySelector('[data-toast]');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    // Background music: only after explicit user click. No autoplay, no external audio file.
    let audioContext = null;
    let musicGain = null;
    let musicTimer = null;
    let musicEnabled = false;
    const notes = [392, 494, 523, 659, 587, 494, 440, 523];
    let noteIndex = 0;

    function initMusicToggle() {
        document.querySelectorAll('.music-toggle').forEach(button => {
            button.addEventListener('click', async () => {
                if (musicEnabled) {
                    stopMusic();
                } else {
                    await startMusic();
                }
            });
        });
    }

    async function startMusic() {
        try {
            audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') await audioContext.resume();
            musicGain = audioContext.createGain();
            musicGain.gain.setValueAtTime(0.035, audioContext.currentTime);
            musicGain.connect(audioContext.destination);
            musicEnabled = true;
            updateMusicButtons();
            playMusicNote();
            musicTimer = window.setInterval(playMusicNote, 780);
            showToast('Фоновая музыка включена');
        } catch (error) {
            showToast('Не удалось включить музыку в этом браузере');
        }
    }

    function playMusicNote() {
        if (!audioContext || !musicGain || !musicEnabled) return;
        const now = audioContext.currentTime;
        const oscillator = audioContext.createOscillator();
        const noteGain = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(notes[noteIndex % notes.length], now);
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.9, now + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
        oscillator.connect(noteGain);
        noteGain.connect(musicGain);
        oscillator.start(now);
        oscillator.stop(now + 0.7);
        noteIndex += 1;
    }

    function stopMusic() {
        if (!musicEnabled) return;
        musicEnabled = false;
        if (musicTimer) window.clearInterval(musicTimer);
        musicTimer = null;
        if (musicGain) {
            try {
                musicGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.08);
                window.setTimeout(() => musicGain?.disconnect(), 120);
            } catch (error) {}
        }
        musicGain = null;
        updateMusicButtons();
        showToast('Фоновая музыка выключена');
    }

    function updateMusicButtons() {
        document.querySelectorAll('.music-toggle').forEach(button => {
            button.setAttribute('aria-pressed', String(musicEnabled));
            button.setAttribute('aria-label', musicEnabled ? 'Выключить фоновую музыку' : 'Включить фоновую музыку');
        });
    }
});
