async function fetchJSON(url) {
    console.log(`开始加载: ${url}`);
    if (state.cache[url]) {
        console.log(`使用缓存: ${url}`);
        return state.cache[url];
    }
    const res = await fetch(url);
    if (!res.ok) {
        console.error(`加载失败: ${url} 状态码 ${res.status}`);
        throw new Error(`加载失败: ${url}`);
    }
    const data = await res.json();
    if (Array.isArray(data)) {
        console.log(`加载成功: ${url} 共 ${data.length} 条记录`);
        if (data.length > 0) {
            console.log('第一条数据示例:', data[0]);
        } else {
            console.warn(`警告: ${url} 返回空数组`);
        }
        data.forEach(item => {
            if (item.result === undefined || item.result === null) {
                item.result = 'DNF';
            }
        });
    } else {
        console.log(`加载成功: ${url} (对象)`);
    }
    state.cache[url] = data; 
    return data;
}

async function loadMeta() {
    if (state.meta) return;
    try {
        state.meta = await fetchJSON('data/meta.json');
        if (!state.meta.country_continent) {
            state.meta.country_continent = {};
            console.warn('meta.json 缺少 country_continent 字段，将使用空映射，按洲筛选将无法工作');
        }
    } catch {
        state.meta = { 
            countries: [], 
            country_continent: {} 
        };
    }
}

function formatResultForSort(resultStr) {
    if (resultStr === undefined || resultStr === null || resultStr === '') return Infinity;
    if (resultStr === 'DNF' || resultStr === '暂无') return Infinity;
    if (typeof resultStr === 'string' && resultStr.includes(':')) {
        const parts = resultStr.split(':');
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(resultStr);
}

function parseTime(timeStr) {
    return formatResultForSort(timeStr);
}

function parseMBF(resultStr) {
    if (!resultStr || resultStr === 'DNF' || resultStr === '暂无') return null;
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
    if (typeof resultStr === 'string' && resultStr.includes('/') && resultStr.includes(':')) return resultStr;
    if (/^\d+$/.test(String(resultStr).trim())) {
        return resultStr;
    }
    if (typeof resultStr === 'string' && (resultStr.includes(':') || resultStr.includes('.')) && !/^\d+$/.test(resultStr)) {
        return resultStr;
    }
    const num = parseFloat(resultStr);
    if (isNaN(num) || num <= 0) return '暂无';
    const totalSeconds = num / 100;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    if (minutes > 0) {
        return `${minutes}:${seconds.padStart(5, '0')}`;
    } else {
        return seconds;
    }
}

function extractChineseName(name) {
    if (name && name.includes('(') && name.includes(')')) {
        const match = name.match(/\(([^)]+)\)/);
        if (match) {
            const inside = match[1].trim();
            if (/[\u4e00-\u9fa5]/.test(inside)) {
                return inside;
            }
        }
    }
    return name;
}

function getDisplayName(item) {
    const name = item.name || '';
    if (!state.currentLang.startsWith('zh')) {
        return name;
    }
    const isChinese = (item.country === 'China') || (item.province);
    if (isChinese) {
        return extractChineseName(name);
    }
    return name;
}

function recomputeRanks(data, project) {
    data = data.filter(item => item && item.result !== undefined);
    
    if (project === '333mbf') {
        data.sort((a, b) => {
            const aParsed = parseMBF(a.result);
            const bParsed = parseMBF(b.result);
            const aValid = aParsed !== null;
            const bValid = bParsed !== null;
            if (!aValid && !bValid) return 0;
            if (!aValid) return 1;      
            if (!bValid) return -1;
            const aScore = aParsed.success - aParsed.fail;
            const bScore = bParsed.success - bParsed.fail;
            if (aScore !== bScore) return bScore - aScore;   
            if (aParsed.timeSeconds !== bParsed.timeSeconds) return aParsed.timeSeconds - bParsed.timeSeconds;
            return aParsed.fail - bParsed.fail;
        });
    } else {
        data.sort((a, b) => parseTime(a.result) - parseTime(b.result));
    }

    let rank = 1;
    let sameCount = 0;
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (i === 0) {
            item.rank = rank;
            continue;
        }
        let isSame = false;
        if (project === '333mbf') {
            const prevParsed = parseMBF(data[i-1].result);
            const currParsed = parseMBF(item.result);
            if (prevParsed && currParsed) {
                const prevScore = prevParsed.success - prevParsed.fail;
                const currScore = currParsed.success - currParsed.fail;
                isSame = (prevScore === currScore) &&
                         (prevParsed.timeSeconds === currParsed.timeSeconds) &&
                         (prevParsed.fail === currParsed.fail);
            } else if (!prevParsed && !currParsed) {
                isSame = true;   
            } else {
                isSame = false;
            }
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