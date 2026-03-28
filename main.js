// ==================== 初始化 ====================
async function detectLanguageFromIP() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const country = data.country_code;
        if (country === 'CN') return 'zh-CN';
        if (['TW', 'HK', 'MO'].includes(country)) return 'zh-TW';
        return 'en';
    } catch (e) {
        const navLang = navigator.language || 'en';
        if (navLang.startsWith('zh')) {
            if (navLang === 'zh-TW' || navLang === 'zh-HK') return 'zh-TW';
            return 'zh-CN';
        }
        return 'en';
    }
}

async function initLanguage() {
    const detected = await detectLanguageFromIP();
    state.currentLang = detected;
    const select = document.getElementById('lang-select');
    if (select) select.value = state.currentLang;
}

function updateDesktopNav() {
    const desktopNav = document.getElementById('desktop-nav');
    if (!desktopNav) return;
    desktopNav.innerHTML = `
        <a href="#home" class="nav-item" data-page="home">${__('nav.home')}</a>
        <a href="#annual" class="nav-item" data-page="season">${__('nav.season')}</a>
        <a href="#three-year" class="nav-item" data-page="active">${__('nav.active')}</a>
        <a href="#comprehensive" class="nav-item" data-page="comprehensive">${__('nav.comprehensive')}</a>
        <a href="#region" class="nav-item" data-page="region">${__('nav.region')}</a>
        <a href="#regionTop" class="nav-item" data-page="regionTop">${__('nav.regionTop')}</a>
        <a href="#regionComp" class="nav-item" data-page="regionComp">${__('nav.regionComp')}</a>
        <a href="#record" class="nav-item" data-page="record">${__('nav.record')}</a>
    `;
}

function bindLanguageSwitch() {
    const select = document.getElementById('lang-select');
    if (!select) return;
    select.innerHTML = LANG_LIST.map(l => `<option value="${l.code}">${l.name}</option>`).join('');
    select.value = state.currentLang;
    select.addEventListener('change', async (e) => {
        state.currentLang = e.target.value;
        updateDesktopNav();
        const mobileNav = document.getElementById('mobile-nav');
        if (mobileNav) {
            mobileNav.innerHTML = `
                <a href="#home" class="nav-item" data-page="home">${__('nav.home')}</a>
                <a href="#annual" class="nav-item" data-page="season">${__('nav.season')}</a>
                <a href="#three-year" class="nav-item" data-page="active">${__('nav.active')}</a>
                <a href="#comprehensive" class="nav-item" data-page="comprehensive">${__('nav.comprehensive')}</a>
                <a href="#region" class="nav-item" data-page="region">${__('nav.region')}</a>
                <a href="#regionTop" class="nav-item" data-page="regionTop">${__('nav.regionTop')}</a>
                <a href="#regionComp" class="nav-item" data-page="regionComp">${__('nav.regionComp')}</a>
                <a href="#record" class="nav-item" data-page="record">${__('nav.record')}</a>
            `;
        }
        if (state.currentPage) await loadPage(state.currentPage);
    });
}

async function loadPage(page) {
    console.log(`切换到页面: ${page}`);
    state.currentPage = page;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll(`[data-page="${page}"]`).forEach(el => el.classList.add('active'));

    const app = document.getElementById('app');
    switch(page) {
        case 'home': app.innerHTML = renderHome(); initCarousel(); break;
        case 'season': app.innerHTML = renderSeason(); await initSeason(); break;
        case 'active': app.innerHTML = renderActive(); await initActive(); break;
        case 'comprehensive': app.innerHTML = renderComprehensive(); await initComprehensive(); break;
        case 'region': app.innerHTML = renderRegion(); await initRegion(); break;
        case 'regionTop': app.innerHTML = renderRegionTop(); await initRegionTop(); break;
        case 'regionComp': app.innerHTML = renderRegionComp(); await initRegionComp(); break;
        case 'record': app.innerHTML = renderRecord(); await initRecord(); break;
        default: window.location.hash = '#home';
    }
}

function handleHash() {
    let hash = window.location.hash.slice(1) || 'home';
    let page = hash;
    if (hash === 'annual') page = 'season';
    else if (hash === 'three-year') page = 'active';
    loadPage(page);
}

// ==================== 年份选择辅助（缓存优化） ====================
const _yearCache = new Map();

function getAvailableYears(project, type) {
    const cacheKey = `${project}_${type}`;
    if (_yearCache.has(cacheKey)) return _yearCache.get(cacheKey);
    const years = state.meta?.availableYears?.[project]?.[type] || [];
    const valid = years.filter(y => typeof y === 'number' && y >= 2007).sort((a,b)=>b-a);
    _yearCache.set(cacheKey, valid);
    return valid;
}

async function loadYearOptions(pageKey, project) {
    const yearSelect = document.getElementById(`${pageKey}-year`);
    if (!yearSelect) return;
    const type = state[pageKey].type;
    const validYears = getAvailableYears(project, type);
    if (validYears.length === 0) {
        yearSelect.innerHTML = '<option value="">无数据</option>';
        yearSelect.disabled = true;
        return;
    }
    yearSelect.disabled = false;
    let html = '';
    if (pageKey === 'active') {
        const maxStart = Math.max(...validYears) - 2;
        const minStart = Math.min(...validYears);
        for (let y = maxStart; y >= minStart; y--) {
            html += `<option value="${y}">${y} - ${y+2}</option>`;
        }
        const currentYear = new Date().getFullYear();
        let defaultYear = currentYear - 2;
        if (defaultYear < minStart) defaultYear = minStart;
        if (defaultYear > maxStart) defaultYear = maxStart;
        yearSelect.innerHTML = html;
        yearSelect.value = defaultYear;
        state[pageKey].year = defaultYear;
    } else {
        validYears.forEach(y => { html += `<option value="${y}">${y}</option>`; });
        yearSelect.innerHTML = html;
        const currentYear = new Date().getFullYear();
        let defaultYear = currentYear;
        if (!validYears.includes(currentYear) && validYears.length) {
            defaultYear = validYears[0];
        }
        yearSelect.value = defaultYear;
        state[pageKey].year = defaultYear;
    }
    yearSelect.removeEventListener('change', yearSelect._handler);
    yearSelect._handler = (e) => {
        const newYear = parseInt(e.target.value);
        if (!isNaN(newYear)) {
            state[pageKey].year = newYear;
            if (pageKey === 'season') loadRankingData('season', 'season');
            else if (pageKey === 'active') loadRankingData('active', 'active');
        }
    };
    yearSelect.addEventListener('change', yearSelect._handler);
}

// ==================== 通用加载函数 ====================
async function loadRankingData(pageKey, period) {
    const { project, type, gender, continent, country, year } = state[pageKey];
    updateCurrentLabels(pageKey, project, type);
    const yearSpan = document.getElementById(`${pageKey}-current-year`);
    if (yearSpan) {
        if (pageKey === 'active') {
            yearSpan.textContent = `${year} - ${year+2}`;
        } else {
            yearSpan.textContent = year;
        }
    }
    showPageLoading(pageKey);
    try {
        let data = await fetchDataByPeriod(project, type, period, year);
        data = applyGenderFilter(data, gender);
        data = applyScopeFilter(data, continent, country);
        data = deduplicateByBestAndDate(data, project);
        const ranked = recomputeRanks(data, project);
        renderTable(pageKey, ranked, project);
    } catch (e) {
        console.error(e);
        const tbody = document.getElementById(`${pageKey}-tbody`);
        if (tbody) tbody.innerHTML = `.<td colspan="6">${__('loading_failed')}<\/td>`;
    }
}

// ==================== 各页面初始化 ====================
async function initSeason() {
    await loadMeta();
    populateScopeSelect('season-scope', state.season.scope);
    const projSelect = document.getElementById('season-project');
    if (projSelect) projSelect.value = state.season.project;
    const genderSelect = document.getElementById('season-gender');
    if (genderSelect) genderSelect.value = state.season.gender;

    await loadYearOptions('season', state.season.project);

    bindEvents('season', false);
    await loadRankingData('season', 'season');
}

async function initActive() {
    await loadMeta();
    populateScopeSelect('active-scope', state.active.scope);
    const projSelect = document.getElementById('active-project');
    if (projSelect) projSelect.value = state.active.project;
    const genderSelect = document.getElementById('active-gender');
    if (genderSelect) genderSelect.value = state.active.gender;

    await loadYearOptions('active', state.active.project);

    bindEvents('active', false);
    await loadRankingData('active', 'active');
}

async function initRegion() {
    await loadMeta();
    const radios = document.querySelectorAll('input[name="region-period"]');
    radios.forEach(r => {
        if (r.value === state.region.period) r.checked = true;
        r.addEventListener('change', (e) => {
            state.region.period = e.target.value;
            updateRegionYearVisibility();
            loadRegionData();
        });
    });

    const provinces = state.meta.provincesCities.provinces;
    const citiesMap = state.meta.provincesCities.cities;
    state.region.allProvinces = provinces;
    state.region.provinceCities = citiesMap;

    const provinceSelect = document.getElementById('region-province');
    if (provinceSelect) {
        provinceSelect.innerHTML = provinces.map(p => `<option value="${p}">${p}</option>`).join('');
        if (provinces.includes('北京')) provinceSelect.value = '北京';
        else if (provinces.length) provinceSelect.value = provinces[0];
        state.region.province = provinceSelect.value;
    }
    updateRegionCitySelect(state.region.province);

    const projectSelect = document.getElementById('region-project');
    if (projectSelect) projectSelect.value = state.region.project;
    const genderSelect = document.getElementById('region-gender');
    if (genderSelect) genderSelect.value = state.region.gender;

    await loadRegionYearOptions();
    updateRegionYearVisibility();

    bindEvents('region', false);
    if (provinceSelect) {
        provinceSelect.addEventListener('change', (e) => {
            state.region.province = e.target.value;
            updateRegionCitySelect(state.region.province);
        });
    }
    const citySelect = document.getElementById('region-city');
    if (citySelect) {
        citySelect.addEventListener('change', (e) => { state.region.city = e.target.value; });
    }
    document.getElementById('region-single')?.addEventListener('click', () => {
        setType('region', 'single');
        loadRegionData();
    });
    document.getElementById('region-average')?.addEventListener('click', () => {
        setType('region', 'average');
        loadRegionData();
    });

    await loadRegionData();
}

async function loadRegionYearOptions() {
    const yearSelect = document.getElementById('region-year');
    if (!yearSelect) return;
    const project = state.region.project;
    const type = state.region.type;
    const validYears = getAvailableYears(project, type);
    if (validYears.length === 0) {
        yearSelect.innerHTML = '<option value="">无数据</option>';
        yearSelect.disabled = true;
        return;
    }
    yearSelect.disabled = false;
    let html = '';
    if (state.region.period === 'active') {
        const maxStart = Math.max(...validYears) - 2;
        const minStart = Math.min(...validYears);
        for (let y = maxStart; y >= minStart; y--) {
            html += `<option value="${y}">${y} - ${y+2}</option>`;
        }
        const currentYear = new Date().getFullYear();
        let defaultYear = currentYear - 2;
        if (defaultYear < minStart) defaultYear = minStart;
        if (defaultYear > maxStart) defaultYear = maxStart;
        yearSelect.innerHTML = html;
        yearSelect.value = defaultYear;
        state.region.year = defaultYear;
    } else if (state.region.period === 'season') {
        validYears.forEach(y => { html += `<option value="${y}">${y}</option>`; });
        yearSelect.innerHTML = html;
        const currentYear = new Date().getFullYear();
        let defaultYear = currentYear;
        if (!validYears.includes(currentYear) && validYears.length) {
            defaultYear = validYears[0];
        }
        yearSelect.value = defaultYear;
        state.region.year = defaultYear;
    } else {
        yearSelect.innerHTML = '';
        return;
    }
    yearSelect.removeEventListener('change', yearSelect._handler);
    yearSelect._handler = (e) => {
        const newYear = parseInt(e.target.value);
        if (!isNaN(newYear)) {
            state.region.year = newYear;
            loadRegionData();
        }
    };
    yearSelect.addEventListener('change', yearSelect._handler);
}

function updateRegionYearVisibility() {
    const yearItem = document.getElementById('region-year-item');
    if (!yearItem) return;
    if (state.region.period === 'season' || state.region.period === 'active') {
        yearItem.style.display = 'flex';
    } else {
        yearItem.style.display = 'none';
    }
}

async function loadRegionData() {
    if (state.currentPage !== 'region') return;
    showPageLoading('region');
    const { period, project, type, gender, province, city, year } = state.region;
    document.getElementById('region-current-project').textContent = getProjectName(project);
    document.getElementById('region-current-type').textContent = type === 'single' ? __('btn.single') : __('btn.average');
    let periodText = '';
    if (period === 'historical') periodText = __('current.historical');
    else if (period === 'season') periodText = __('current.season');
    else periodText = __('current.active');
    document.getElementById('region-current-period').textContent = periodText;
    const yearSpan = document.getElementById('region-current-year');
    if (yearSpan) {
        if (period === 'season') yearSpan.textContent = year ? `${year}` : '';
        else if (period === 'active') yearSpan.textContent = year ? `${year}-${year+2}` : '';
        else yearSpan.textContent = '';
    }

    try {
        let data = await fetchDataByPeriod(project, type, period, period === 'historical' ? null : year);
        data = applyGenderFilter(data, gender);
        if (province) data = data.filter(d => d.province === province);
        if (city !== '全部城市' && city) data = data.filter(d => d.city === city);
        data = deduplicateByBestAndDate(data, project);
        renderTable('region', data, project);
    } catch (e) {
        console.error(e);
        const tbody = document.getElementById('region-tbody');
        if (tbody) tbody.innerHTML = `.<td colspan="7">${__('loading_failed')}<\/td>`;
    }
}

async function initRegionTop() {
    await loadMeta();
    const dimSelect = document.getElementById('regionTop-dimension');
    if (dimSelect) {
        dimSelect.value = state.regionTop.dimension;
        dimSelect.addEventListener('change', (e) => {
            state.regionTop.dimension = e.target.value;
            updateRegionTopCurrentLabel();
            loadRegionTopData();
        });
    }
    const periodRadios = document.querySelectorAll('input[name="regionTop-period"]');
    periodRadios.forEach(r => {
        if (r.value === state.regionTop.period) r.checked = true;
        r.addEventListener('change', (e) => {
            state.regionTop.period = e.target.value;
            updateRegionTopYearVisibility();
            updateRegionTopCurrentLabel();
            loadRegionTopData();
        });
    });
    const projSelect = document.getElementById('regionTop-project');
    if (projSelect) {
        projSelect.value = state.regionTop.project;
        projSelect.addEventListener('change', (e) => {
            state.regionTop.project = e.target.value;
            loadRegionTopYearOptions();
            updateRegionTopCurrentLabel();
            loadRegionTopData();
        });
    }
    const genderSelect = document.getElementById('regionTop-gender');
    if (genderSelect) {
        genderSelect.value = state.regionTop.gender;
        genderSelect.addEventListener('change', (e) => {
            state.regionTop.gender = e.target.value;
            updateRegionTopCurrentLabel();
            loadRegionTopData();
        });
    }

    await loadRegionTopYearOptions();
    updateRegionTopYearVisibility();

    document.getElementById('regionTop-single').addEventListener('click', () => {
        setType('regionTop', 'single');
        loadRegionTopData();
    });
    document.getElementById('regionTop-average').addEventListener('click', () => {
        setType('regionTop', 'average');
        loadRegionTopData();
    });
    await loadRegionTopData();
}

async function loadRegionTopYearOptions() {
    const yearSelect = document.getElementById('regionTop-year');
    if (!yearSelect) return;
    const project = state.regionTop.project;
    const type = state.regionTop.type;
    const validYears = getAvailableYears(project, type);
    if (validYears.length === 0) {
        yearSelect.innerHTML = '<option value="">无数据</option>';
        yearSelect.disabled = true;
        return;
    }
    yearSelect.disabled = false;
    let html = '';
    if (state.regionTop.period === 'active') {
        const maxStart = Math.max(...validYears) - 2;
        const minStart = Math.min(...validYears);
        for (let y = maxStart; y >= minStart; y--) {
            html += `<option value="${y}">${y} - ${y+2}</option>`;
        }
        const currentYear = new Date().getFullYear();
        let defaultYear = currentYear - 2;
        if (defaultYear < minStart) defaultYear = minStart;
        if (defaultYear > maxStart) defaultYear = maxStart;
        yearSelect.innerHTML = html;
        yearSelect.value = defaultYear;
        state.regionTop.year = defaultYear;
    } else if (state.regionTop.period === 'season') {
        validYears.forEach(y => { html += `<option value="${y}">${y}</option>`; });
        yearSelect.innerHTML = html;
        const currentYear = new Date().getFullYear();
        let defaultYear = currentYear;
        if (!validYears.includes(currentYear) && validYears.length) {
            defaultYear = validYears[0];
        }
        yearSelect.value = defaultYear;
        state.regionTop.year = defaultYear;
    } else {
        yearSelect.innerHTML = '';
        return;
    }
    yearSelect.removeEventListener('change', yearSelect._handler);
    yearSelect._handler = (e) => {
        const newYear = parseInt(e.target.value);
        if (!isNaN(newYear)) {
            state.regionTop.year = newYear;
            loadRegionTopData();
        }
    };
    yearSelect.addEventListener('change', yearSelect._handler);
}

function updateRegionTopYearVisibility() {
    const yearItem = document.getElementById('regionTop-year-item');
    if (!yearItem) return;
    if (state.regionTop.period === 'season' || state.regionTop.period === 'active') {
        yearItem.style.display = 'flex';
    } else {
        yearItem.style.display = 'none';
    }
}

function updateRegionTopCurrentLabel() {
    const { dimension, project, type, period, year } = state.regionTop;
    let periodText = '';
    if (period === 'historical') periodText = __('current.historical');
    else if (period === 'season') periodText = __('current.season');
    else periodText = __('current.active');
    let yearText = '';
    if (period === 'season' && year) yearText = ` · ${year}`;
    if (period === 'active' && year) yearText = ` · ${year}-${year+2}`;
    document.getElementById('regionTop-current').innerText =
        `${dimension === 'province' ? __('dimension.province') : __('dimension.city')} · ${periodText}${yearText} · ${getProjectName(project)} · ${type === 'single' ? __('btn.single') : __('btn.average')}`;
}

async function loadRegionTopData() {
    if (state.currentPage !== 'regionTop') return;
    showPageLoading('regionTop');
    const { dimension, project, type, gender, period, year } = state.regionTop;
    updateRegionTopCurrentLabel();
    try {
        let data = await fetchDataByPeriod(project, type, period, period === 'historical' ? null : year);
        data = applyGenderFilter(data, gender);
        data = deduplicateByBestAndDate(data, project);
        data = data.filter(item => {
            if (!item.province) return false;
            if (dimension === 'city' && !item.city) return false;
            return true;
        });
        const groups = {};
        data.forEach(item => {
            const key = dimension === 'province' ? item.province : `${item.province}|${item.city}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        let topList = [];
        for (let key in groups) {
            const items = groups[key];
            const sorted = recomputeRanks(items, project);
            const bestRank = sorted[0].rank;
            const bestItems = sorted.filter(item => item.rank === bestRank);
            bestItems.forEach(item => {
                topList.push({
                    ...item,
                    groupKey: key,
                    province: item.province,
                    city: item.city || ''
                });
            });
        }
        if (project === '333mbf') {
            topList.sort((a, b) => {
                const aParsed = parseMBF(a.result);
                const bParsed = parseMBF(b.result);
                if (!aParsed && !bParsed) return 0;
                if (!aParsed) return 1;
                if (!bParsed) return -1;
                const aScore = aParsed.success - aParsed.fail;
                const bScore = bParsed.success - bParsed.fail;
                if (aScore !== bScore) return bScore - aScore;
                if (aParsed.timeSeconds !== bParsed.timeSeconds) return aParsed.timeSeconds - bParsed.timeSeconds;
                return aParsed.fail - bParsed.fail;
            });
        } else {
            topList.sort((a, b) => parseTime(a.result) - parseTime(b.result));
        }
        let rank = 1, sameCount = 0;
        for (let i = 0; i < topList.length; i++) {
            if (i === 0) { topList[i].displayRank = rank; continue; }
            let isSame = false;
            if (project === '333mbf') {
                const prev = parseMBF(topList[i-1].result);
                const curr = parseMBF(topList[i].result);
                if (prev && curr) {
                    isSame = (prev.success - prev.fail === curr.success - curr.fail) &&
                             (prev.timeSeconds === curr.timeSeconds) &&
                             (prev.fail === curr.fail);
                } else if (!prev && !curr) isSame = true;
            } else {
                isSame = topList[i].result === topList[i-1].result;
            }
            if (isSame) {
                sameCount++;
                topList[i].displayRank = rank;
            } else {
                rank += 1 + sameCount;
                sameCount = 0;
                topList[i].displayRank = rank;
            }
        }
        renderTable('regionTop', topList, project);
    } catch (e) {
        console.error(e);
        document.getElementById('regionTop-tbody').innerHTML = `.<td colspan="7">${__('loading_failed')}<\/td>`;
    }
}

async function initRegionComp() {
    await loadMeta();
    const dimSelect = document.getElementById('regionComp-dimension');
    if (dimSelect) {
        dimSelect.value = state.regionComp.dimension;
        dimSelect.addEventListener('change', (e) => {
            state.regionComp.dimension = e.target.value;
            updateRegionCompCurrentLabel();
            calculateRegionComp();
        });
    }
    const periodRadios = document.querySelectorAll('input[name="regionComp-period"]');
    periodRadios.forEach(r => {
        if (r.value === state.regionComp.period) r.checked = true;
        r.addEventListener('change', (e) => {
            state.regionComp.period = e.target.value;
            updateRegionCompYearVisibility();
            updateRegionCompCurrentLabel();
            calculateRegionComp();
        });
    });

    await loadRegionCompYearOptions();
    updateRegionCompYearVisibility();

    renderRegionCompProjectTags();
    document.getElementById('regionComp-single').addEventListener('click', () => {
        setType('regionComp', 'single');
        calculateRegionComp();
    });
    document.getElementById('regionComp-average').addEventListener('click', () => {
        setType('regionComp', 'average');
        calculateRegionComp();
    });
    await calculateRegionComp();
}

async function loadRegionCompYearOptions() {
    const yearSelect = document.getElementById('regionComp-year');
    if (!yearSelect) return;
    const project = state.regionComp.selectedEvents[0] || '333';
    const type = state.regionComp.type;
    const validYears = getAvailableYears(project, type);
    if (validYears.length === 0) {
        yearSelect.innerHTML = '<option value="">无数据</option>';
        yearSelect.disabled = true;
        return;
    }
    yearSelect.disabled = false;
    let html = '';
    if (state.regionComp.period === 'active') {
        const maxStart = Math.max(...validYears) - 2;
        const minStart = Math.min(...validYears);
        for (let y = maxStart; y >= minStart; y--) {
            html += `<option value="${y}">${y} - ${y+2}</option>`;
        }
        const currentYear = new Date().getFullYear();
        let defaultYear = currentYear - 2;
        if (defaultYear < minStart) defaultYear = minStart;
        if (defaultYear > maxStart) defaultYear = maxStart;
        yearSelect.innerHTML = html;
        yearSelect.value = defaultYear;
        state.regionComp.year = defaultYear;
    } else if (state.regionComp.period === 'season') {
        validYears.forEach(y => { html += `<option value="${y}">${y}</option>`; });
        yearSelect.innerHTML = html;
        const currentYear = new Date().getFullYear();
        let defaultYear = currentYear;
        if (!validYears.includes(currentYear) && validYears.length) {
            defaultYear = validYears[0];
        }
        yearSelect.value = defaultYear;
        state.regionComp.year = defaultYear;
    } else {
        yearSelect.innerHTML = '';
        return;
    }
    yearSelect.removeEventListener('change', yearSelect._handler);
    yearSelect._handler = (e) => {
        const newYear = parseInt(e.target.value);
        if (!isNaN(newYear)) {
            state.regionComp.year = newYear;
            calculateRegionComp();
        }
    };
    yearSelect.addEventListener('change', yearSelect._handler);
}

function updateRegionCompYearVisibility() {
    const yearItem = document.getElementById('regionComp-year-item');
    if (!yearItem) return;
    if (state.regionComp.period === 'season' || state.regionComp.period === 'active') {
        yearItem.style.display = 'flex';
    } else {
        yearItem.style.display = 'none';
    }
}

async function calculateRegionComp() {
    if (state.currentPage !== 'regionComp') return;
    const tbody = document.getElementById('regionComp-tbody');
    const paginationDiv = document.getElementById('regionComp-pagination');
    if (tbody) tbody.innerHTML = `.<td colspan="5" class="loading-cell"><i class="fas fa-spinner"></i> ${__('comp.calculating')}<\/td>`;
    if (paginationDiv) paginationDiv.innerHTML = '';
    await new Promise(resolve => setTimeout(resolve, 20));
    updateRegionCompCurrentLabel();
    const { dimension, selectedEvents, type, period, year } = state.regionComp;
    if (selectedEvents.length === 0) {
        tbody.innerHTML = `.<td colspan="5">${__('no_data')}<\/td>`;
        return;
    }
    const projectDataMap = {};
    const groupInfoMap = new Map(); // key -> { province, city, totalRank, eventCount }

    for (let proj of selectedEvents) {
        try {
            let data = await fetchDataByPeriod(proj, type, period, period === 'historical' ? null : year);
            const ranked = recomputeRanks(data, proj);
            // 取每个地区的第一名（排名最小）
            const groupFirst = {};
            ranked.forEach(item => {
                const key = dimension === 'province' ? item.province : `${item.province}|${item.city}`;
                if (!key || !item.province) return;
                if (!groupFirst[key] || item.rank < groupFirst[key].rank) {
                    groupFirst[key] = { rank: item.rank, province: item.province, city: item.city || '' };
                }
            });
            // 累加排名
            for (let key in groupFirst) {
                const info = groupFirst[key];
                if (!groupInfoMap.has(key)) {
                    groupInfoMap.set(key, { province: info.province, city: info.city, totalRank: 0, eventCount: 0 });
                }
                const group = groupInfoMap.get(key);
                group.totalRank += info.rank;
                group.eventCount++;
            }
        } catch (e) {
            console.warn(`加载项目 ${proj} 失败`, e);
        }
    }

    const results = [];
    for (let [key, group] of groupInfoMap.entries()) {
        results.push({
            groupKey: key,
            province: group.province,
            city: group.city,
            totalRank: group.totalRank,
            totalCount: group.eventCount
        });
    }
    results.sort((a, b) => a.totalRank - b.totalRank);
    let rank = 1, sameCount = 0;
    const rankedResults = results.map((item, idx) => {
        if (idx === 0) item.displayRank = rank;
        else {
            if (item.totalRank === results[idx-1].totalRank) {
                sameCount++;
                item.displayRank = rank;
            } else {
                rank += 1 + sameCount;
                sameCount = 0;
                item.displayRank = rank;
            }
        }
        return item;
    });
    renderRegionCompTable(rankedResults);
}

async function initComprehensive() {
    await loadMeta();
    await loadCompProvinceList();
    populateScopeSelect('comp-scope', state.comprehensive.scope);
    const sourceSelect = document.getElementById('comp-source');
    if (sourceSelect) sourceSelect.value = state.comprehensive.source;
    toggleCompFilters(state.comprehensive.source);
    renderProjectTags();

    await loadCompYearOptions();

    sourceSelect?.addEventListener('change', async (e) => {
        state.comprehensive.source = e.target.value;
        toggleCompFilters(e.target.value);
        await loadCompYearOptions();
        updateCompCurrentLabel();
        calculateComprehensive();
    });
    document.getElementById('comp-scope')?.addEventListener('change', (e) => {
        state.comprehensive.scope = e.target.value;
        updateCompCurrentLabel();
        calculateComprehensive();
    });
    document.getElementById('comp-dataset')?.addEventListener('change', async (e) => {
        state.comprehensive.subDataset = e.target.value;
        await loadCompYearOptions();
        updateCompCurrentLabel();
        calculateComprehensive();
    });
    document.getElementById('comp-province')?.addEventListener('change', async (e) => {
        state.comprehensive.province = e.target.value;
        await updateCompCitySelect(state.comprehensive.province);
        updateCompCurrentLabel();
        calculateComprehensive();
    });
    document.getElementById('comp-city')?.addEventListener('change', (e) => {
        state.comprehensive.city = e.target.value;
        updateCompCurrentLabel();
        calculateComprehensive();
    });
    document.getElementById('comp-gender')?.addEventListener('change', (e) => {
        state.comprehensive.gender = e.target.value;
        updateCompCurrentLabel();
        calculateComprehensive();
    });
    document.getElementById('comp-single')?.addEventListener('click', () => {
        setType('comprehensive', 'single');
        calculateComprehensive();
    });
    document.getElementById('comp-average')?.addEventListener('click', () => {
        setType('comprehensive', 'average');
        calculateComprehensive();
    });
    await calculateComprehensive();
}

async function loadCompYearOptions() {
    const yearSelect = document.getElementById('comp-year');
    if (!yearSelect) return;
    const source = state.comprehensive.source;
    const subDataset = state.comprehensive.subDataset;
    let shouldShow = false;
    if (source === 'season' || source === 'active') {
        shouldShow = true;
    } else if (source === 'province' && (subDataset === 'season' || subDataset === 'active')) {
        shouldShow = true;
    }
    if (!shouldShow) {
        yearSelect.style.display = 'none';
        return;
    }
    yearSelect.style.display = 'flex';

    const project = state.comprehensive.selectedEvents[0] || '333';
    const type = state.comprehensive.type;
    const validYears = getAvailableYears(project, type);
    if (validYears.length === 0) {
        yearSelect.innerHTML = '<option value="">无数据</option>';
        yearSelect.disabled = true;
        return;
    }
    yearSelect.disabled = false;
    let html = '';
    if ((source === 'active') || (source === 'province' && subDataset === 'active')) {
        const maxStart = Math.max(...validYears) - 2;
        const minStart = Math.min(...validYears);
        for (let y = maxStart; y >= minStart; y--) {
            html += `<option value="${y}">${y} - ${y+2}</option>`;
        }
        const currentYear = new Date().getFullYear();
        let defaultYear = currentYear - 2;
        if (defaultYear < minStart) defaultYear = minStart;
        if (defaultYear > maxStart) defaultYear = maxStart;
        yearSelect.innerHTML = html;
        yearSelect.value = defaultYear;
        state.comprehensive.year = defaultYear;
    } else if ((source === 'season') || (source === 'province' && subDataset === 'season')) {
        validYears.forEach(y => { html += `<option value="${y}">${y}</option>`; });
        yearSelect.innerHTML = html;
        const currentYear = new Date().getFullYear();
        let defaultYear = currentYear;
        if (!validYears.includes(currentYear) && validYears.length) {
            defaultYear = validYears[0];
        }
        yearSelect.value = defaultYear;
        state.comprehensive.year = defaultYear;
    } else {
        yearSelect.style.display = 'none';
        return;
    }
    yearSelect.removeEventListener('change', yearSelect._handler);
    yearSelect._handler = (e) => {
        const newYear = parseInt(e.target.value);
        if (!isNaN(newYear)) {
            state.comprehensive.year = newYear;
            calculateComprehensive();
        }
    };
    yearSelect.addEventListener('change', yearSelect._handler);
}

async function calculateComprehensive() {
    if (state.currentPage !== 'comprehensive') return;
    const startTime = Date.now();
    const loadingDiv = document.getElementById('comp-loading');
    const tbody = document.getElementById('comp-tbody');
    const paginationDiv = document.getElementById('comp-pagination');
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (tbody) tbody.innerHTML = '';
    if (paginationDiv) paginationDiv.innerHTML = '';
    await new Promise(resolve => setTimeout(resolve, 0));
    updateCompCurrentLabel();
    const { source, subDataset, scope, selectedEvents, gender, province, city, type, year } = state.comprehensive;
    if (selectedEvents.length === 0) {
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (tbody) tbody.innerHTML = `.<td colspan="5">${__('comp.select_events')}<\/td>`;
        return;
    }
    const projectDataMap = {};
    const personInfoMap = new Map();
    console.log(`综合排名开始计算，数据源: ${source}, 子类型: ${subDataset}, 项目: ${selectedEvents.join(',')}`);
    for (let proj of selectedEvents) {
        try {
            let period = '';
            if (source === 'season') period = 'season';
            else if (source === 'active') period = 'active';
            else period = subDataset;
            let data = await fetchDataByPeriod(proj, type, period, period !== 'historical' ? year : null);
            if (gender !== 'all') data = data.filter(d => d.gender === gender);
            if (source !== 'province') {
                const [scopeType, scopeValue] = scope.split(':');
                if (scopeType === 'continent') {
                    data = data.filter(d => applyContinentFilter(d.country, scopeValue));
                } else if (scopeType === 'country') {
                    data = data.filter(d => d.country === scopeValue);
                }
            } else {
                if (province) data = data.filter(d => d.province === province);
                if (city !== '全部城市' && city) data = data.filter(d => d.city === city);
            }
            console.log(`项目 ${proj} 加载完成，记录数: ${data.length}`);
            data.forEach(d => {
                const id = d.wcaid;
                if (!personInfoMap.has(id)) {
                    personInfoMap.set(id, {
                        name: d.name,
                        country: d.country || '中国',
                        province: d.province || '',
                        city: d.city || ''
                    });
                }
            });
            const ranked = recomputeRanks(data, proj);
            const rankMap = {};
            ranked.forEach(item => { rankMap[item.wcaid] = item.rank; });
            projectDataMap[proj] = { rankMap: rankMap, maxRank: data.length };
            console.log(`项目 ${proj} 处理完成，有效选手数: ${data.length}, 最大排名: ${data.length}`);
        } catch (e) {
            console.warn(`加载项目 ${proj} 失败`, e);
            projectDataMap[proj] = { rankMap: {}, maxRank: 0 };
        }
    }
    const results = [];
    for (let [wcaid, info] of personInfoMap.entries()) {
        let totalRank = 0;
        let count = 0;
        for (let proj of selectedEvents) {
            const projData = projectDataMap[proj];
            if (projData.rankMap[wcaid]) {
                totalRank += projData.rankMap[wcaid];
                count++;
            } else {
                totalRank += (projData.maxRank + 1);
            }
        }
        if (count > 0) {
            results.push({
                wcaid: wcaid,
                name: info.name,
                country: info.country,
                province: info.province,
                city: info.city,
                totalRank: totalRank,
                eventCount: count
            });
        }
    }
    console.log(`综合排名计算完成，共有 ${results.length} 名选手`);
    if (results.length === 0) {
        if (loadingDiv) loadingDiv.style.display = 'none';
        tbody.innerHTML = `.<td colspan="5">${__('no_data')}<\/td>`;
        return;
    }
    results.sort((a, b) => a.totalRank - b.totalRank);
    let rank = 1, lastTotal = null, sameCount = 0;
    const rankedResults = results.map((item, idx) => {
        if (idx === 0) {
            lastTotal = item.totalRank;
            return { ...item, displayRank: rank };
        }
        if (item.totalRank === lastTotal) {
            sameCount++;
            return { ...item, displayRank: rank };
        } else {
            rank += 1 + sameCount;
            sameCount = 0;
            lastTotal = item.totalRank;
            return { ...item, displayRank: rank };
        }
    });
    const elapsed = Date.now() - startTime;
    if (elapsed < 500) await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
    if (loadingDiv) loadingDiv.style.display = 'none';
    renderComprehensiveTable(rankedResults);
}

// ==================== 省市纪录（按需加载优化） ====================
const recordCache = new Map();

async function initRecord() {
    await loadMeta();
    // 年份下拉框
    const yearSelect = document.getElementById('record-year');
    if (yearSelect) {
        const allYears = state.meta?.availableYears?.['333']?.['single'] || [];
        const validYears = allYears.filter(y => typeof y === 'number' && y >= 2007).sort((a,b)=>b-a);
        if (validYears.length) {
            let html = '';
            validYears.forEach(y => { html += `<option value="${y}">${y}</option>`; });
            yearSelect.innerHTML = html;
            const currentYear = new Date().getFullYear();
            let defaultYear = currentYear;
            if (!validYears.includes(currentYear) && validYears.length) {
                defaultYear = validYears[0];
            }
            yearSelect.value = defaultYear;
            state.record.year = defaultYear;
            yearSelect.removeEventListener('change', yearSelect._handler);
            yearSelect._handler = (e) => {
                state.record.year = parseInt(e.target.value);
                loadRecordData();
            };
            yearSelect.addEventListener('change', yearSelect._handler);
        } else {
            yearSelect.innerHTML = '<option value="">无数据</option>';
        }
    }

    // 省份下拉框（从元数据获取）
    const provinceSelect = document.getElementById('record-province');
    if (provinceSelect) {
        const provinces = state.meta.provincesCities.provinces;
        provinceSelect.innerHTML = provinces.map(p => `<option value="${p}">${p}</option>`).join('');
        if (provinces.includes(state.record.province))
            provinceSelect.value = state.record.province;
        else if (provinces.length) {
            provinceSelect.value = provinces[0];
            state.record.province = provinces[0];
        }
        provinceSelect.addEventListener('change', (e) => {
            state.record.province = e.target.value;
            state.record.city = '全部城市';
            updateRecordCitySelect(state.record.province);
            loadRecordData();
        });
    }

    // 城市下拉框（动态加载）
    updateRecordCitySelect(state.record.province);

    const genderSelect = document.getElementById('record-gender');
    if (genderSelect) genderSelect.value = state.record.gender;
    genderSelect?.addEventListener('change', (e) => { state.record.gender = e.target.value; loadRecordData(); });

    document.getElementById('record-refresh')?.addEventListener('click', () => { loadRecordData(); });

    // 初始加载数据
    await loadRecordData();
}

function updateRecordCitySelect(province) {
    const citySelect = document.getElementById('record-city');
    if (!citySelect) return;
    if (MUNICIPALITIES.includes(province)) {
        citySelect.disabled = true;
        citySelect.innerHTML = `<option value="${province}">${province}</option>`;
        citySelect.value = province;
        state.record.city = province;
    } else {
        citySelect.disabled = false;
        // 从缓存获取该省份的城市列表
        const cities = state.meta.provincesCities.cities[province] || [];
        let options = '<option value="全部城市">全省</option>';
        cities.forEach(c => options += `<option value="${c}">${c}</option>`);
        citySelect.innerHTML = options;
        if (!cities.includes(state.record.city) && state.record.city !== '全部城市') {
            state.record.city = '全部城市';
        }
        citySelect.value = state.record.city;
        citySelect.removeEventListener('change', citySelect._handler);
        citySelect._handler = (e) => { state.record.city = e.target.value; loadRecordData(); };
        citySelect.addEventListener('change', citySelect._handler);
    }
}

async function loadRecordData() {
    const tbody = document.getElementById('record-tbody');
    if (!tbody) return;
    const province = state.record.province;
    const city = state.record.city;
    const gender = state.record.gender;
    const year = state.record.year;

    // 更新当前信息显示
    document.getElementById('record-current-year').textContent = year;
    document.getElementById('record-current-province').textContent = province;
    let displayCity = (city === '全部城市') ? '全省' : city;
    document.getElementById('record-current-city').textContent = displayCity;
    let genderText = '所有';
    if (gender === '男') genderText = '男';
    else if (gender === '女') genderText = '女';
    else if (gender === '未知') genderText = '未知';
    document.getElementById('record-current-gender').textContent = genderText;

    tbody.innerHTML = `.<td colspan="6" class="loading-cell"><i class="fas fa-spinner"></i> ${__('loading')}<span class="loading-dots"></span><\/td>`;
    await new Promise(resolve => setTimeout(resolve, 20));

    // 按需加载数据：只加载当前省份和年份所需的数据
    const cacheKey = `record_${province}_${city}_${gender}_${year}`;
    if (recordCache.has(cacheKey)) {
        renderRecordTable(recordCache.get(cacheKey), tbody);
        return;
    }

    // 并行加载所有项目截至该年份的历史数据
    const projectPromises = PROJECT_LIST.map(async proj => {
        const code = proj.code;
        try {
            const data = await fetchHistoricalUpToYear(code, 'single', year);
            return { code, data };
        } catch (e) {
            console.warn(`加载项目 ${code} 历史数据失败`, e);
            return { code, data: [] };
        }
    });
    const allProjectData = await Promise.all(projectPromises);
    const bestMap = {};

    // 计算每个项目的纪录
    for (let { code, data } of allProjectData) {
        // 过滤：省份、城市、性别
        let filtered = data.filter(item => {
            if (item.province !== province) return false;
            if (city !== '全部城市' && item.city !== city) return false;
            if (gender !== 'all' && item.gender !== gender) return false;
            return true;
        });
        // 按成绩排序，取第一名
        if (code === '333mbf') {
            filtered.sort((a, b) => {
                const aParsed = parseMBF(a.result);
                const bParsed = parseMBF(b.result);
                if (!aParsed && !bParsed) return 0;
                if (!aParsed) return 1;
                if (!bParsed) return -1;
                const aScore = aParsed.success - aParsed.fail;
                const bScore = bParsed.success - bParsed.fail;
                if (aScore !== bScore) return bScore - aScore;
                if (aParsed.timeSeconds !== bParsed.timeSeconds) return aParsed.timeSeconds - bParsed.timeSeconds;
                return aParsed.fail - bParsed.fail;
            });
        } else {
            filtered.sort((a, b) => parseTime(a.result) - parseTime(b.result));
        }
        const bestSingle = filtered[0] || null;
        // 平均同理
        let avgData = [];
        try {
            avgData = await fetchHistoricalUpToYear(code, 'average', year);
        } catch (e) {}
        let avgFiltered = avgData.filter(item => {
            if (item.province !== province) return false;
            if (city !== '全部城市' && item.city !== city) return false;
            if (gender !== 'all' && item.gender !== gender) return false;
            return true;
        });
        if (code === '333mbf') {
            // 多盲平均处理同单次（实际上多盲没有平均，但这里统一用排序）
            avgFiltered.sort((a, b) => {
                const aParsed = parseMBF(a.result);
                const bParsed = parseMBF(b.result);
                if (!aParsed && !bParsed) return 0;
                if (!aParsed) return 1;
                if (!bParsed) return -1;
                const aScore = aParsed.success - aParsed.fail;
                const bScore = bParsed.success - bParsed.fail;
                if (aScore !== bScore) return bScore - aScore;
                if (aParsed.timeSeconds !== bParsed.timeSeconds) return aParsed.timeSeconds - bParsed.timeSeconds;
                return aParsed.fail - bParsed.fail;
            });
        } else {
            avgFiltered.sort((a, b) => parseTime(a.result) - parseTime(b.result));
        }
        const bestAvg = avgFiltered[0] || null;
        bestMap[code] = { single: bestSingle, average: bestAvg };
    }

    recordCache.set(cacheKey, bestMap);
    renderRecordTable(bestMap, tbody);
}

function renderRecordTable(bestMap, tbody) {
    let html = '';
    for (let proj of PROJECT_LIST) {
        const projBest = bestMap[proj.code] || { single: null, average: null };
        html += `<tr class="region-cell"><td colspan="6">${proj.name}<\/td><\/tr>`;
        if (!projBest.single && !projBest.average) {
            html += `.<td colspan="6" class="empty-cell">${__('record.no_record')}<\/td><\/tr>`;
        } else {
            if (projBest.single) {
                const rec = projBest.single;
                const displayName = extractChineseName(rec.name);
                html += `.<td><\/td><td>${formatResult(rec.result)}<\/td><td><\/td><td>${displayName}<\/td><td>${rec.competition || ''}<\/td><td>${rec.date || ''}<\/td><\/tr>`;
            }
            if (projBest.average) {
                const rec = projBest.average;
                const displayName = extractChineseName(rec.name);
                html += `.<td><\/td><td><\/td><td>${formatResult(rec.result)}<\/td><td>${displayName}<\/td><td>${rec.competition || ''}<\/td><td>${rec.date || ''}<\/td><\/tr>`;
            }
        }
    }
    tbody.innerHTML = html || `.<td colspan="6">${__('no_data')}<\/td><\/tr>`;
}

// ==================== 辅助函数 ====================
function populateScopeSelect(selectId, currentVal) {
    const select = document.getElementById(selectId);
    if (!select) return;
    let html = `<option value="world">${__('world')}</option>`;
    const continents = [
        { code: 'asia', name: __('continent.asia') },
        { code: 'europe', name: __('continent.europe') },
        { code: 'north_america', name: __('continent.north_america') },
        { code: 'south_america', name: __('continent.south_america') },
        { code: 'africa', name: __('continent.africa') },
        { code: 'oceania', name: __('continent.oceania') }
    ];
    continents.forEach(c => { html += `<option value="continent:${c.code}">${c.name}</option>`; });
    html += '<option value="country:China">中国</option>';
    if (state.meta && state.meta.countries) {
        state.meta.countries.filter(c => c !== 'China').forEach(c => {
            html += `<option value="country:${c}">${c}</option>`;
        });
    }
    select.innerHTML = html;
    if (currentVal) select.value = currentVal;
}

function updateRegionCitySelect(province) {
    const citySelect = document.getElementById('region-city');
    if (!citySelect) return;
    if (MUNICIPALITIES.includes(province)) {
        citySelect.disabled = true;
        citySelect.innerHTML = `<option value="${province}">${province}</option>`;
        citySelect.value = province;
        state.region.city = province;
    } else {
        citySelect.disabled = false;
        const cities = state.region.provinceCities[province] || [];
        let options = '<option value="全部城市">全省</option>';
        cities.forEach(c => { options += `<option value="${c}">${c}</option>`; });
        citySelect.innerHTML = options;
        citySelect.value = '全部城市';
        state.region.city = '全部城市';
    }
}

async function updateCompCitySelect(province) {
    const citySelect = document.getElementById('comp-city');
    if (!citySelect) return;
    if (!province) return;
    if (MUNICIPALITIES.includes(province)) {
        citySelect.disabled = true;
        citySelect.innerHTML = `<option value="${province}">${province}</option>`;
        citySelect.value = province;
        state.comprehensive.city = province;
        return;
    }
    try {
        const cities = state.meta.provincesCities.cities[province] || [];
        citySelect.disabled = false;
        citySelect.innerHTML = '<option value="全部城市">全省</option>' +
            cities.map(c => `<option value="${c}">${c}</option>`).join('');
        citySelect.value = '全部城市';
        state.comprehensive.city = '全部城市';
    } catch (e) {
        console.warn('加载城市列表失败', e);
    }
}

async function loadCompProvinceList() {
    const provinces = state.meta.provincesCities.provinces;
    const provinceSelect = document.getElementById('comp-province');
    if (provinceSelect) {
        provinceSelect.innerHTML = provinces.map(p => `<option value="${p}">${p}</option>`).join('');
        if (provinces.length) {
            provinceSelect.value = provinces[0];
            state.comprehensive.province = provinces[0];
        }
    }
    await updateCompCitySelect(state.comprehensive.province || provinces[0]);
}

function bindEvents(page, autoLoad = true) {
    const prefix = page === 'comprehensive' ? 'comp' : page;
    if (page !== 'comprehensive' && page !== 'regionTop' && page !== 'regionComp') {
        const projSelect = document.getElementById(`${prefix}-project`);
        if (projSelect) {
            projSelect.addEventListener('change', async (e) => {
                state[page].project = e.target.value;
                if (page === 'season' || page === 'active') {
                    await loadYearOptions(page, e.target.value);
                    if (page === 'season') loadRankingData('season', 'season');
                    else loadRankingData('active', 'active');
                } else if (page === 'region') {
                    await loadRegionYearOptions();
                    loadRegionData();
                }
            });
        }
    }
    const genderSelect = document.getElementById(`${prefix}-gender`);
    if (genderSelect && page !== 'regionComp') {
        genderSelect.addEventListener('change', (e) => {
            state[page].gender = e.target.value;
            if (page === 'season') loadRankingData('season', 'season');
            else if (page === 'active') loadRankingData('active', 'active');
            else if (page === 'region') loadRegionData();
            else if (page === 'regionTop') loadRegionTopData();
        });
    }
    if (prefix !== 'region' && page !== 'comprehensive' && page !== 'regionTop' && page !== 'regionComp') {
        const scopeSelect = document.getElementById(`${prefix}-scope`);
        if (scopeSelect) {
            scopeSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val.startsWith('continent:')) {
                    state[page].continent = val.split(':')[1];
                    state[page].country = '';
                } else if (val.startsWith('country:')) {
                    state[page].country = val.split(':')[1];
                    state[page].continent = '';
                } else {
                    state[page].continent = '';
                    state[page].country = '';
                }
                if (page === 'season') loadRankingData('season', 'season');
                else if (page === 'active') loadRankingData('active', 'active');
            });
        }
    }
    if (page !== 'comprehensive' && page !== 'regionComp') {
        const singleBtn = document.getElementById(`${prefix}-single`);
        const avgBtn = document.getElementById(`${prefix}-average`);
        if (singleBtn) {
            singleBtn.addEventListener('click', () => {
                setType(page, 'single');
                if (page === 'season') loadRankingData('season', 'season');
                else if (page === 'active') loadRankingData('active', 'active');
                else if (page === 'region') loadRegionData();
                else if (page === 'regionTop') loadRegionTopData();
            });
        }
        if (avgBtn) {
            avgBtn.addEventListener('click', () => {
                setType(page, 'average');
                if (page === 'season') loadRankingData('season', 'season');
                else if (page === 'active') loadRankingData('active', 'active');
                else if (page === 'region') loadRegionData();
                else if (page === 'regionTop') loadRegionTopData();
            });
        }
    }
}

function setType(page, type) {
    state[page].type = type;
    const prefix = page === 'comprehensive' ? 'comp' : page;
    const singleBtn = document.getElementById(`${prefix}-single`);
    const avgBtn = document.getElementById(`${prefix}-average`);
    if (type === 'single') {
        singleBtn?.classList.add('btn-warning');
        singleBtn?.classList.remove('btn-primary');
        avgBtn?.classList.add('btn-primary');
        avgBtn?.classList.remove('btn-warning');
    } else {
        avgBtn?.classList.add('btn-warning');
        avgBtn?.classList.remove('btn-primary');
        singleBtn?.classList.add('btn-primary');
        singleBtn?.classList.remove('btn-warning');
    }
}

async function loadPageData(page) {
    if (page === 'season') await loadRankingData('season', 'season');
    else if (page === 'active') await loadRankingData('active', 'active');
    else if (page === 'region') await loadRegionData();
    else if (page === 'comprehensive') await calculateComprehensive();
}

function initCarousel() {
    const slidesContainer = document.querySelector('.banner-slides');
    const prevBtn = document.querySelector('.banner-prev');
    const nextBtn = document.querySelector('.banner-next');
    if (!slidesContainer) return;
    const slides = slidesContainer.children;
    const totalSlides = slides.length;
    if (totalSlides === 0) return;
    let currentIndex = 0;
    let autoTimer;
    function goToSlide(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        currentIndex = index;
        slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
        resetAutoPlay();
    }
    function resetAutoPlay() {
        if (autoTimer) clearInterval(autoTimer);
        autoTimer = setInterval(() => goToSlide(currentIndex + 1), 4000);
    }
    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
    resetAutoPlay();
    goToSlide(0);
}

window.addEventListener('load', async () => {
    await initLanguage();
    bindLanguageSwitch();
    updateDesktopNav();
    const menuIcon = document.getElementById('mobile-menu-icon');
    const mobileNav = document.getElementById('mobile-nav');
    menuIcon.addEventListener('click', () => mobileNav.classList.toggle('show'));
    mobileNav.innerHTML = `
        <a href="#home" class="nav-item" data-page="home">${__('nav.home')}</a>
        <a href="#annual" class="nav-item" data-page="season">${__('nav.season')}</a>
        <a href="#three-year" class="nav-item" data-page="active">${__('nav.active')}</a>
        <a href="#comprehensive" class="nav-item" data-page="comprehensive">${__('nav.comprehensive')}</a>
        <a href="#region" class="nav-item" data-page="region">${__('nav.region')}</a>
        <a href="#regionTop" class="nav-item" data-page="regionTop">${__('nav.regionTop')}</a>
        <a href="#regionComp" class="nav-item" data-page="regionComp">${__('nav.regionComp')}</a>
        <a href="#record" class="nav-item" data-page="record">${__('nav.record')}</a>
    `;
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('show')));
    window.addEventListener('hashchange', handleHash);
    handleHash();
});