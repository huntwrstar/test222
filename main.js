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

// ==================== 年份选择辅助 ====================
async function loadYearOptions(pageKey, project) {
    const yearSelect = document.getElementById(`${pageKey}-year`);
    if (!yearSelect) return;
    const type = state[pageKey].type;
    const years = state.meta?.availableYears?.[project]?.[type] || [];
    const validYears = years.filter(y => typeof y === 'number').sort((a,b)=>b-a);
    if (validYears.length === 0) {
        yearSelect.innerHTML = '<option value="">无数据</option>';
        return;
    }
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
    yearSelect.addEventListener('change', (e) => {
        const newYear = parseInt(e.target.value);
        if (!isNaN(newYear)) {
            state[pageKey].year = newYear;
            if (pageKey === 'season') loadRankingData('season', 'season');
            else if (pageKey === 'active') loadRankingData('active', 'active');
        }
    });
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
        if (tbody) tbody.innerHTML = `<tr><td colspan="6">${__('loading_failed')}</td></tr>`;
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
    const years = state.meta?.availableYears?.[project]?.[type] || [];
    const validYears = years.filter(y => typeof y === 'number').sort((a,b)=>b-a);
    if (validYears.length === 0) {
        yearSelect.innerHTML = '<option value="">无数据</option>';
        return;
    }
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
    yearSelect.addEventListener('change', (e) => {
        const newYear = parseInt(e.target.value);
        if (!isNaN(newYear)) {
            state.region.year = newYear;
            loadRegionData();
        }
    });
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
        if (tbody) tbody.innerHTML = `<tr><td colspan="7">${__('loading_failed')}</td></tr>`;
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
    const years = state.meta?.availableYears?.[project]?.[type] || [];
    const validYears = years.filter(y => typeof y === 'number').sort((a,b)=>b-a);
    if (validYears.length === 0) {
        yearSelect.innerHTML = '<option value="">无数据</option>';
        return;
    }
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
    yearSelect.addEventListener('change', (e) => {
        const newYear = parseInt(e.target.value);
        if (!isNaN(newYear)) {
            state.regionTop.year = newYear;
            loadRegionTopData();
        }
    });
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
        document.getElementById('regionTop-tbody').innerHTML = `<tr><td colspan="7">${__('loading_failed')}</td></tr>`;
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
    const years = state.meta?.availableYears?.[project]?.[type] || [];
    const validYears = years.filter(y => typeof y === 'number').sort((a,b)=>b-a);
    if (validYears.length === 0) {
        yearSelect.innerHTML = '<option value="">无数据</option>';
        return;
    }
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
    yearSelect.addEventListener('change', (e) => {
        const newYear = parseInt(e.target.value);
        if (!isNaN(newYear)) {
            state.regionComp.year = newYear;
            calculateRegionComp();
        }
    });
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
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="loading-cell"><i class="fas fa-spinner"></i> ${__('comp.calculating')}</td></tr>`;
    if (paginationDiv) paginationDiv.innerHTML = '';
    await new Promise(resolve => setTimeout(resolve, 20));
    updateRegionCompCurrentLabel();
    const { dimension, selectedEvents, type, period, year } = state.regionComp;
    if (selectedEvents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">${__('no_data')}</td></tr>`;
        return;
    }
    const projectDataMap = {};
    const groupInfoMap = new Map();
    for (let proj of selectedEvents) {
        try {
            let data = await fetchDataByPeriod(proj, type, period, period === 'historical' ? null : year);
            const ranked = recomputeRanks(data, proj);
            // 按省份/城市聚合所有选手的排名，计算总排名和和人数
            const groupData = {};
            ranked.forEach(item => {
                const key = dimension === 'province' ? item.province : `${item.province}|${item.city}`;
                if (!key || !item.province) return;
                if (!groupData[key]) {
                    groupData[key] = { totalRank: 0, count: 0, province: item.province, city: item.city || '' };
                }
                groupData[key].totalRank += item.rank;
                groupData[key].count++;
            });
            // 存储每个项目的聚合数据
            if (!projectDataMap[proj]) projectDataMap[proj] = {};
            for (let key in groupData) {
                projectDataMap[proj][key] = groupData[key];
                if (!groupInfoMap.has(key)) {
                    groupInfoMap.set(key, {
                        province: groupData[key].province,
                        city: groupData[key].city
                    });
                }
            }
        } catch (e) {
            console.warn(`加载项目 ${proj} 失败`, e);
            projectDataMap[proj] = {};
        }
    }
    const results = [];
    for (let [key, info] of groupInfoMap.entries()) {
        let totalRank = 0;
        let totalCount = 0;
        for (let proj of selectedEvents) {
            const projData = projectDataMap[proj][key];
            if (projData) {
                totalRank += projData.totalRank;
                totalCount += projData.count;
            }
            // 如果该项目在该地区没有选手，不参与排名（跳过）
        }
        // 只有当至少有一个项目有选手时才计入排名
        if (totalCount > 0) {
            results.push({
                groupKey: key,
                province: info.province,
                city: info.city,
                totalRank: totalRank,
                totalCount: totalCount
            });
        }
    }
    // 按总排名和排序（越小越好）
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
        await loadCompYearOptions();  // 重要：切换数据集时重新加载年份
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
    // 判断是否应显示年份下拉框
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

    // 获取第一个选中项目，用于获取可用年份
    const project = state.comprehensive.selectedEvents[0] || '333';
    const type = state.comprehensive.type;
    const years = state.meta?.availableYears?.[project]?.[type] || [];
    const validYears = years.filter(y => typeof y === 'number').sort((a,b)=>b-a);
    if (validYears.length === 0) {
        yearSelect.innerHTML = '<option value="">无数据</option>';
        return;
    }
    let html = '';
    // 根据当前排名类型和子数据集决定年份范围
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
        // 其他情况（historical）隐藏下拉框
        yearSelect.style.display = 'none';
        return;
    }
    yearSelect.addEventListener('change', (e) => {
        const newYear = parseInt(e.target.value);
        if (!isNaN(newYear)) {
            state.comprehensive.year = newYear;
            calculateComprehensive();
        }
    });
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
        if (tbody) tbody.innerHTML = `<tr><td colspan="5">${__('comp.select_events')}</td></tr>`;
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
            else period = subDataset; // historical / season / active
            // 修正：只要 period 不是 historical，就传入年份
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
            console.log(`项目 ${proj} 处理完成，有效选手数: ${data.length}`);
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

async function initRecord() {
    await loadMeta();
    // 加载年份选项
    const yearSelect = document.getElementById('record-year');
    if (yearSelect) {
        const allYears = state.meta?.availableYears?.['333']?.['single'] || [];
        const validYears = allYears.filter(y => typeof y === 'number').sort((a,b)=>b-a);
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
            yearSelect.addEventListener('change', (e) => {
                state.record.year = parseInt(e.target.value);
                loadRecordData();
            });
        } else {
            yearSelect.innerHTML = '<option value="">无数据</option>';
        }
    }

    if (!state.record.dataLoaded) await loadAllRecordsData();
    const provinceSelect = document.getElementById('record-province');
    if (provinceSelect && state.record.allProvinces.length) {
        provinceSelect.innerHTML = state.record.allProvinces.map(p => `<option value="${p}">${p}</option>`).join('');
        if (state.record.allProvinces.includes(state.record.province))
            provinceSelect.value = state.record.province;
        else {
            provinceSelect.value = state.record.allProvinces[0];
            state.record.province = state.record.allProvinces[0];
        }
    }
    updateRecordCitySelect(state.record.province);
    const genderSelect = document.getElementById('record-gender');
    if (genderSelect) genderSelect.value = state.record.gender;
    provinceSelect?.addEventListener('change', (e) => {
        state.record.province = e.target.value;
        state.record.city = '全部城市';
        updateRecordCitySelect(state.record.province);
        loadRecordData();
    });
    const citySelect = document.getElementById('record-city');
    citySelect?.addEventListener('change', (e) => { state.record.city = e.target.value; loadRecordData(); });
    genderSelect?.addEventListener('change', (e) => { state.record.gender = e.target.value; loadRecordData(); });
    document.getElementById('record-refresh')?.addEventListener('click', () => { loadRecordData(); });
    await loadRecordData();
}

async function loadAllRecordsData() {
    if (state.record.dataLoaded) return;
    state.record.loading = true;
    const rawDataByProject = {};
    for (let proj of PROJECT_LIST) {
        const code = proj.code;
        rawDataByProject[code] = { single: [], average: [] };
        try {
            const single = await fetchAllHistorical(code, 'single');
            const avg = await fetchAllHistorical(code, 'average');
            rawDataByProject[code].single = single;
            rawDataByProject[code].average = avg;
        } catch (e) {
            console.warn(`加载项目 ${code} 历史数据失败`, e);
        }
    }
    state.record.rawDataByProject = rawDataByProject;
    const provinceSet = new Set();
    const citiesMap = {};
    for (let proj in rawDataByProject) {
        ['single', 'average'].forEach(type => {
            rawDataByProject[proj][type].forEach(item => {
                if (item.province) provinceSet.add(item.province);
                if (item.province && item.city) {
                    if (!citiesMap[item.province]) citiesMap[item.province] = new Set();
                    citiesMap[item.province].add(item.city);
                }
            });
        });
    }
    let provinces = Array.from(provinceSet).sort((a,b) => a.localeCompare(b, 'zh'));
    const shenshouIndex = provinces.indexOf('神手谷');
    if (shenshouIndex > -1) {
        provinces.splice(shenshouIndex, 1);
        provinces.unshift('神手谷');
    }
    state.record.allProvinces = provinces;
    state.record.provinceCities = {};
    for (let p in citiesMap) {
        state.record.provinceCities[p] = Array.from(citiesMap[p]).sort((a,b) => a.localeCompare(b, 'zh'));
    }
    state.record.dataLoaded = true;
    console.log('省市纪录原始数据加载完成，省份列表：', state.record.allProvinces);
    state.record.loading = false;
}

function extractCitiesFromRawData(province) {
    if (!state.record.dataLoaded) return [];
    const citiesSet = new Set();
    for (let proj in state.record.rawDataByProject) {
        ['single', 'average'].forEach(type => {
            (state.record.rawDataByProject[proj][type] || []).forEach(item => {
                if (item.province === province && item.city) citiesSet.add(item.city);
            });
        });
    }
    return Array.from(citiesSet).sort((a,b) => a.localeCompare(b, 'zh'));
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
        const cities = extractCitiesFromRawData(province);
        let options = '<option value="全部城市">全省</option>';
        cities.forEach(c => options += `<option value="${c}">${c}</option>`);
        citySelect.innerHTML = options;
        if (!cities.includes(state.record.city) && state.record.city !== '全部城市') {
            state.record.city = '全部城市';
        }
        citySelect.value = state.record.city;
    }
}

function computeAllBestRecords(province, city, gender, year) {
    const result = {};
    for (let proj of PROJECT_LIST) {
        const projCode = proj.code;
        const singleList = (state.record.rawDataByProject[projCode]?.single || []).filter(item => {
            const itemYear = item.date ? parseInt(item.date.split('-')[0]) : null;
            return itemYear === year;
        });
        const avgList = (state.record.rawDataByProject[projCode]?.average || []).filter(item => {
            const itemYear = item.date ? parseInt(item.date.split('-')[0]) : null;
            return itemYear === year;
        });
        const filterFn = (item) => {
            if (item.province !== province) return false;
            if (city !== '全部城市' && item.city !== city) return false;
            if (gender !== 'all' && item.gender !== gender) return false;
            return true;
        };
        const filteredSingle = singleList.filter(filterFn);
        const filteredAvg = avgList.filter(filterFn);
        let bestSingleVal = (projCode === '333mbf') ? -Infinity : Infinity;
        let bestAvgVal = Infinity;
        if (projCode === '333mbf') {
            filteredSingle.forEach(item => {
                const parsed = parseMBF(item.result);
                if (!parsed) return;
                const score = parsed.success - parsed.fail;
                if (score > bestSingleVal) bestSingleVal = score;
            });
        } else {
            filteredSingle.forEach(item => {
                const val = parseTime(item.result);
                if (val < bestSingleVal) bestSingleVal = val;
            });
            filteredAvg.forEach(item => {
                const val = parseTime(item.result);
                if (val < bestAvgVal) bestAvgVal = val;
            });
        }
        const bestSingles = [];
        const bestAvgs = [];
        if (projCode === '333mbf') {
            filteredSingle.forEach(item => {
                const parsed = parseMBF(item.result);
                if (parsed && (parsed.success - parsed.fail) === bestSingleVal) bestSingles.push(item);
            });
        } else {
            filteredSingle.forEach(item => {
                if (parseTime(item.result) === bestSingleVal) bestSingles.push(item);
            });
            filteredAvg.forEach(item => {
                if (parseTime(item.result) === bestAvgVal) bestAvgs.push(item);
            });
        }
        result[projCode] = { single: bestSingles, average: bestAvgs };
    }
    return result;
}

async function loadRecordData() {
    const tbody = document.getElementById('record-tbody');
    if (!tbody) return;
    if (!state.record.dataLoaded) {
        tbody.innerHTML = `<tr><td colspan="6" class="loading-cell"><i class="fas fa-spinner"></i> ${__('loading')}</td></tr>`;
        return;
    }
    const province = state.record.province;
    const city = state.record.city;
    const gender = state.record.gender;
    const year = state.record.year;
    document.getElementById('record-current-year').textContent = year;
    document.getElementById('record-current-province').textContent = province;
    let displayCity = (city === '全部城市') ? '全省' : city;
    document.getElementById('record-current-city').textContent = displayCity;
    let genderText = '所有';
    if (gender === '男') genderText = '男';
    else if (gender === '女') genderText = '女';
    else if (gender === '未知') genderText = '未知';
    document.getElementById('record-current-gender').textContent = genderText;
    tbody.innerHTML = `<tr><td colspan="6" class="loading-cell"><i class="fas fa-spinner"></i> ${__('loading')}<span class="loading-dots"></span></td></tr>`;
    await new Promise(resolve => setTimeout(resolve, 20));
    const bestMap = computeAllBestRecords(province, city, gender, year);
    let html = '';
    for (let proj of PROJECT_LIST) {
        const projBest = bestMap[proj.code] || { single: [], average: [] };
        const singleList = projBest.single;
        const avgList = projBest.average;
        html += `<tr class="region-cell"><td colspan="6">${proj.name}</td></tr>`;
        if (singleList.length === 0 && avgList.length === 0) {
            html += `<tr><td colspan="6" class="empty-cell">${__('record.no_record')}</td></tr>`;
        } else {
            singleList.forEach(rec => {
                const displayName = extractChineseName(rec.name);
                html += `<tr>
                    <td></td>
                    <td>${formatResult(rec.result)}</td>
                    <td></td>
                    <td>${displayName}</td>
                    <td>${rec.competition || ''}</td>
                    <td>${rec.date || ''}</td>
                </tr>`;
            });
            avgList.forEach(rec => {
                const displayName = extractChineseName(rec.name);
                html += `<tr>
                    <td></td>
                    <td></td>
                    <td>${formatResult(rec.result)}</td>
                    <td>${displayName}</td>
                    <td>${rec.competition || ''}</td>
                    <td>${rec.date || ''}</td>
                </tr>`;
            });
        }
    }
    tbody.innerHTML = html || `<tr><td colspan="6">${__('no_data')}</td></tr>`;
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