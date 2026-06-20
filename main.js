// ==================== 语言检测与初始化 ====================
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

// ==================== 导航更新 ====================
function updateDesktopNav() {
    const desktopNav = document.getElementById('desktop-nav');
    if (!desktopNav) return;
    desktopNav.innerHTML = `
        <a href="#home" class="nav-item" data-page="home">${__('nav.home')}</a>
        <a href="#annual" class="nav-item" data-page="season">${__('nav.season')}</a>
        <a href="#three-year" class="nav-item" data-page="active">${__('nav.active')}</a>
        <a href="#comprehensive" class="nav-item" data-page="comprehensive">${__('nav.comprehensive')}</a>
        <a href="#region" class="nav-item" data-page="region">${__('nav.region')}</a>
        <a href="#record" class="nav-item" data-page="record">${__('nav.record')}</a>
        <div class="nav-dropdown">
            <span class="nav-item dropdown-toggle">天赋测试</span>
            <div class="dropdown-menu">
                <a href="test1.html" class="dropdown-item">反应速度</a>
                <a href="test2.html" class="dropdown-item">手眼协调</a>
            </div>
        </div>
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
                <a href="#record" class="nav-item" data-page="record">${__('nav.record')}</a>
                <div class="nav-dropdown">
                    <span class="nav-item dropdown-toggle">天赋测试</span>
                    <div class="dropdown-menu">
                        <a href="test1.html" class="dropdown-item">反应速度</a>
                        <a href="test2.html" class="dropdown-item">手眼协调</a>
                    </div>
                </div>
            `;
            const dropdowns = mobileNav.querySelectorAll('.nav-dropdown');
            dropdowns.forEach(drop => {
                const toggle = drop.querySelector('.dropdown-toggle');
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    drop.classList.toggle('active');
                });
            });
        }
        if (state.currentPage) {
            loadPage(state.currentPage);
        }
    });
}

// ==================== 路由与页面加载 ====================
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
        case 'record': app.innerHTML = renderRecord(); await initRecord(); break;
        case 'recordV2': app.innerHTML = renderRecordV2(); await initRecordV2(); break;
        case 'recordHunter': app.innerHTML = renderRecordHunter(); await initRecordHunter(); break;
        default: window.location.hash = '#home';
    }
}

function handleHash() {
    let hash = window.location.hash.slice(1) || 'home';
    let page = hash;
    if (hash === 'annual') page = 'season';
    else if (hash === 'three-year') page = 'active';
    else if (hash === 'regionComp' || hash === 'regionTop') {
        window.location.hash = '#home';
        return;
    } else if (hash === 'recordV2') page = 'recordV2';
    else if (hash === 'recordHunter') page = 'recordHunter';
    loadPage(page);
}

// ==================== 原有页面初始化函数（保持原样） ====================
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
    } catch (e) {
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

// ==================== 原有数据加载函数 ====================
async function loadSeasonData() {
    if (state.currentPage !== 'season') return;
    showPageLoading('season');
    const { project, type, gender, continent, country } = state.season;
    updateCurrentLabels('season', project, type);
    try {
        let data = await fetchJSON(`data/season/${type}/${project}.json`);
        data = applyGenderFilter(data, gender);
        data = applyScopeFilter(data, continent, country);
        renderTable('season', data, project);
    } catch (e) {
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
        data = applyGenderFilter(data, gender);
        data = applyScopeFilter(data, continent, country);
        renderTable('active', data, project);
    } catch (e) {
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
            <th>排名</th><th>姓名</th><th>省份</th><th>城市</th><th>成绩</th><th>比赛</th><th>WCA ID</th>
        </tr>`;
    }

    try {
        let data = await fetchJSON(`data/region/${period}/${type}/${project}.json`);
        data = applyGenderFilter(data, gender);
        if (province) {
            data = data.filter(d => d.province === province);
        }
        if (city !== '全部城市' && city) {
            data = data.filter(d => d.city === city);
        }
        data = deduplicateByBestAndDate(data, project);
        renderTable('region', data, project);
    } catch (e) {
        const tbody = document.getElementById('region-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7">数据加载失败</td></tr>';
    }
}

async function calculateComprehensive() {
    if (state.currentPage !== 'comprehensive') return;

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

    for (let proj of selectedEvents) {
        try {
            let basePath;
            if (source === 'season') basePath = `data/season/${type}`;
            else if (source === 'active') basePath = `data/active/${type}`;
            else basePath = `data/region/${subDataset}/${type}`;

            const url = `${basePath}/${proj}.json`;
            let data = await fetchJSON(url);

            if (gender !== 'all') {
                data = data.filter(d => d.gender === gender);
            }

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
        } catch (e) {
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

    if (loadingDiv) loadingDiv.style.display = 'none';
    renderComprehensiveTable(rankedResults);
}

// ==================== 辅助函数（保持原样） ====================
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
        autoTimer = setInterval(() => {
            goToSlide(currentIndex + 1);
        }, 4000);
    }

    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

    resetAutoPlay();
    goToSlide(0);
}

// ==================== 原有 record 相关函数 ====================
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

        result[projCode] = { single: bestSingles, average: bestAvgs };
    }
    return result;
}

async function loadRecordData() {
    const tbody = document.getElementById('record-tbody');
    if (!tbody) return;
    if (!state.record.dataLoaded) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">数据未就绪</td></tr>';
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

    tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">加载纪录表</td></tr>';
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
                html += `<tr><td></td><td>${formatResult(rec.result)}</td><td></td><td>${displayName}</td><td>${rec.competition || ''}</td><td>${rec.date || ''}</td></tr>`;
            });
            avgList.forEach(rec => {
                const displayName = extractChineseName(rec.name);
                html += `<tr><td></td><td></td><td>${formatResult(rec.result)}</td><td>${displayName}</td><td>${rec.competition || ''}</td><td>${rec.date || ''}</td></tr>`;
            });
        }
    }
    tbody.innerHTML = html || '<tr><td colspan="6">暂无数据</td></tr>';
}

// ==================== 新增：recordV2 省市纪录（隐藏页面） ====================
async function initRecordV2() {
    if (!state.recordV2.dataLoaded) await loadAllRecordsDataV2();

    const provinceSelect = document.getElementById('recordV2-province');
    if (provinceSelect && state.recordV2.allProvinces.length > 0) {
        provinceSelect.innerHTML = state.recordV2.allProvinces.map(p => `<option value="${p}">${p}</option>`).join('');
        if (state.recordV2.province && state.recordV2.allProvinces.includes(state.recordV2.province)) {
            provinceSelect.value = state.recordV2.province;
        } else {
            provinceSelect.value = state.recordV2.allProvinces[0];
            state.recordV2.province = state.recordV2.allProvinces[0];
        }
    }

    updateRecordV2CitySelect(state.recordV2.province);

    const genderSelect = document.getElementById('recordV2-gender');
    if (genderSelect) genderSelect.value = state.recordV2.gender;

    provinceSelect?.addEventListener('change', (e) => {
        state.recordV2.province = e.target.value;
        state.recordV2.city = '全部城市';
        updateRecordV2CitySelect(state.recordV2.province);
    });

    const citySelect = document.getElementById('recordV2-city');
    citySelect?.addEventListener('change', (e) => { state.recordV2.city = e.target.value; });
    genderSelect?.addEventListener('change', (e) => { state.recordV2.gender = e.target.value; });

    document.getElementById('recordV2-refresh')?.addEventListener('click', () => { loadRecordV2Data(); });

    // 截图功能
    document.getElementById('recordV2-screenshot')?.addEventListener('click', async () => {
        const pageEl = document.getElementById('recordV2-page');
        const infoEl = pageEl?.querySelector('.current-info');
        const tableEl = document.getElementById('recordV2-table');
        if (!infoEl || !tableEl) {
            alert('未找到要截取的内容，请刷新后重试');
            return;
        }

        const btn = document.getElementById('recordV2-screenshot');
        btn.disabled = true;
        btn.textContent = '生成中...';

        try {
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.backgroundColor = '#ffffff';
            container.style.width = tableEl.offsetWidth + 'px';
            document.body.appendChild(container);

            const infoClone = infoEl.cloneNode(true);
            const tableClone = tableEl.cloneNode(true);
            const tableContainer = tableClone.closest('.table-container');
            if (tableContainer) tableContainer.style.overflow = 'visible';
            tableClone.style.width = tableEl.offsetWidth + 'px';

            container.appendChild(infoClone);
            container.appendChild(tableClone);

            const canvas = await html2canvas(container, {
                scale: 2,
                backgroundColor: '#ffffff',
                allowTaint: false,
                useCORS: true,
                logging: false
            });

            document.body.removeChild(container);

            const province = state.recordV2.province || '未知';
            const city = state.recordV2.city === '全部城市' ? '全省' : state.recordV2.city;
            const link = document.createElement('a');
            link.download = `省市纪录_${province}_${city}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('截图失败', err);
            alert('截图失败，请刷新后重试');
        } finally {
            btn.disabled = false;
            btn.textContent = '截图保存';
        }
    });

    await loadRecordV2Data();
}

async function loadAllRecordsDataV2() {
    if (state.recordV2.dataLoaded) return;
    state.recordV2.loading = true;

    const rawDataByProject = {};
    PROJECT_LIST.forEach(p => { rawDataByProject[p.code] = { single: [], average: [] }; });

    const singlePromises = PROJECT_LIST.map(p =>
        fetchJSON(`data/region/historical/single/${p.code}.json`).catch(() => [])
    );
    const avgPromises = PROJECT_LIST.map(p => {
        if (['333mbf', '333fm'].includes(p.code)) return Promise.resolve([]);
        return fetchJSON(`data/region/historical/average/${p.code}.json`).catch(() => []);
    });

    try {
        const singles = await Promise.all(singlePromises);
        const averages = await Promise.all(avgPromises);

        PROJECT_LIST.forEach((p, idx) => {
            rawDataByProject[p.code].single = singles[idx] || [];
            rawDataByProject[p.code].average = averages[idx] || [];
        });

        state.recordV2.rawDataByProject = rawDataByProject;

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
        state.recordV2.allProvinces = provinces;
        state.recordV2.dataLoaded = true;
    } catch (e) {
        console.error('加载省市纪录原始数据失败', e);
    } finally {
        state.recordV2.loading = false;
    }
}

function extractCitiesFromRawDataV2(province) {
    if (!state.recordV2.dataLoaded) return [];
    const citiesSet = new Set();
    for (let proj in state.recordV2.rawDataByProject) {
        ['single', 'average'].forEach(type => {
            const list = state.recordV2.rawDataByProject[proj][type] || [];
            list.forEach(item => {
                if (item.province === province && item.city) citiesSet.add(item.city);
            });
        });
    }
    return Array.from(citiesSet).sort((a,b) => a.localeCompare(b, 'zh'));
}

function updateRecordV2CitySelect(province) {
    const citySelect = document.getElementById('recordV2-city');
    if (!citySelect) return;
    if (MUNICIPALITIES.includes(province)) {
        citySelect.disabled = true;
        citySelect.innerHTML = `<option value="${province}">${province}</option>`;
        citySelect.value = province;
        state.recordV2.city = province;
    } else {
        citySelect.disabled = false;
        const cities = extractCitiesFromRawDataV2(province);
        let options = '<option value="全部城市">全省</option>';
        cities.forEach(c => options += `<option value="${c}">${c}</option>`);
        citySelect.innerHTML = options;
        if (!cities.includes(state.recordV2.city) && state.recordV2.city !== '全部城市') {
            state.recordV2.city = '全部城市';
        }
        citySelect.value = state.recordV2.city;
    }
}

function computeAllBestRecordsV2(province, city, gender) {
    const result = {};
    for (let proj of PROJECT_LIST) {
        const projCode = proj.code;
        const singleList = (state.recordV2.rawDataByProject[projCode]?.single || []).filter(item => {
            if (item.province !== province) return false;
            if (city !== '全部城市' && item.city !== city) return false;
            if (gender !== 'all' && item.gender !== gender) return false;
            return true;
        });
        const avgList = (state.recordV2.rawDataByProject[projCode]?.average || []).filter(item => {
            if (item.province !== province) return false;
            if (city !== '全部城市' && item.city !== city) return false;
            if (gender !== 'all' && item.gender !== gender) return false;
            return true;
        });

        let bestSingleVal = (projCode === '333mbf') ? -Infinity : Infinity;
        let bestAvgVal = Infinity;
        if (projCode === '333mbf') {
            singleList.forEach(item => {
                const parsed = parseMBF(item.result);
                if (!parsed) return;
                const score = parsed.success - parsed.fail;
                if (score > bestSingleVal) bestSingleVal = score;
            });
        } else {
            singleList.forEach(item => {
                const val = parseTime(item.result);
                if (val < bestSingleVal) bestSingleVal = val;
            });
            avgList.forEach(item => {
                const val = parseTime(item.result);
                if (val < bestAvgVal) bestAvgVal = val;
            });
        }

        const bestSingles = [];
        const bestAvgs = [];

        if (projCode === '333mbf') {
            singleList.forEach(item => {
                const parsed = parseMBF(item.result);
                if (parsed && (parsed.success - parsed.fail) === bestSingleVal) bestSingles.push(item);
            });
        } else {
            singleList.forEach(item => {
                if (parseTime(item.result) === bestSingleVal) bestSingles.push(item);
            });
            avgList.forEach(item => {
                if (parseTime(item.result) === bestAvgVal) bestAvgs.push(item);
            });
        }

        result[projCode] = { single: bestSingles, average: bestAvgs };
    }
    return result;
}

async function loadRecordV2Data() {
    const tbody = document.getElementById('recordV2-tbody');
    if (!tbody) return;
    if (!state.recordV2.dataLoaded) {
        tbody.innerHTML = '<tr><td colspan="5">数据未就绪</td></tr>';
        return;
    }

    const province = state.recordV2.province;
    const city = state.recordV2.city;
    const gender = state.recordV2.gender;

    document.getElementById('recordV2-current-province').textContent = province;
    document.getElementById('recordV2-current-city').textContent = city === '全部城市' ? '全省' : city;
    let genderText = '所有';
    if (gender === '男') genderText = '男';
    else if (gender === '女') genderText = '女';
    else if (gender === '未知') genderText = '未知';
    document.getElementById('recordV2-current-gender').textContent = genderText;

    tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">加载纪录表</td></tr>';
    await new Promise(resolve => setTimeout(resolve, 20));

    const bestMap = computeAllBestRecordsV2(province, city, gender);
    let html = '';

    for (let proj of PROJECT_LIST) {
        const projBest = bestMap[proj.code] || { single: [], average: [] };
        const singleList = projBest.single;
        const avgList = projBest.average;

        let singleResultStr = '', singleNameStr = '';
        if (singleList.length > 0) {
            const results = singleList.map(r => formatResult(r.result));
            const uniqueResults = [...new Set(results)];
            singleResultStr = uniqueResults.join(' / ');
            const names = [...new Set(singleList.map(r => extractChineseName(r.name)))];
            singleNameStr = names.join('、');
        }

        let avgResultStr = '', avgNameStr = '';
        if (avgList.length > 0) {
            const results = avgList.map(r => formatResult(r.result));
            const uniqueResults = [...new Set(results)];
            avgResultStr = uniqueResults.join(' / ');
            const names = [...new Set(avgList.map(r => extractChineseName(r.name)))];
            avgNameStr = names.join('、');
        }

        if (!singleResultStr && !avgResultStr) {
            html += `<tr><td>${proj.name}</td><td colspan="4" class="empty-cell">暂无纪录</td></tr>`;
            continue;
        }

        html += `<tr>
            <td>${proj.name}</td>
            <td>${singleResultStr}</td>
            <td>${singleNameStr}</td>
            <td>${avgResultStr}</td>
            <td>${avgNameStr}</td>
        </tr>`;
    }

    tbody.innerHTML = html || '<tr><td colspan="5">暂无数据</td></tr>';
}

// ==================== 新增：recordHunter 纪录猎人（隐藏页面） ====================
async function prepareRecordHunterData() {
    if (state.recordHunterCache.eventsData) return;

    const singleData = {};
    const averageData = {};
    const allPromises = [];

    for (let proj of PROJECT_LIST) {
        const pCode = proj.code;
        allPromises.push(
            fetchJSON(`data/region/historical/single/${pCode}.json`).then(data => { singleData[pCode] = data; }).catch(() => { singleData[pCode] = []; })
        );
        if (pCode !== '333mbf' && pCode !== '333fm') {
            allPromises.push(
                fetchJSON(`data/region/historical/average/${pCode}.json`).then(data => { averageData[pCode] = data; }).catch(() => { averageData[pCode] = []; })
            );
        } else {
            averageData[pCode] = [];
        }
    }

    await Promise.all(allPromises);
    state.recordHunterCache.eventsData = { single: singleData, average: averageData };

    const provinceEvents = [];
    const cityEvents = [];

    function processData(dataList, type, project) {
        const sorted = dataList.slice().filter(d => d.date).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        const provinceBest = {};
        const cityBest = {};

        sorted.forEach(record => {
            const prov = record.province;
            const city = record.city;
            const wcaid = record.wcaid;
            const date = record.date;
            if (!prov || !date) return;

            const isMBF = project === '333mbf';
            let parsed;
            if (isMBF) {
                parsed = parseMBF(record.result);
                if (!parsed) return;
            } else {
                parsed = parseTime(record.result);
                if (parsed === Infinity) return;
            }

            // 省份纪录
            const curProv = provinceBest[prov];
            let isProvRecord = false;
            if (!curProv) {
                isProvRecord = true;
            } else {
                if (isMBF) {
                    const curScore = curProv.parsed.success - curProv.parsed.fail;
                    const newScore = parsed.success - parsed.fail;
                    if (newScore > curScore ||
                        (newScore === curScore && parsed.timeSeconds < curProv.parsed.timeSeconds) ||
                        (newScore === curScore && parsed.timeSeconds === curProv.parsed.timeSeconds && parsed.fail < curProv.parsed.fail)) {
                        isProvRecord = true;
                    }
                } else {
                    if (parsed < curProv.parsed) isProvRecord = true;
                }
            }
            if (isProvRecord) {
                provinceBest[prov] = { result: record.result, parsed, wcaid, date };
                provinceEvents.push({
                    date, project, type, province: prov, wcaid, result: record.result, name: record.name
                });
            }

            // 城市纪录
            if (city) {
                const cityKey = `${prov}|${city}`;
                const curCity = cityBest[cityKey];
                let isCityRecord = false;
                if (!curCity) {
                    isCityRecord = true;
                } else {
                    if (isMBF) {
                        const curScore = curCity.parsed.success - curCity.parsed.fail;
                        const newScore = parsed.success - parsed.fail;
                        if (newScore > curScore ||
                            (newScore === curScore && parsed.timeSeconds < curCity.parsed.timeSeconds) ||
                            (newScore === curScore && parsed.timeSeconds === curCity.parsed.timeSeconds && parsed.fail < curCity.parsed.fail)) {
                            isCityRecord = true;
                        }
                    } else {
                        if (parsed < curCity.parsed) isCityRecord = true;
                    }
                }
                if (isCityRecord) {
                    cityBest[cityKey] = { result: record.result, parsed, wcaid, date };
                    cityEvents.push({
                        date, project, type, province: prov, city, wcaid, result: record.result, name: record.name
                    });
                }
            }
        });
    }

    for (let proj of PROJECT_LIST) {
        const code = proj.code;
        if (singleData[code]) processData(singleData[code], 'single', code);
        if (averageData[code]) processData(averageData[code], 'average', code);
    }

    provinceEvents.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    cityEvents.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    function calcDuration(events, regionKeyFn) {
        const groups = {};
        events.forEach(e => {
            const key = `${regionKeyFn(e)}|${e.project}|${e.type}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(e);
        });
        events.forEach(e => {
            const key = `${regionKeyFn(e)}|${e.project}|${e.type}`;
            const list = groups[key];
            const idx = list.indexOf(e);
            if (idx < list.length - 1) {
                const days = Math.floor((new Date(list[idx + 1].date) - new Date(e.date)) / 86400000);
                e.durationDays = Math.max(1, days);
            } else {
                const days = Math.floor((new Date() - new Date(e.date)) / 86400000);
                e.durationDays = Math.max(1, days);
            }
        });
    }

    calcDuration(provinceEvents, e => e.province);
    calcDuration(cityEvents, e => `${e.province}|${e.city}`);

    state.recordHunterCache.provinceRecords = provinceEvents;
    state.recordHunterCache.cityRecords = cityEvents;
    state.recordHunter.ready = true;
}

function searchRecordHunter() {
    const nameInput = state.recordHunter.searchName.trim().toLowerCase();
    if (!nameInput) {
        alert('请输入选手姓名或WCA ID');
        return;
    }
    if (!state.recordHunter.ready) {
        alert('数据尚未准备完毕，请稍后再试');
        return;
    }

    const selectedEvents = state.recordHunter.selectedEvents;
    const match = (e) => {
        if (!selectedEvents.includes(e.project)) return false;
        const lowerName = (e.name || '').toLowerCase();
        const lowerWca = (e.wcaid || '').toLowerCase();
        return lowerName.includes(nameInput) || lowerWca.includes(nameInput) || extractChineseName(e.name).toLowerCase().includes(nameInput);
    };

    const filteredProv = state.recordHunterCache.provinceRecords.filter(match);
    const filteredCity = state.recordHunterCache.cityRecords.filter(match);

    const statsMap = {};
    const add = (e, isCity) => {
        const key = `${e.project}|${e.type}`;
        if (!statsMap[key]) {
            statsMap[key] = {
                project: e.project,
                type: e.type,
                cityCount: 0,
                cityDays: 0,
                provCount: 0,
                provDays: 0
            };
        }
        if (isCity) {
            statsMap[key].cityCount++;
            statsMap[key].cityDays += e.durationDays;
        } else {
            statsMap[key].provCount++;
            statsMap[key].provDays += e.durationDays;
        }
    };

    filteredProv.forEach(e => add(e, false));
    filteredCity.forEach(e => add(e, true));

    const results = Object.values(statsMap).sort((a, b) => a.project.localeCompare(b.project));
    state.recordHunter.results = results;
    renderHunterResults(results);
}

function renderHunterResults(results) {
    const tbody = document.getElementById('hunter-tbody');
    if (!tbody) return;
    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">未找到破纪录记录</td></tr>';
        return;
    }
    let html = '';
    results.forEach(r => {
        html += `<tr>
            <td>${__('project.' + r.project)}</td>
            <td>${r.type === 'single' ? '单次' : '平均'}</td>
            <td>${r.cityCount}</td>
            <td>${r.cityDays}</td>
            <td>${r.provCount}</td>
            <td>${r.provDays}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

async function initRecordHunter() {
    renderHunterProjectTags();

    if (!state.recordHunter.ready) {
        const loading = document.getElementById('hunter-loading');
        if (loading) loading.style.display = 'block';
        await prepareRecordHunterData();
        if (loading) loading.style.display = 'none';
        state.recordHunter.ready = true;
    }

    document.getElementById('hunter-btn')?.addEventListener('click', searchRecordHunter);
    document.getElementById('hunter-search')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchRecordHunter();
    });
    document.getElementById('hunter-search')?.addEventListener('input', (e) => {
        state.recordHunter.searchName = e.target.value;
    });

    if (state.recordHunter.results.length > 0) {
        renderHunterResults(state.recordHunter.results);
    }
}

// ==================== 页面启动 ====================
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
        <a href="#record" class="nav-item" data-page="record">${__('nav.record')}</a>
    `;
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('show')));

    window.addEventListener('hashchange', handleHash);
    handleHash();
});