function renderHome() {
    return `
        <div style="text-align: center; margin: 50px 0;">
            <h3 class="home-title"><span>探索未来，</span><span>未来已来。</span></h3>
        </div>
        <div class="announcement-list">
            <div class="announcement">
                <h3>关于省市信息</h3>
                <div class="announcement-card"><p>2018年5月粗饼网取消选手所在城市显示，由于现在已无法从粗饼网获取选手城市，故而此后的选手在本站被作者归入了不存在的神手谷。<p>目前使用的选手省市信息源自魔友赵吉波在取消前爬取的数据，非常感谢前辈留下的数据！<p>
                </div>
            </div>
            <div class="announcement">
                <h3>网站上线</h3>
                <div class="announcement-card">
                    <p>XCUBING网站正式上线运行，网站目前提供WCA赛事的年度、近三年度、省市、综合排名及省市纪录功能，诚挚欢迎广大魔友积极体验并对网站在页面显示、功能使用等方面存在的问题和不足提出宝贵意见和建议。如您在访问网站过程中发现任何错误、故障，请及时通过以下方式反馈：</p>
                    <p>作者邮箱：xcubing@qq.com。</p>
                </div>
            </div>
        </div>
    `;
}

function renderSeason() {
    return `
        <div class="page-heading">
            <h2>年度排名</h2>
        </div>
        <div class="page-subtitle">本页面为年度排名，以一个自然年为一个年度（如2026年即为2026年度），将参赛选手在这个年度内取得的最佳成绩进行排名。所有的排名成绩源自WCA赛事的官方排名。</div>
        <div class="filter-section">
            <div class="filter-item">
                <label>地区</label>
                <select id="season-scope"></select>
            </div>
            <div class="filter-item">
                <label>项目</label>
                <select id="season-project">${projectOptions()}</select>
            </div>
            <div class="filter-item">
                <label>性别</label>
                <select id="season-gender">${genderOptions()}</select>
            </div>
            <div class="btn-group">
<button id="season-single" class="btn btn-warning">单次</button>
<button id="season-average" class="btn btn-primary">平均</button>
            </div>
        </div>
        <div class="current-info">
            <h3><i class="fa fa-info-circle"></i> 当前：<span id="active-current-gender">年度</span> - <span id="season-current-project">三阶</span> - <span id="season-current-type">单次</span></h3>
        </div>
        <div class="table-container">
            <table id="season-table"><thead><tr><th>排名</th><th>姓名</th><th>国家</th><th>成绩</th><th>比赛</th><th>WCA ID</th></tr></thead><tbody id="season-tbody"></tbody></table>
        </div>
        <div class="pagination-container" id="season-pagination"></div>
    `;
}

function renderActive() {
    return `
        <div class="page-heading">
            <h2>近三年度排名</h2>
        </div>
        <div class="page-subtitle">本页面为近三年度排名，将参赛选手在最近三年内取得的最佳成绩进行排名，超过三年无参赛记录的选手不被列入排名。所有的排名成绩源自WCA赛事的官方排名。</div>
        <div class="filter-section">
            <div class="filter-item">
                <label>地区</label>
                <select id="active-scope"></select>
            </div>
            <div class="filter-item">
                <label>项目</label>
                <select id="active-project">${projectOptions()}</select>
            </div>
            <div class="filter-item">
                <label>性别</label>
                <select id="active-gender">${genderOptions()}</select>
            </div>
            <div class="btn-group">
<button id="active-single" class="btn btn-warning">单次</button>
<button id="active-average" class="btn btn-primary">平均</button>
            </div>
        </div>
        <div class="current-info">
            <h3><i class="fa fa-info-circle"></i> 当前：<span id="active-current-gender">近三年度</span> - <span id="active-current-project">三阶</span> - <span id="active-current-type">单次</span></h3>
        </div>
        <div class="table-container">
            <table id="active-table"><thead><tr><th>排名</th><th>姓名</th><th>国家</th><th>成绩</th><th>比赛</th><th>WCA ID</th></tr></thead><tbody id="active-tbody"></tbody></table>
        </div>
        <div class="pagination-container" id="active-pagination"></div>
    `;
}

function renderRegion() {
    return `
        <div class="page-heading">
            <h2>省市排名</h2>
        </div>
        <div class="page-subtitle">本页面为省市排名，可以查看中国选手在其归属地的排名，对于截至2018年5月前没有在粗饼网选择归属地的选手，系统将自动将其归入本站虚构的秘境——神手谷（具体缘由详见首页公告）。所有的排名成绩源自WCA赛事的官方排名。</div>
        <div class="filter-section">
            <div class="filter-item">
                <label>时期</label>
                <div class="radio-group" id="region-period-group">
                    <label><input type="radio" name="region-period" value="historical" checked> 所有</label>
                    <label><input type="radio" name="region-period" value="season"> 年度</label>
                    <label><input type="radio" name="region-period" value="active"> 近三年度</label>
                </div>
            </div>
            <div class="filter-item">
                <label>省份</label>
                <select id="region-province"></select>
            </div>
            <div class="filter-item">
                <label>城市</label>
                <select id="region-city"></select>
            </div>
            <div class="filter-item">
                <label>项目</label>
                <select id="region-project">${projectOptions()}</select>
            </div>
            <div class="filter-item">
                <label>性别</label>
                <select id="region-gender">${genderOptions()}</select>
            </div>
            <div class="btn-group">
<button id="region-single" class="btn btn-warning">单次</button>
<button id="region-average" class="btn btn-primary">平均</button>
            </div>
        </div>
        <div class="current-info">
            <h3><i class="fa fa-info-circle"></i> 当前：<span id="region-current">省市排名</span> - <span id="region-current-project">三阶</span> - <span id="region-current-type">单次</span> <span id="region-current-period">所有</span></h3>
        </div>
        <div class="table-container">
            <table id="region-table">
                <thead></thead>
                <tbody id="region-tbody"></tbody>
            </table>
        </div>
        <div class="pagination-container" id="region-pagination"></div>
    `;
}

function renderComprehensive() {
    return `
        <div class="page-heading">
            <h2>综合排名</h2>
        </div>
        <div class="page-subtitle">本页面为综合排名，可计算选手在多个项目的排名总和并进行排名。</div>
        <div style="margin-bottom: 15px;">
            <label style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase; color: #6c757d; margin-bottom: 5px; display: block;">项目(点击选择)</label>
            <div class="project-tag-group" id="comp-project-tags"></div>
        </div>
        <div class="filter-section" id="comp-filters">
            <div class="filter-item">
                <label>排名类型</label>
                <select id="comp-source">
                    <option value="season">年度排名</option>
                    <option value="active">近三年度排名</option>
                    <option value="province">省市排名</option>
                </select>
            </div>
            <div class="filter-item" id="comp-scope-item">
                <label>地区</label>
                <select id="comp-scope"></select>
            </div>
            <div class="filter-item hidden" id="comp-dataset-item">
                <label>时期</label>
                <select id="comp-dataset">
                    <option value="historical">所有</option>
                    <option value="season">年度 (2026)</option>
                    <option value="active">近三年度 (2024-2026)</option>
                </select>
            </div>
            <div class="filter-item">
                <label>性别</label>
                <select id="comp-gender">${genderOptions()}</select>
            </div>
            <div class="filter-item hidden" id="comp-province-item">
                <label>省份</label>
                <select id="comp-province"></select>
            </div>
            <div class="filter-item hidden" id="comp-city-item">
                <label>城市</label>
                <select id="comp-city"></select>
            </div>
            <div class="btn-group">
<button id="comp-single" class="btn btn-warning">单次</button>
<button id="comp-average" class="btn btn-primary">平均</button>
            </div>
        </div>
        <div class="current-info">
            <h3><i class="fa fa-info-circle"></i> 当前：<span id="comp-current">年度排名 - 已选1个项目 (单次)</span></h3>
        </div>
        <div id="comp-loading" class="loading-indicator" style="display: none;">
            <i class="fas fa-spinner fa-spin"></i> 正在计算综合排名，请稍候...
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
            <h2>省市纪录</h2>
        </div>
        <div class="page-subtitle">本页面为省市纪录，可以查看中国所有有参赛选手的省份及城市在WCA所有项目的纪录。所有的成绩源自WCA官方排名。</div>
        <div class="filter-section">
            <div class="filter-item">
                <label>省份</label>
                <select id="record-province"></select>
            </div>
            <div class="filter-item">
                <label>城市</label>
                <select id="record-city"></select>
            </div>
            <div class="filter-item">
                <label>性别</label>
                <select id="record-gender">
                    <option value="all">所有</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="未知">未知</option>
                </select>
            </div>
            <div class="btn-group">
                <button id="record-refresh" class="btn btn-primary"> 刷新</button>
            </div>
        </div>
        <div class="current-info">
            <h3><i class="fa fa-map-marker-alt"></i> 当前：<span id="record-current">省市纪录</span> - <span id="record-current-province">北京</span> · <span id="record-current-city">全省</span> · <span id="record-current-gender">所有</span></h3>
        </div>
        <div class="table-container">
            <table id="record-table">
                <thead>
                    <tr>
                        <th width="15%">项目</th>
                        <th width="15%">单次</th>
                        <th width="15%">平均</th>
                        <th width="20%">姓名</th>
                        <th width="35%">比赛</th>
                    </tr>
                </thead>
                <tbody id="record-tbody">
                    <tr><td colspan="5" class="loading-cell"><i class="fas fa-spinner"></i> 加载数据<span class="loading-dots"></span></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function projectOptions() {
    return PROJECT_LIST.map(p => `<option value="${p.code}">${p.name}</option>`).join('');
}

function genderOptions() {
    return `<option value="all">所有</option><option value="男">男</option><option value="女">女</option><option value="未知">未知</option>`;
}

function getProjectName(code) {
    const p = PROJECT_LIST.find(p => p.code === code);
    return p ? p.name : code;
}

function showPageLoading(page) {
    const tbody = document.getElementById(`${page}-tbody`);
    if (!tbody) return;
    let colspan = 6; 
    if (page === 'region') {
        colspan = 7;
    } else if (page === 'season' || page === 'active') {
        colspan = 6;
    } else if (page === 'comprehensive') {
        const source = state.comprehensive.source;
        colspan = source === 'province' ? 6 : 5;
    } else if (page === 'record') {
        colspan = 5;
    }
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="loading-cell"><i class="fas fa-spinner"></i> 加载中<span class="loading-dots"></span></td></tr>`;
}

function updateCurrentLabels(page, project, type) {
    const projSpan = document.getElementById(`${page}-current-project`);
    const typeSpan = document.getElementById(`${page}-current-type`);
    if (projSpan) projSpan.textContent = getProjectName(project);
    if (typeSpan) typeSpan.textContent = type === 'single' ? '单次' : '平均';
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
    renderTableBody(tbody, pageData, page === 'region');

    const onPageChange = (newPage) => {
        state.pagination.currentPage = newPage;
        const newPageData = paginate(ranked, newPage);
        renderTableBody(tbody, newPageData, page === 'region');
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
    tbody.innerHTML = html || `<tr><td colspan="${source === 'province' ? 6 : 5}">暂无数据</td></tr>`;
}

function renderProjectTags() {
    const container = document.getElementById('comp-project-tags');
    if (!container) return;
    const selected = state.comprehensive.selectedEvents;
    const html = PROJECT_LIST.map(p => {
        const isSelected = selected.includes(p.code);
        return `<span class="project-tag ${isSelected ? 'selected' : ''}" data-code="${p.code}">${p.name}</span>`;
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
    const sourceName = comp.source === 'season' ? '年度' : (comp.source === 'active' ? '近三年度' : '省市');
    const typeName = comp.type === 'single' ? '单次' : '平均';
    const eventCount = comp.selectedEvents.length;
    document.getElementById('comp-current').innerText = `${sourceName} - 已选${eventCount}个项目 (${typeName})`;
}