// 在文件开头添加更新桌面导航的函数
function updateDesktopNav() {
    const desktopNav = document.getElementById('desktop-nav');
    if (!desktopNav) return;
    desktopNav.innerHTML = `
        <a href="#home" class="nav-item" data-page="home">${__('nav.home')}</a>
        <a href="#season" class="nav-item" data-page="season">${__('nav.season')}</a>
        <a href="#active" class="nav-item" data-page="active">${__('nav.active')}</a>
        <a href="#region" class="nav-item" data-page="region">${__('nav.region')}</a>
        <a href="#comprehensive" class="nav-item" data-page="comprehensive">${__('nav.comprehensive')}</a>
        <a href="#record" class="nav-item" data-page="record">${__('nav.record')}</a>
    `;
}

// 在 bindLanguageSwitch 中，切换语言后调用 updateDesktopNav 和更新移动导航
function bindLanguageSwitch() {
    const select = document.getElementById('lang-select');
    if (!select) return;
    select.innerHTML = LANG_LIST.map(l => `<option value="${l.code}">${l.name}</option>`).join('');
    select.value = state.currentLang;
    select.addEventListener('change', (e) => {
        const newLang = e.target.value;
        state.currentLang = newLang;
        localStorage.setItem('preferredLang', newLang);
        updateDesktopNav(); // 更新桌面导航
        // 更新移动导航
        const mobileNav = document.getElementById('mobile-nav');
        if (mobileNav) {
            mobileNav.innerHTML = `
                <a href="#home" class="nav-item" data-page="home">${__('nav.home')}</a>
                <a href="#season" class="nav-item" data-page="season">${__('nav.season')}</a>
                <a href="#active" class="nav-item" data-page="active">${__('nav.active')}</a>
                <a href="#region" class="nav-item" data-page="region">${__('nav.region')}</a>
                <a href="#comprehensive" class="nav-item" data-page="comprehensive">${__('nav.comprehensive')}</a>
                <a href="#record" class="nav-item" data-page="record">${__('nav.record')}</a>
            `;
        }
        // 重新加载当前页面以更新所有文本
        if (state.currentPage) {
            loadPage(state.currentPage);
        }
    });
}

// 在 load 事件中初始化
window.addEventListener('load', async () => {
    await initLanguage();
    bindLanguageSwitch();
    updateDesktopNav(); // 首次生成桌面导航

    const menuIcon = document.getElementById('mobile-menu-icon');
    const mobileNav = document.getElementById('mobile-nav');
    menuIcon.addEventListener('click', () => mobileNav.classList.toggle('show'));
    mobileNav.innerHTML = `
        <a href="#home" class="nav-item" data-page="home">${__('nav.home')}</a>
        <a href="#season" class="nav-item" data-page="season">${__('nav.season')}</a>
        <a href="#active" class="nav-item" data-page="active">${__('nav.active')}</a>
        <a href="#region" class="nav-item" data-page="region">${__('nav.region')}</a>
        <a href="#comprehensive" class="nav-item" data-page="comprehensive">${__('nav.comprehensive')}</a>
        <a href="#record" class="nav-item" data-page="record">${__('nav.record')}</a>
    `;
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('show')));

    window.addEventListener('hashchange', handleHash);
    handleHash();
});