// ==================== 基础请求与缓存 ====================
async function fetchJSON(url) {
    if (state.cache[url]) return state.cache[url];
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        state.cache[url] = data;
        return data;
    } catch (e) {
        console.error(`加载失败 ${url}:`, e);
        throw e;
    }
}

// ==================== 元数据加载 ====================
async function loadMeta() {
    if (state.meta) return;
    try {
        const meta = await fetchJSON('data/meta.json');
        const provincesCities = await fetchJSON('data/provinces_cities.json');
        const availableYears = await fetchJSON('data/available_years.json');
        state.meta = { ...meta, provincesCities, availableYears };
    } catch (e) {
        console.error('加载元数据失败', e);
        state.meta = {
            countries: [],
            country_continent: {},
            provincesCities: { provinces: [], cities: {} },
            availableYears: {}
        };
    }
}

// ==================== 原始数据加载（分片合并） ====================
async function fetchRawData(project, type, years) {
    const cacheKey = `raw_${project}_${type}_${years.join('_')}`;
    if (state.cache[cacheKey]) return state.cache[cacheKey];

    const basePath = `data/raw/${project}/${type}`;
    const promises = years.map(async year => {
        const url = `${basePath}/${year}.json`;
        try {
            return await fetchJSON(url);
        } catch (e) {
            console.warn(`加载失败 ${url}`, e);
            return [];
        }
    });
    const results = await Promise.all(promises);
    const merged = results.flat();
    state.cache[cacheKey] = merged;
    return merged;
}

/**
 * 加载某个项目在指定时期的数据，支持年份参数
 * @param {string} project
 * @param {string} type 'single'|'average'
 * @param {string} period 'historical'|'season'|'active'
 * @param {number|null} year 年份，用于 season 或 active
 */
async function fetchDataByPeriod(project, type, period, year = null) {
    const currentYear = new Date().getFullYear();
    let years = [];
    if (period === 'historical') {
        const allYears = state.meta?.availableYears?.[project]?.[type] || [];
        years = allYears;
        if (years.length === 0) years = ['unknown'];
    } else if (period === 'season') {
        const targetYear = year !== null ? year : currentYear;
        years = [targetYear];
    } else if (period === 'active') {
        let startYear;
        if (year !== null) {
            startYear = year;
        } else {
            startYear = currentYear - 2;
        }
        years = [startYear, startYear + 1, startYear + 2];
    }
    return await fetchRawData(project, type, years);
}

// ==================== 成绩处理与排序 ====================
function formatResultForSort(resultStr) {
    if (!resultStr || resultStr === 'DNF' || resultStr === '暂无') return Infinity;
    if (resultStr.includes(':')) {
        const parts = resultStr.split(':');
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(resultStr);
}

function parseTime(timeStr) { return formatResultForSort(timeStr); }

function parseMBF(resultStr) {
    if (!resultStr || resultStr === 'DNF') return null;
    const match = String(resultStr).match(/^(\d+)\/(\d+)\s+(\d+):(\d+(?:\.\d+)?)$/);
    if (!match) return null;
    const success = parseInt(match[1], 10);
    const attempts = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    const seconds = parseFloat(match[4]);
    const timeSeconds = minutes * 60 + seconds;
    const fail = attempts - success;
    return { success, attempts, fail, timeSeconds };
}

function formatResult(resultStr) {
    if (!resultStr || resultStr === 'DNF' || resultStr === '暂无') return '暂无';
    if (resultStr.includes('/') && resultStr.includes(':')) return resultStr;
    if (/^\d+$/.test(String(resultStr).trim())) return resultStr;
    if (resultStr.includes(':') || resultStr.includes('.')) return resultStr;
    const num = parseFloat(resultStr);
    if (isNaN(num) || num <= 0) return '暂无';
    const totalSeconds = num / 100;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    if (minutes > 0) return `${minutes}:${seconds.padStart(5, '0')}`;
    else return seconds;
}

function extractChineseName(name) {
    if (name && name.includes('(') && name.includes(')')) {
        const match = name.match(/\(([^)]+)\)/);
        if (match && /[\u4e00-\u9fa5]/.test(match[1])) return match[1];
    }
    return name;
}

function getDisplayName(item) {
    const name = item.name || '';
    if (!state.currentLang?.startsWith('zh')) return name;
    const isChinese = (item.country === 'China') || (item.province);
    return isChinese ? extractChineseName(name) : name;
}

function deduplicateByBestAndDate(data, project) {
    const map = new Map();
    data.forEach(item => {
        const id = item.wcaid;
        if (!id) return;
        const existing = map.get(id);
        if (!existing) { map.set(id, item); return; }

        let isBetter = false;
        if (project === '333mbf') {
            const curr = parseMBF(item.result);
            const exist = parseMBF(existing.result);
            if (!curr && !exist) return;
            if (!curr) return;
            if (!exist) { map.set(id, item); return; }
            const currScore = curr.success - curr.fail;
            const existScore = exist.success - exist.fail;
            if (currScore > existScore) isBetter = true;
            else if (currScore === existScore) {
                if (curr.timeSeconds < exist.timeSeconds) isBetter = true;
                else if (curr.timeSeconds === exist.timeSeconds && curr.fail < exist.fail) isBetter = true;
                else if (curr.timeSeconds === exist.timeSeconds && curr.fail === exist.fail) {
                    if (item.date && existing.date && item.date < existing.date) isBetter = true;
                    else if (!existing.date && item.date) isBetter = true;
                }
            }
        } else {
            const currVal = parseTime(item.result);
            const existVal = parseTime(existing.result);
            if (currVal < existVal) isBetter = true;
            else if (currVal === existVal) {
                if (item.date && existing.date && item.date < existing.date) isBetter = true;
                else if (!existing.date && item.date) isBetter = true;
            }
        }
        if (isBetter) map.set(id, item);
    });
    return Array.from(map.values());
}

function recomputeRanks(data, project) {
    data = data.filter(item => item && item.result !== undefined);
    if (project === '333mbf') {
        data.sort((a, b) => {
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
        data.sort((a, b) => parseTime(a.result) - parseTime(b.result));
    }

    let rank = 1, sameCount = 0;
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (i === 0) { item.rank = rank; continue; }
        let isSame = false;
        if (project === '333mbf') {
            const prev = parseMBF(data[i-1].result);
            const curr = parseMBF(item.result);
            if (prev && curr) {
                const prevScore = prev.success - prev.fail;
                const currScore = curr.success - curr.fail;
                isSame = (prevScore === currScore) &&
                         (prev.timeSeconds === curr.timeSeconds) &&
                         (prev.fail === curr.fail);
            } else if (!prev && !curr) isSame = true;
        } else {
            isSame = (item.result === data[i-1].result);
        }
        if (isSame) {
            sameCount++;
            item.rank = rank;
        } else {
            rank += 1 + sameCount;
            sameCount = 0;
            item.rank = rank;
        }
    }
    return data;
}

function applyGenderFilter(data, gender) {
    if (gender === 'all') return data;
    return data.filter(d => d.gender === gender);
}

function applyScopeFilter(data, continent, country) {
    if (continent) {
        const countryContinent = state.meta?.country_continent || {};
        return data.filter(d => countryContinent[d.country] === continent);
    } else if (country) {
        return data.filter(d => d.country === country);
    }
    return data;
}

function applyContinentFilter(country, continent) {
    const countryContinent = state.meta?.country_continent || {};
    return countryContinent[country] === continent;
}

function paginate(data, page, pageSize = 100) {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
}