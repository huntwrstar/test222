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
        case 'region': app.innerHTML = renderRegion(); await initRegion(); break;
        case 'comprehensive': app.innerHTML = renderComprehensive(); await initComprehensive(); break;
        case 'record': app.innerHTML = renderRecord(); await initRecord(); break;
        default: window.location.hash = '#home';
    }
}

function handleHash() {
    const hash = window.location.hash.slice(1) || 'home';
    loadPage(hash);
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
        state.region.allProvinces = Array.from(provinceSet).sort();
        state.region.provinceCities = {};
        for (let p in cityMap) {
            state.region.provinceCities[p] = Array.from(cityMap[p]).sort();
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
        period === 'historical' ? '所有' : (period === 'season' ? '年度' : '近三⁮年度');

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
        state.record.allProvinces = Array.from(provinceSet).sort((a,b) => a.localeCompare(b, 'zh'));
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

function computeBestForFilters(province, city, gender) {
    const result = {};
    for (let proj of PROJECT_LIST) {
        const singleBest = { value: Infinity, record: null };
        const avgBest = { value: Infinity, record: null };
        const projCode = proj.code;

        const singleList = state.record.rawDataByProject[projCode]?.single || [];
        const avgList = state.record.rawDataByProject[projCode]?.average || [];

        if (projCode === '333mbf') {
            let bestScore = -Infinity, bestTime = Infinity, bestFail = Infinity;
            singleList.forEach(item => {
                if (item.province !== province) return;
                if (city !== '全部城市' && item.city !== city) return;
                if (gender !== 'all' && item.gender !== gender) return;
                const parsed = parseMBF(item.result);
                if (!parsed) return;
                const score = parsed.success - parsed.fail;
                if (score > bestScore) {
                    bestScore = score;
                    bestTime = parsed.timeSeconds;
                    bestFail = parsed.fail;
                    singleBest.record = { ...item };
                } else if (score === bestScore) {
                    if (parsed.timeSeconds < bestTime) {
                        bestTime = parsed.timeSeconds;
                        bestFail = parsed.fail;
                        singleBest.record = { ...item };
                    } else if (parsed.timeSeconds === bestTime) {
                        if (parsed.fail < bestFail) {
                            bestFail = parsed.fail;
                            singleBest.record = { ...item };
                        } else if (parsed.fail === bestFail) {
                            if (item.date && singleBest.record?.date && item.date < singleBest.record.date) {
                                singleBest.record = { ...item };
                            }
                        }
                    }
                }
            });
        } else {
            singleList.forEach(item => {
                if (item.province !== province) return;
                if (city !== '全部城市' && item.city !== city) return;
                if (gender !== 'all' && item.gender !== gender) return;
                const val = parseTime(item.result);
                if (val < singleBest.value) {
                    singleBest.value = val;
                    singleBest.record = {
                        result: item.result,
                        name: item.name,
                        competition: item.competition,
                        date: item.date,
                        wcaid: item.wcaid
                    };
                } else if (val === singleBest.value && singleBest.record) {
                    if (item.date && singleBest.record.date && item.date < singleBest.record.date) {
                        singleBest.record = { ...item };
                    }
                }
            });
        }

        if (projCode === '333mbf') {
        } else {
            avgList.forEach(item => {
                if (item.province !== province) return;
                if (city !== '全部城市' && item.city !== city) return;
                if (gender !== 'all' && item.gender !== gender) return;
                const val = parseTime(item.result);
                if (val < avgBest.value) {
                    avgBest.value = val;
                    avgBest.record = {
                        result: item.result,
                        name: item.name,
                        competition: item.competition,
                        date: item.date,
                        wcaid: item.wcaid
                    };
                } else if (val === avgBest.value && avgBest.record) {
                    if (item.date && avgBest.record.date && item.date < avgBest.record.date) {
                        avgBest.record = { ...item };
                    }
                }
            });
        }

        result[projCode] = {
            single: singleBest.record,
            average: avgBest.record
        };
    }
    return result;
}

async function loadRecordData() {
    const tbody = document.getElementById('record-tbody');
    if (!tbody) return;
    if (!state.record.dataLoaded) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell"><i class="fas fa-spinner"></i> 数据未就绪</td></tr>';
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

    tbody.innerHTML = '<tr><td colspan="5" class="loading-cell"><i class="fas fa-spinner"></i> 加载纪录表<span class="loading-dots"></span></td></tr>';
    await new Promise(resolve => setTimeout(resolve, 20));

    const bestMap = computeBestForFilters(province, city, gender);
    let html = '';

    for (let proj of PROJECT_LIST) {
        const projBest = bestMap[proj.code] || { single: null, average: null };
        const singleRec = projBest.single;
        const avgRec = projBest.average;

        html += `<tr class="region-cell"><td colspan="5">${proj.name}</td></tr>`;

        if (!singleRec && !avgRec) {
            html += `<tr><td colspan="5" class="empty-cell">暂无纪录</td></tr>`;
        } else {
            if (singleRec) {
                const displayName = extractChineseName(singleRec.name);
                html += `<tr>
                    <td></td>
                    <td>${formatResult(singleRec.result)}</td>
                    <td></td>
                    <td>${displayName}</td>
                    <td>${singleRec.competition || ''}</td>
                </tr>`;
            }
            if (avgRec) {
                const displayName = extractChineseName(avgRec.name);
                html += `<tr>
                    <td></td>
                    <td></td>
                    <td>${formatResult(avgRec.result)}</td>
                    <td>${displayName}</td>
                    <td>${avgRec.competition || ''}</td>
                </tr>`;
            }
        }
    }
    tbody.innerHTML = html || '<tr><td colspan="5">暂无数据</td></tr>';
}

function populateScopeSelect(selectId, currentVal) {
    const select = document.getElementById(selectId);
    if (!select) return;
    let html = '<option value="world">世界</option>';
    const continents = ['亚洲','欧洲','北美洲','南美洲','非洲','大洋洲'];
    continents.forEach(c => html += `<option value="continent:${c}">${c}</option>`);
    html += '<option value="country:China">中国</option>';
    if (state.meta && state.meta.countries) {
        state.meta.countries.filter(c => c !== 'China').forEach(c => html += `<option value="country:${c}">${c}</option>`);
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
        const provinces = [...new Set(data.map(d => d.province).filter(p => p))].sort();
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
    if (page !== 'comprehensive') {
        const projSelect = document.getElementById(`${prefix}-project`);
        if (projSelect) {
            projSelect.addEventListener('change', (e) => {
                state[page].project = e.target.value;
            });
        }
    }
    const genderSelect = document.getElementById(`${prefix}-gender`);
    if (genderSelect) {
        genderSelect.addEventListener('change', (e) => {
            state[page].gender = e.target.value;
        });
    }
    if (prefix !== 'region' && page !== 'comprehensive') {
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
    if (page !== 'comprehensive') {
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
    const menuIcon = document.getElementById('mobile-menu-icon');
    const mobileNav = document.getElementById('mobile-nav');
    menuIcon.addEventListener('click', () => mobileNav.classList.toggle('show'));
    mobileNav.innerHTML = `
        <a href="#home" class="nav-item">首页</a>
        <a href="#season" class="nav-item">年度排名</a>
        <a href="#active" class="nav-item">近三年度排名</a>
        <a href="#region" class="nav-item">省市排名</a>
        <a href="#comprehensive" class="nav-item">综合排名</a>
        <a href="#record" class="nav-item">省市纪录</a>
    `;
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('show')));

    window.addEventListener('hashchange', handleHash);
    handleHash();
});