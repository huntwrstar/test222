function renderHome() {
    return `
        <div style="text-align: center; margin: 50px 0;">
            <h3 class="home-title"><span>探索未来，</span><span>未来已来。</span></h3>
        </div>
        <div class="announcement-list">
            <div class="announcement">
                <h3>更新公告</h3>
                <div class="announcement-card"><p>更新内容如下：<p>
<p>1.新增省市榜首排名<p>
<p>-在省市榜首排名中，您可以看到每个省份/城市排名第一的选手的排名；p>
<p>2.新增省市综合排名<p>
<p>-在省市综合排名中，您可以自由组合项目计算每个省份/城市的综合实力进行排名；<p>
<p>3.完善一些细节<p>
<p>2026-03-19<p>
                </div>
            </div>
        <div class="announcement-list">
            <div class="announcement">
                <h3>更新公告</h3>
                <div class="announcement-card"><p>根据最近几天大家的反馈，本次更新内容如下：<p>
<p>1.更改部分排名榜单的定义<p>
<p>2.修复部分已知bug<p>
<p>3.开放选手省份城市更改<p>
<p>4.添加反馈页<p>
<p>-通过该页面可直接提交对网站的意见反馈或选手省市信息更改申请。<p>
<p>（反馈入口可在页面右下角找到）<p>
欢迎大家积极反馈，一起完善小破站。
<p>2026-03-08<p>
                </div>
            </div>
        <div class="announcement-list">
            <div class="announcement">
                <h3>关于省市信息</h3>
                <div class="announcement-card"><p>2018年5月粗饼网取消选手所在城市显示，由于现在已无法从粗饼网获取选手城市，故2018年5月之后参加WCA比赛的选手在本站被作者归入了不存在的神手谷。<p>目前使用的选手省市信息源自魔友赵吉波在取消前爬取的数据，非常感谢前辈留下的数据！<p>
                </div>
            </div>
            <div class="announcement">
                <h3>${__('announcement.launch.title')}</h3>
                <div class="announcement-card">
                    <p>${__('announcement.launch.content')}</p>
                </div>
            </div>
        </div>
    `;
}

function renderSeason() {
    return `
        <div class="page-heading">
            <h2>${__('season.title')}</h2>
        </div>
        <div class="page-subtitle">${__('season.subtitle')}</div>
        <div class="filter-section">
            <div class="filter-item">
                <label>${__('filter.region')}</label>
                <select id="season-scope"></select>
            </div>
            <div class="filter-item">
                <label>${__('filter.project')}</label>
                <select id="season-project">${projectOptions()}</select>
            </div>
            <div class="filter-item">
                <label>${__('filter.gender')}</label>
                <select id="season-gender">${genderOptions()}</select>
            </div>
            <div class="btn-group">
                <button id="season-single" class="btn btn-warning">${__('btn.single')}</button>
                <button id="season-average" class="btn btn-primary">${__('btn.average')}</button>
            </div>
        </div>
        <div class="current-info">
            <h3><i class="fa fa-info-circle"></i> ${__('current.season')} - <span id="season-current-project">${getProjectName(state.season.project)}</span> - <span id="season-current-type">${__('btn.single')}</span></h3>
        </div>
        <div class="table-container">
            <table id="season-table">
                <thead>
                    <tr>
                        <th>${__('table.rank')}</th>
                        <th>${__('table.name')}</th>
                        <th>${__('table.country')}</th>
                        <th>${__('table.result')}</th>
                        <th>${__('table.competition')}</th>
                        <th>${__('table.wcaid')}</th>
                    </tr>
                </thead>
                <tbody id="season-tbody"></tbody>
            </table>
        </div>
        <div class="pagination-container" id="season-pagination"></div>
    `;
}

function renderActive() {
    return `
        <div class="page-heading">
            <h2>${__('active.title')}</h2>
        </div>
        <div class="page-subtitle">${__('active.subtitle')}</div>
        <div class="filter-section">
            <div class="filter-item">
                <label>${__('filter.region')}</label>
                <select id="active-scope"></select>
            </div>
            <div class="filter-item">
                <label>${__('filter.project')}</label>
                <select id="active-project">${projectOptions()}</select>
            </div>
            <div class="filter-item">
                <label>${__('filter.gender')}</label>
                <select id="active-gender">${genderOptions()}</select>
            </div>
            <div class="btn-group">
                <button id="active-single" class="btn btn-warning">${__('btn.single')}</button>
                <button id="active-average" class="btn btn-primary">${__('btn.average')}</button>
            </div>
        </div>
        <div class="current-info">
            <h3><i class="fa fa-info-circle"></i> ${__('current.active')} - <span id="active-current-project">${getProjectName(state.active.project)}</span> - <span id="active-current-type">${__('btn.single')}</span></h3>
        </div>
        <div class="table-container">
            <table id="active-table">
                <thead>
                    <tr>
                        <th>${__('table.rank')}</th>
                        <th>${__('table.name')}</th>
                        <th>${__('table.country')}</th>
                        <th>${__('table.result')}</th>
                        <th>${__('table.competition')}</th>
                        <th>${__('table.wcaid')}</th>
                    </tr>
                </thead>
                <tbody id="active-tbody"></tbody>
            </table>
        </div>
        <div class="pagination-container" id="active-pagination"></div>
    `;
}

function renderRegion() {
    return `
        <div class="page-heading">
            <h2>${__('region.title')}</h2>
        </div>
        <div class="page-subtitle">${__('region.subtitle')}</div>
        <div class="filter-section">
            <div class="filter-item">
                <label>${__('filter.period')}</label>
                <div class="radio-group" id="region-period-group">
                    <label><input type="radio" name="region-period" value="historical" checked> ${__('current.historical')}</label>
                    <label><input type="radio" name="region-period" value="season"> ${__('current.season')}</label>
                    <label><input type="radio" name="region-period" value="active"> ${__('current.active')}</label>
                </div>
            </div>
            <div class="filter-item">
                <label>${__('filter.province')}</label>
                <select id="region-province"></select>
            </div>
            <div class="filter-item">
                <label>${__('filter.city')}</label>
                <select id="region-city"></select>
            </div>
            <div class="filter-item">
                <label>${__('filter.project')}</label>
                <select id="region-project">${projectOptions()}</select>
            </div>
            <div class="filter-item">
                <label>${__('filter.gender')}</label>
                <select id="region-gender">${genderOptions()}</select>
            </div>
            <div class="btn-group">
                <button id="region-single" class="btn btn-warning">${__('btn.single')}</button>
                <button id="region-average" class="btn btn-primary">${__('btn.average')}</button>
            </div>
        </div>
        <div class="current-info">
            <h3><i class="fa fa-info-circle"></i> ${__('current.region')} - <span id="region-current-project">${getProjectName(state.region.project)}</span> - <span id="region-current-type">${__('btn.single')}</span> <span id="region-current-period">${__('current.historical')}</span></h3>
        </div>
        <div class="table-container">
            <table id="region-table">
                <thead>
                    <tr>
                        <th>${__('table.rank')}</th>
                        <th>${__('table.name')}</th>
                        <th>${__('table.province')}</th>
                        <th>${__('table.city')}</th>
                        <th>${__('table.result')}</th>
                        <th>${__('table.competition')}</th>
                        <th>${__('table.wcaid')}</th>
                    </tr>
                </thead>
                <tbody id="region-tbody"></tbody>
            </table>
        </div>
        <div class="pagination-container" id="region-pagination"></div>
    `;
}

function renderRegionTop() {
    return `
        <div class="page-heading">
            <h2>${__('regionTop.title')}</h2>
        </div>
        <div class="page-subtitle">${__('regionTop.subtitle')}</div>
        <div class="filter-section">
            <div class="filter-item">
                <label>${__('filter.dimension')}</label>
                <select id="regionTop-dimension">
                    <option value="province">${__('dimension.province')}</option>
                    <option value="city">${__('dimension.city')}</option>
                </select>
            </div>
            <div class="filter-item">
                <label>${__('filter.period')}</label>
                <div class="radio-group" id="regionTop-period-group">
                    <label><input type="radio" name="regionTop-period" value="historical" checked> ${__('current.historical')}</label>
                    <label><input type="radio" name="regionTop-period" value="season"> ${__('current.season')}</label>
                    <label><input type="radio" name="regionTop-period" value="active"> ${__('current.active')}</label>
                </div>
            </div>
            <div class="filter-item">
                <label>${__('filter.project')}</label>
                <select id="regionTop-project">${projectOptions()}</select>
            </div>
            <div class="filter-item">
                <label>${__('filter.gender')}</label>
                <select id="regionTop-gender">${genderOptions()}</select>
            </div>
            <div class="btn-group">
                <button id="regionTop-single" class="btn btn-warning">${__('btn.single')}</button>
                <button id="regionTop-average" class="btn btn-primary">${__('btn.average')}</button>
            </div>
        </div>
        <div class="current-info">
            <h3><i class="fa fa-info-circle"></i> <span id="regionTop-current"></span></h3>
        </div>
        <div class="table-container">
            <table id="regionTop-table">
                <thead>
                    <tr>
                        <th>${__('table.rank')}</th>
                        <th>${__('table.name')}</th>
                        <th>${__('table.province')}</th>
                        <th>${__('table.city')}</th>
                        <th>${__('table.result')}</th>
                        <th>${__('table.competition')}</th>
                        <th>${__('table.wcaid')}</th>
                    </tr>
                </thead>
                <tbody id="regionTop-tbody"></tbody>
            </table>
        </div>
        <div class="pagination-container" id="regionTop-pagination"></div>
    `;
}

function renderRegionComp() {
    const dimension = state.regionComp.dimension;
    return `
        <div class="page-heading">
            <h2>${__('regionComp.title')}</h2>
        </div>
        <div class="page-subtitle">${__('regionComp.subtitle')}</div>
        <div class="filter-section">
            <div class="filter-item">
                <label>${__('filter.dimension')}</label>
                <select id="regionComp-dimension">
                    <option value="province" ${dimension === 'province' ? 'selected' : ''}>${__('dimension.province')}</option>
                    <option value="city" ${dimension === 'city' ? 'selected' : ''}>${__('dimension.city')}</option>
                </select>
            </div>
            <div class="filter-item">
                <label>${__('filter.period')}</label>
                <div class="radio-group" id="regionComp-period-group">
                    <label><input type="radio" name="regionComp-period" value="historical" ${state.regionComp.period === 'historical' ? 'checked' : ''}> ${__('current.historical')}</label>
                    <label><input type="radio" name="regionComp-period" value="season" ${state.regionComp.period === 'season' ? 'checked' : ''}> ${__('current.season')}</label>
                    <label><input type="radio" name="regionComp-period" value="active" ${state.regionComp.period === 'active' ? 'checked' : ''}> ${__('current.active')}</label>
                </div>
            </div>
            <div style="margin-bottom: 15px; width:100%;">
                <label style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase; color: #6c757d; margin-bottom: 5px; display: block;">${__('comp.select_events')}</label>
                <div class="project-tag-group" id="regionComp-project-tags"></div>
            </div>
            <div class="btn-group">
                <button id="regionComp-single" class="btn btn-warning">${__('btn.single')}</button>
                <button id="regionComp-average" class="btn btn-primary">${__('btn.average')}</button>
            </div>
        </div>
        <div class="current-info">
            <h3><i class="fa fa-info-circle"></i> <span id="regionComp-current"></span></h3>
        </div>
        <div class="table-container">
            <table id="regionComp-table">
                <thead>
                    <tr>
                        <th>${__('table.rank')}</th>
                        <th>${dimension === 'province' ? __('dimension.province') : __('dimension.city')}</th>
                        ${dimension === 'city' ? `<th>${__('dimension.city')}</th>` : ''}
                        <th>${__('table.events_count')}</th>
                        <th>${__('table.total_rank')}</th>
                    </tr>
                </thead>
                <tbody id="regionComp-tbody"></tbody>
            </table>
        </div>
        <div class="pagination-container" id="regionComp-pagination"></div>
    `;
}

function renderComprehensive() {
    return `
        <div class="page-heading">
            <h2>${__('comprehensive.title')}</h2>
        </div>
        <div class="page-subtitle">${__('comprehensive.subtitle')}</div>
        <div style="margin-bottom: 15px;">
            <label style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase; color: #6c757d; margin-bottom: 5px; display: block;">${__('comp.select_events')}</label>
            <div class="project-tag-group" id="comp-project-tags"></div>
        </div>
        <div class="filter-section" id="comp-filters">
            <div class="filter-item">
                <label>${__('filter.source')}</label>
                <select id="comp-source">
                    <option value="season">${__('nav.season')}</option>
                    <option value="active">${__('nav.active')}</option>
                    <option value="province">${__('nav.region')}</option>
                </select>
            </div>
            <div class="filter-item" id="comp-scope-item">
                <label>${__('filter.region')}</label>
                <select id="comp-scope"></select>
            </div>
            <div class="filter-item hidden" id="comp-dataset-item">
                <label>${__('filter.dataset')}</label>
                <select id="comp-dataset">
                    <option value="historical">${__('current.historical')}</option>
                    <option value="season">${__('current.season')} (2026)</option>
                    <option value="active">${__('current.active')} (2024-2026)</option>
                </select>
            </div>
            <div class="filter-item">
                <label>${__('filter.gender')}</label>
                <select id="comp-gender">${genderOptions()}</select>
            </div>
            <div class="filter-item hidden" id="comp-province-item">
                <label>${__('filter.province')}</label>
                <select id="comp-province"></select>
            </div>
            <div class="filter-item hidden" id="comp-city-item">
                <label>${__('filter.city')}</label>
                <select id="comp-city"></select>
            </div>
            <div class="btn-group">
                <button id="comp-single" class="btn btn-warning">${__('btn.single')}</button>
                <button id="comp-average" class="btn btn-primary">${__('btn.average')}</button>
            </div>
        </div>
        <div class="current-info">
            <h3><i class="fa fa-info-circle"></i> <span id="comp-current">${__('comp.current', {source: __('nav.season'), count: '1', type: __('btn.single')})}</span></h3>
        </div>
        <div id="comp-loading" class="loading-indicator" style="display: none;">
            <i class="fas fa-spinner fa-spin"></i> ${__('comp.calculating')}
        </div>
        <div class="table-container">
            <table id="comp-table">
                <thead></thead>
                <tbody id="comp-tbody"></tbody>
            </table>
        </div>
        <div class="pagination-container" id="comp-pagination"></div>
    `;
}

function renderRecord() {
    return `
        <div class="page-heading">
            <h2>${__('record.title')}</h2>
        </div>
        <div class="page-subtitle">${__('record.subtitle')}</div>
        <div class="filter-section">
            <div class="filter-item">
                <label>${__('filter.province')}</label>
                <select id="record-province"></select>
            </div>
            <div class="filter-item">
                <label>${__('filter.city')}</label>
                <select id="record-city"></select>
            </div>
            <div class="filter-item">
                <label>${__('filter.gender')}</label>
                <select id="record-gender">
                    <option value="all">${__('gender.all')}</option>
                    <option value="男">${__('gender.male')}</option>
                    <option value="女">${__('gender.female')}</option>
                    <option value="未知">${__('gender.unknown')}</option>
                </select>
            </div>
            <div class="btn-group">
                <button id="record-refresh" class="btn btn-primary">${__('btn.refresh')}</button>
            </div>
        </div>
        <div class="current-info">
            <h3><i class="fa fa-map-marker-alt"></i> ${__('current.region')} - <span id="record-current-province">北京</span> · <span id="record-current-city">${__('all_cities')}</span> · <span id="record-current-gender">${__('gender.all')}</span></h3>
        </div>
        <div class="table-container">
            <table id="record-table">
                <thead>
                    <tr>
                        <th width="12%">${__('table.event')}</th>
                        <th width="12%">${__('btn.single')}</th>
                        <th width="12%">${__('btn.average')}</th>
                        <th width="15%">${__('table.name')}</th>
                        <th width="25%">${__('table.competition')}</th>
                        <th width="12%">${__('table.date')}</th>
                    </tr>
                </thead>
                <tbody id="record-tbody">
                    <tr><td colspan="6" class="loading-cell"><i class="fas fa-spinner"></i> ${__('loading')}<span class="loading-dots"></span></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function projectOptions() {
    return PROJECT_LIST.map(p => `<option value="${p.code}">${__('project.' + p.code)}</option>`).join('');
}

function genderOptions() {
    return `<option value="all">${__('gender.all')}</option><option value="男">${__('gender.male')}</option><option value="女">${__('gender.female')}</option><option value="未知">${__('gender.unknown')}</option>`;
}

function getProjectName(code) {
    return __('project.' + code);
}

function showPageLoading(page) {
    const tbody = document.getElementById(`${page}-tbody`);
    if (!tbody) return;
    let colspan = 6; 
    if (page === 'region') {
        colspan = 7;
    } else if (page === 'season' || page === 'active') {
        colspan = 6;
    } else if (page === 'regionTop') {
        colspan = 7;
    } else if (page === 'regionComp') {
        colspan = 5;
    } else if (page === 'comprehensive') {
        const source = state.comprehensive.source;
        colspan = source === 'province' ? 6 : 5;
    } else if (page === 'record') {
        colspan = 6;
    }
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="loading-cell"><i class="fas fa-spinner"></i> ${__('loading')}<span class="loading-dots"></span></td></tr>`;
}

function updateCurrentLabels(page, project, type) {
    const projSpan = document.getElementById(`${page}-current-project`);
    const typeSpan = document.getElementById(`${page}-current-type`);
    if (projSpan) projSpan.textContent = getProjectName(project);
    if (typeSpan) typeSpan.textContent = type === 'single' ? __('btn.single') : __('btn.average');
}

function renderPagination(containerId, totalPages, currentPage, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    let html = '<ul class="pagination">';
    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    html += `<li class="${prevDisabled}"><a href="#" data-page="${currentPage-1}"><i class="fa fa-angle-left"></i> 前页</a></li>`;
    const maxVisible = 8;
    let start = Math.max(1, currentPage - Math.floor(maxVisible/2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }
    if (start > 1) {
        html += `<li><a href="#" data-page="1">1</a></li>`;
        if (start > 2) html += `<li class="disabled"><span>...</span></li>`;
    }
    for (let i = start; i <= end; i++) {
        const active = i === currentPage ? 'active' : '';
        html += `<li class="${active}"><a href="#" data-page="${i}">${i}</a></li>`;
    }
    if (end < totalPages) {
        if (end < totalPages - 1) html += `<li class="disabled"><span>...</span></li>`;
        html += `<li><a href="#" data-page="${totalPages}">${totalPages}</a></li>`;
    }
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';
    html += `<li class="${nextDisabled}"><a href="#" data-page="${currentPage+1}">后页 <i class="fa fa-angle-right"></i></a></li>`;
    html += '</ul>';
    container.innerHTML = html;

    container.querySelectorAll('a[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(link.dataset.page);
            if (!isNaN(page) && page >= 1 && page <= totalPages && page !== currentPage) {
                callback(page);
            }
        });
    });
}

function renderTableBody(tbody, data, regionMode) {
    if (!tbody) return;
    if (regionMode) {
        tbody.innerHTML = data.map(item => {
            const displayName = getDisplayName(item);
            return `<tr>
                <td class="rank-cell">${item.displayRank || item.rank}</td>
                <td>${displayName}</td>
                <td>${item.province || ''}</td>
                <td>${item.city || ''}</td>
                <td>${formatResult(item.result)}</td>
                <td>${item.competition || ''}</td>
                <td>${item.wcaid}</td>
            </tr>`;
        }).join('');
    } else {
        tbody.innerHTML = data.map(item => {
            const displayName = getDisplayName(item);
            return `
            <tr>
                <td class="rank-cell">${item.displayRank || item.rank}</td>
                <td>${displayName}</td>
                <td>${item.country}</td>
                <td>${formatResult(item.result)}</td>
                <td>${item.competition || ''}</td>
                <td>${item.wcaid}</td>
            </tr>
        `}).join('');
    }
}

function renderTable(page, data, project) {
    const tbody = document.getElementById(`${page}-tbody`);
    if (!tbody) {
        console.warn(`表格体 ${page}-tbody 不存在，无法渲染`);
        return;
    }

    const ranked = recomputeRanks(data, project);
    console.log(`渲染表格 ${page}, 排名后数据条数: ${ranked.length}`);

    state.pagination.data = ranked;
    state.pagination.totalPages = Math.ceil(ranked.length / 100);
    state.pagination.currentPage = 1;

    const pageData = paginate(ranked, 1);
    renderTableBody(tbody, pageData, page === 'region' || page === 'regionTop');

    const onPageChange = (newPage) => {
        state.pagination.currentPage = newPage;
        const newPageData = paginate(ranked, newPage);
        renderTableBody(tbody, newPageData, page === 'region' || page === 'regionTop');
        renderPagination(`${page}-pagination`, state.pagination.totalPages, newPage, onPageChange);
    };

    renderPagination(`${page}-pagination`, state.pagination.totalPages, 1, onPageChange);
}

function renderCompTableBody(tbody, data) {
    const source = state.comprehensive.source;
    let html = '';
    data.forEach(item => {
        const displayName = getDisplayName(item);
        let row = `<tr><td class="rank-cell">${item.displayRank}</td><td>${displayName}</td>`;
        if (source === 'province') {
            row += `<td>${item.province || ''}</td><td>${item.city || ''}</td>`;
        } else {
            row += `<td>${item.country || ''}</td>`;
        }
        row += `<td>${item.eventCount}</td><td>${item.totalRank}</td></tr>`;
        html += row;
    });
    tbody.innerHTML = html || `<tr><td colspan="${source === 'province' ? 6 : 5}">${__('no_data')}</td></tr>`;
}

function renderProjectTags() {
    const container = document.getElementById('comp-project-tags');
    if (!container) return;
    const selected = state.comprehensive.selectedEvents;
    const html = PROJECT_LIST.map(p => {
        const isSelected = selected.includes(p.code);
        return `<span class="project-tag ${isSelected ? 'selected' : ''}" data-code="${p.code}">${__('project.' + p.code)}</span>`;
    }).join('');
    container.innerHTML = html;

    container.querySelectorAll('.project-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            const code = tag.dataset.code;
            let selected = state.comprehensive.selectedEvents.slice();
            if (selected.includes(code)) {
                if (selected.length > 1) {
                    selected = selected.filter(c => c !== code);
                } else {
                    return;
                }
            } else {
                selected.push(code);
            }
            state.comprehensive.selectedEvents = selected;
            renderProjectTags();
            updateCompCurrentLabel();
        });
    });
}

function toggleCompFilters(source) {
    const isProvince = source === 'province';
    const scopeItem = document.getElementById('comp-scope-item');
    const datasetItem = document.getElementById('comp-dataset-item');
    const provinceItem = document.getElementById('comp-province-item');
    const cityItem = document.getElementById('comp-city-item');
    if (scopeItem) scopeItem.classList.toggle('hidden', isProvince);
    if (datasetItem) datasetItem.classList.toggle('hidden', !isProvince);
    if (provinceItem) provinceItem.classList.toggle('hidden', !isProvince);
    if (cityItem) cityItem.classList.toggle('hidden', !isProvince);
}

function updateCompCurrentLabel() {
    const comp = state.comprehensive;
    let sourceName = '';
    if (comp.source === 'season') sourceName = __('nav.season');
    else if (comp.source === 'active') sourceName = __('nav.active');
    else sourceName = __('nav.region');
    const typeName = comp.type === 'single' ? __('btn.single') : __('btn.average');
    const eventCount = comp.selectedEvents.length;
    document.getElementById('comp-current').innerText = __('comp.current', {source: sourceName, count: eventCount, type: typeName});
}

function renderRegionCompProjectTags() {
    const container = document.getElementById('regionComp-project-tags');
    if (!container) return;
    const selected = state.regionComp.selectedEvents;
    const html = PROJECT_LIST.map(p => {
        const isSelected = selected.includes(p.code);
        return `<span class="project-tag ${isSelected ? 'selected' : ''}" data-code="${p.code}">${__('project.' + p.code)}</span>`;
    }).join('');
    container.innerHTML = html;

    container.querySelectorAll('.project-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            const code = tag.dataset.code;
            let selected = state.regionComp.selectedEvents.slice();
            if (selected.includes(code)) {
                if (selected.length > 1) {
                    selected = selected.filter(c => c !== code);
                } else {
                    return;
                }
            } else {
                selected.push(code);
            }
            state.regionComp.selectedEvents = selected;
            renderRegionCompProjectTags();
            updateRegionCompCurrentLabel(); // 只更新标签，不清空表格
        });
    });
}

function updateRegionCompCurrentLabel() {
    const dim = state.regionComp.dimension === 'province' ? __('dimension.province') : __('dimension.city');
    const type = state.regionComp.type === 'single' ? __('btn.single') : __('btn.average');
    const period = state.regionComp.period;
    let periodText = '';
    if (period === 'historical') periodText = __('current.historical');
    else if (period === 'season') periodText = __('current.season');
    else periodText = __('current.active');
    document.getElementById('regionComp-current').innerText = `${dim} · ${periodText} · ${type} · ${state.regionComp.selectedEvents.length} ${__('table.event')}`;
}

function renderRegionCompTable(data) {
    const tbody = document.getElementById('regionComp-tbody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">' + __('no_data') + '</td></tr>';
        return;
    }

    state.pagination.data = data;
    state.pagination.totalPages = Math.ceil(data.length / 100);
    state.pagination.currentPage = 1;

    const pageData = paginate(data, 1);
    renderRegionCompTableBody(tbody, pageData);

    const onPageChange = (newPage) => {
        state.pagination.currentPage = newPage;
        const newPageData = paginate(data, newPage);
        renderRegionCompTableBody(tbody, newPageData);
        renderPagination('regionComp-pagination', state.pagination.totalPages, newPage, onPageChange);
    };
    renderPagination('regionComp-pagination', state.pagination.totalPages, 1, onPageChange);
}

function renderRegionCompTableBody(tbody, data) {
    const dimension = state.regionComp.dimension;
    let html = '';
    data.forEach(item => {
        if (dimension === 'province') {
            html += `<tr>
                <td class="rank-cell">${item.displayRank}</td>
                <td>${item.province}</td>
                <td>${item.eventCount}</td>
                <td>${item.totalRank}</td>
            </tr>`;
        } else {
            html += `<tr>
                <td class="rank-cell">${item.displayRank}</td>
                <td>${item.province}</td>
                <td>${item.city || ''}</td>
                <td>${item.eventCount}</td>
                <td>${item.totalRank}</td>
            </tr>`;
        }
    });
    tbody.innerHTML = html;
}