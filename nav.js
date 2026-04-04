/* ================================================
   DarkTales — Shared Nav Builder
   © Muhammad Shourov. All Rights Reserved.
   Call buildNav(activeItem) after DOM ready.
   ================================================ */

function buildNav(activeItem) {
  const headerHTML = `
  <header class="app-header">
    <div class="header-logo">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
      <a href="feed.html" class="logo-text">DarkTales</a>
    </div>
    <div class="header-search">
      <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" placeholder="গল্প বা লেখক খুঁজুন..." id="global-search" onkeydown="handleGlobalSearch(event)">
    </div>
    <div class="header-actions">
      <a href="write.html" class="btn btn-primary btn-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        লিখুন
      </a>
      <a href="notifications.html" class="btn-icon" style="position:relative;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="nav-badge notif-badge" style="position:absolute;top:-2px;right:-2px;display:none;padding:0 4px;min-width:16px;height:16px;line-height:16px;font-size:9px;"></span>
      </a>
      <div class="dropdown">
        <button class="btn-icon" onclick="toggleDropdown(this)" id="nav-avatar"></button>
        <div class="dropdown-menu" id="user-dropdown">
          <a class="dropdown-item" href="profile.html?me=1">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            আমার প্রোফাইল
          </a>
          <a class="dropdown-item" href="bookmarks.html">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
            বুকমার্ক
          </a>
          <a class="dropdown-item" href="settings.html">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            সেটিংস
          </a>
          <div id="admin-link" style="display:none;">
            <div class="dropdown-divider"></div>
            <a class="dropdown-item" href="admin.html">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Admin Panel
            </a>
          </div>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item danger" onclick="signOutUser()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            লগআউট
          </button>
        </div>
      </div>
    </div>
  </header>`;

  const sidebarHTML = `
  <aside class="app-sidebar">
    <span class="nav-section-label">মেনু</span>
    <a class="nav-item ${activeItem==='feed'?'active':''}" href="feed.html">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      হোম
    </a>
    <a class="nav-item ${activeItem==='explore'?'active':''}" href="explore.html">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      অন্বেষণ
    </a>
    <a class="nav-item ${activeItem==='write'?'active':''}" href="write.html">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      লিখুন
    </a>
    <a class="nav-item ${activeItem==='notifications'?'active':''}" href="notifications.html" style="position:relative;">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      নোটিফিকেশন
      <span class="nav-badge notif-badge" style="display:none;"></span>
    </a>
    <a class="nav-item ${activeItem==='bookmarks'?'active':''}" href="bookmarks.html">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
      বুকমার্ক
    </a>
    <a class="nav-item ${activeItem==='leaderboard'?'active':''}" href="leaderboard.html">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
      লিডারবোর্ড
    </a>
    <div class="sidebar-divider"></div>
    <a class="nav-item ${activeItem==='profile'?'active':''}" href="profile.html?me=1">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      প্রোফাইল
    </a>
    <a class="nav-item ${activeItem==='settings'?'active':''}" href="settings.html">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      সেটিংস
    </a>
    <div id="sidebar-admin-link" style="display:none;">
      <a class="nav-item" href="admin.html">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Admin Panel
      </a>
    </div>
    <div class="sidebar-xp">
      <div class="xp-label">আপনার অগ্রগতি</div>
      <div class="xp-bar-wrap"><div class="xp-bar-fill" id="sidebar-xp-bar" style="width:0%"></div></div>
      <div class="xp-info">
        <span class="xp-level" id="sidebar-xp-level">নতুন আত্মা</span>
        <span class="xp-count" id="sidebar-xp-count">0 XP</span>
      </div>
    </div>
  </aside>`;

  const bottomNavHTML = `
  <nav class="bottom-nav">
    <a class="bottom-nav-item ${activeItem==='feed'?'active':''}" href="feed.html">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
      হোম
    </a>
    <a class="bottom-nav-item ${activeItem==='explore'?'active':''}" href="explore.html">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      খুঁজুন
    </a>
    <a class="bottom-nav-item ${activeItem==='write'?'active':''}" href="write.html">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      লিখুন
    </a>
    <a class="bottom-nav-item ${activeItem==='notifications'?'active':''}" href="notifications.html" style="position:relative;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <span class="notif-badge" style="position:absolute;top:2px;right:8px;background:var(--red);color:white;font-size:9px;padding:0 4px;border-radius:9999px;display:none;"></span>
      নোটিফ
    </a>
    <a class="bottom-nav-item ${activeItem==='profile'?'active':''}" href="profile.html?me=1">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      প্রোফাইল
    </a>
  </nav>`;

  document.body.insertAdjacentHTML('afterbegin', headerHTML);
  document.querySelector('.app-shell').insertAdjacentHTML('afterbegin', sidebarHTML);
  document.body.insertAdjacentHTML('beforeend', bottomNavHTML);

  // Check admin
  auth.onAuthStateChanged(async (user) => {
    if (user && await isAdmin(user.uid)) {
      document.getElementById('admin-link').style.display = 'block';
      const sidebarAdmin = document.getElementById('sidebar-admin-link');
      if (sidebarAdmin) sidebarAdmin.style.display = 'block';
    }
  });
}

function toggleDropdown(btn) {
  const menu = document.getElementById('user-dropdown');
  menu.classList.toggle('open');
  document.addEventListener('click', (e) => {
    if (!btn.closest('.dropdown').contains(e.target)) menu.classList.remove('open');
  }, { once: true });
}

function handleGlobalSearch(e) {
  if (e.key === 'Enter') {
    const q = document.getElementById('global-search').value.trim();
    if (q) window.location.href = `explore.html?q=${encodeURIComponent(q)}`;
  }
}
