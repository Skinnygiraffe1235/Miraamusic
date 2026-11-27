const root = document.documentElement;
function lockBackgroundHeight() {
  if (window.innerWidth > 640) {
    root.style.removeProperty('--bg-fixed-h');
    return;
  }
  root.style.setProperty('--bg-fixed-h', window.screen.height + 'px');
}
lockBackgroundHeight();
window.addEventListener('orientationchange', () => {
  setTimeout(lockBackgroundHeight, 200);
});

/* Lock a CSS page height variable on meaningful resizes (not on transient URL-bar changes) */
function setPageHeightLock(px) {
  if (typeof px === 'number') {
    root.style.setProperty('--page-h', px + 'px');
    return;
  }
  // default: set to current innerHeight (layout viewport height)
  root.style.setProperty('--page-h', window.innerHeight + 'px');
}
setPageHeightLock();
window.addEventListener('orientationchange', () => setTimeout(setPageHeightLock, 220));

const starsWrap = document.getElementById('stars');
const navButtons = [...document.querySelectorAll('.nav-btn')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const brandWordmark = document.querySelector('.wordmark');
const brandEyebrow = document.getElementById('brandEyebrow');
const aboutView = document.querySelector('.tab-view[data-tab-view="about"]');
const worksView = document.querySelector('.tab-view[data-tab-view="works"]');
if (aboutView && worksView) {
  const darkSection = worksView.querySelector('.phase-section[data-phase="dark"]');
  const bookSection = aboutView.querySelector('.phase-book');
  const bookContent = bookSection?.querySelector('.book-content');
  const artisticContent = darkSection?.querySelector('.content');
  if (bookSection && bookContent && artisticContent) {
    artisticContent.append(...bookContent.children);
    bookSection.remove();
  }
}
const artisticSocialLinks = document.querySelector('.tab-view[data-tab-view="works"] .social-links');
const technicianSocialLinks = document.querySelector('.tab-view[data-tab-view="alterego"] .social-links');
if (artisticSocialLinks && technicianSocialLinks) {
  technicianSocialLinks.replaceChildren(...[...artisticSocialLinks.children].map(link => link.cloneNode(true)));
  technicianSocialLinks.setAttribute('aria-label', artisticSocialLinks.getAttribute('aria-label'));
}

function updateBrand(target) {
  if (target === 'works' || target === 'alterego') {
    root.dataset.persona = target;
  }
  const isTechnician = target === 'alterego';
  const isAbout = target === 'about';
  if (brandWordmark) {
    brandWordmark.setAttribute('aria-label', isAbout || isTechnician ? 'Mahdi Tajoby home' : 'Miraamusic home');
    brandWordmark.innerHTML = isTechnician
      ? '<span class="wordmark-name">Mahdi Tajoby</span>'
      : isAbout
        ? '<span class="wordmark-name">Mahdi Tajoby</span>'
        : '<em class="wordmark-miraa">Miraa</em><span class="wordmark-music">music</span>';
  }
  if (brandEyebrow) {
    brandEyebrow.textContent = isTechnician
      ? 'Audio Engineer / Music Technologist'
      : isAbout
        ? 'aka Miraamusic'
        : 'Musician / Live Performer';
  }
}

updateBrand(document.querySelector('.tab-view.active')?.dataset.tabView);
let lightSection = null;
let darkSection = null;
let progressBarWidth = 0;

function createStars(count = 70) {
  if (!starsWrap || starsWrap.childElementCount) return;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 72}%`;
    star.style.opacity = (0.3 + Math.random() * 0.7).toFixed(2);
    star.style.transform = `scale(${(0.7 + Math.random() * 1.1).toFixed(2)})`;
    fragment.appendChild(star);
  }
  starsWrap.appendChild(fragment);
}

function setThemeMix(t) {
  const activeView = document.querySelector('.tab-view.active')?.dataset.tabView;
  if (activeView === 'works') t = 1;
  if (activeView === 'alterego') t = 0;
  const clamped = Math.max(0, Math.min(1, t));
  root.style.setProperty('--mix', clamped.toFixed(3));
  root.style.setProperty('--mix-pct', `${(clamped * 100).toFixed(1)}%`);
}

let ticking = false;
let currentPhaseSections = [];

function refreshActivePhaseSections() {
  const activeView = document.querySelector('.tab-view.active');
  const sections = activeView
    ? [...activeView.querySelectorAll('.phase-section[data-phase]')]
    : [];

  currentPhaseSections = sections;
  lightSection = null;
  darkSection = null;
  sections.forEach((section) => {
    if (section.dataset.phase === 'light') lightSection = section;
    if (section.dataset.phase === 'dark') darkSection = section;
  });
}

function updateNavActiveState(target) {
  navButtons.forEach(btn => {
    const isActive = btn.dataset.tab === target;
    btn.classList.toggle('active', isActive);
    btn.toggleAttribute('aria-current', isActive);
  });
}

function updateOnScroll() {
  const activeView = document.querySelector('.tab-view.active');
  const target = activeView?.dataset.tabView ?? null;

  if (!lightSection || !darkSection) return;
  // Use visualViewport when available so the center remains stable while the browser chrome animates
  const viewportCenter = (function getViewportCenter() {
    if (window.visualViewport) {
      const top = typeof window.visualViewport.pageTop === 'number' ? window.visualViewport.pageTop : window.scrollY;
      return top + window.visualViewport.height * 0.5;
    }
    return window.scrollY + window.innerHeight * 0.5;
  })();
  const transitionStart = lightSection.offsetTop + lightSection.offsetHeight * 0.85;
  const transitionEnd = darkSection.offsetTop + darkSection.offsetHeight * 0.15;
  let t = (viewportCenter - transitionStart) / Math.max(1, transitionEnd - transitionStart);
  t = Math.max(0, Math.min(1, t));
  t = t * t * (3 - 2 * t);
  setThemeMix(t);

  updateNavActiveState(target);

  ticking = false;
}

function requestScrollUpdate() {
  if (ticking) return;
  requestAnimationFrame(updateOnScroll);
  ticking = true;
}

createStars();
refreshActivePhaseSections();
requestAnimationFrame(() => {
  document.body.classList.add('is-loaded');
});

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('load', updateOnScroll);
reducedMotion.addEventListener?.('change', updateOnScroll);
updateOnScroll();

function switchTab(target, scrollTarget, updateHistory = true) {
  const currentView = document.querySelector('.tab-view.active');
  const nextView = document.querySelector(`.tab-view[data-tab-view="${target}"]`);
  if (!nextView) return;
  updateNavActiveState(target);

  if (updateHistory && window.location.hash !== `#${target}`) {
    window.history.pushState({ tab: target }, '', `#${target}`);
  }

  function activateNext() {
    nextView.classList.add('active');
    updateBrand(target);
    refreshActivePhaseSections();

    nextView.querySelectorAll('.collapse-item.is-open .collapse-body-wrap').forEach(wrap => {
      wrap.style.maxHeight = wrap.scrollHeight + 'px';
    });

    window.scrollTo({ top: 0, behavior: 'auto' });

    if (scrollTarget) {
      const section = currentPhaseSections.find(s => s.dataset.phase === scrollTarget);
      if (section) section.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    updateOnScroll();

    if (reducedMotion.matches) {
      nextView.classList.add('visible');
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        nextView.classList.add('visible');
      }));
    }
  }

  if (currentView && currentView !== nextView) {
    currentView.classList.remove('active', 'visible');
    activateNext();
  } else if (!currentView) {
    activateNext();
  } else {
    if (scrollTarget) {
      const section = currentPhaseSections.find(s => s.dataset.phase === scrollTarget);
      if (section) section.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }
  }
}

const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab, btn.dataset.scroll);
    mainNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

function showIntro() {
  if (!introSplit) return;
  introSplit.style.removeProperty('display');
  introSplit.classList.remove('is-hidden');
}

function hideIntro() {
  if (!introSplit) return;
  introSplit.classList.add('is-hidden');
  setTimeout(() => {
    if (window.location.hash !== '#home') introSplit.style.display = 'none';
  }, 650);
}

function restoreTabFromLocation() {
  const target = window.location.hash.slice(1);
  if (target === 'home') {
    introSplit?.style.removeProperty('display');
    introSplit?.classList.remove('is-hidden');
  } else if (['works', 'alterego', 'about'].includes(target)) {
    hideIntro();
    switchTab(target, null, false);
  }
}

window.addEventListener('popstate', restoreTabFromLocation);
window.addEventListener('hashchange', restoreTabFromLocation);

if (brandWordmark) {
  brandWordmark.addEventListener('click', (event) => {
    event.preventDefault();
    hideIntro();
    switchTab(root.dataset.persona || 'alterego');
  });
}

const introSplit = document.getElementById('introSplit');

const initialTarget = window.location.hash.slice(1);
if (['works', 'alterego', 'about'].includes(initialTarget)) {
  hideIntro();
  switchTab(initialTarget, null, false);
} else if (!window.location.hash) {
  window.history.replaceState({ tab: 'home' }, '', '#home');
}

if (introSplit) {
  introSplit.querySelectorAll('.intro-half').forEach(half => {
    half.addEventListener('click', () => {
      const persona = half.dataset.persona;
      hideIntro();
      switchTab(persona);
    });
  });
}

/* ---------- Collapsible sections ---------- */

function setCollapseOpen(item, open) {
  const head = item.querySelector('.collapse-head');
  const wrap = item.querySelector('.collapse-body-wrap');
  if (open) {
    item.classList.add('is-open');
    head.setAttribute('aria-expanded', 'true');
    wrap.style.maxHeight = wrap.scrollHeight + 'px';
  } else {
    wrap.style.maxHeight = wrap.scrollHeight + 'px';
    wrap.offsetHeight;
    item.classList.remove('is-open');
    head.setAttribute('aria-expanded', 'false');
    wrap.style.maxHeight = '0px';
  }
}

function closeCollapseInstantly(item) {
  const head = item.querySelector('.collapse-head');
  const wrap = item.querySelector('.collapse-body-wrap');
  item.classList.remove('is-open');
  head.setAttribute('aria-expanded', 'false');
  wrap.style.maxHeight = '0px';
}

document.querySelectorAll('.collapse-item').forEach(item => {
  closeCollapseInstantly(item);
});

  setTimeout(() => {
  const baseSelector = '.tab-view[data-tab-view="works"]';
  const selector = window.innerWidth > 640
    ? `${baseSelector} .collapse-item`
    : `${baseSelector} .collapse-item:nth-child(-n+2)`;
  document.querySelectorAll(selector).forEach(item => {
    setCollapseOpen(item, true);
    loadArtworkForCollapse(item);
  });
  setTimeout(updateOnScroll, 350);
}, 1000);

document.querySelectorAll('.collapse-head').forEach(head => {
  head.addEventListener('click', () => {
    const item = head.closest('.collapse-item');
    setCollapseOpen(item, !item.classList.contains('is-open'));
  });
});

/* ---------- Consolidated resize handling (debounced and width-aware) ---------- */

let lastInnerWidth = window.innerWidth;
let resizeTimer = null;

function layoutRecalc() {
  // Keep scroll update responsive
  requestScrollUpdate();

  // Schedule heavy recalcs in rAF
  requestAnimationFrame(() => {
    updateProgressBarWidth();
    checkTitleOverflow();

    const activeView = document.querySelector('.tab-view.active');
    if (activeView) {
      activeView.querySelectorAll('.collapse-item.is-open .collapse-body-wrap').forEach(wrap => {
        wrap.style.maxHeight = wrap.scrollHeight + 'px';
      });
    }
  });
}

window.addEventListener('resize', () => {
  requestScrollUpdate();

  const iw = window.innerWidth;

  // Only treat width changes as real layout changes.
  // Height-only changes are usually the mobile browser URL bar
  // appearing/disappearing, so keep --page-h locked.
  if (iw !== lastInnerWidth) {
    lastInnerWidth = iw;
    clearTimeout(resizeTimer);
    setPageHeightLock();
    lockBackgroundHeight();
    layoutRecalc();
    return;
  }

  // Height-only resize: keep the existing locked page height.
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    layoutRecalc();
  }, 220);
}, { passive: true });

/* ---------- Custom bottom player (SoundCloud + Spotify) ---------- */

const tracks = [
  { title: 'Funky Disco House Mix - Groove Therapy Vol. 1', artist: 'Miraa · Mix', type: 'mixcloud', url: 'https://www.mixcloud.com/Miraamusic/miraamusic-funky-disco-house-mix-groove-therapy-vol-1/', artwork: 'https://thumbnailer.mixcloud.com/unsafe/600x600/extaudio/8/2/2/6/da71-5f88-43e0-b55a-613f0fd9a191', accent: '#e8562f' },
  { title: 'California Orange', artist: 'Miraa · Funky House', type: 'soundcloud', url: 'https://soundcloud.com/miraamusic-599839794/california-orange', accent: '#ca919d' },
  { title: 'Tech House Mix - Late Night Session Vol. 1', artist: 'Miraa · Mix', type: 'mixcloud', url: 'https://www.mixcloud.com/Miraamusic/miraamusic-tech-house-mix-late-night-session-vol1/', artwork: 'https://thumbnailer.mixcloud.com/unsafe/600x600/extaudio/4/6/9/4/ea74-6b75-44af-a8cb-a1f2bf3fee03', accent: '#8a3fae' },
  { title: 'The Fourth State of Matter', artist: 'Miraa · Progressive House', type: 'soundcloud', url: 'https://soundcloud.com/miraamusic-599839794/thefourthstateofmatter', accent: '#641460' },
  { title: 'Funk & Soul', artist: 'Spotify Playlist', type: 'spotify', uri: 'spotify:playlist:5wHdvjWLoV2xavZC3bHOIy', accent: '#1DB954' },
  { title: 'Funky House', artist: 'Spotify Playlist', type: 'spotify', uri: 'spotify:playlist:0zqOpSn5I5uRfCQuwm90pI', accent: '#1DB954' },
  { title: 'Deep House & Lounge', artist: 'Spotify Playlist', type: 'spotify', uri: 'spotify:playlist:3sjXD8J3RaO0BMsPboQFYW', accent: '#1DB954' },
  { title: 'Progressive House', artist: 'Spotify Playlist', type: 'spotify', uri: 'spotify:playlist:6i8AnUDQ4T6ee8ApYYTRta', accent: '#1DB954' },
  { title: 'Melodic Techno', artist: 'Spotify Playlist', type: 'spotify', uri: 'spotify:playlist:3wZ97h31kIDL8XnAmwHKa9', accent: '#1DB954' },
  { title: 'Techno & Tech House', artist: 'Spotify Playlist', type: 'spotify', uri: 'spotify:playlist:3lAtpVQq5fGrlEWnZ6UGN0', accent: '#1DB954' },
  { title: 'Underwater Vol. 1 - Deep Progressive House', artist: 'Miraa · Mix', type: 'mixcloud', url: 'https://www.mixcloud.com/Miraamusic/miraamusic-underwater-vol-1-deep-progressive-house/', artwork: 'https://thumbnailer.mixcloud.com/unsafe/600x600/extaudio/a/3/5/d/cb71-21bf-4070-9983-999c3ca33d9a', accent: '#8a3fae' },
  { title: 'SENZA META', artist: 'Mahdi · Score', type: 'local', url: 'assets/SENZA%20META.mp3', accent: '#e1527e' },
  { title: 'Pelcast', artist: 'Mahdi · Audio Logo', type: 'local', url: 'assets/Pelcast2.mp3', accent: '#e1527e' },
  { title: 'Arcade', artist: 'Mahdi · Game Score', type: 'local', url: 'assets/arcade.mp3', accent: '#e1527e' },
  { title: 'Enan', artist: 'Miraa · Psychedelic Pop', type: 'soundcloud', url: 'https://soundcloud.com/miraamusic-599839794/enan', accent: '#e1527e' },
  { title: 'Funk Rock Mix', artist: 'Mahdi · Stem Mix', type: 'local', url: 'assets/Funk%20rock%20mix.mp3', accent: '#e1527e' }
];

const localAudio = document.getElementById('localAudio');

let currentSource = 'soundcloud';
let spotifyController = null;
let spDuration = 0;
let isScrubbing = false;
// True after we ask the player to move (track change or seek) but before
// real audio is confirmed playing from that position. While true, the
// progress estimator holds still instead of advancing through silence.
let awaitingPlayback = false;

let progressPositionMs = 0;
let progressDurationMs = 0;
let progressLastSync = performance.now();

const scIframe = document.getElementById('scWidget');
const mixcloudIframe = document.getElementById('mixcloudWidget');
const playerBar = document.getElementById('playerBar');
const pbTitle = document.getElementById('pbTitle');
const pbTitleInner = document.getElementById('pbTitleInner');

function checkTitleOverflow() {
  pbTitleInner.classList.remove('is-scrolling');
  requestAnimationFrame(() => {
    const availableWidth = pbTitle.getBoundingClientRect().width;
    const overflowing = pbTitleInner.scrollWidth > availableWidth + 1;
    pbTitleInner.classList.toggle('is-scrolling', overflowing);
  });
}
if (document.fonts) {
  document.fonts.ready.then(checkTitleOverflow);
  document.fonts.addEventListener('loadingdone', checkTitleOverflow);
}
const pbArtist = document.getElementById('pbArtist');
const pbArtwork = document.getElementById('pbArtwork');
const pbVinyl = document.getElementById('pbVinyl');
const pbVinylLabel = document.getElementById('pbVinylLabel');
const pbPlay = document.getElementById('pbPlay');
const pbPrev = document.getElementById('pbPrev');
const pbNext = document.getElementById('pbNext');
const pbTime = document.getElementById('pbTime');
const pbProgress = document.getElementById('pbProgress');
const pbProgressFill = document.getElementById('pbProgressFill');
const pbProgressThumb = document.getElementById('pbProgressThumb');
const pbQueueToggle = document.getElementById('pbQueueToggle');
const pbQueue = document.getElementById('pbQueue');
const iconPlay = document.querySelector('.pb-icon-play');
const iconPause = document.querySelector('.pb-icon-pause');
const trackElements = [...document.querySelectorAll('[data-track]')];

updateProgressBarWidth();

let scWidget = null;
let mixcloudWidget = null;
let mixcloudReady = false;
let mixcloudLoadedFeed = null;   // feed path currently in the Mixcloud iframe
let mixcloudLastSeconds = null;  // length of that mix, in seconds
let mixcloudAutoplayPending = false;
let currentTrackIndex = -1;
let isPlaying = false;
let duration = 0;

function formatTime(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function syncProgress(positionMs, durationMs) {
  progressPositionMs = positionMs;
  progressDurationMs = durationMs;
  progressLastSync = performance.now();
  if (durationMs > 0) {
    setThumbPosition((positionMs / durationMs) * 100);
    pbTime.textContent = `${formatTime(positionMs)} / ${formatTime(durationMs)}`;
  }
}

function updateProgressBarWidth() {
  progressBarWidth = pbProgress.getBoundingClientRect().width;
}

function setThumbPosition(pct) {
  pbProgressFill.style.width = pct + '%';
  // Percentage-based so the thumb always follows the fill, even if the bar resizes
  pbProgressThumb.style.left = `clamp(6px, ${pct}%, calc(100% - 6px))`;
}

function resetProgressInstant() {
  progressPositionMs = 0;
  progressDurationMs = 0;
  progressLastSync = performance.now();
  setThumbPosition(0);
  pbTime.textContent = '0:00 / 0:00';
}

let progressRAFId = null;

function renderProgressFrame() {
  if (!isPlaying) {
    progressRAFId = null;
    return;
  }
  // Don't fight the user's finger while they're dragging the thumb.
  if (isScrubbing) {
    progressRAFId = requestAnimationFrame(renderProgressFrame);
    return;
  }
  if (awaitingPlayback) {
    progressRAFId = requestAnimationFrame(renderProgressFrame);
    return;
  }
  if (progressDurationMs > 0) {
    const elapsed = performance.now() - progressLastSync;
    let estPos = progressPositionMs + elapsed;
    if (estPos > progressDurationMs) estPos = progressDurationMs;
    const pct = (estPos / progressDurationMs) * 100;
    setThumbPosition(pct);
    pbTime.textContent = `${formatTime(estPos)} / ${formatTime(progressDurationMs)}`;
  }
  progressRAFId = requestAnimationFrame(renderProgressFrame);
}

function buildQueue() {
  pbQueue.innerHTML = '';
  tracks.forEach((t, i) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'pb-queue-item';
    item.dataset.index = i;
    item.innerHTML = `<span class="pb-queue-title">${t.title}</span><span class="pb-queue-artist">${t.artist}</span>`;
    item.addEventListener('click', () => {
      loadTrack(i, true);
      playerBar.classList.remove('queue-open');
    });
    pbQueue.appendChild(item);
  });
}

function highlightActive() {
  document.querySelectorAll('.pb-queue-item').forEach(el => {
    el.classList.toggle('active', Number(el.dataset.index) === currentTrackIndex);
  });
  trackElements.forEach(el => {
    const isCurrent = Number(el.dataset.track) === currentTrackIndex;
    el.classList.toggle('is-current', isCurrent);
    el.classList.toggle('is-playing', isCurrent && isPlaying);
  });
}

function updatePlayIcon() {
  iconPlay.style.display = isPlaying ? 'none' : 'block';
  iconPause.style.display = isPlaying ? 'block' : 'none';
  document.getElementById('pbPlay').setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
  playerBar.classList.toggle('is-playing', isPlaying);
  pbVinyl.classList.toggle('spinning', isPlaying);
  highlightActive();
  if (isPlaying && progressRAFId === null) {
    progressRAFId = requestAnimationFrame(renderProgressFrame);
  } else if (!isPlaying && progressRAFId !== null) {
    cancelAnimationFrame(progressRAFId);
    progressRAFId = null;
  }
}

function setArtwork(url) {
  if (url) {
    pbArtwork.style.backgroundImage = `url('${url}')`;
    pbArtwork.classList.add('has-art');
  } else {
    pbArtwork.style.backgroundImage = 'none';
    pbArtwork.classList.remove('has-art');
  }
}

function pauseCurrentSource() {
  if (currentSource === 'soundcloud') {
    scWidget?.pause();
  } else if (currentSource === 'mixcloud') {
    if (mixcloudReady) mixcloudWidget.pause();
  } else if (currentSource === 'spotify') {
    spotifyController?.pause();
  } else if (currentSource === 'local') {
    localAudio?.pause();
  }
}

function playCurrentSource() {
  if (currentSource === 'soundcloud') {
    scWidget?.play();
    return;
  }
  if (currentSource === 'mixcloud') {
    if (mixcloudReady) mixcloudWidget.play();
    return;
  }
  if (currentSource === 'local') {
    localAudio?.play();
    return;
  }
  if (!spotifyController) return;
  if (typeof spotifyController.resume === 'function') spotifyController.resume();
  else spotifyController.play?.();
}

function loadLocalTrack(track, autoplay) {
  currentSource = 'local';
  scWidget?.pause();
  spotifyController?.pause();
  if (mixcloudReady) mixcloudWidget.pause();
  if (!localAudio) return;
  localAudio.src = track.url;
  localAudio.currentTime = 0;
  if (autoplay) localAudio.play();
}

function loadSoundCloudTrack(track, autoplay) {
  currentSource = 'soundcloud';
  spotifyController?.pause();
  if (mixcloudReady) mixcloudWidget.pause();
  if (!scWidget) return;

  scWidget.load(track.url, {
    auto_play: false,
    callback: () => {
      scWidget.getDuration(d => {
        duration = d;
        syncProgress(0, d);
      });
      scWidget.getCurrentSound(sound => {
        if (sound?.artwork_url) setArtwork(sound.artwork_url.replace('-large', '-t300x300'));
      });
      // Explicit play() after load, rather than relying on auto_play —
      // mobile browsers often refuse the autoplay flag but honor a direct call
      // made in the same interaction chain as the user's tap.
      if (autoplay) scWidget.play();
    }
  });
}

function loadSpotifyTrack(track, autoplay) {
  currentSource = 'spotify';
  scWidget?.pause();
  if (mixcloudReady) mixcloudWidget.pause();
  if (!spotifyController) {
    isPlaying = false;
    awaitingPlayback = false;
    updatePlayIcon();
    return;
  }

  spotifyController.loadUri(track.uri);
  if (autoplay) {
    if (typeof spotifyController.play === 'function') spotifyController.play();
    else spotifyController.resume?.();
  }
}

function loadMixcloudTrack(track, autoplay) {
  currentSource = 'mixcloud';
  scWidget?.pause();
  spotifyController?.pause();
  localAudio?.pause();
  setArtwork(track.artwork);
  const feedPath = new URL(track.url).pathname;
  duration = 0;
  if (!mixcloudWidget || !mixcloudReady) {
    mixcloudAutoplayPending = autoplay;
    isPlaying = false;
    updatePlayIcon();
    return;
  }

  mixcloudAutoplayPending = false;
  isPlaying = false;
  awaitingPlayback = !!autoplay;
  updatePlayIcon();
  // The Mixcloud iframe starts with the first mix already loaded, and Mixcloud never
  // answers a request to load the mix it already has. Skip the reload in that case and
  // just ask for the duration, otherwise seeking stays broken until the track changes.
  const alreadyLoaded = mixcloudLoadedFeed === feedPath;
  mixcloudLoadedFeed = feedPath;
  const loading = alreadyLoaded
    ? (autoplay ? mixcloudWidget.play() : Promise.resolve())
    : mixcloudWidget.load(feedPath, autoplay);
  // Right after the widget starts it can report a length of 0 for a moment, so retry briefly.
  // After switching mixes it can briefly still report the previous mix's length too.
  const previousSeconds = alreadyLoaded ? null : mixcloudLastSeconds;
  const askDuration = (triesLeft) => mixcloudWidget.getDuration().then(seconds => {
    if ((seconds && seconds !== previousSeconds) || triesLeft <= 0) return seconds;
    return new Promise(r => setTimeout(r, 700)).then(() => askDuration(triesLeft - 1));
  });
  Promise.resolve(loading).then(() => askDuration(10)).then(seconds => {
    if (currentSource !== 'mixcloud' || !seconds) return;
    mixcloudLastSeconds = seconds;
    duration = seconds * 1000;
    syncProgress(0, duration);
  }).catch(error => {
    awaitingPlayback = false;
    console.error('Could not load Mixcloud track.', error);
  });
}

function loadTrack(index, autoplay = false) {
  const track = tracks[index];
  if (!track) return;

  currentTrackIndex = index;
    pbTitleInner.textContent = track.title;
  requestAnimationFrame(checkTitleOverflow);
  pbArtist.textContent = track.artist;
  pbVinylLabel.setAttribute('fill', track.accent);
  root.style.setProperty('--player-accent', track.accent);
  highlightActive();
  setArtwork(null);
  awaitingPlayback = !!autoplay;
  resetProgressInstant();
  isPlaying = !!autoplay;
  updatePlayIcon();

  if (track.type === 'soundcloud') loadSoundCloudTrack(track, autoplay);
  else if (track.type === 'local') loadLocalTrack(track, autoplay);
  else if (track.type === 'mixcloud') loadMixcloudTrack(track, autoplay);
  else loadSpotifyTrack(track, autoplay);
}

function togglePlay() {
  if (currentTrackIndex === -1) {
    loadTrack(0, true);
    return;
  }

  isPlaying = !isPlaying;
  updatePlayIcon();
  if (isPlaying) playCurrentSource();
  else pauseCurrentSource();
}

function nextTrack() {
  const next = (currentTrackIndex + 1 + tracks.length) % tracks.length;
  loadTrack(next, true);
}
function prevTrack() {
  const prev = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  loadTrack(prev, true);
}

function initPlayer() {
  scWidget = SC.Widget(scIframe);
  scWidget.bind(SC.Widget.Events.READY, () => {
    scWidget.getDuration(d => { duration = d; });
    // Wait for the widget to actually be ready before issuing the first load —
    // on slower devices this can otherwise fire too early and be dropped.
    loadTrack(0, false);
  });
  scWidget.bind(SC.Widget.Events.PLAY, () => {
    if (currentSource !== 'soundcloud') return;
    isPlaying = true; updatePlayIcon();
  });
  scWidget.bind(SC.Widget.Events.PAUSE, () => {
    if (currentSource !== 'soundcloud') return;
    isPlaying = false; updatePlayIcon();
  });
  scWidget.bind(SC.Widget.Events.FINISH, () => {
    if (currentSource !== 'soundcloud') return;
    nextTrack();
  });
  scWidget.bind(SC.Widget.Events.SEEK, () => {
    if (currentSource !== 'soundcloud') return;
    awaitingPlayback = true;
  });
  // PLAY_PROGRESS only fires when audio is genuinely advancing, so it's the
  // reliable signal that buffering has finished.
  scWidget.bind(SC.Widget.Events.PLAY_PROGRESS, (data) => {
    if (currentSource !== 'soundcloud') return;
    awaitingPlayback = false;
    if (isScrubbing) return;
    syncProgress(data.currentPosition, duration);
  });
}

function initMixcloudPlayer() {
  if (!window.Mixcloud?.PlayerWidget || !mixcloudIframe) return;
  try {
    mixcloudLoadedFeed = decodeURIComponent(new URL(mixcloudIframe.src).searchParams.get('feed') || '') || null;
  } catch (e) { mixcloudLoadedFeed = null; }
  mixcloudWidget = window.Mixcloud.PlayerWidget(mixcloudIframe);
  mixcloudWidget.ready.then(() => {
    mixcloudReady = true;
    mixcloudWidget.events.play.on(() => {
      if (currentSource !== 'mixcloud') return;
      isPlaying = true;
      awaitingPlayback = false;
      updatePlayIcon();
      renderProgressFrame();
    });
    mixcloudWidget.events.pause.on(() => {
      if (currentSource !== 'mixcloud') return;
      isPlaying = false;
      updatePlayIcon();
    });
    mixcloudWidget.events.ended.on(() => {
      if (currentSource === 'mixcloud') nextTrack();
    });

    if (tracks[currentTrackIndex]?.type === 'mixcloud') {
      loadMixcloudTrack(tracks[currentTrackIndex], mixcloudAutoplayPending);
    }

    setInterval(() => {
      if (currentSource !== 'mixcloud' || !isPlaying || isScrubbing) return;
      Promise.all([mixcloudWidget.getPosition(), mixcloudWidget.getDuration()]).then(([position, seconds]) => {
        if (currentSource === 'mixcloud' && !isScrubbing) {
          if (seconds) { duration = seconds * 1000; mixcloudLastSeconds = seconds; }
          awaitingPlayback = false;
          syncProgress(position * 1000, duration);
        }
      }).catch(error => console.error('Could not read Mixcloud playback position.', error));
    }, 500);
  }).catch(error => console.error('Could not initialize the Mixcloud player.', error));
}


if (localAudio) {
  localAudio.addEventListener('loadedmetadata', () => {
    if (currentSource !== 'local') return;
    syncProgress(0, localAudio.duration * 1000);
  });
  localAudio.addEventListener('timeupdate', () => {
    if (currentSource !== 'local' || isScrubbing) return;
    awaitingPlayback = false;
    syncProgress(localAudio.currentTime * 1000, localAudio.duration * 1000);
  });
  localAudio.addEventListener('play', () => {
    if (currentSource !== 'local') return;
    isPlaying = true; updatePlayIcon();
  });
  localAudio.addEventListener('pause', () => {
    if (currentSource !== 'local') return;
    isPlaying = false; updatePlayIcon();
  });
  localAudio.addEventListener('ended', () => {
    if (currentSource !== 'local') return;
    nextTrack();
  });
}

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  const element = document.getElementById('spotifyEmbed');
  const options = { width: '1', height: '1', uri: tracks[4].uri };
  IFrameAPI.createController(element, options, (controller) => {
    spotifyController = controller;
    spotifyController.addListener('playback_update', (e) => {
      if (currentSource !== 'spotify') return;
      const { position, duration: d, isPaused } = e.data;
      spDuration = d;
      awaitingPlayback = false;
      if (!isScrubbing) syncProgress(position, spDuration);
      isPlaying = !isPaused;
      updatePlayIcon();
    });
  });
};

pbPlay.addEventListener('click', togglePlay);
pbNext.addEventListener('click', nextTrack);
pbPrev.addEventListener('click', prevTrack);

pbQueueToggle.addEventListener('click', () => {
  playerBar.classList.toggle('queue-open');
});

function pctFromEvent(e) {
  const rect = pbProgress.getBoundingClientRect();
  let pct = (e.clientX - rect.left) / rect.width;
  return Math.max(0, Math.min(1, pct));
}

function previewSeek(pct) {
  const track = tracks[currentTrackIndex];
  if (!track) return;
  const total = track.type === 'mixcloud'
    ? duration
    : track.type === 'soundcloud'
      ? duration
      : track.type === 'local'
        ? localAudio.duration * 1000
        : spDuration;
  if (!total) return;
  // Paint the thumb/time as the user drags, without committing the seek yet.
  setThumbPosition(pct * 100);
  pbTime.textContent = `${formatTime(pct * total)} / ${formatTime(total)}`;
}

function commitSeek(pct) {
  const track = tracks[currentTrackIndex];
  if (!track) return;

  if (track.type === 'mixcloud') {
    if (!mixcloudWidget) return;
    if (!duration) {
      // Duration not known yet: ask Mixcloud, then seek
      mixcloudWidget.getDuration().then(seconds => {
        if (!seconds || currentSource !== 'mixcloud') return;
        duration = seconds * 1000;
        commitSeek(pct);
      }).catch(() => {});
      return;
    }
    const targetMs = pct * duration;
    awaitingPlayback = true;
    syncProgress(targetMs, duration);
    mixcloudWidget.seek(targetMs / 1000).then(() => {
      awaitingPlayback = false;
    }).catch(error => {
      awaitingPlayback = false;
      console.error('Could not seek in the Mixcloud track.', error);
    });
  } else if (track.type === 'soundcloud') {
    if (!scWidget || !duration) return;
    const targetMs = pct * duration;
    awaitingPlayback = true;
    syncProgress(targetMs, duration);
    scWidget.seekTo(targetMs);
  } else if (track.type === 'local') {
    if (!localAudio || !localAudio.duration) return;
    const targetMs = pct * localAudio.duration * 1000;
    awaitingPlayback = true;
    syncProgress(targetMs, localAudio.duration * 1000);
    localAudio.currentTime = targetMs / 1000;
  } else {
    if (!spotifyController || !spDuration) return;
    const targetMs = pct * spDuration;
    awaitingPlayback = true;
    syncProgress(targetMs, spDuration);
    spotifyController.seek(Math.round(targetMs / 1000));
  }
}

pbProgress.addEventListener('pointerdown', (e) => {
  if (currentTrackIndex === -1) return;
  isScrubbing = true;
  pbProgress.setPointerCapture(e.pointerId);
  previewSeek(pctFromEvent(e));
});

pbProgress.addEventListener('pointermove', (e) => {
  if (!isScrubbing) return;
  previewSeek(pctFromEvent(e));
});

pbProgress.addEventListener('pointerup', (e) => {
  if (!isScrubbing) return;
  isScrubbing = false;
  pbProgress.releasePointerCapture(e.pointerId);
  commitSeek(pctFromEvent(e));
});

pbProgress.addEventListener('pointercancel', () => {
  isScrubbing = false;
});

trackElements.forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.track);
    if (idx === currentTrackIndex) {
      togglePlay();
    } else {
      loadTrack(idx, true);
    }
  });
});

function ensureTrackArtwork(btn) {
  if (!btn || btn.dataset.artLoaded === 'true') return;
  const idx = Number(btn.dataset.track);
  const track = tracks[idx];
  if (!track || (track.type !== 'soundcloud' && track.type !== 'mixcloud')) return;

  btn.dataset.artLoaded = 'true';
  if (track.type === 'mixcloud') {
    if (track.artwork) {
      btn.style.backgroundImage = `linear-gradient(var(--art-veil), var(--art-veil)), url('${track.artwork}')`;
      btn.classList.add('has-art');
    }
    return;
  }

  fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(track.url)}`)
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(data => {
      if (!data?.thumbnail_url) return;
      const art = data.thumbnail_url.replace('-large', '-t300x300');
      btn.style.backgroundImage = `linear-gradient(var(--art-veil), var(--art-veil)), url('${art}')`;
      btn.classList.add('has-art');
    })
    .catch(() => { btn.dataset.artLoaded = 'error'; });
}

function loadArtworkForCollapse(item) {
  item?.querySelectorAll('.track-trigger[data-track]').forEach(ensureTrackArtwork);
}

document.querySelectorAll('.collapse-item.is-open').forEach(loadArtworkForCollapse);
document.querySelectorAll('.collapse-head').forEach(head => {
  head.addEventListener('click', () => {
    const item = head.closest('.collapse-item');
    if (item && !item.classList.contains('is-open')) loadArtworkForCollapse(item);
  }, { capture: true });
});

buildQueue();
if (window.SC) initPlayer();
else window.addEventListener('load', initPlayer);

if (window.Mixcloud) initMixcloudPlayer();
else window.addEventListener('load', initMixcloudPlayer);

/* ---------- Header hides when scrolling down, comes back when scrolling up ---------- */
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let lastY = window.scrollY;
  let ticking = false;
  const THRESHOLD = 6;            // ignore tiny scroll jitters

  function update() {
    ticking = false;
    const y = window.scrollY;
    const delta = y - lastY;
    const menuOpen = document.getElementById('mainNav')?.classList.contains('is-open');
    const focusInside = header.contains(document.activeElement);

    if (y <= header.offsetHeight || menuOpen || focusInside) {
      header.classList.remove('is-hidden');
    } else if (delta > THRESHOLD) {
      header.classList.add('is-hidden');
    } else if (delta < -THRESHOLD) {
      header.classList.remove('is-hidden');
    }
    if (Math.abs(delta) > THRESHOLD) lastY = y;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });

  // Keyboard users: bring the header back as soon as anything in it gets focus
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  // Switching tabs scrolls to the top, so show the header again
  document.querySelectorAll('.nav-btn, .intro-half, .wordmark').forEach(el =>
    el.addEventListener('click', () => { header.classList.remove('is-hidden'); lastY = 0; })
  );
})();

/* ---------- Case studies: cards never move; details open in a panel underneath ---------- */
(() => {
  const grid = document.querySelector('.dp-grid');
  const cards = [...document.querySelectorAll('.dp-card')];
  if (!grid || !cards.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION = 380;
  const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  const settle = (anim, ms) => Promise.race([anim.finished.catch(() => {}), new Promise(r => setTimeout(r, ms + 80))]);

  // One shared panel that sits in the grid, spanning the full row under the clicked card's row
  const panel = document.createElement('div');
  panel.className = 'dp-panel';
  panel.id = 'dp-panel';
  panel.setAttribute('role', 'region');
  panel.hidden = true;
  panel.innerHTML = '<div class="dp-panel-inner"><h4 class="dp-panel-title"></h4><div class="dp-panel-body"></div></div>';
  const title = panel.querySelector('.dp-panel-title');
  const body = panel.querySelector('.dp-panel-body');
  let current = null;   // card whose case study is showing
  let busy = false;

  const summaries = cards.map(c => c.querySelector('.dp-more summary')).filter(Boolean);
  summaries.forEach(sm => { sm.setAttribute('aria-expanded', 'false'); sm.setAttribute('aria-controls', 'dp-panel'); });

  function setButton(card, on) {
    const sm = card.querySelector('.dp-more summary');
    if (!sm) return;
    sm.setAttribute('aria-expanded', on ? 'true' : 'false');
    card.querySelector('.dp-more').classList.toggle('is-active', on);
  }

  // Insert the panel right after the last card in the same visual row as `card`
  function placeUnder(card) {
    const top = card.offsetTop;
    const rowCards = cards.filter(c => Math.abs(c.offsetTop - top) < 4);
    rowCards[rowCards.length - 1].after(panel);
  }

  function fill(card) {
    title.textContent = card.querySelector('.dp-card-title')?.textContent.trim() + ' — case study';
    const steps = card.querySelector('.dp-steps');
    body.innerHTML = '';
    if (steps) body.appendChild(steps.cloneNode(true));
    panel.setAttribute('aria-label', title.textContent);
  }

  function animateHeight(from, to, ms) {
    const anim = panel.animate([{ height: from + 'px', opacity: from ? 1 : 0 }, { height: to + 'px', opacity: to ? 1 : 0 }],
                               { duration: ms, easing: EASE });
    return settle(anim, ms).then(() => anim.cancel());
  }

  function open(card) {
    fill(card); placeUnder(card); panel.hidden = false;
    current = card; setButton(card, true);
    if (reduce.matches) return Promise.resolve();
    return animateHeight(0, panel.offsetHeight, DURATION);
  }

  function close() {
    if (!current) return Promise.resolve();
    const card = current; current = null; setButton(card, false);
    if (reduce.matches) { panel.hidden = true; return Promise.resolve(); }
    return animateHeight(panel.offsetHeight, 0, DURATION * 0.75).then(() => { panel.hidden = true; });
  }

  summaries.forEach(sm => {
    const card = sm.closest('.dp-card');
    sm.addEventListener('click', (e) => {
      e.preventDefault();                 // never open the details inside the card
      if (busy) return;
      busy = true;
      const done = () => { busy = false; };
      if (current === card) { close().then(done); return; }
      if (current) close().then(() => open(card)).then(done);
      else open(card).then(done);
    });
  });

  // If the layout changes (window resized), keep the panel under the right row
  window.addEventListener('resize', () => { if (current) placeUnder(current); });
})();
