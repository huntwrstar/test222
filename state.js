window.state = {
    cache: {}, 
    currentPage: 'home',
    meta: null,
    season: { project: '333', type: 'single', scope: 'country:China', gender: 'all', continent: '', country: 'China' },
    active: { project: '333', type: 'single', scope: 'country:China', gender: 'all', continent: '', country: 'China' },
    region: { 
        project: '333', type: 'single', period: 'historical', 
        province: '北京', city: '全部城市', gender: 'all',
        allProvinces: [],
        provinceCities: {}
    },
    comprehensive: { 
        source: 'season',
        subDataset: 'historical',
        scope: 'country:China',
        selectedEvents: ['333'],
        gender: 'all',
        province: '',
        city: '全部城市',
        type: 'single',
        rankedData: [],
        currentPage: 1
    },
    record: {
        province: '北京',
        city: '全部城市',
        gender: 'all',
        allProvinces: [],
        provinceCities: {},
        rawDataByProject: {},
        dataLoaded: false,
        loading: false
    },
    pagination: { currentPage: 1, totalPages: 1, data: [] }
};

window.MUNICIPALITIES = ['北京', '上海', '重庆', '天津', '台湾', '香港', '澳门', '神手谷'];

window.PROJECT_LIST = [
    {code:'333', name:'三阶'},{code:'222', name:'二阶'},{code:'444', name:'四阶'},{code:'555', name:'五阶'},
    {code:'666', name:'六阶'},{code:'777', name:'七阶'},{code:'333bf', name:'三盲'},{code:'333fm', name:'最少步'},
    {code:'333oh', name:'单手'},{code:'clock', name:'魔表'},{code:'minx', name:'五魔方'},{code:'pyram', name:'金字塔'},
    {code:'skewb', name:'斜转'},{code:'sq1', name:'SQ1'},{code:'444bf', name:'四盲'},{code:'555bf', name:'五盲'},
    {code:'333mbf', name:'多盲'}
];