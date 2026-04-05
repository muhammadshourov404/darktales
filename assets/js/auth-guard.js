/* ================================================
   DarkTales — Auth Guard
   © Muhammad Shourov. All Rights Reserved.
   Redirects unauthenticated users to login page.
   ================================================ */

let currentUser = null;
let currentUserData = null;

function requireAuth(callback) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    const banned = await checkBanned(user.uid);
    if (banned) return;
    currentUser = user;
    const snap = await db.collection('users').doc(user.uid).get();
    if (snap.exists) {
      currentUserData = snap.data();
      applyTheme(currentUserData.theme || 'default');
      await checkDailyLogin(user.uid);
    }
    updateNavUI();
    if (callback) callback(user, currentUserData);
    hideLoading();
  });
}

function redirectIfAuth() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      window.location.href = 'feed.html';
    } else {
      hideLoading();
    }
  });
}

function updateNavUI() {
  if (!currentUser || !currentUserData) return;
  const xp = currentUserData.xp || 0;
  const lvl = getLevelInfo(xp);
  const progress = getXPProgress(xp);

  const xpBarEl = document.getElementById('sidebar-xp-bar');
  const xpLevelEl = document.getElementById('sidebar-xp-level');
  const xpCountEl = document.getElementById('sidebar-xp-count');
  const navAvatarEl = document.getElementById('nav-avatar');

  if (xpBarEl) xpBarEl.style.width = progress + '%';
  if (xpLevelEl) xpLevelEl.textContent = lvl.name;
  if (xpCountEl) xpCountEl.textContent = xp + ' XP';
  if (navAvatarEl) navAvatarEl.innerHTML = renderAvatar(currentUserData.displayName || currentUser.email, 'sm');

  // Unread notification count
  db.collection('notifications')
    .where('userId', '==', currentUser.uid)
    .where('read', '==', false)
    .onSnapshot((snap) => {
      const count = snap.size;
      const badges = document.querySelectorAll('.notif-badge');
      badges.forEach(b => {
        b.textContent = count;
        b.style.display = count > 0 ? 'inline' : 'none';
      });
    });
}

function signOutUser() {
  auth.signOut().then(() => { window.location.href = 'index.html'; });
}
