/* ================================================
   DarkTales — Complete Script
   © Muhammad Shourov. All Rights Reserved.
   ================================================ */

/* ══════════════════════════════════════
   FIREBASE INIT
══════════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyB2D2PDyUFGERGRkCeribAWc2Ogj1zG_nU",
  authDomain: "darktales-3b610.firebaseapp.com",
  projectId: "darktales-3b610",
  storageBucket: "darktales-3b610.firebasestorage.app",
  messagingSenderId: "371433251557",
  appId: "1:371433251557:web:eef56e3d080983272aea0c"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* ══════════════════════════════════════
   CONSTANTS
══════════════════════════════════════ */
const XP = {
  POST_STORY: 10, RECEIVE_LIKE: 2, RECEIVE_COMMENT: 3,
  RECEIVE_RATING: 3, RECEIVE_5STAR: 8, RECEIVE_FOLLOWER: 5,
  STORY_FEATURED: 25, STORY_TRENDING: 15, POST_COMMENT: 1, DAILY_LOGIN: 3
};
const LEVELS = [
  { min:0,    max:99,   name:'নতুন আত্মা',         cls:'level-1' },
  { min:100,  max:499,  name:'অন্ধকারের পথিক',     cls:'level-2' },
  { min:500,  max:999,  name:'ভয়ের গল্পকার',        cls:'level-3' },
  { min:1000, max:2499, name:'রাতের রাজা',          cls:'level-4' },
  { min:2500, max:4999, name:'অতিপ্রাকৃত মাস্টার', cls:'level-5' },
  { min:5000, max:Infinity, name:'DarkTales Legend', cls:'level-6' }
];
const THEMES = [
  { id:'default',  name:'Default',   xp:0,    },
  { id:'blood',    name:'Blood Red', xp:500,  },
  { id:'ghost',    name:'Ghost',     xp:1000, },
  { id:'midnight', name:'Midnight',  xp:2000, },
  { id:'cursed',   name:'Cursed',    xp:5000, }
];
const CATS = [
  { id:'ghost',     label:'ভুতুড়ে অভিজ্ঞতা', cls:'cat-ghost'     },
  { id:'dark',      label:'রাতের আঁধার',      cls:'cat-dark'      },
  { id:'real',      label:'বাস্তব ভয়',         cls:'cat-real'      },
  { id:'super',     label:'অতিপ্রাকৃত',        cls:'cat-super'     },
  { id:'challenge', label:'চ্যালেঞ্জিং মুহূর্ত',cls:'cat-challenge' },
  { id:'mystery',   label:'অজানা রহস্য',       cls:'cat-mystery'   }
];

/* ══════════════════════════════════════
   STATE
══════════════════════════════════════ */
let currentUser = null;
let currentUserData = null;
let currentPage = 'feed';
let reportTarget = { type: null, id: null, storyId: null };
let ratingTarget = { storyId: null, storyData: null };
let selectedRating = 0;
let hasRated = false;
let feedLastDoc = null;
let feedLoading = false;
let exploreLastDoc = null;
let notifUnsubscribe = null;

/* ══════════════════════════════════════
   BOOT
══════════════════════════════════════ */
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    showAuthSection();
    hideLoading();
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
  showAppSection();
  updateSidebarUI();
  watchNotifBadge();
  checkAdminUI();
  lucide.createIcons();
  navigate('feed');
  hideLoading();
});

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
function hideLoading() {
  const el = document.getElementById('loading-screen');
  if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }
}
function showAuthSection() {
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('app-section').style.display = 'none';
  showPage('login');
}
function showAppSection() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('app-section').style.display = 'block';
}
function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
function timeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return 'এইমাত্র';
  if (diff < 3600) return Math.floor(diff/60) + ' মিনিট আগে';
  if (diff < 86400) return Math.floor(diff/3600) + ' ঘন্টা আগে';
  if (diff < 604800) return Math.floor(diff/86400) + ' দিন আগে';
  return date.toLocaleDateString('bn-BD');
}
function fmtNum(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
  if (n >= 1000) return (n/1000).toFixed(1)+'K';
  return String(n);
}
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
}
function calcReadTime(text) {
  return Math.max(1, Math.ceil((text||'').trim().split(/\s+/).length / 200));
}
function isValidUsername(u) { return /^[a-zA-Z0-9_]{3,20}$/.test(u); }
function applyTheme(id) {
  document.body.className = document.body.className.replace(/theme-\S+/g,'').trim();
  if (id && id !== 'default') document.body.classList.add('theme-'+id);
}
function getLevelInfo(xp) {
  for (let i = LEVELS.length-1; i >= 0; i--) {
    if ((xp||0) >= LEVELS[i].min) return { ...LEVELS[i], idx: i+1 };
  }
  return { ...LEVELS[0], idx: 1 };
}
function getXPProgress(xp) {
  const lvl = getLevelInfo(xp);
  if (lvl.max === Infinity) return 100;
  return Math.round(((xp - lvl.min) / (lvl.max - lvl.min + 1)) * 100);
}
function getCat(id) { return CATS.find(c=>c.id===id) || CATS[0]; }
function renderAvatar(name, size='sm', extra='') {
  const colors = ['#7c3aed','#dc2626','#d97706','#0ea5e9','#16a34a','#db2777'];
  const color = colors[(name||'').charCodeAt(0) % colors.length];
  return `<div class="avatar avatar-${size} ${extra}" style="background:${color}22;border-color:${color}44;color:${color};">${sanitize(getInitials(name))}</div>`;
}
function renderCatBadge(id) {
  const c = getCat(id);
  return `<span class="category-badge ${c.cls}">${sanitize(c.label)}</span>`;
}
function renderLevelBadge(xp) {
  const lvl = getLevelInfo(xp);
  return `<span class="level-badge ${lvl.cls}">${sanitize(lvl.name)}</span>`;
}
function renderStars(rating, size='') {
  let h = `<div class="stars stars-display">`;
  for (let i=1;i<=5;i++) {
    h += `<svg class="star ${size} ${i<=Math.round(rating)?'filled':''}" viewBox="0 0 24 24" fill="${i<=Math.round(rating)?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
  return h + '</div>';
}
async function awardXP(uid, amount, reason) {
  try {
    await db.collection('users').doc(uid).update({ xp: firebase.firestore.FieldValue.increment(amount) });
  } catch(e) {}
}
async function sendNotif(toUid, type, fromUser, extra={}) {
  if (!toUid || toUid === fromUser.uid) return;
  try {
    await db.collection('notifications').add({
      userId: toUid, type,
      fromUserId: fromUser.uid,
      fromUserName: fromUser.displayName || 'Someone',
      fromUserUsername: fromUser.username || '',
      storyId: extra.storyId || null,
      storyTitle: extra.storyTitle || null,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) {}
}
async function checkBanned(uid) {
  try {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists && doc.data().banned) {
      auth.signOut();
      document.getElementById('banned-notice').style.display = 'block';
      showAuthSection();
      hideLoading();
      return true;
    }
  } catch(e) {}
  return false;
}
async function checkDailyLogin(uid) {
  try {
    const today = new Date().toDateString();
    const doc = await db.collection('users').doc(uid).get();
    const data = doc.data();
    if (!data || data.lastStreakDate === today) return;
    const yesterday = new Date(Date.now()-86400000).toDateString();
    const newStreak = data.lastStreakDate === yesterday ? (data.loginStreak||0)+1 : 1;
    await db.collection('users').doc(uid).update({
      lastStreakDate: today, loginStreak: newStreak,
      xp: firebase.firestore.FieldValue.increment(XP.DAILY_LOGIN),
      lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) {}
}
async function checkAdminUI() {
  try {
    const doc = await db.collection('admins').doc(currentUser.uid).get();
    if (doc.exists) {
      document.getElementById('admin-menu-item').style.display = 'block';
      const sb = document.getElementById('sidebar-admin-link');
      if (sb) sb.style.display = 'block';
    }
  } catch(e) {}
}
function watchNotifBadge() {
  if (notifUnsubscribe) notifUnsubscribe();
  notifUnsubscribe = db.collection('notifications')
    .where('userId','==',currentUser.uid)
    .where('read','==',false)
    .onSnapshot(snap => {
      const n = snap.size;
      ['notif-badge','sidebar-notif-badge','bnav-notif-badge'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.textContent = n; el.style.display = n>0?'inline':'none'; }
      });
    });
}
function updateSidebarUI() {
  if (!currentUser || !currentUserData) return;
  const xp = currentUserData.xp || 0;
  const lvl = getLevelInfo(xp);
  const prog = getXPProgress(xp);
  const bar = document.getElementById('sidebar-xp-bar');
  const lvlEl = document.getElementById('sidebar-xp-level');
  const cntEl = document.getElementById('sidebar-xp-count');
  const navAv = document.getElementById('nav-avatar');
  if (bar) bar.style.width = prog + '%';
  if (lvlEl) lvlEl.textContent = lvl.name;
  if (cntEl) cntEl.textContent = fmtNum(xp) + ' XP';
  if (navAv) navAv.innerHTML = renderAvatar(currentUserData.displayName || currentUser.email, 'sm');
}
function showToast(msg, type='info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const icons = {
    success:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `${icons[type]||icons.info}<span class="toast-msg">${sanitize(msg)}</span>`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transition='.25s'; setTimeout(()=>t.remove(),250); }, 3500);
}

/* ══════════════════════════════════════
   AUTH FUNCTIONS
══════════════════════════════════════ */
function showPage(page) {
  ['login-form','register-form','forgot-form'].forEach(id=>{
    document.getElementById(id).style.display='none';
  });
  document.getElementById(page+'-form').style.display='block';
}

const googleProvider = new firebase.auth.GoogleAuthProvider();

async function googleSignIn() {
  try {
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;
    const doc = await db.collection('users').doc(user.uid).get();
    if (!doc.exists) {
      await db.collection('users').doc(user.uid).set({
        uid: user.uid, email: user.email,
        displayName: user.displayName || 'Anonymous',
        username: 'user_' + user.uid.slice(0,8),
        bio: '', xp: 0, theme: 'default',
        verified: false, banned: false,
        followersCount: 0, followingCount: 0, storiesCount: 0,
        loginStreak: 1, lastStreakDate: new Date().toDateString(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch(e) {
    showToast(e.message || 'Google লগইন ব্যর্থ হয়েছে', 'error');
  }
}

document.getElementById('google-login-btn').addEventListener('click', googleSignIn);
document.getElementById('google-register-btn').addEventListener('click', googleSignIn);

async function loginEmail() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');
  err.textContent = '';
  if (!email || !pass) { err.textContent = 'সব তথ্য দিন'; return; }
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch(e) {
    const msgs = { 'auth/user-not-found':'ইমেইল পাওয়া যায়নি', 'auth/wrong-password':'পাসওয়ার্ড ভুল', 'auth/invalid-email':'ইমেইল ফরম্যাট ভুল', 'auth/too-many-requests':'অনেকবার চেষ্টা হয়েছে' };
    err.textContent = msgs[e.code] || e.message;
  }
}

async function registerEmail() {
  const name = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim().toLowerCase();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-password').value;
  const pass2 = document.getElementById('reg-password2').value;
  const err = document.getElementById('reg-error');
  err.textContent = '';
  if (!name||!username||!email||!pass||!pass2) { err.textContent='সব তথ্য দিন'; return; }
  if (!isValidUsername(username)) { err.textContent='ইউজারনেম অবৈধ (৩-২০ অক্ষর, a-z 0-9 _)'; return; }
  if (pass.length < 8) { err.textContent='পাসওয়ার্ড কমপক্ষে ৮ অক্ষর'; return; }
  if (pass !== pass2) { err.textContent='পাসওয়ার্ড মিলছে না'; return; }
  const uCheck = await db.collection('users').where('username','==',username).get();
  if (!uCheck.empty) { err.textContent='এই ইউজারনেম নেওয়া হয়েছে'; return; }
  try {
    const result = await auth.createUserWithEmailAndPassword(email, pass);
    await result.user.updateProfile({ displayName: name });
    await result.user.sendEmailVerification();
    await db.collection('users').doc(result.user.uid).set({
      uid: result.user.uid, email, displayName: name, username,
      bio: '', xp: 0, theme: 'default',
      verified: false, banned: false,
      followersCount: 0, followingCount: 0, storiesCount: 0,
      loginStreak: 1, lastStreakDate: new Date().toDateString(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('অ্যাকাউন্ট তৈরি হয়েছে! ইমেইল ভেরিফাই করুন।', 'success');
  } catch(e) {
    const msgs = { 'auth/email-already-in-use':'এই ইমেইল ইতিমধ্যে ব্যবহৃত', 'auth/invalid-email':'ইমেইল ফরম্যাট ভুল', 'auth/weak-password':'পাসওয়ার্ড শক্তিশালী করুন' };
    err.textContent = msgs[e.code] || e.message;
  }
}

async function sendReset() {
  const email = document.getElementById('forgot-email').value.trim();
  const err = document.getElementById('forgot-error');
  err.textContent = '';
  if (!email) { err.textContent='ইমেইল দিন'; return; }
  try {
    await auth.sendPasswordResetEmail(email);
    showToast('রিসেট লিংক পাঠানো হয়েছে!', 'success');
    showPage('login');
  } catch(e) { err.textContent='ইমেইল পাওয়া যায়নি'; }
}

let uChkTimer;
async function checkUsername(inp) {
  clearTimeout(uChkTimer);
  const val = inp.value.trim().toLowerCase();
  const hint = document.getElementById('username-hint');
  const err = document.getElementById('username-error');
  err.textContent = '';
  if (!val) return;
  if (!isValidUsername(val)) { err.textContent='৩-২০ অক্ষর, a-z 0-9 _'; return; }
  uChkTimer = setTimeout(async ()=>{
    const snap = await db.collection('users').where('username','==',val).get();
    if (!snap.empty) { err.textContent='এই ইউজারনেম নেওয়া হয়েছে'; }
    else { hint.textContent='✓ পাওয়া যাচ্ছে'; hint.style.color='var(--success)'; }
  }, 600);
}

function togglePass(id) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function doSignOut() {
  if (notifUnsubscribe) notifUnsubscribe();
  auth.signOut().then(()=>{ window.location.reload(); });
}

/* ══════════════════════════════════════
   NAVIGATION / ROUTER
══════════════════════════════════════ */
function navigate(page, params={}) {
  currentPage = page;
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('nav-'+page);
  const bnavEl = document.getElementById('bnav-'+page);
  if (navEl) navEl.classList.add('active');
  if (bnavEl) bnavEl.classList.add('active');
  const main = document.getElementById('page-content');
  main.innerHTML = `<div style="text-align:center;padding:3rem;"><div class="spinner spinner-lg" style="margin:0 auto;"></div></div>`;
  window.scrollTo(0,0);
  switch(page) {
    case 'feed':        renderFeed(main); break;
    case 'explore':     renderExplore(main, params); break;
    case 'write':       renderWrite(main, params); break;
    case 'story':       renderStoryDetail(main, params.id); break;
    case 'profile':     renderProfile(main, params); break;
    case 'notifications': renderNotifications(main); break;
    case 'bookmarks':   renderBookmarks(main); break;
    case 'leaderboard': renderLeaderboard(main); break;
    case 'settings':    renderSettings(main); break;
    default:            renderFeed(main);
  }
}

function toggleDropdown() {
  const menu = document.getElementById('user-dropdown');
  menu.classList.toggle('open');
  setTimeout(()=>{
    document.addEventListener('click', function handler(e) {
      if (!e.target.closest('.dropdown')) { menu.classList.remove('open'); }
      document.removeEventListener('click', handler);
    });
  }, 10);
}

/* ══════════════════════════════════════
   PAGE: FEED
══════════════════════════════════════ */
let feedTab = 'explore';
let feedCat = '';
feedLastDoc = null;

async function renderFeed(container) {
  container.innerHTML = `
    <div class="tabs" id="feed-tabs">
      <button class="tab-btn ${feedTab==='following'?'active':''}" onclick="switchFeedTab('following')">Following</button>
      <button class="tab-btn ${feedTab==='explore'?'active':''}" onclick="switchFeedTab('explore')">সকলের গল্প</button>
      <button class="tab-btn ${feedTab==='trending'?'active':''}" onclick="switchFeedTab('trending')">ট্রেন্ডিং</button>
      <button class="tab-btn ${feedTab==='featured'?'active':''}" onclick="switchFeedTab('featured')">ফিচার্ড</button>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem;" id="feed-cat-row">
      <button class="tag-pill ${feedCat===''?'active':''}" onclick="switchFeedCat('')">সব</button>
      ${CATS.map(c=>`<button class="tag-pill ${feedCat===c.id?'active':''}" onclick="switchFeedCat('${c.id}')">${sanitize(c.label)}</button>`).join('')}
    </div>
    <div id="feed-list"></div>
    <div id="feed-load-more" style="text-align:center;padding:1.5rem 0;display:none;">
      <button class="btn btn-ghost" onclick="loadMoreFeed()">আরো গল্প দেখুন</button>
    </div>
    <div id="feed-spinner" style="text-align:center;padding:1.5rem;display:none;">
      <div class="spinner spinner-lg" style="margin:0 auto;"></div>
    </div>`;
  feedLastDoc = null;
  await loadFeedStories(true);
  lucide.createIcons();
}

function switchFeedTab(tab) {
  feedTab = tab;
  feedLastDoc = null;
  document.querySelectorAll('#feed-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('#feed-tabs .tab-btn').forEach(b=>{ if(b.textContent.includes(tabLabel(tab))) b.classList.add('active'); });
  loadFeedStories(true);
}
function tabLabel(t) { return { following:'Following', explore:'সকলের', trending:'ট্রেন্ডিং', featured:'ফিচার্ড' }[t] || ''; }

function switchFeedCat(cat) {
  feedCat = cat;
  feedLastDoc = null;
  document.querySelectorAll('#feed-cat-row .tag-pill').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
  loadFeedStories(true);
}

async function loadFeedStories(reset=false) {
  if (feedLoading) return;
  feedLoading = true;
  const list = document.getElementById('feed-list');
  const spinner = document.getElementById('feed-spinner');
  const loadMore = document.getElementById('feed-load-more');
  if (!list) { feedLoading=false; return; }
  if (reset) { list.innerHTML=''; feedLastDoc=null; }
  if (spinner) spinner.style.display='block';
  if (loadMore) loadMore.style.display='none';
  try {
    let q = db.collection('stories').where('isDraft','==',false).where('hidden','==',false);
    if (feedCat) q = q.where('category','==',feedCat);
    if (feedTab==='trending') q = q.orderBy('views','desc').orderBy('createdAt','desc');
    else if (feedTab==='featured') q = q.where('featured','==',true).orderBy('createdAt','desc');
    else q = q.orderBy('createdAt','desc');
    if (feedLastDoc) q = q.startAfter(feedLastDoc);
    q = q.limit(10);
    let snap = await q.get();
    let docs = snap.docs;
    if (feedTab==='following') {
      const fSnap = await db.collection('follows').where('followerId','==',currentUser.uid).get();
      const ids = fSnap.docs.map(d=>d.data().followingId);
      if (ids.length===0) {
        if (reset) list.innerHTML=`<div class="empty-state"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><h3>কাউকে ফলো করুন</h3><p>ফলো করা লেখকদের গল্প এখানে দেখাবে।</p><button class="btn btn-primary btn-sm mt-2" onclick="navigate('explore',{})">লেখক খুঁজুন</button></div>`;
        feedLoading=false; if(spinner) spinner.style.display='none'; return;
      }
      docs = docs.filter(d=>ids.includes(d.data().authorId));
    }
    if (reset && docs.length===0) {
      list.innerHTML=`<div class="empty-state"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><h3>কোনো গল্প নেই</h3><button class="btn btn-primary btn-sm mt-2" onclick="navigate('write')">প্রথম গল্প লিখুন</button></div>`;
      feedLoading=false; if(spinner) spinner.style.display='none'; return;
    }
    docs.forEach(doc=>{
      list.insertAdjacentHTML('beforeend', buildStoryCard({ id:doc.id,...doc.data() }));
    });
    if (snap.docs.length>0) feedLastDoc=snap.docs[snap.docs.length-1];
    if (loadMore) loadMore.style.display=snap.docs.length===10?'block':'none';
  } catch(e) { showToast('গল্প লোড করতে সমস্যা হয়েছে','error'); }
  feedLoading=false;
  if (spinner) spinner.style.display='none';
  lucide.createIcons();
}

function loadMoreFeed() { loadFeedStories(false); }

function buildStoryCard(s) {
  const cat = getCat(s.category);
  const avg = s.ratingCount>0 ? (s.ratingSum/s.ratingCount).toFixed(1) : 0;
  return `
  <div class="story-card ${s.featured?'featured':''}" onclick="navigate('story',{id:'${s.id}'})">
    ${s.featured?'<div style="margin-bottom:8px;"><span class="featured-badge">★ ফিচার্ড</span></div>':''}
    <div class="story-card-meta">
      <div class="story-card-author">
        ${renderAvatar(s.isAnonymous?'?':s.authorName,'sm')}
        <span class="story-card-author-name" onclick="event.stopPropagation();navigate('profile',{uid:'${s.authorId}'})">${sanitize(s.isAnonymous?'অজানা লেখক':s.authorName)}</span>
      </div>
      <span class="story-card-date">${timeAgo(s.createdAt)}</span>
    </div>
    <div class="story-card-title">${sanitize(s.title)}</div>
    <div class="story-card-body">${sanitize(s.body)}</div>
    <div class="story-card-footer">
      ${renderCatBadge(s.category)}
      <span class="lang-badge">${s.language==='en'?'EN':'বাংলা'}</span>
      <span style="font-size:11px;color:var(--text-3);">${s.readingTime||1} মিনিট</span>
      ${avg>0?`<span style="font-size:12px;color:var(--gold);">★ ${avg}</span>`:''}
      <div class="story-card-actions">
        <button class="story-action-btn" onclick="event.stopPropagation();quickLike('${s.id}',this)">
          <i data-lucide="heart" style="width:13px;height:13px;"></i>
          <span>${fmtNum(s.likesCount||0)}</span>
        </button>
        <button class="story-action-btn" onclick="event.stopPropagation();navigate('story',{id:'${s.id}'})">
          <i data-lucide="message-circle" style="width:13px;height:13px;"></i>
          <span>${fmtNum(s.commentsCount||0)}</span>
        </button>
        <button class="story-action-btn" onclick="event.stopPropagation();quickBookmark('${s.id}','${sanitize(s.title)}',this)">
          <i data-lucide="bookmark" style="width:13px;height:13px;"></i>
        </button>
      </div>
    </div>
  </div>`;
}

async function quickLike(storyId, btn) {
  if (!currentUser) return;
  const likeRef = db.collection('stories').doc(storyId).collection('likes').doc(currentUser.uid);
  const likeDoc = await likeRef.get();
  const span = btn.querySelector('span');
  const storyRef = db.collection('stories').doc(storyId);
  if (likeDoc.exists) {
    await likeRef.delete();
    await storyRef.update({ likesCount: firebase.firestore.FieldValue.increment(-1) });
    btn.classList.remove('liked');
    if (span) span.textContent = Math.max(0, (parseInt(span.textContent)||1)-1);
  } else {
    await likeRef.set({ uid:currentUser.uid, createdAt:firebase.firestore.FieldValue.serverTimestamp() });
    await storyRef.update({ likesCount: firebase.firestore.FieldValue.increment(1) });
    btn.classList.add('liked');
    if (span) span.textContent = (parseInt(span.textContent)||0)+1;
    const sDoc = await storyRef.get();
    if (sDoc.exists && sDoc.data().authorId !== currentUser.uid) {
      await awardXP(sDoc.data().authorId, XP.RECEIVE_LIKE, 'like');
      await sendNotif(sDoc.data().authorId, 'like', { uid:currentUser.uid, displayName:currentUserData?.displayName, username:currentUserData?.username }, { storyId, storyTitle:sDoc.data().title });
    }
  }
}

async function quickBookmark(storyId, title, btn) {
  if (!currentUser) return;
  const ref = db.collection('bookmarks').doc(`${currentUser.uid}_${storyId}`);
  const doc = await ref.get();
  if (doc.exists) {
    await ref.delete();
    btn.classList.remove('bookmarked');
    showToast('বুকমার্ক সরানো হয়েছে','info');
  } else {
    await ref.set({ userId:currentUser.uid, storyId, storyTitle:title, createdAt:firebase.firestore.FieldValue.serverTimestamp() });
    btn.classList.add('bookmarked');
    showToast('বুকমার্ক হয়েছে','success');
  }
}

/* ══════════════════════════════════════
   PAGE: EXPLORE
══════════════════════════════════════ */
let exploreType = 'stories';
let exploreCat = '';
let exploreSort = 'newest';
let exploreQuery = '';
let exploreTimer;

async function renderExplore(container, params={}) {
  if (params.q) exploreQuery = params.q;
  exploreLastDoc = null;
  container.innerHTML = `
    <div class="section-header mb-2">
      <h2 class="page-title"><i data-lucide="search" style="width:18px;height:18px;"></i> অন্বেষণ</h2>
    </div>
    <div style="position:relative;margin-bottom:1.25rem;">
      <i data-lucide="search" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-3);width:15px;height:15px;pointer-events:none;"></i>
      <input class="form-input" type="text" id="explore-search" value="${sanitize(exploreQuery)}" placeholder="গল্পের শিরোনাম বা লেখক খুঁজুন..." style="padding-left:42px;" oninput="onExploreSearch()" onkeydown="if(event.key==='Enter')doExploreSearch()">
    </div>
    <div class="tabs" id="explore-type-tabs">
      <button class="tab-btn ${exploreType==='stories'?'active':''}" onclick="switchExploreType('stories')">গল্প</button>
      <button class="tab-btn ${exploreType==='users'?'active':''}" onclick="switchExploreType('users')">লেখক</button>
    </div>
    <div id="explore-cat-row" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem;">
      <button class="tag-pill ${exploreCat===''?'active':''}" onclick="switchExploreCat('')">সব</button>
      ${CATS.map(c=>`<button class="tag-pill ${exploreCat===c.id?'active':''}" onclick="switchExploreCat('${c.id}')">${sanitize(c.label)}</button>`).join('')}
    </div>
    <div id="explore-sort-row" style="display:flex;gap:6px;margin-bottom:1rem;align-items:center;">
      <span style="font-size:12px;color:var(--text-3);">সাজান:</span>
      <button class="tag-pill ${exploreSort==='newest'?'active':''}" onclick="switchExploreSort('newest')">নতুন</button>
      <button class="tag-pill ${exploreSort==='popular'?'active':''}" onclick="switchExploreSort('popular')">জনপ্রিয়</button>
      <button class="tag-pill ${exploreSort==='rated'?'active':''}" onclick="switchExploreSort('rated')">সেরা রেটিং</button>
    </div>
    <div id="explore-results"></div>
    <div id="explore-spinner" style="text-align:center;padding:1.5rem;display:none;"><div class="spinner spinner-lg" style="margin:0 auto;"></div></div>
    <div id="explore-load-more" style="text-align:center;padding:1rem;display:none;">
      <button class="btn btn-ghost" onclick="loadMoreExplore()">আরো দেখুন</button>
    </div>`;
  await loadExploreResults(true);
  lucide.createIcons();
}

function onExploreSearch() {
  clearTimeout(exploreTimer);
  exploreTimer = setTimeout(()=>{
    exploreQuery = document.getElementById('explore-search')?.value.trim()||'';
    exploreLastDoc = null;
    loadExploreResults(true);
  }, 400);
}
function doExploreSearch() {
  exploreQuery = document.getElementById('explore-search')?.value.trim()||'';
  exploreLastDoc = null;
  loadExploreResults(true);
}
function switchExploreType(type) {
  exploreType = type;
  exploreLastDoc = null;
  const catRow = document.getElementById('explore-cat-row');
  const sortRow = document.getElementById('explore-sort-row');
  if (catRow) catRow.style.display = type==='users'?'none':'flex';
  if (sortRow) sortRow.style.display = type==='users'?'none':'flex';
  document.querySelectorAll('#explore-type-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
  loadExploreResults(true);
}
function switchExploreCat(cat) {
  exploreCat = cat;
  exploreLastDoc = null;
  document.querySelectorAll('#explore-cat-row .tag-pill').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
  loadExploreResults(true);
}
function switchExploreSort(sort) {
  exploreSort = sort;
  exploreLastDoc = null;
  document.querySelectorAll('#explore-sort-row .tag-pill').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
  loadExploreResults(true);
}

async function loadExploreResults(reset=false) {
  const results = document.getElementById('explore-results');
  const spinner = document.getElementById('explore-spinner');
  const loadMore = document.getElementById('explore-load-more');
  if (!results) return;
  if (reset) { results.innerHTML=''; exploreLastDoc=null; }
  if (spinner) spinner.style.display='block';
  if (loadMore) loadMore.style.display='none';
  try {
    if (exploreType==='users') {
      let q = db.collection('users').where('banned','==',false).orderBy('xp','desc').limit(20);
      if (exploreLastDoc) q = q.startAfter(exploreLastDoc);
      const snap = await q.get();
      let docs = snap.docs;
      if (exploreQuery) { const lq=exploreQuery.toLowerCase(); docs=docs.filter(d=>{ const u=d.data(); return (u.displayName||'').toLowerCase().includes(lq)||(u.username||'').toLowerCase().includes(lq); }); }
      if (reset && docs.length===0) { results.innerHTML=`<div class="empty-state"><h3>কোনো লেখক পাওয়া যায়নি</h3></div>`; }
      else docs.forEach(doc=>{ const u=doc.data(); results.insertAdjacentHTML('beforeend',`
        <div class="user-row" onclick="navigate('profile',{uid:'${doc.id}'})">
          ${renderAvatar(u.displayName,'md')}
          <div class="user-row-info">
            <div class="user-row-name">${sanitize(u.displayName)} ${u.verified?`<i data-lucide="check-circle" style="width:13px;height:13px;color:var(--red);"></i>`:''}</div>
            <div class="user-row-username">@${sanitize(u.username||'')}</div>
            <div class="user-row-meta">${fmtNum(u.storiesCount||0)} গল্প · ${fmtNum(u.followersCount||0)} ফলোয়ার</div>
          </div>
          ${renderLevelBadge(u.xp||0)}
        </div>`); });
      if (snap.docs.length>0) exploreLastDoc=snap.docs[snap.docs.length-1];
      if (loadMore) loadMore.style.display=snap.docs.length===20?'block':'none';
    } else {
      let q = db.collection('stories').where('isDraft','==',false).where('hidden','==',false);
      if (exploreCat) q = q.where('category','==',exploreCat);
      if (exploreSort==='popular') q = q.orderBy('likesCount','desc');
      else if (exploreSort==='rated') q = q.orderBy('ratingSum','desc');
      else q = q.orderBy('createdAt','desc');
      if (exploreLastDoc) q = q.startAfter(exploreLastDoc);
      q = q.limit(12);
      const snap = await q.get();
      let docs = snap.docs;
      if (exploreQuery) { const lq=exploreQuery.toLowerCase(); docs=docs.filter(d=>{ const s=d.data(); return (s.title||'').toLowerCase().includes(lq)||(s.authorName||'').toLowerCase().includes(lq); }); }
      if (reset && docs.length===0) { results.innerHTML=`<div class="empty-state"><h3>কোনো ফলাফল নেই</h3></div>`; }
      else docs.forEach(doc=>{ results.insertAdjacentHTML('beforeend',buildStoryCard({id:doc.id,...doc.data()})); });
      if (snap.docs.length>0) exploreLastDoc=snap.docs[snap.docs.length-1];
      if (loadMore) loadMore.style.display=snap.docs.length===12?'block':'none';
    }
  } catch(e) { showToast('লোড করতে সমস্যা হয়েছে','error'); }
  if (spinner) spinner.style.display='none';
  lucide.createIcons();
}
function loadMoreExplore() { loadExploreResults(false); }

/* ══════════════════════════════════════
   PAGE: WRITE
══════════════════════════════════════ */
let writeEditId = null;
let isAnonymous = false;
let anonUnlocked = false;

function renderWrite(container, params={}) {
  writeEditId = params.editId || null;
  anonUnlocked = (currentUserData?.xp||0) >= 1000;
  container.innerHTML = `
    <div class="section-header mb-2">
      <h2 class="page-title"><i data-lucide="edit-3" style="width:18px;height:18px;"></i> গল্প লিখুন</h2>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" onclick="saveDraft()"><i data-lucide="save" style="width:14px;height:14px;"></i> ড্রাফট</button>
        <button class="btn btn-primary btn-sm" onclick="publishStory()" id="publish-btn"><i data-lucide="send" style="width:14px;height:14px;"></i> প্রকাশ করুন</button>
      </div>
    </div>
    <div class="write-container">
      <input class="story-title-input" type="text" id="story-title" placeholder="আপনার গল্পের শিরোনাম..." maxlength="150">
      <div class="write-toolbar">
        <button class="toolbar-btn" onclick="insertText('**','**')"><b>B</b></button>
        <button class="toolbar-btn" onclick="insertText('_','_')"><em>I</em></button>
        <button class="toolbar-btn" onclick="insertText('\n\n','')">¶</button>
        <button class="toolbar-btn" onclick="insertText('— ','')">—</button>
        <button class="toolbar-btn" onclick="insertText('"','"')">"</button>
        <span class="char-counter" id="char-counter">0 / 15000</span>
      </div>
      <textarea class="story-textarea" id="story-body" placeholder="আপনার ভয়ের গল্পটি এখানে লিখুন...&#10;&#10;সেই রাতটার কথা মনে আছে?" maxlength="15000" oninput="updateCounter()"></textarea>
    </div>
    <div class="write-options">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">ক্যাটাগরি</label>
        <select class="form-input form-select" id="story-category">
          ${CATS.map(c=>`<option value="${c.id}">${sanitize(c.label)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">ভাষা</label>
        <select class="form-input form-select" id="story-language">
          <option value="bn">বাংলা</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
    <div class="write-footer">
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:${anonUnlocked?'var(--text-2)':'var(--text-3)'};cursor:pointer;" onclick="toggleAnon()">
        <i data-lucide="${isAnonymous?'lock':'unlock'}" style="width:15px;height:15px;color:var(--gold);" id="anon-icon"></i>
        <span id="anon-label">${isAnonymous?'নাম গোপন থাকবে':'নাম গোপন রেখে পোস্ট করুন'}</span>
        ${!anonUnlocked?'<span style="font-size:11px;color:var(--text-3);">(১০০০ XP দরকার)</span>':''}
      </label>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" onclick="navigate('feed')">বাতিল</button>
        <button class="btn btn-primary" onclick="publishStory()" id="publish-btn2"><i data-lucide="send" style="width:15px;height:15px;"></i> প্রকাশ করুন</button>
      </div>
    </div>`;
  if (writeEditId) loadEditStory(writeEditId);
  lucide.createIcons();
}

function updateCounter() {
  const body = document.getElementById('story-body')?.value||'';
  const counter = document.getElementById('char-counter');
  if (!counter) return;
  const len = body.length;
  counter.textContent = `${len} / 15000`;
  counter.className = 'char-counter' + (len>14000?' over':len>12000?' warn':'');
}
function insertText(before, after) {
  const ta = document.getElementById('story-body');
  if (!ta) return;
  const start=ta.selectionStart, end=ta.selectionEnd;
  const sel=ta.value.substring(start,end);
  ta.value=ta.value.substring(0,start)+before+sel+after+ta.value.substring(end);
  ta.focus(); ta.selectionStart=start+before.length; ta.selectionEnd=start+before.length+sel.length;
  updateCounter();
}
function toggleAnon() {
  if (!anonUnlocked) { showToast('Anonymous পোস্টের জন্য ১০০০ XP দরকার','error'); return; }
  isAnonymous = !isAnonymous;
  const icon = document.getElementById('anon-icon');
  const label = document.getElementById('anon-label');
  if (icon) icon.setAttribute('data-lucide', isAnonymous?'lock':'unlock');
  if (label) label.textContent = isAnonymous?'নাম গোপন থাকবে':'নাম গোপন রেখে পোস্ট করুন';
  lucide.createIcons();
}
async function publishStory() {
  const title = document.getElementById('story-title')?.value.trim();
  const body = document.getElementById('story-body')?.value.trim();
  const category = document.getElementById('story-category')?.value;
  const language = document.getElementById('story-language')?.value;
  if (!title) { showToast('শিরোনাম দিন','error'); return; }
  if (!body || body.length < 100) { showToast('গল্পটি কমপক্ষে ১০০ অক্ষর হতে হবে','error'); return; }
  const btn = document.getElementById('publish-btn');
  const btn2 = document.getElementById('publish-btn2');
  if (btn) btn.disabled=true;
  if (btn2) btn2.disabled=true;
  try {
    const data = {
      title, body, category, language,
      authorId: currentUser.uid,
      authorName: isAnonymous?'অজানা':(currentUserData?.displayName||'Anonymous'),
      authorUsername: isAnonymous?'':(currentUserData?.username||''),
      isAnonymous, isDraft: false, hidden: false, featured: false,
      likesCount:0, commentsCount:0, ratingSum:0, ratingCount:0, views:0,
      readingTime: calcReadTime(body),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    let storyId;
    if (writeEditId) {
      await db.collection('stories').doc(writeEditId).update(data);
      storyId = writeEditId;
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      const ref = await db.collection('stories').add(data);
      storyId = ref.id;
      await db.collection('users').doc(currentUser.uid).update({ storiesCount: firebase.firestore.FieldValue.increment(1) });
      await awardXP(currentUser.uid, XP.POST_STORY, 'post_story');
      showToast('গল্প প্রকাশিত হয়েছে! +10 XP','success');
    }
    setTimeout(()=>navigate('story',{id:storyId}), 800);
  } catch(e) {
    showToast('প্রকাশ করতে সমস্যা হয়েছে: '+e.message,'error');
    if (btn) btn.disabled=false;
    if (btn2) btn2.disabled=false;
  }
}
async function saveDraft() {
  const title = document.getElementById('story-title')?.value.trim();
  const body = document.getElementById('story-body')?.value.trim();
  if (!title && !body) { showToast('কিছু লিখুন আগে','error'); return; }
  try {
    const data = {
      title: title||'(শিরোনামহীন)', body: body||'',
      category: document.getElementById('story-category')?.value||'ghost',
      language: document.getElementById('story-language')?.value||'bn',
      authorId: currentUser.uid,
      authorName: currentUserData?.displayName||'Anonymous',
      authorUsername: currentUserData?.username||'',
      isAnonymous: false, isDraft: true, hidden: false, featured: false,
      likesCount:0, commentsCount:0, ratingSum:0, ratingCount:0, views:0,
      readingTime: calcReadTime(body||' '),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (writeEditId) await db.collection('stories').doc(writeEditId).update(data);
    else { data.createdAt=firebase.firestore.FieldValue.serverTimestamp(); await db.collection('stories').add(data); }
    showToast('ড্রাফট সেভ হয়েছে','success');
  } catch(e) { showToast('সেভ করতে সমস্যা হয়েছে','error'); }
}
async function loadEditStory(id) {
  const doc = await db.collection('stories').doc(id).get();
  if (!doc.exists || doc.data().authorId!==currentUser.uid) return;
  const d = doc.data();
  const t=document.getElementById('story-title'); if(t) t.value=d.title||'';
  const b=document.getElementById('story-body'); if(b) b.value=d.body||'';
  const c=document.getElementById('story-category'); if(c) c.value=d.category||'ghost';
  const l=document.getElementById('story-language'); if(l) l.value=d.language||'bn';
  updateCounter();
}

/* ══════════════════════════════════════
   PAGE: STORY DETAIL
══════════════════════════════════════ */
let storyData = null;
let storyHasLiked = false;
let storyHasBookmarked = false;

async function renderStoryDetail(container, storyId) {
  if (!storyId) { navigate('feed'); return; }
  const doc = await db.collection('stories').doc(storyId).get();
  if (!doc.exists) { container.innerHTML=`<div class="empty-state"><h3>গল্পটি পাওয়া যায়নি</h3><button class="btn btn-ghost btn-sm mt-2" onclick="navigate('feed')">ফিডে ফিরুন</button></div>`; return; }
  storyData = { id:doc.id,...doc.data() };
  if (storyData.hidden && storyData.authorId!==currentUser?.uid) { container.innerHTML=`<div class="empty-state"><h3>গল্পটি লুকানো হয়েছে</h3></div>`; return; }
  const cat = getCat(storyData.category);
  const avg = storyData.ratingCount>0?(storyData.ratingSum/storyData.ratingCount).toFixed(1):0;
  const isOwner = currentUser?.uid===storyData.authorId;
  storyHasLiked = false; storyHasBookmarked = false;
  container.innerHTML = `
    <div class="read-progress"><div class="read-progress-fill" id="read-prog"></div></div>
    <div style="margin-bottom:1rem;">
      <button class="btn btn-ghost btn-sm" onclick="navigate('feed')"><i data-lucide="arrow-left" style="width:14px;height:14px;"></i> ফিরুন</button>
    </div>
    <article>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1rem;align-items:center;">
        ${renderCatBadge(storyData.category)}
        <span class="lang-badge">${storyData.language==='en'?'EN':'বাংলা'}</span>
        ${storyData.featured?'<span class="featured-badge">★ ফিচার্ড</span>':''}
        ${storyData.isAnonymous?'<span class="anon-badge">নাম গোপন</span>':''}
      </div>
      <h1 class="story-detail-title">${sanitize(storyData.title)}</h1>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:1.5rem;flex-wrap:wrap;">
        ${renderAvatar(storyData.isAnonymous?'?':storyData.authorName,'md')}
        <div>
          <div style="font-size:14px;font-weight:500;color:var(--text-1);cursor:pointer;" onclick="${!storyData.isAnonymous?`navigate('profile',{uid:'${storyData.authorId}'})`:''}">
            ${sanitize(storyData.isAnonymous?'অজানা লেখক':storyData.authorName)}
          </div>
          <div style="font-size:12px;color:var(--text-3);">${timeAgo(storyData.createdAt)} · ${storyData.readingTime||1} মিনিট · ${fmtNum(storyData.views||0)} ভিউ</div>
        </div>
        ${!storyData.isAnonymous && !isOwner ? `<button class="btn btn-ghost btn-sm" style="margin-left:auto;" onclick="toggleFollow('${storyData.authorId}',this)" id="story-follow-btn">ফলো করুন</button>` : ''}
        ${isOwner ? `<div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" onclick="navigate('write',{editId:'${storyData.id}'})">সম্পাদনা</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="deleteMyStory()">মুছুন</button>
        </div>` : ''}
      </div>
      <div class="card mb-3" style="border-left:3px solid var(--red);border-radius:0 var(--radius-lg) var(--radius-lg) 0;">
        <div class="card-body story-detail-body">${sanitize(storyData.body)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:1.5rem;">
        <button class="btn btn-ghost btn-sm" id="like-btn" onclick="toggleStoryLike()">
          <i data-lucide="heart" style="width:15px;height:15px;"></i>
          <span id="like-count">${fmtNum(storyData.likesCount||0)}</span> লাইক
        </button>
        <button class="btn btn-ghost btn-sm" id="bm-btn" onclick="toggleStoryBookmark()">
          <i data-lucide="bookmark" style="width:15px;height:15px;"></i> বুকমার্ক
        </button>
        <button class="btn btn-ghost btn-sm" onclick="shareStory()">
          <i data-lucide="share-2" style="width:15px;height:15px;"></i> শেয়ার
        </button>
        <button class="btn btn-ghost btn-sm" id="rate-btn" onclick="openRateModal()">
          <i data-lucide="star" style="width:15px;height:15px;"></i> রেটিং দিন
        </button>
        ${avg>0?`<div style="display:flex;align-items:center;gap:4px;">${renderStars(avg,'star-sm')}<span style="font-size:13px;color:var(--gold);">${avg} (${storyData.ratingCount})</span></div>`:''}
        <button class="btn btn-ghost btn-sm" style="margin-left:auto;color:var(--text-3);" onclick="openReportModal('story','${storyData.id}',null)">
          <i data-lucide="flag" style="width:14px;height:14px;"></i> রিপোর্ট
        </button>
      </div>
    </article>
    <div>
      <h3 style="font-family:var(--font-heading);margin-bottom:1rem;">মন্তব্য (<span id="comment-count">${storyData.commentsCount||0}</span>)</h3>
      <div class="card mb-2">
        <div class="card-body">
          <textarea class="form-input form-textarea" id="comment-input" placeholder="আপনার মন্তব্য লিখুন..." rows="3" maxlength="1000"></textarea>
          <div style="text-align:right;margin-top:8px;">
            <button class="btn btn-primary btn-sm" onclick="postComment()">মন্তব্য করুন</button>
          </div>
        </div>
      </div>
      <div id="comments-list"></div>
    </div>`;
  db.collection('stories').doc(storyId).update({ views: firebase.firestore.FieldValue.increment(1) });
  checkStoryInteractions(storyId);
  loadComments(storyId);
  setupReadProgress();
  lucide.createIcons();
  if (!storyData.isAnonymous && !isOwner) checkFollowingAuthor(storyData.authorId);
}

async function checkStoryInteractions(storyId) {
  if (!currentUser) return;
  const [likeDoc, bmDoc, rateDoc] = await Promise.all([
    db.collection('stories').doc(storyId).collection('likes').doc(currentUser.uid).get(),
    db.collection('bookmarks').doc(`${currentUser.uid}_${storyId}`).get(),
    db.collection('stories').doc(storyId).collection('ratings').doc(currentUser.uid).get()
  ]);
  storyHasLiked = likeDoc.exists;
  storyHasBookmarked = bmDoc.exists;
  hasRated = rateDoc.exists;
  const likeBtn=document.getElementById('like-btn');
  const bmBtn=document.getElementById('bm-btn');
  const rateBtn=document.getElementById('rate-btn');
  if (likeBtn && storyHasLiked) { likeBtn.classList.add('btn-outline-red'); likeBtn.querySelector('i')?.setAttribute('fill','currentColor'); }
  if (bmBtn && storyHasBookmarked) bmBtn.style.color='var(--gold)';
  if (rateBtn && hasRated) rateBtn.innerHTML=`<i data-lucide="star" style="width:15px;height:15px;color:var(--gold);"></i> রেটিং দেওয়া হয়েছে`;
  lucide.createIcons();
}
async function checkFollowingAuthor(authorId) {
  const followDoc = await db.collection('follows').doc(`${currentUser.uid}_${authorId}`).get();
  const btn = document.getElementById('story-follow-btn');
  if (btn && followDoc.exists) btn.textContent='আনফলো';
}
async function toggleStoryLike() {
  if (!storyData||!currentUser) return;
  const likeRef=db.collection('stories').doc(storyData.id).collection('likes').doc(currentUser.uid);
  const btn=document.getElementById('like-btn');
  const countEl=document.getElementById('like-count');
  if (storyHasLiked) {
    await likeRef.delete();
    await db.collection('stories').doc(storyData.id).update({ likesCount:firebase.firestore.FieldValue.increment(-1) });
    storyHasLiked=false;
    if(btn) btn.classList.remove('btn-outline-red');
    storyData.likesCount=Math.max(0,(storyData.likesCount||1)-1);
  } else {
    await likeRef.set({ uid:currentUser.uid, createdAt:firebase.firestore.FieldValue.serverTimestamp() });
    await db.collection('stories').doc(storyData.id).update({ likesCount:firebase.firestore.FieldValue.increment(1) });
    storyHasLiked=true;
    if(btn) btn.classList.add('btn-outline-red');
    storyData.likesCount=(storyData.likesCount||0)+1;
    if (storyData.authorId!==currentUser.uid) {
      await awardXP(storyData.authorId,XP.RECEIVE_LIKE,'like');
      await sendNotif(storyData.authorId,'like',{uid:currentUser.uid,displayName:currentUserData?.displayName,username:currentUserData?.username},{storyId:storyData.id,storyTitle:storyData.title});
    }
  }
  if(countEl) countEl.textContent=fmtNum(storyData.likesCount);
}
async function toggleStoryBookmark() {
  if (!storyData||!currentUser) return;
  const ref=db.collection('bookmarks').doc(`${currentUser.uid}_${storyData.id}`);
  const btn=document.getElementById('bm-btn');
  if (storyHasBookmarked) {
    await ref.delete(); storyHasBookmarked=false;
    if(btn) btn.style.color='';
    showToast('বুকমার্ক সরানো হয়েছে','info');
  } else {
    await ref.set({ userId:currentUser.uid, storyId:storyData.id, storyTitle:storyData.title, createdAt:firebase.firestore.FieldValue.serverTimestamp() });
    storyHasBookmarked=true;
    if(btn) btn.style.color='var(--gold)';
    showToast('বুকমার্ক হয়েছে','success');
  }
}
function shareStory() {
  const url = window.location.href;
  if (navigator.share) navigator.share({ title:storyData?.title||'DarkTales', url });
  else navigator.clipboard.writeText(url).then(()=>showToast('লিংক কপি হয়েছে!','success'));
}
async function deleteMyStory() {
  if (!confirm('গল্পটি চিরতরে মুছে ফেলবেন?')) return;
  await db.collection('stories').doc(storyData.id).delete();
  await db.collection('users').doc(currentUser.uid).update({ storiesCount:firebase.firestore.FieldValue.increment(-1) });
  showToast('গল্প মুছে ফেলা হয়েছে','success');
  setTimeout(()=>navigate('feed'),800);
}
async function postComment() {
  const body=document.getElementById('comment-input')?.value.trim();
  if (!body||body.length<2) { showToast('মন্তব্য লিখুন','error'); return; }
  if (!storyData||!currentUser) return;
  try {
    await db.collection('stories').doc(storyData.id).collection('comments').add({
      authorId:currentUser.uid,
      authorName:currentUserData?.displayName||'Anonymous',
      authorUsername:currentUserData?.username||'',
      body, reported:false,
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    await db.collection('stories').doc(storyData.id).update({ commentsCount:firebase.firestore.FieldValue.increment(1) });
    await awardXP(currentUser.uid,XP.POST_COMMENT,'comment');
    if (storyData.authorId!==currentUser.uid) {
      await awardXP(storyData.authorId,XP.RECEIVE_COMMENT,'receive_comment');
      await sendNotif(storyData.authorId,'comment',{uid:currentUser.uid,displayName:currentUserData?.displayName,username:currentUserData?.username},{storyId:storyData.id,storyTitle:storyData.title});
    }
    const inp=document.getElementById('comment-input'); if(inp) inp.value='';
    const cnt=document.getElementById('comment-count'); if(cnt) cnt.textContent=(storyData.commentsCount||0)+1;
    storyData.commentsCount=(storyData.commentsCount||0)+1;
    loadComments(storyData.id);
    showToast('মন্তব্য হয়েছে! +1 XP','success');
  } catch(e) { showToast('মন্তব্য করতে সমস্যা হয়েছে','error'); }
}
async function loadComments(storyId) {
  const list=document.getElementById('comments-list');
  if (!list) return;
  const snap=await db.collection('stories').doc(storyId).collection('comments').orderBy('createdAt','desc').limit(50).get();
  if (snap.empty) { list.innerHTML=`<div class="empty-state" style="padding:2rem 0;"><p>এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্য করুন!</p></div>`; return; }
  list.innerHTML=snap.docs.map(doc=>{
    const c={id:doc.id,...doc.data()};
    const isMine=currentUser?.uid===c.authorId;
    return `<div class="comment-item">
      ${renderAvatar(c.authorName,'sm')}
      <div class="comment-body">
        <div class="comment-header">
          <span class="comment-author" onclick="navigate('profile',{uid:'${c.authorId}'})">${sanitize(c.authorName)}</span>
          <span class="comment-time">${timeAgo(c.createdAt)}</span>
        </div>
        <div class="comment-text">${sanitize(c.body)}</div>
        <div class="comment-actions">
          ${isMine?`<button class="story-action-btn" style="color:var(--red);font-size:12px;" onclick="deleteComment('${storyId}','${c.id}')">মুছুন</button>`:''}
          <button class="story-action-btn" style="font-size:12px;color:var(--text-3);" onclick="openReportModal('comment','${c.id}','${storyId}')">রিপোর্ট</button>
        </div>
      </div>
    </div>`;
  }).join('');
  lucide.createIcons();
}
async function deleteComment(storyId, commentId) {
  if (!confirm('মন্তব্যটি মুছবেন?')) return;
  await db.collection('stories').doc(storyId).collection('comments').doc(commentId).delete();
  await db.collection('stories').doc(storyId).update({ commentsCount:firebase.firestore.FieldValue.increment(-1) });
  loadComments(storyId);
}
function setupReadProgress() {
  window.addEventListener('scroll', ()=>{
    const art=document.querySelector('article');
    if (!art) return;
    const rect=art.getBoundingClientRect();
    const pct=Math.min(100,Math.max(0,(-rect.top/art.offsetHeight)*100));
    const fill=document.getElementById('read-prog');
    if(fill) fill.style.width=pct+'%';
  });
}
async function toggleFollow(authorId, btn) {
  const followId=`${currentUser.uid}_${authorId}`;
  const ref=db.collection('follows').doc(followId);
  const doc=await ref.get();
  if (doc.exists) {
    await ref.delete();
    await db.collection('users').doc(authorId).update({ followersCount:firebase.firestore.FieldValue.increment(-1) });
    await db.collection('users').doc(currentUser.uid).update({ followingCount:firebase.firestore.FieldValue.increment(-1) });
    if(btn) btn.textContent='ফলো করুন';
  } else {
    await ref.set({ followerId:currentUser.uid, followingId:authorId, createdAt:firebase.firestore.FieldValue.serverTimestamp() });
    await db.collection('users').doc(authorId).update({ followersCount:firebase.firestore.FieldValue.increment(1) });
    await db.collection('users').doc(currentUser.uid).update({ followingCount:firebase.firestore.FieldValue.increment(1) });
    await awardXP(authorId,XP.RECEIVE_FOLLOWER,'follow');
    await sendNotif(authorId,'follow',{uid:currentUser.uid,displayName:currentUserData?.displayName,username:currentUserData?.username},{});
    if(btn) btn.textContent='আনফলো';
    showToast('ফলো করা হয়েছে','success');
  }
}

/* ══════════════════════════════════════
   PAGE: PROFILE
══════════════════════════════════════ */
let profileData = null;
let profileUid = null;
let profileTab = 'stories';
let profileIsMe = false;
let profileIsFollowing = false;

async function renderProfile(container, params={}) {
  profileUid = params.me ? currentUser.uid : (params.uid || currentUser.uid);
  profileIsMe = profileUid === currentUser.uid;
  const doc=await db.collection('users').doc(profileUid).get();
  if (!doc.exists) { container.innerHTML=`<div class="empty-state"><h3>ব্যবহারকারী পাওয়া যায়নি</h3></div>`; return; }
  profileData=doc.data();
  if (!profileIsMe) {
    const fDoc=await db.collection('follows').doc(`${currentUser.uid}_${profileUid}`).get();
    profileIsFollowing=fDoc.exists;
  }
  const xp=profileData.xp||0;
  const lvl=getLevelInfo(xp);
  const prog=getXPProgress(xp);
  container.innerHTML = `
    <div class="profile-cover"></div>
    <div class="profile-card">
      <div class="profile-avatar-wrap" style="position:relative;margin-bottom:0;">
        ${renderAvatar(profileData.displayName,'xl',profileData.verified?'verified':'')}
      </div>
      <div style="display:flex;align-items:flex-start;justify-content:flex-end;min-height:42px;padding-top:8px;">
        ${profileIsMe?`<button class="btn btn-ghost btn-sm" onclick="openEditProfileModal()"><i data-lucide="edit-2" style="width:13px;height:13px;"></i> সম্পাদনা</button>`:
        `<button class="btn ${profileIsFollowing?'btn-outline-red':'btn-primary'} btn-sm" id="profile-follow-btn" onclick="profileToggleFollow()">${profileIsFollowing?'আনফলো':'ফলো করুন'}</button>`}
      </div>
      <div style="padding-top:44px;">
        <div class="profile-name">
          ${sanitize(profileData.displayName)}
          ${profileData.verified?`<i data-lucide="check-circle" style="width:16px;height:16px;color:var(--red);"></i>`:''}
          ${profileData.banned?'<span class="banned-badge">নিষিদ্ধ</span>':''}
        </div>
        <div class="profile-username">@${sanitize(profileData.username||'unknown')}</div>
        ${profileData.bio?`<div class="profile-bio">${sanitize(profileData.bio)}</div>`:''}
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1rem;">
          ${renderLevelBadge(xp)}
          <span style="font-size:12px;color:var(--gold);">${fmtNum(xp)} XP</span>
        </div>
        <div class="profile-stats" style="margin-bottom:1rem;">
          <div class="profile-stat" onclick="openFollowModal('followers')">
            <div class="profile-stat-val">${fmtNum(profileData.followersCount||0)}</div>
            <div class="profile-stat-label">ফলোয়ার</div>
          </div>
          <div class="profile-stat" onclick="openFollowModal('following')">
            <div class="profile-stat-val">${fmtNum(profileData.followingCount||0)}</div>
            <div class="profile-stat-label">Following</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-val">${fmtNum(profileData.storiesCount||0)}</div>
            <div class="profile-stat-label">গল্প</div>
          </div>
        </div>
        <div style="margin-bottom:1rem;">
          <div style="font-size:11px;color:var(--text-3);margin-bottom:4px;">XP অগ্রগতি · ${lvl.name}</div>
          <div class="xp-bar-wrap" style="height:6px;"><div class="xp-bar-fill" style="width:${prog}%"></div></div>
        </div>
        <div style="font-size:11px;color:var(--text-3);">যোগ দিয়েছেন ${profileData.createdAt?timeAgo(profileData.createdAt):''}</div>
      </div>
    </div>
    <div class="tabs mt-3" id="profile-tabs">
      <button class="tab-btn active" onclick="switchProfileTab(this,'stories')">গল্পসমূহ</button>
      ${profileIsMe?'<button class="tab-btn" onclick="switchProfileTab(this,\'drafts\')">ড্রাফট</button>':''}
    </div>
    <div id="profile-stories"></div>`;
  loadProfileStories();
  lucide.createIcons();
}
function switchProfileTab(btn, tab) {
  document.querySelectorAll('#profile-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  profileTab=tab;
  loadProfileStories();
}
async function loadProfileStories() {
  const el=document.getElementById('profile-stories');
  if (!el) return;
  el.innerHTML=`<div style="text-align:center;padding:2rem;"><div class="spinner" style="margin:0 auto;"></div></div>`;
  let q=db.collection('stories').where('authorId','==',profileUid);
  if (profileTab==='drafts') q=q.where('isDraft','==',true);
  else q=q.where('isDraft','==',false).where('hidden','==',false);
  const snap=await q.orderBy('createdAt','desc').limit(20).get();
  if (snap.empty) { el.innerHTML=`<div class="empty-state"><h3>কোনো গল্প নেই</h3></div>`; return; }
  el.innerHTML=snap.docs.map(doc=>buildStoryCard({id:doc.id,...doc.data()})).join('');
  lucide.createIcons();
}
async function profileToggleFollow() {
  const btn=document.getElementById('profile-follow-btn');
  await toggleFollow(profileUid, btn);
  profileIsFollowing = !profileIsFollowing;
  if (btn) { btn.textContent=profileIsFollowing?'আনফলো':'ফলো করুন'; btn.className=`btn ${profileIsFollowing?'btn-outline-red':'btn-primary'} btn-sm`; }
  const fDoc=await db.collection('users').doc(profileUid).get();
  if (fDoc.exists) {
    const newCount=fDoc.data().followersCount||0;
    const vals=document.querySelectorAll('.profile-stat-val');
    if (vals[0]) vals[0].textContent=fmtNum(newCount);
  }
}
async function openFollowModal(type) {
  const modal=document.getElementById('follow-modal');
  const title=document.getElementById('follow-modal-title');
  const list=document.getElementById('follow-list');
  if(!modal||!list) return;
  title.textContent=type==='followers'?'ফলোয়ার':'Following';
  list.innerHTML=`<div style="text-align:center;padding:1.5rem;"><div class="spinner" style="margin:0 auto;"></div></div>`;
  showModal('follow-modal');
  const snap=type==='followers'
    ? await db.collection('follows').where('followingId','==',profileUid).limit(50).get()
    : await db.collection('follows').where('followerId','==',profileUid).limit(50).get();
  if (snap.empty) { list.innerHTML=`<div class="empty-state" style="padding:1.5rem;"><p>কেউ নেই</p></div>`; return; }
  const uids=snap.docs.map(d=>type==='followers'?d.data().followerId:d.data().followingId);
  const userSnaps=await Promise.all(uids.map(uid=>db.collection('users').doc(uid).get()));
  list.innerHTML=userSnaps.map(ud=>{
    if(!ud.exists) return '';
    const u=ud.data();
    return `<div class="user-row" onclick="closeModal('follow-modal');navigate('profile',{uid:'${ud.id}'})">
      ${renderAvatar(u.displayName,'md')}
      <div class="user-row-info">
        <div class="user-row-name">${sanitize(u.displayName)}</div>
        <div class="user-row-username">@${sanitize(u.username||'')}</div>
      </div>
      ${renderLevelBadge(u.xp||0)}
    </div>`;
  }).join('');
  lucide.createIcons();
}
function openEditProfileModal() {
  document.getElementById('edit-name').value=profileData?.displayName||'';
  document.getElementById('edit-bio').value=profileData?.bio||'';
  showModal('edit-profile-modal');
}
async function saveProfile() {
  const name=document.getElementById('edit-name')?.value.trim();
  const bio=document.getElementById('edit-bio')?.value.trim();
  if (!name) { showToast('নাম দিন','error'); return; }
  await db.collection('users').doc(currentUser.uid).update({ displayName:name, bio });
  await currentUser.updateProfile({ displayName:name });
  profileData={ ...profileData, displayName:name, bio };
  currentUserData={ ...currentUserData, displayName:name, bio };
  closeModal('edit-profile-modal');
  renderProfile(document.getElementById('page-content'),{me:true});
  updateSidebarUI();
  showToast('প্রোফাইল আপডেট হয়েছে','success');
}

/* ══════════════════════════════════════
   PAGE: NOTIFICATIONS
══════════════════════════════════════ */
async function renderNotifications(container) {
  container.innerHTML = `
    <div class="section-header mb-2">
      <h2 class="page-title"><i data-lucide="bell" style="width:18px;height:18px;"></i> নোটিফিকেশন</h2>
      <button class="btn btn-ghost btn-sm" onclick="markAllRead()">সব পড়া হয়েছে</button>
    </div>
    <div class="card" id="notif-container">
      <div style="text-align:center;padding:2rem;"><div class="spinner spinner-lg" style="margin:0 auto;"></div></div>
    </div>`;
  const snap=await db.collection('notifications').where('userId','==',currentUser.uid).orderBy('createdAt','desc').limit(50).get();
  const container2=document.getElementById('notif-container');
  if (!container2) return;
  if (snap.empty) { container2.innerHTML=`<div class="empty-state" style="padding:3rem;"><h3>কোনো নোটিফিকেশন নেই</h3><p>নতুন কার্যক্রমের বিজ্ঞপ্তি এখানে দেখাবে।</p></div>`; return; }
  const icons={
    like:`<i data-lucide="heart" style="width:16px;height:16px;color:var(--red);"></i>`,
    comment:`<i data-lucide="message-circle" style="width:16px;height:16px;color:var(--info);"></i>`,
    follow:`<i data-lucide="user-plus" style="width:16px;height:16px;color:var(--success);"></i>`,
    rating:`<i data-lucide="star" style="width:16px;height:16px;color:var(--gold);"></i>`
  };
  const msgs={
    like:n=>`<strong>${sanitize(n.fromUserName)}</strong> আপনার গল্পে লাইক দিয়েছেন`,
    comment:n=>`<strong>${sanitize(n.fromUserName)}</strong> আপনার গল্পে মন্তব্য করেছেন`,
    follow:n=>`<strong>${sanitize(n.fromUserName)}</strong> আপনাকে ফলো করেছেন`,
    rating:n=>`<strong>${sanitize(n.fromUserName)}</strong> আপনার গল্পে রেটিং দিয়েছেন`
  };
  container2.innerHTML=snap.docs.map(doc=>{
    const n={id:doc.id,...doc.data()};
    return `<div class="notif-item ${n.read?'':'unread'}" onclick="${n.storyId?`navigate('story',{id:'${n.storyId}'})`:n.type==='follow'?`navigate('profile',{uid:'${n.fromUserId}'})`:''}">
      ${!n.read?'<div class="notif-dot"></div>':''}
      <div style="width:36px;height:36px;border-radius:50%;background:var(--bg-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        ${icons[n.type]||icons.like}
      </div>
      <div class="notif-text">
        ${msgs[n.type]?msgs[n.type](n):'নতুন বিজ্ঞপ্তি'}
        ${n.storyTitle?`<span style="display:block;font-size:12px;color:var(--text-3);margin-top:2px;">"${sanitize(n.storyTitle)}"</span>`:''}
      </div>
      <div class="notif-time">${timeAgo(n.createdAt)}</div>
    </div>`;
  }).join('');
  const batch=db.batch();
  snap.docs.filter(d=>!d.data().read).forEach(d=>batch.update(d.ref,{read:true}));
  await batch.commit();
  lucide.createIcons();
}
async function markAllRead() {
  const snap=await db.collection('notifications').where('userId','==',currentUser.uid).where('read','==',false).get();
  if (snap.empty) { showToast('সব নোটিফিকেশন পড়া হয়েছে','info'); return; }
  const batch=db.batch();
  snap.docs.forEach(d=>batch.update(d.ref,{read:true}));
  await batch.commit();
  showToast('সব পড়া হিসেবে চিহ্নিত','success');
  renderNotifications(document.getElementById('page-content'));
}

/* ══════════════════════════════════════
   PAGE: BOOKMARKS
══════════════════════════════════════ */
async function renderBookmarks(container) {
  container.innerHTML=`
    <div class="section-header mb-2">
      <h2 class="page-title"><i data-lucide="bookmark" style="width:18px;height:18px;"></i> বুকমার্ক</h2>
    </div>
    <div id="bm-list"><div style="text-align:center;padding:2rem;"><div class="spinner spinner-lg" style="margin:0 auto;"></div></div></div>`;
  const snap=await db.collection('bookmarks').where('userId','==',currentUser.uid).orderBy('createdAt','desc').limit(50).get();
  const list=document.getElementById('bm-list');
  if (!list) return;
  if (snap.empty) { list.innerHTML=`<div class="empty-state"><h3>কোনো বুকমার্ক নেই</h3><p>পছন্দের গল্পে বুকমার্ক আইকন ক্লিক করুন।</p><button class="btn btn-primary btn-sm mt-2" onclick="navigate('feed')">গল্প পড়তে যান</button></div>`; return; }
  const sIds=snap.docs.map(d=>d.data().storyId);
  const sSnaps=await Promise.all(sIds.map(id=>db.collection('stories').doc(id).get()));
  list.innerHTML='';
  sSnaps.forEach((sDoc,i)=>{
    const bmId=snap.docs[i].id;
    if(!sDoc.exists) return;
    const s={id:sDoc.id,...sDoc.data()};
    list.insertAdjacentHTML('beforeend',`
      <div class="story-card" style="position:relative;">
        <button onclick="removeBm('${bmId}',this)" style="position:absolute;top:12px;right:12px;padding:5px;border-radius:var(--radius-md);background:transparent;border:none;cursor:pointer;color:var(--gold);" title="বুকমার্ক সরান">
          <i data-lucide="bookmark" style="width:15px;height:15px;fill:currentColor;"></i>
        </button>
        <div onclick="navigate('story',{id:'${s.id}'})" style="cursor:pointer;">
          <div class="story-card-meta">
            <div class="story-card-author">
              ${renderAvatar(s.isAnonymous?'?':s.authorName,'sm')}
              <span class="story-card-author-name">${sanitize(s.isAnonymous?'অজানা লেখক':s.authorName)}</span>
            </div>
            <span class="story-card-date">${timeAgo(s.createdAt)}</span>
          </div>
          <div class="story-card-title">${sanitize(s.title)}</div>
          <div class="story-card-body">${sanitize(s.body)}</div>
          <div class="story-card-footer">
            ${renderCatBadge(s.category)}
            <span style="font-size:12px;color:var(--text-3);margin-left:auto;">${s.readingTime||1} মিনিট</span>
          </div>
        </div>
      </div>`);
  });
  lucide.createIcons();
}
async function removeBm(bmId, btn) {
  await db.collection('bookmarks').doc(bmId).delete();
  btn.closest('.story-card').remove();
  showToast('বুকমার্ক সরানো হয়েছে','info');
}

/* ══════════════════════════════════════
   PAGE: LEADERBOARD
══════════════════════════════════════ */
let lbTab='xp';
async function renderLeaderboard(container) {
  container.innerHTML=`
    <div class="section-header mb-2">
      <h2 class="page-title"><i data-lucide="trending-up" style="width:18px;height:18px;"></i> লিডারবোর্ড</h2>
    </div>
    <div class="tabs mb-2" id="lb-tabs">
      <button class="tab-btn ${lbTab==='xp'?'active':''}" onclick="switchLb(this,'xp')">XP র‍্যাংকিং</button>
      <button class="tab-btn ${lbTab==='stories'?'active':''}" onclick="switchLb(this,'stories')">সর্বোচ্চ গল্প</button>
      <button class="tab-btn ${lbTab==='followers'?'active':''}" onclick="switchLb(this,'followers')">সর্বোচ্চ ফলোয়ার</button>
    </div>
    <div id="lb-my-rank" class="card mb-2" style="display:none;">
      <div class="card-body" style="display:flex;align-items:center;gap:12px;">
        <div style="font-family:var(--font-heading);font-size:1rem;color:var(--text-3);width:28px;text-align:center;" id="lb-my-rank-num">—</div>
        <div style="flex:1;font-size:13px;font-weight:500;color:var(--text-2);">আপনার র‍্যাংক</div>
        <div style="font-family:var(--font-heading);font-size:1rem;color:var(--gold);" id="lb-my-rank-val">0</div>
      </div>
    </div>
    <div id="lb-list"><div style="text-align:center;padding:2rem;"><div class="spinner spinner-lg" style="margin:0 auto;"></div></div></div>`;
  loadLb();
  lucide.createIcons();
}
function switchLb(btn, tab) {
  lbTab=tab;
  document.querySelectorAll('#lb-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  loadLb();
}
async function loadLb() {
  const list=document.getElementById('lb-list');
  if (!list) return;
  list.innerHTML=`<div style="text-align:center;padding:2rem;"><div class="spinner spinner-lg" style="margin:0 auto;"></div></div>`;
  const field=lbTab==='stories'?'storiesCount':lbTab==='followers'?'followersCount':'xp';
  const label=lbTab==='stories'?'গল্প':lbTab==='followers'?'ফলোয়ার':'XP';
  const snap=await db.collection('users').where('banned','==',false).orderBy(field,'desc').limit(50).get();
  if (snap.empty) { list.innerHTML=`<div class="empty-state"><h3>কোনো তথ্য নেই</h3></div>`; return; }
  let myRank=-1, myVal=0;
  snap.docs.forEach((doc,i)=>{ if(doc.id===currentUser.uid){ myRank=i+1; myVal=doc.data()[field]||0; } });
  const myBox=document.getElementById('lb-my-rank');
  if (myRank>0 && myBox) {
    document.getElementById('lb-my-rank-num').textContent='#'+myRank;
    document.getElementById('lb-my-rank-val').textContent=fmtNum(myVal)+' '+label;
    myBox.style.display='block';
  }
  const medals=['','★','②','③'];
  const rClasses=['','gold','silver','bronze'];
  list.innerHTML=snap.docs.map((doc,i)=>{
    const u=doc.data(); const rank=i+1; const isMe=doc.id===currentUser.uid;
    const val=u[field]||0;
    return `<div class="lb-row ${rank<=3?'top-'+rank:''} ${isMe?'':''}` +
      `" onclick="navigate('profile',{uid:'${doc.id}'})">
      <div class="lb-rank ${rank<=3?rClasses[rank]:''}">${rank<=3?medals[rank]:rank}</div>
      ${renderAvatar(u.displayName,'sm')}
      <div class="lb-info">
        <div class="lb-name">
          ${sanitize(u.displayName)}
          ${u.verified?`<i data-lucide="check-circle" style="width:13px;height:13px;color:var(--red);"></i>`:''}
          ${isMe?'<span style="font-size:10px;color:var(--text-3);">(আপনি)</span>':''}
        </div>
        <div class="lb-meta">@${sanitize(u.username||'')} · ${getLevelInfo(u.xp||0).name}</div>
      </div>
      <div class="lb-xp">${fmtNum(val)} <span style="font-size:12px;color:var(--text-3);">${label}</span></div>
    </div>`;
  }).join('');
  lucide.createIcons();
}

/* ══════════════════════════════════════
   PAGE: SETTINGS
══════════════════════════════════════ */
function renderSettings(container) {
  const xp=currentUserData?.xp||0;
  const theme=currentUserData?.theme||'default';
  container.innerHTML=`
    <h2 class="page-title mb-3"><i data-lucide="settings" style="width:18px;height:18px;"></i> সেটিংস</h2>
    <div class="card mb-2">
      <div class="card-body" style="display:flex;align-items:center;gap:16px;">
        ${renderAvatar(currentUserData?.displayName||'?','md')}
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:500;color:var(--text-1);">${sanitize(currentUserData?.displayName||'')}</div>
          <div style="font-size:12px;color:var(--text-3);">@${sanitize(currentUserData?.username||'')}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">${renderLevelBadge(xp)}<span style="font-size:12px;color:var(--gold);">${fmtNum(xp)} XP</span></div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="navigate('profile',{me:true})">প্রোফাইল</button>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <div class="settings-section">
          <div class="settings-section-title">থিম</div>
          <div class="theme-grid">
            ${THEMES.map(t=>{
              const unlocked=xp>=t.xp;
              const active=theme===t.id;
              return `<div class="theme-option ${active?'active':''} ${!unlocked?'locked':''}"
                onclick="${unlocked?`selectTheme('${t.id}')`:`showToast('${t.name} থিমের জন্য ${fmtNum(t.xp)} XP দরকার','error')`}">
                <div class="theme-dot theme-dot-${t.id}"></div>
                <div class="theme-name">${t.name}</div>
                ${!unlocked?`<div class="theme-xp-label"><i data-lucide="lock" style="width:10px;height:10px;display:inline;"></i> ${fmtNum(t.xp)} XP</div>`:`<div class="theme-xp-label" style="color:var(--success);">আনলক</div>`}
              </div>`;
            }).join('')}
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title">অ্যাকাউন্ট</div>
          <div class="setting-row">
            <div class="setting-info"><div class="setting-label">পাসওয়ার্ড পরিবর্তন</div><div class="setting-desc">রিসেট লিংক ইমেইলে পাঠানো হবে</div></div>
            <button class="btn btn-ghost btn-sm" onclick="sendPassReset()">রিসেট করুন</button>
          </div>
          <div class="setting-row">
            <div class="setting-info"><div class="setting-label">XP অর্জনের নিয়ম</div><div class="setting-desc">কীভাবে XP পাবেন দেখুন</div></div>
            <button class="btn btn-ghost btn-sm" onclick="openXPModal()">দেখুন</button>
          </div>
          <div class="setting-row">
            <div class="setting-info"><div class="setting-label">অ্যাকাউন্ট মুছুন</div><div class="setting-desc">এই কাজ পূর্বাবস্থায় ফেরানো যাবে না</div></div>
            <button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="deleteAccount()">মুছুন</button>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-info"><div class="setting-label">লগআউট</div></div>
          <button class="btn btn-ghost btn-sm" onclick="doSignOut()">লগআউট</button>
        </div>
        <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid var(--border);text-align:center;">
          <p style="font-size:11px;color:var(--text-3);">DarkTales — © Muhammad Shourov. All Rights Reserved.</p>
        </div>
      </div>
    </div>`;
  lucide.createIcons();
}
async function selectTheme(id) {
  await db.collection('users').doc(currentUser.uid).update({ theme:id });
  currentUserData.theme=id;
  applyTheme(id);
  renderSettings(document.getElementById('page-content'));
  showToast(id+' থিম সেট করা হয়েছে','success');
}
async function sendPassReset() {
  await auth.sendPasswordResetEmail(currentUser.email);
  showToast('পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে','success');
}
async function deleteAccount() {
  if (!confirm('অ্যাকাউন্ট মুছবেন? সব গল্প মুছে যাবে।')) return;
  if (!confirm('সত্যিই মুছবেন? পূর্বাবস্থায় ফেরানো সম্ভব নয়।')) return;
  try {
    const snap=await db.collection('stories').where('authorId','==',currentUser.uid).get();
    const batch=db.batch();
    snap.docs.forEach(d=>batch.delete(d.ref));
    batch.delete(db.collection('users').doc(currentUser.uid));
    await batch.commit();
    await currentUser.delete();
    window.location.reload();
  } catch(e) { showToast('মুছতে সমস্যা হয়েছে। পুনরায় লগইন করে চেষ্টা করুন।','error'); }
}
function openXPModal() {
  const xpRules=[
    ['গল্প পোস্ট করলে','+10 XP'],['প্রতিটি Like পেলে','+2 XP'],
    ['প্রতিটি Comment পেলে','+3 XP'],['Rating পেলে','+3 XP'],
    ['5 Star Rating পেলে','+8 XP'],['নতুন Follower পেলে','+5 XP'],
    ['গল্প Featured হলে','+25 XP'],['Trending হলে','+15 XP'],
    ['Comment করলে','+1 XP'],['Daily Login','+3 XP/দিন']
  ];
  document.getElementById('xp-rules-list').innerHTML=xpRules.map(([k,v])=>`
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:.5px solid var(--border);font-size:13.5px;">
      <span style="color:var(--text-2);">${k}</span>
      <span style="color:var(--gold);font-weight:500;">${v}</span>
    </div>`).join('');
  showModal('xp-modal');
}

/* ══════════════════════════════════════
   RATING MODAL
══════════════════════════════════════ */
function openRateModal() {
  if (hasRated) { showToast('আপনি ইতিমধ্যে রেটিং দিয়েছেন','info'); return; }
  selectedRating=0;
  const starsEl=document.getElementById('modal-stars');
  if (!starsEl) return;
  starsEl.innerHTML='';
  for (let i=1;i<=5;i++) {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','star');
    svg.style.width='32px'; svg.style.height='32px';
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('fill','none');
    svg.setAttribute('stroke','currentColor');
    svg.setAttribute('stroke-width','2');
    svg.innerHTML='<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>';
    svg.addEventListener('click',()=>setRating(i));
    svg.addEventListener('mouseover',()=>hoverRating(i));
    svg.addEventListener('mouseleave',()=>hoverRating(0));
    starsEl.appendChild(svg);
  }
  document.getElementById('rate-submit-btn').disabled=true;
  showModal('rate-modal');
}
function hoverRating(val) {
  document.querySelectorAll('#modal-stars .star').forEach((s,i)=>{
    if(val>0){s.setAttribute('fill',i<val?'currentColor':'none');s.style.color=i<val?'var(--gold)':'var(--text-3)';}
    else{s.setAttribute('fill',i<selectedRating?'currentColor':'none');s.style.color=i<selectedRating?'var(--gold)':'var(--text-3)';}
  });
}
const ratingLabels=['','হতাশাজনক','গড়পড়তা','ভালো','দারুণ','অসাধারণ'];
function setRating(val) {
  selectedRating=val;
  hoverRating(0);
  const lbl=document.getElementById('rating-label');
  if(lbl) lbl.textContent=ratingLabels[val]||'';
  document.getElementById('rate-submit-btn').disabled=false;
}
async function submitRating() {
  if (!selectedRating||!storyData||!currentUser||hasRated) return;
  await db.collection('stories').doc(storyData.id).collection('ratings').doc(currentUser.uid).set({
    uid:currentUser.uid, rating:selectedRating, createdAt:firebase.firestore.FieldValue.serverTimestamp()
  });
  await db.collection('stories').doc(storyData.id).update({
    ratingSum:firebase.firestore.FieldValue.increment(selectedRating),
    ratingCount:firebase.firestore.FieldValue.increment(1)
  });
  if (storyData.authorId!==currentUser.uid) {
    const xpAmt=selectedRating===5?XP.RECEIVE_5STAR:XP.RECEIVE_RATING;
    await awardXP(storyData.authorId,xpAmt,'rating');
    await sendNotif(storyData.authorId,'rating',{uid:currentUser.uid,displayName:currentUserData?.displayName,username:currentUserData?.username},{storyId:storyData.id,storyTitle:storyData.title});
  }
  hasRated=true;
  closeModal('rate-modal');
  showToast('রেটিং দেওয়া হয়েছে!','success');
  const rateBtn=document.getElementById('rate-btn');
  if(rateBtn) rateBtn.innerHTML=`<i data-lucide="star" style="width:15px;height:15px;color:var(--gold);fill:var(--gold);"></i> রেটিং দেওয়া হয়েছে`;
  lucide.createIcons();
}

/* ══════════════════════════════════════
   REPORT MODAL
══════════════════════════════════════ */
function openReportModal(type, id, storyId=null) {
  reportTarget={type,id,storyId};
  showModal('report-modal');
}
async function submitReport() {
  await db.collection('reports').add({
    reporterId:currentUser.uid,
    targetType:reportTarget.type,
    targetId:reportTarget.id,
    storyId:reportTarget.storyId,
    reason:document.getElementById('report-reason')?.value||'inappropriate',
    status:'pending',
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  });
  closeModal('report-modal');
  showToast('রিপোর্ট পাঠানো হয়েছে। ধন্যবাদ।','success');
}

/* ══════════════════════════════════════
   MODAL HELPERS
══════════════════════════════════════ */
function showModal(id) {
  const overlay=document.getElementById('modal-overlay');
  if(overlay) overlay.classList.add('open');
  document.querySelectorAll('.modal').forEach(m=>m.style.display='none');
  const modal=document.getElementById(id);
  if(modal) modal.style.display='block';
  lucide.createIcons();
}
function closeModal(id) {
  const overlay=document.getElementById('modal-overlay');
  if(overlay) overlay.classList.remove('open');
  const modal=document.getElementById(id);
  if(modal) modal.style.display='none';
}
function closeAllModals(e) {
  if(e.target===document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').classList.remove('open');
    document.querySelectorAll('.modal').forEach(m=>m.style.display='none');
  }
}

/* ══════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key==='Escape') {
    const overlay=document.getElementById('modal-overlay');
    if(overlay) overlay.classList.remove('open');
    document.querySelectorAll('.modal').forEach(m=>m.style.display='none');
    document.getElementById('user-dropdown')?.classList.remove('open');
  }
  if (e.key==='Enter' && document.getElementById('auth-section')?.style.display!=='none') {
    if (document.getElementById('login-form')?.style.display!=='none') loginEmail();
    else if (document.getElementById('register-form')?.style.display!=='none') registerEmail();
    else if (document.getElementById('forgot-form')?.style.display!=='none') sendReset();
  }
});
