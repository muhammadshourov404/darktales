/* ================================================
   DarkTales — Firebase Config & Utilities
   © Muhammad Shourov. All Rights Reserved.
   ================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyB2D2PDyUFGERGRkCeribAWc2Ogj1zG_nU",
  authDomain: "darktales-3b610.firebaseapp.com",
  projectId: "darktales-3b610",
  storageBucket: "darktales-3b610.firebasestorage.app",
  messagingSenderId: "371433251557",
  appId: "1:371433251557:web:eef56e3d080983272aea0c",
  measurementId: "G-WLYSDZZZ59"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* ── XP Config ── */
const XP_RULES = {
  POST_STORY: 10,
  RECEIVE_LIKE: 2,
  RECEIVE_COMMENT: 3,
  RECEIVE_RATING: 3,
  RECEIVE_5STAR: 8,
  RECEIVE_FOLLOWER: 5,
  STORY_FEATURED: 25,
  STORY_TRENDING: 15,
  POST_COMMENT: 1,
  DAILY_LOGIN: 3
};

const LEVELS = [
  { min: 0,    max: 99,   name: 'নতুন আত্মা',           class: 'level-1' },
  { min: 100,  max: 499,  name: 'অন্ধকারের পথিক',       class: 'level-2' },
  { min: 500,  max: 999,  name: 'ভয়ের গল্পকার',          class: 'level-3' },
  { min: 1000, max: 2499, name: 'রাতের রাজা',            class: 'level-4' },
  { min: 2500, max: 4999, name: 'অতিপ্রাকৃত মাস্টার',   class: 'level-5' },
  { min: 5000, max: Infinity, name: 'DarkTales Legend', class: 'level-6' }
];

const THEMES = [
  { id: 'default',  name: 'Default',   xpRequired: 0,    dot: '#dc2626' },
  { id: 'blood',    name: 'Blood Red', xpRequired: 500,  dot: '#7f0000' },
  { id: 'ghost',    name: 'Ghost',     xpRequired: 1000, dot: '#a855f7' },
  { id: 'midnight', name: 'Midnight',  xpRequired: 2000, dot: '#0ea5e9' },
  { id: 'cursed',   name: 'Cursed',    xpRequired: 5000, dot: '#d97706' }
];

const CATEGORIES = [
  { id: 'ghost',     label: 'ভুতুড়ে অভিজ্ঞতা', class: 'cat-ghost' },
  { id: 'dark',      label: 'রাতের আঁধার',      class: 'cat-dark' },
  { id: 'real',      label: 'বাস্তব ভয়',         class: 'cat-real' },
  { id: 'super',     label: 'অতিপ্রাকৃত',        class: 'cat-super' },
  { id: 'challenge', label: 'চ্যালেঞ্জিং মুহূর্ত', class: 'cat-challenge' },
  { id: 'mystery',   label: 'অজানা রহস্য',       class: 'cat-mystery' }
];

/* ── Helpers ── */
function getLevelInfo(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return { ...LEVELS[i], index: i + 1 };
  }
  return { ...LEVELS[0], index: 1 };
}

function getXPProgress(xp) {
  const lvl = getLevelInfo(xp);
  if (lvl.max === Infinity) return 100;
  const range = lvl.max - lvl.min + 1;
  const progress = xp - lvl.min;
  return Math.round((progress / range) * 100);
}

function getCategoryInfo(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
}

function timeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'এইমাত্র';
  if (diff < 3600) return `${Math.floor(diff/60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff/3600)} ঘন্টা আগে`;
  if (diff < 604800) return `${Math.floor(diff/86400)} দিন আগে`;
  if (diff < 2592000) return `${Math.floor(diff/604800)} সপ্তাহ আগে`;
  return date.toLocaleDateString('bn-BD');
}

function calcReadingTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function sanitizeText(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

/* ── Toast ── */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container') || (() => {
    const c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'toast-container';
    document.body.appendChild(c);
    return c;
  })();
  const icons = {
    success: `<svg class="toast-icon success" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg class="toast-icon error" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:    `<svg class="toast-icon info" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `${icons[type] || icons.info}<span class="toast-msg">${sanitizeText(msg)}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; t.style.transition = '0.25s'; setTimeout(() => t.remove(), 250); }, 3500);
}

/* ── Loading Screen ── */
function showLoading() {
  const el = document.getElementById('loading-screen');
  if (el) el.style.display = 'flex';
}
function hideLoading() {
  const el = document.getElementById('loading-screen');
  if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }
}

/* ── Apply Theme ── */
function applyTheme(themeId) {
  document.body.className = document.body.className.replace(/theme-\S+/g, '').trim();
  if (themeId && themeId !== 'default') {
    document.body.classList.add(`theme-${themeId}`);
  }
}

/* ── Award XP ── */
async function awardXP(userId, amount, reason) {
  try {
    await db.collection('users').doc(userId).update({
      xp: firebase.firestore.FieldValue.increment(amount)
    });
    await db.collection('xp_log').add({
      userId, amount, reason,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) { console.error('XP award failed:', e); }
}

/* ── Send Notification ── */
async function sendNotification(toUserId, type, fromUser, extra = {}) {
  if (toUserId === fromUser.uid) return;
  try {
    await db.collection('notifications').add({
      userId: toUserId,
      type,
      fromUserId: fromUser.uid,
      fromUserName: fromUser.displayName || fromUser.username || 'Someone',
      fromUserUsername: fromUser.username || '',
      storyId: extra.storyId || null,
      storyTitle: extra.storyTitle || null,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) { console.error('Notification failed:', e); }
}

/* ── Daily Login Streak ── */
async function checkDailyLogin(userId) {
  try {
    const today = new Date().toDateString();
    const userDoc = await db.collection('users').doc(userId).get();
    const data = userDoc.data();
    if (!data) return;
    if (data.lastStreakDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const newStreak = data.lastStreakDate === yesterday ? (data.loginStreak || 0) + 1 : 1;
    await db.collection('users').doc(userId).update({
      lastStreakDate: today,
      loginStreak: newStreak,
      xp: firebase.firestore.FieldValue.increment(XP_RULES.DAILY_LOGIN),
      lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) { console.error('Streak error:', e); }
}

/* ── Check Admin ── */
async function isAdmin(uid) {
  try {
    const doc = await db.collection('admins').doc(uid).get();
    return doc.exists;
  } catch (e) { return false; }
}

/* ── Check Banned ── */
async function checkBanned(uid) {
  try {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists && doc.data().banned === true) {
      auth.signOut();
      window.location.href = 'index.html?banned=1';
      return true;
    }
    return false;
  } catch (e) { return false; }
}

/* ── Render Avatar ── */
function renderAvatar(name, size = 'sm', extraClass = '') {
  const initials = getInitials(name);
  const colors = ['#7c3aed','#dc2626','#d97706','#0ea5e9','#16a34a','#db2777'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  return `<div class="avatar avatar-${size} ${extraClass}" style="background:${color}20;border-color:${color}40;color:${color}">${sanitizeText(initials)}</div>`;
}

/* ── Render Category Badge ── */
function renderCategoryBadge(catId) {
  const cat = getCategoryInfo(catId);
  return `<span class="category-badge ${cat.class}">${sanitizeText(cat.label)}</span>`;
}

/* ── Render Level Badge ── */
function renderLevelBadge(xp) {
  const lvl = getLevelInfo(xp);
  return `<span class="level-badge ${lvl.class}">${sanitizeText(lvl.name)}</span>`;
}

/* ── Render Stars ── */
function renderStars(rating, size = '') {
  let html = `<div class="stars stars-display">`;
  for (let i = 1; i <= 5; i++) {
    html += `<svg class="star ${size} ${i <= Math.round(rating) ? 'filled' : ''}" viewBox="0 0 24 24" fill="${i <= Math.round(rating) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
  return html + '</div>';
}

/* ── Format Number ── */
function fmtNum(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n.toString();
}
