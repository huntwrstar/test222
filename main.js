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
    if (select) {
        select.value = state.currentLang;
    }
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
    select.addEventListener('change', (e) => {
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
        if (state.currentPage) {
            loadPage(state.currentPage);
        }
    });
}

async function loadPage(page) {
    console.log(`切换到页面: ${page}`);
    state.currentPage = page;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll(`[data-page="${page}"]`).forEach(el => el.classList.add('active'));

    const app = document.getElementById('app');
    switch(page) {
        case 'home': app.innerHTML = renderHome(); break;
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

async function initSeason() {
    await loadMeta();
    populateScopeSelect('season-scope', state.season.scope);
    const projSelect = document.getElementById('season-project');
    if (projSelect) projSelect.value = state.season.project;
    const genderSelect = document.getElementById('season-gender');
    if (genderSelect) genderSelect.value = state.season.gender;
    bindEvents('season', false);
    await loadPageData('season');
}

async function initActive() {
    await loadMeta();
    populateScopeSelect('active-scope', state.active.scope);
    const projSelect = document.getElementById('active-project');
    if (projSelect) projSelect.value = state.active.project;
    const genderSelect = document.getElementById('active-gender');
    if (genderSelect) genderSelect.value = state.active.gender;
    bindEvents('active', false);
    await loadPageData('active');
}

async function initRegion() {
    await loadMeta();
    const radios = document.querySelectorAll('input[name="region-period"]');
    radios.forEach(r => {
        if (r.value === state.region.period) r.checked = true;
        r.addEventListener('change', (e) => {
            state.region.period = e.target.value;
        });
    });

    try {
        const historicalData = await fetchJSON(`data/region/historical/single/333.json`);
        console.log(`构建省份列表，数据条数: ${historicalData.length}`);
        const allRecords = historicalData;
        const provinceSet = new Set();
        const cityMap = {};
        allRecords.forEach(r => {
            if (r.province) {
                provinceSet.add(r.province);
                if (r.city) {
                    if (!cityMap[r.province]) cityMap[r.province] = new Set();
                    cityMap[r.province].add(r.city);
                }
            }
        });
        let provinces = Array.from(provinceSet).sort((a, b) => a.localeCompare(b, 'zh'));
        const shenshouIndex = provinces.indexOf('神手谷');
        if (shenshouIndex > -1) {
            provinces.splice(shenshouIndex, 1);
            provinces.unshift('神手谷');
        }
        state.region.allProvinces = provinces;
        state.region.provinceCities = {};
        for (let p in cityMap) {
            state.region.provinceCities[p] = Array.from(cityMap[p]).sort((a, b) => a.localeCompare(b, 'zh'));
        }
        console.log('省份列表:', state.region.allProvinces);
    } catch (e) {
        console.warn('无法构建省份城市列表', e);
        state.region.allProvinces = [];
        state.region.provinceCities = {};
    }

    const provinceSelect = document.getElementById('region-province');
    if (provinceSelect) {
        provinceSelect.innerHTML = state.region.allProvinces.map(p => `<option value="${p}">${p}</option>`).join('');
        if (state.region.allProvinces.includes('北京')) {
            provinceSelect.value = '北京';
            state.region.province = '北京';
        } else if (state.region.allProvinces.length > 0) {
            provinceSelect.value = state.region.allProvinces[0];
            state.region.province = state.region.allProvinces[0];
        }
    }

    updateRegionCitySelect(state.region.province);

    const projectSelect = document.getElementById('region-project');
    if (projectSelect) projectSelect.value = state.region.project;
    const genderSelect = document.getElementById('region-gender');
    if (genderSelect) genderSelect.value = state.region.gender;

    bindEvents('region', false);

    if (provinceSelect) {
        provinceSelect.addEventListener('change', (e) => {
            state.region.province = e.target.value;
            updateRegionCitySelect(state.region.province);
        });
    }

    const citySelect = document.getElementById('region-city');
    if (citySelect) {
        citySelect.addEventListener('change', (e) => {
            state.region.city = e.target.value;
        });
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

async function initRegionTop() {
    await loadMeta();
    const dimSelect = document.getElementById('regionTop-dimension');
    if (dimSelect) {
        dimSelect.value = state.regionTop.dimension;
        dimSelect.addEventListener('change', (e) => {
            state.regionTop.dimension = e.target.value;
            updateRegionTopCurrentLabel(); // 只更新标签，不清空表格
        });
    }

    const periodRadios = document.querySelectorAll('input[name="regionTop-period"]');
    periodRadios.forEach(r => {
        if (r.value === state.regionTop.period) r.checked = true;
        r.addEventListener('change', (e) => {
            state.regionTop.period = e.target.value;
            updateRegionTopCurrentLabel(); // 只更新标签，不清空表格
        });
    });

    const projSelect = document.getElementById('regionTop-project');
    if (projSelect) {
        projSelect.value = state.regionTop.project;
        projSelect.addEventListener('change', (e) => {
            state.regionTop.project = e.target.value;
            updateRegionTopCurrentLabel(); // 只更新标签，不清空表格
        });
    }

    const genderSelect = document.getElementById('regionTop-gender');
    if (genderSelect) {
        genderSelect.value = state.regionTop.gender;
        genderSelect.addEventListener('change', (e) => {
            state.regionTop.gender = e.target.value;
            updateRegionTopCurrentLabel(); // 只更新标签，不清空表格
        });
    }

    document.getElementById('regionTop-single').addEventListener('click', () => {
        setType('regionTop', 'single');
        loadRegionTopData(); // 点击按钮才加载数据
    });
    document.getElementById('regionTop-average').addEventListener('click', () => {
        setType('regionTop', 'average');
        loadRegionTopData(); // 点击按钮才加载数据
    });

    // 初始加载数据
    await loadRegionTopData();
}

// 辅助函数：更新当前信息标签（如果尚未定义，请确保此函数存在）
function updateRegionTopCurrentLabel() {
    const { dimension, project, type, period } = state.regionTop;
    let periodText = '';
    if (period === 'historical') periodText = __('current.historical');
    else if (period === 'season') periodText = __('current.season');
    else periodText = __('current.active');

    document.getElementById('regionTop-current').innerText = 
        `${dimension === 'province' ? __('dimension.province') : __('dimension.city')} · ${periodText} · ${getProjectName(project)} · ${type === 'single' ? __('btn.single') : __('btn.average')}`;
}

async function loadRegionTopData() {
    if (state.currentPage !== 'regionTop') return;
    showPageLoading('regionTop');
    const { dimension, project, type, gender, period } = state.regionTop;
    let periodText = '';
    if (period === 'historical') periodText = __('current.historical');
    else if (period === 'season') periodText = __('current.season');
    else periodText = __('current.active');
    document.getElementById('regionTop-current').innerText = 
        `${dimension === 'province' ? __('dimension.province') : __('dimension.city')} · ${periodText} · ${getProjectName(project)} · ${type === 'single' ? __('btn.single') : __('btn.average')}`;

    try {
        let data = await fetchJSON(`data/region/${period}/${type}/${project}.json`);
        data = applyGenderFilter(data, gender);

        // 新增：按选手去重，保留成绩最好且日期最早的一条
        data = deduplicateByBestAndDate(data, project);

        const groups = {};
        data.forEach(item => {
            const key = dimension === 'province' ? item.province : `${item.province}|${item.city}`;
            if (!key) return;
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
            if (i === 0) {
                topList[i].displayRank = rank;
                continue;
            }
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
        document.getElementById('regionTop-tbody').innerHTML = '<tr><td colspan="7">' + __('loading_failed') + '</td></tr>';
    }
}

async function initRegionComp() {
    await loadMeta();
    const dimSelect = document.getElementById('regionComp-dimension');
    if (dimSelect) {
        dimSelect.value = state.regionComp.dimension;
        dimSelect.addEventListener('change', (e) => {
            state.regionComp.dimension = e.target.value;
            updateRegionCompCurrentLabel(); // 只更新标签，不清空表格
        });
    }

    const periodRadios = document.querySelectorAll('input[name="regionComp-period"]');
    periodRadios.forEach(r => {
        if (r.value === state.regionComp.period) r.checked = true;
        r.addEventListener('change', (e) => {
            state.regionComp.period = e.target.value;
            updateRegionCompCurrentLabel(); // 只更新标签，不清空表格
        });
    });

    renderRegionCompProjectTags();

    document.getElementById('regionComp-single').addEventListener('click', () => {
        setType('regionComp', 'single');
        calculateRegionComp(); // 点击时重新计算
    });
    document.getElementById('regionComp-average').addEventListener('click', () => {
        setType('regionComp', 'average');
        calculateRegionComp(); // 点击时重新计算
    });

    await calculateRegionComp(); // 初始加载
}

async function calculateRegionComp() {
    if (state.currentPage !== 'regionComp') return;
    const tbody = document.getElementById('regionComp-tbody');
    const paginationDiv = document.getElementById('regionComp-pagination');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="loading-cell"><i class="fas fa-spinner"></i> ' + __('comp.calculating') + '</td></tr>';
    if (paginationDiv) paginationDiv.innerHTML = '';

    await new Promise(resolve => setTimeout(resolve, 20));

    updateRegionCompCurrentLabel();

    const { dimension, selectedEvents, type, period } = state.regionComp;
    if (selectedEvents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">' + __('no_data') + '</td></tr>';
        return;
    }

    const projectDataMap = {};
    const groupInfoMap = new Map();

    for (let proj of selectedEvents) {
        try {
            const url = `data/region/${period}/${type}/${proj}.json`;
            let data = await fetchJSON(url);
            const ranked = recomputeRanks(data, proj);
            const maxRank = ranked.length;

            const groupRank = {};
            ranked.forEach(item => {
                const key = dimension === 'province' ? item.province : `${item.province}|${item.city}`;
                if (!key) return;
                const rank = item.rank;
                if (!groupRank[key] || rank < groupRank[key]) {
                    groupRank[key] = rank;
                }
                if (!groupInfoMap.has(key)) {
                    groupInfoMap.set(key, {
                        province: item.province || '',
                        city: dimension === 'city' ? item.city || '' : ''
                    });
                }
            });

            projectDataMap[proj] = {
                rankMap: groupRank,
                maxRank: maxRank
            };
        } catch (e) {
            console.warn(`加载项目 ${proj} 失败`, e);
            projectDataMap[proj] = { rankMap: {}, maxRank: 0 };
        }
    }

    const results = [];
    for (let [key, info] of groupInfoMap.entries()) {
        let totalRank = 0;
        let count = 0;
        for (let proj of selectedEvents) {
            const projData = projectDataMap[proj];
            const rank = projData.rankMap[key];
            if (rank !== undefined) {
                totalRank += rank;
                count++;
            } else {
                totalRank += (projData.maxRank + 1);
            }
        }
        results.push({
            groupKey: key,
            province: info.province,
            city: info.city,
            totalRank: totalRank,
            eventCount: count
        });
    }

    results.sort((a, b) => a.totalRank - b.totalRank);

    let rank = 1, sameCount = 0;
    const rankedResults = results.map((item, idx) => {
        if (idx === 0) {
            item.displayRank = rank;
        } else {
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

    // 调用 ui.js 中的渲染函数
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

    sourceSelect?.addEventListener('change', (e) => {
        state.comprehensive.source = e.target.value;
        toggleCompFilters(e.target.value);
        updateCompCurrentLabel();
    });

    document.getElementById('comp-scope')?.addEventListener('change', (e) => {
        state.comprehensive.scope = e.target.value;
        updateCompCurrentLabel();
    });

    document.getElementById('comp-dataset')?.addEventListener('change', (e) => {
        state.comprehensive.subDataset = e.target.value;
        updateCompCurrentLabel();
    });

    document.getElementById('comp-province')?.addEventListener('change', async (e) => {
        state.comprehensive.province = e.target.value;
        await updateCompCitySelect(state.comprehensive.province);
        updateCompCurrentLabel();
    });

    document.getElementById('comp-city')?.addEventListener('change', (e) => {
        state.comprehensive.city = e.target.value;
        updateCompCurrentLabel();
    });

    document.getElementById('comp-gender')?.addEventListener('change', (e) => {
        state.comprehensive.gender = e.target.value;
        updateCompCurrentLabel();
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

async function initRecord() {
    if (!state.record.dataLoaded) {
        await loadAllRecordsData();
    }

    const provinceSelect = document.getElementById('record-province');
    if (provinceSelect && state.record.allProvinces.length > 0) {
        provinceSelect.innerHTML = state.record.allProvinces.map(p => `<option value="${p}">${p}</option>`).join('');
        if (state.record.province && state.record.allProvinces.includes(state.record.province)) {
            provinceSelect.value = state.record.province;
        } else {
            provinceSelect.value = state.record.allProvinces[0];
            state.record.province = state.record.allProvinces[0];
        }
    }

    updateRecordCitySelect(state.record.province);

    const genderSelect = document.getElementById('record-gender');
    if (genderSelect) {
        genderSelect.value = state.record.gender;
    }

    provinceSelect?.addEventListener('change', (e) => {
        state.record.province = e.target.value;
        state.record.city = '全部城市';
        updateRecordCitySelect(state.record.province);
    });

    const citySelect = document.getElementById('record-city');
    citySelect?.addEventListener('change', (e) => {
        state.record.city = e.target.value;
    });

    genderSelect?.addEventListener('change', (e) => {
        state.record.gender = e.target.value;
    });

    document.getElementById('record-refresh')?.addEventListener('click', () => {
        loadRecordData();
    });

    await loadRecordData();
}

async function loadPageData(page) {
    if (page === 'season') loadSeasonData();
    else if (page === 'active') loadActiveData();
    else if (page === 'region') loadRegionData();
    else if (page === 'comprehensive') calculateComprehensive();
}

async function loadSeasonData() {
    if (state.currentPage !== 'season') return;
    showPageLoading('season');
    const { project, type, gender, continent, country } = state.season;
    updateCurrentLabels('season', project, type);
    try {
        let data = await fetchJSON(`data/season/${type}/${project}.json`);
        console.log(`赛季数据原始条数: ${data.length}`);
        data = applyGenderFilter(data, gender);
        console.log(`赛季数据性别筛选后: ${data.length}`);
        data = applyScopeFilter(data, continent, country);
        console.log(`赛季数据范围筛选后: ${data.length}`);
        renderTable('season', data, project);
    } catch (e) {
        console.error(e);
        const tbody = document.getElementById('season-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6">数据加载失败</td></tr>';
    }
}

async function loadActiveData() {
    if (state.currentPage !== 'active') return;
    showPageLoading('active');
    const { project, type, gender, continent, country } = state.active;
    updateCurrentLabels('active', project, type);
    try {
        let data = await fetchJSON(`data/active/${type}/${project}.json`);
        console.log(`现役数据原始条数: ${data.length}`);
        data = applyGenderFilter(data, gender);
        console.log(`现役数据性别筛选后: ${data.length}`);
        data = applyScopeFilter(data, continent, country);
        console.log(`现役数据范围筛选后: ${data.length}`);
        renderTable('active', data, project);
    } catch (e) {
        console.error(e);
        const tbody = document.getElementById('active-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6">数据加载失败</td></tr>';
    }
}

async function loadRegionData() {
    if (state.currentPage !== 'region') return;
    showPageLoading('region');
    const { period, project, type, gender, province, city } = state.region;
    document.getElementById('region-current-project').textContent = getProjectName(project);
    document.getElementById('region-current-type').textContent = type === 'single' ? '单次' : '平均';
    document.getElementById('region-current-period').textContent = 
        period === 'historical' ? '所有' : (period === 'season' ? '年度' : '近三年度');

    const thead = document.querySelector('#region-table thead');
    if (thead) {
        thead.innerHTML = `<tr>
            <th>排名</th>
            <th>姓名</th>
            <th>省份</th>
            <th>城市</th>
            <th>成绩</th>
            <th>比赛</th>
            <th>WCA ID</th>
        </tr>`;
    }

    try {
        let data = await fetchJSON(`data/region/${period}/${type}/${project}.json`);
        console.log(`省市数据原始条数: ${data.length}`);
        data = applyGenderFilter(data, gender);
        console.log(`省市数据性别筛选后: ${data.length}`);
        if (province) {
            data = data.filter(d => d.province === province);
            console.log(`省市数据省份筛选后 (${province}): ${data.length}`);
        }
        if (city === '全部城市') {
        } else if (city) {
            data = data.filter(d => d.city === city);
            console.log(`省市数据城市筛选后 (${city}): ${data.length}`);
        }
        
        // 新增：按选手去重，保留成绩最好且日期最早的一条
        data = deduplicateByBestAndDate(data, project);
        console.log(`去重后数据条数: ${data.length}`);

        renderTable('region', data, project);
    } catch (e) {
        console.error(e);
        const tbody = document.getElementById('region-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7">数据加载失败</td></tr>';
    }
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

    const { source, subDataset, scope, selectedEvents, gender, province, city, type } = state.comprehensive;
    if (selectedEvents.length === 0) {
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (tbody) tbody.innerHTML = '<tr><td colspan="5">请至少选择一个项目</td></tr>';
        return;
    }

    const projectDataMap = {};
    const personInfoMap = new Map();

    console.log(`综合排名开始计算，数据源: ${source}, 子类型: ${subDataset}, 项目: ${selectedEvents.join(',')}`);

    for (let proj of selectedEvents) {
        try {
            let basePath;
            if (source === 'season') basePath = `data/season/${type}`;
            else if (source === 'active') basePath = `data/active/${type}`;
            else basePath = `data/region/${subDataset}/${type}`;

            const url = `${basePath}/${proj}.json`;
            console.log(`加载项目 ${proj} 数据: ${url}`);
            let data = await fetchJSON(url);

            if (gender !== 'all') {
                data = data.filter(d => d.gender === gender);
                console.log(`项目 ${proj} 性别筛选后: ${data.length}`);
            }

            if (source !== 'province') {
                const [scopeType, scopeValue] = scope.split(':');
                if (scopeType === 'continent') {
                    data = data.filter(d => applyContinentFilter(d.country, scopeValue));
                    console.log(`项目 ${proj} 范围筛选(洲)后: ${data.length}`);
                } else if (scopeType === 'country') {
                    data = data.filter(d => d.country === scopeValue);
                    console.log(`项目 ${proj} 范围筛选(国家)后: ${data.length}`);
                }
            } else {
                if (province) {
                    data = data.filter(d => d.province === province);
                    console.log(`项目 ${proj} 省份筛选后: ${data.length}`);
                }
                if (city !== '全部城市' && city) {
                    data = data.filter(d => d.city === city);
                    console.log(`项目 ${proj} 城市筛选后: ${data.length}`);
                }
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
            ranked.forEach(item => {
                rankMap[item.wcaid] = item.rank;
            });
            projectDataMap[proj] = {
                rankMap: rankMap,
                maxRank: data.length
            };
            console.log(`项目 ${proj} 处理完成，有效选手数: ${data.length}, 最大排名: ${data.length}`);
        } catch (e) {
            console.warn(`加载项目 ${proj} 失败`, e);
            projectDataMap[proj] = {
                rankMap: {},
                maxRank: 0
            };
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
    if (elapsed < 500) {
        await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
    }

    if (loadingDiv) loadingDiv.style.display = 'none';

    renderComprehensiveTable(rankedResults);
}

function renderComprehensiveTable(data) {
    const table = document.getElementById('comp-table');
    if (!table) return;
    const thead = table.querySelector('thead');
    const tbody = document.getElementById('comp-tbody');
    if (!thead || !tbody) return;

    const source = state.comprehensive.source;
    let theadHtml = '<tr><th>排名</th><th>姓名</th>';
    if (source === 'province') {
        theadHtml += '<th>省份</th><th>城市</th>';
    } else {
        theadHtml += '<th>国家</th>';
    }
    theadHtml += '<th>参与项目数</th><th>排名总和</th></tr>';
    thead.innerHTML = theadHtml;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${source === 'province' ? 6 : 5}">暂无数据</td></tr>`;
        return;
    }

    state.pagination.data = data;
    state.pagination.totalPages = Math.ceil(data.length / 100);
    state.pagination.currentPage = 1;

    const pageData = paginate(data, 1);
    renderCompTableBody(tbody, pageData);

    const onPageChange = (newPage) => {
        state.pagination.currentPage = newPage;
        const newPageData = paginate(data, newPage);
        renderCompTableBody(tbody, newPageData);
        renderPagination('comp-pagination', state.pagination.totalPages, newPage, onPageChange);
    };

    renderPagination('comp-pagination', state.pagination.totalPages, 1, onPageChange);
}

async function loadAllRecordsData() {
    if (state.record.dataLoaded) return;
    state.record.loading = true;

    const rawDataByProject = {};
    PROJECT_LIST.forEach(p => {
        rawDataByProject[p.code] = { single: [], average: [] };
    });

    const singlePromises = PROJECT_LIST.map(p =>
        fetchJSON(`data/region/historical/single/${p.code}.json`).catch(() => [])
    );
    const avgPromises = PROJECT_LIST.map(p =>
        fetchJSON(`data/region/historical/average/${p.code}.json`).catch(() => [])
    );

    try {
        const singles = await Promise.all(singlePromises);
        const averages = await Promise.all(avgPromises);

        PROJECT_LIST.forEach((p, idx) => {
            rawDataByProject[p.code].single = singles[idx] || [];
            rawDataByProject[p.code].average = averages[idx] || [];
        });

        state.record.rawDataByProject = rawDataByProject;

        const provinceSet = new Set();
        for (let proj in rawDataByProject) {
            ['single', 'average'].forEach(type => {
                rawDataByProject[proj][type].forEach(item => {
                    if (item.province) provinceSet.add(item.province);
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
        state.record.dataLoaded = true;
        console.log('省市纪录原始数据加载完成，省份列表：', state.record.allProvinces);
    } catch (e) {
        console.error('加载省市纪录原始数据失败', e);
    } finally {
        state.record.loading = false;
    }
}

function extractCitiesFromRawData(province) {
    if (!state.record.dataLoaded) return [];
    const citiesSet = new Set();
    for (let proj in state.record.rawDataByProject) {
        ['single', 'average'].forEach(type => {
            const list = state.record.rawDataByProject[proj][type] || [];
            list.forEach(item => {
                if (item.province === province && item.city) {
                    citiesSet.add(item.city);
                }
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

function computeAllBestRecords(province, city, gender) {
    const result = {};
    for (let proj of PROJECT_LIST) {
        const projCode = proj.code;
        const singleList = state.record.rawDataByProject[projCode]?.single || [];
        const avgList = state.record.rawDataByProject[projCode]?.average || [];

        const filterFn = (item) => {
            if (item.province !== province) return false;
            if (city !== '全部城市' && item.city !== city) return false;
            if (gender !== 'all' && item.gender !== gender) return false;
            return true;
        };

        const filteredSingle = singleList.filter(filterFn);
        const filteredAvg = avgList.filter(filterFn);

        let bestSingleVal = Infinity, bestAvgVal = Infinity;
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
                if (parsed && (parsed.success - parsed.fail) === bestSingleVal) {
                    bestSingles.push(item);
                }
            });
        } else {
            filteredSingle.forEach(item => {
                if (parseTime(item.result) === bestSingleVal) bestSingles.push(item);
            });
            filteredAvg.forEach(item => {
                if (parseTime(item.result) === bestAvgVal) bestAvgs.push(item);
            });
        }

        result[projCode] = {
            single: bestSingles,
            average: bestAvgs
        };
    }
    return result;
}

async function loadRecordData() {
    const tbody = document.getElementById('record-tbody');
    if (!tbody) return;
    if (!state.record.dataLoaded) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell"><i class="fas fa-spinner"></i> 数据未就绪</td></tr>';
        return;
    }

    const province = state.record.province;
    const city = state.record.city;
    const gender = state.record.gender;

    document.getElementById('record-current-province').textContent = province;
    let displayCity = (city === '全部城市') ? '全省' : city;
    document.getElementById('record-current-city').textContent = displayCity;
    let genderText = '所有';
    if (gender === '男') genderText = '男';
    else if (gender === '女') genderText = '女';
    else if (gender === '未知') genderText = '未知';
    document.getElementById('record-current-gender').textContent = genderText;

    tbody.innerHTML = '<tr><td colspan="6" class="loading-cell"><i class="fas fa-spinner"></i> 加载纪录表<span class="loading-dots"></span></td></tr>';
    await new Promise(resolve => setTimeout(resolve, 20));

    const bestMap = computeAllBestRecords(province, city, gender);
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
    tbody.innerHTML = html || '<tr><td colspan="6">暂无数据</td></tr>';
}

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
    continents.forEach(c => {
        html += `<option value="continent:${c.code}">${c.name}</option>`;
    });
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
        cities.forEach(c => {
            options += `<option value="${c}">${c}</option>`;
        });
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
        const data = await fetchJSON(`data/region/historical/single/333.json`);
        const cities = [...new Set(data.filter(d => d.province === province).map(d => d.city).filter(c => c))].sort();
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
    try {
        const data = await fetchJSON(`data/region/historical/single/333.json`);
        let provinces = [...new Set(data.map(d => d.province).filter(p => p))].sort((a, b) => a.localeCompare(b, 'zh'));
        const shenshouIndex = provinces.indexOf('神手谷');
        if (shenshouIndex > -1) {
            provinces.splice(shenshouIndex, 1);
            provinces.unshift('神手谷');
        }
        const provinceSelect = document.getElementById('comp-province');
        if (provinceSelect) {
            provinceSelect.innerHTML = provinces.map(p => `<option value="${p}">${p}</option>`).join('');
            if (provinces.length > 0) {
                provinceSelect.value = provinces[0];
                state.comprehensive.province = provinces[0];
            }
        }
        await updateCompCitySelect(state.comprehensive.province || provinces[0]);
    } catch (e) {
        console.warn('加载省份列表失败', e);
    }
}

function bindEvents(page, autoLoad = true) {
    const prefix = page === 'comprehensive' ? 'comp' : page;
    if (page !== 'comprehensive' && page !== 'regionTop' && page !== 'regionComp') {
        const projSelect = document.getElementById(`${prefix}-project`);
        if (projSelect) {
            projSelect.addEventListener('change', (e) => {
                state[page].project = e.target.value;
            });
        }
    }
    const genderSelect = document.getElementById(`${prefix}-gender`);
    if (genderSelect && page !== 'regionComp') {
        genderSelect.addEventListener('change', (e) => {
            state[page].gender = e.target.value;
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
            });
        }
    }
    if (page !== 'comprehensive' && page !== 'regionComp') {
        const singleBtn = document.getElementById(`${prefix}-single`);
        const avgBtn = document.getElementById(`${prefix}-average`);
        if (singleBtn) {
            singleBtn.addEventListener('click', () => {
                setType(page, 'single');
                loadPageData(page);
            });
        }
        if (avgBtn) {
            avgBtn.addEventListener('click', () => {
                setType(page, 'average');
                loadPageData(page);
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