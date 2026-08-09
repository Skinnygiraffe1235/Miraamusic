const root = document.documentElement;
const body = document.body;
const starsWrap = document.getElementById('stars');
const navButtons = [...document.querySelectorAll('.nav-btn')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const trackButtons = [...document.querySelectorAll('[data-track]')];
let queueItems = [];
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

function updateNavActiveState(target, activePhase) {
  navButtons.forEach(btn => {
    let isActive;
    if (btn.dataset.tab !== target) {
      isActive = false;
    } else if (!btn.dataset.scroll) {
      isActive = true;
    } else {
      isActive = btn.dataset.scroll === activePhase;
    }
    btn.classList.toggle('active', isActive);
    btn.toggleAttribute('aria-current', isActive);
  });
}

function updateOnScroll() {
  const activeView = document.querySelector('.tab-view.active');
  const target = activeView?.dataset.tabView ?? null;

  if (!lightSection || !darkSection) return;

  const scrollY = window.scrollY;
  const viewportCenter = scrollY + window.innerHeight * 0.5;
  const transitionStart = lightSection.offsetTop + lightSection.offsetHeight * 0.85;
  const transitionEnd = darkSection.offsetTop + darkSection.offsetHeight * 0.15;
  let t = (viewportCenter - transitionStart) / Math.max(1, transitionEnd - transitionStart);
  t = Math.max(0, Math.min(1, t));
  t = t * t * (3 - 2 * t);
  setThemeMix(t);

  const activePhase = viewportCenter >= darkSection.offsetTop ? 'dark' : 'light';
  updateNavActiveState(target, activePhase);

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

function switchTab(target, scrollTarget) {
  const currentView = document.querySelector('.tab-view.active');
  const nextView = document.querySelector(`.tab-view[data-tab-view="${target}"]`);
  if (!nextView) return;

  function activateNext() {
    nextView.classList.add('active');
    refreshActivePhaseSections();
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
    currentView.classList.remove('visible');

    if (reducedMotion.matches) {
      currentView.classList.remove('active');
      activateNext();
    } else {
      const finishTransition = (event) => {
        if (event.target !== currentView || event.propertyName !== 'opacity') return;
        currentView.removeEventListener('transitionend', finishTransition);
        currentView.classList.remove('active');
        activateNext();
      };
      currentView.addEventListener('transitionend', finishTransition);
    }
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
  const selector = window.innerWidth > 640
    ? '.collapse-item'
    : '.collapse-item:nth-child(-n+2)';
  document.querySelectorAll(selector).forEach(item => {
    setCollapseOpen(item, true);
    loadArtworkForCollapse(item);
  });
}, 1000);

document.querySelectorAll('.collapse-head').forEach(head => {
  head.addEventListener('click', () => {
    const item = head.closest('.collapse-item');
    setCollapseOpen(item, !item.classList.contains('is-open'));
  });
});

/* ---------- Consolidated resize handling ---------- */

window.addEventListener('resize', () => {
  requestScrollUpdate();
  updateProgressBarWidth();
  checkTitleOverflow();

  document.querySelectorAll('.collapse-item.is-open .collapse-body-wrap').forEach(wrap => {
    wrap.style.maxHeight = wrap.scrollHeight + 'px';
  });
});

/* ---------- Custom bottom player (SoundCloud + Spotify) ---------- */

const tracks = [
  { title: 'Milano Sunset 01', artist: 'Miraa · Mix', type: 'soundcloud', url: 'https://soundcloud.com/miraamusic-599839794/milano-sunset-01', accent: '#e8562f' },
  { title: 'California Orange', artist: 'Miraa · Original', type: 'soundcloud', url: 'https://soundcloud.com/miraamusic-599839794/california-orange', accent: '#ca919d' },
  { title: 'Melodic Techno Mix 01', artist: 'Miraa · Mix', type: 'soundcloud', url: 'https://soundcloud.com/miraamusic-599839794/melodic-techno-mix-01', accent: '#8a3fae' },
  { title: 'The Fourth State of Matter', artist: 'Miraa · Original', type: 'soundcloud', url: 'https://api.soundcloud.com/tracks/2372665031', accent: '#641460' },
  { title: 'Funk & Soul', artist: 'Spotify Playlist', type: 'spotify', uri: 'spotify:playlist:5wHdvjWLoV2xavZC3bHOIy', accent: '#1DB954' },
  { title: 'Funky House', artist: 'Spotify Playlist', type: 'spotify', uri: 'spotify:playlist:0zqOpSn5I5uRfCQuwm90pI', accent: '#1DB954' },
  { title: 'Deep House & Lounge', artist: 'Spotify Playlist', type: 'spotify', uri: 'spotify:playlist:3sjXD8J3RaO0BMsPboQFYW', accent: '#1DB954' },
  { title: 'Progressive House', artist: 'Spotify Playlist', type: 'spotify', uri: 'spotify:playlist:6i8AnUDQ4T6ee8ApYYTRta', accent: '#1DB954' },
  { title: 'Melodic Techno', artist: 'Spotify Playlist', type: 'spotify', uri: 'spotify:playlist:3wZ97h31kIDL8XnAmwHKa9', accent: '#1DB954' },
  { title: 'Techno & Tech House', artist: 'Spotify Playlist', type: 'spotify', uri: 'spotify:playlist:3lAtpVQq5fGrlEWnZ6UGN0', accent: '#1DB954' }
];

let currentSource = 'soundcloud';
let spotifyController = null;
let spDuration = 0;
// True after we ask the player to move (track change or seek) but before
// real audio is confirmed playing from that position. While true, the
// progress estimator holds still instead of advancing through silence.
let awaitingPlayback = false;

let progressPositionMs = 0;
let progressDurationMs = 0;
let progressLastSync = performance.now();

const scIframe = document.getElementById('scWidget');
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
window.addEventListener('resize', checkTitleOverflow);
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

let scWidget = null;
let scReady = false;
let pendingSoundCloudLoad = null;
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
  const radius = 6;
  const width = progressBarWidth || pbProgress.getBoundingClientRect().width;
  if (width > radius * 2) {
    let px = (pct / 100) * width;
    px = Math.max(radius, Math.min(width - radius, px));
    pbProgressThumb.style.left = px + 'px';
  } else {
    pbProgressThumb.style.left = pct + '%';
  }
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
  document.querySelectorAll('[data-track]').forEach(el => {
    el.classList.toggle('is-playing', Number(el.dataset.track) === currentTrackIndex);
  });
}

function updatePlayIcon() {
  iconPlay.style.display = isPlaying ? 'none' : 'block';
  iconPause.style.display = isPlaying ? 'block' : 'none';
  pbVinyl.classList.toggle('spinning', isPlaying);
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
  } else {
    spotifyController?.pause();
  }
}

function playCurrentSource() {
  if (currentSource === 'soundcloud') {
    scWidget?.play();
    return;
  }
  if (!spotifyController) return;
  if (typeof spotifyController.resume === 'function') spotifyController.resume();
  else spotifyController.play?.();
}

function loadSoundCloudTrack(track, autoplay) {
  currentSource = 'soundcloud';
  spotifyController?.pause();
  if (!scWidget) return;
  if (!scReady) {
    pendingSoundCloudLoad = { track, autoplay };
    return;
  }

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
    }
  });

  if (autoplay) {
    scWidget.play();
  }
}

function loadSpotifyTrack(track, autoplay) {
  currentSource = 'spotify';
  scWidget?.pause();
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
    scReady = true;
    scWidget.getDuration(d => { duration = d; });
    // Wait for the widget to actually be ready before issuing the first load —
    // on slower devices this can otherwise fire too early and be dropped.
    loadTrack(0, false);
    if (pendingSoundCloudLoad) {
      loadSoundCloudTrack(pendingSoundCloudLoad.track, pendingSoundCloudLoad.autoplay);
      pendingSoundCloudLoad = null;
    }
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
    syncProgress(data.currentPosition, duration);
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
      syncProgress(position, spDuration);
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

pbProgress.addEventListener('click', (e) => {
  if (currentTrackIndex === -1) return;
  const track = tracks[currentTrackIndex];
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;

  if (track.type === 'soundcloud') {
    if (!scWidget || !duration) return;
    const targetMs = pct * duration;
    awaitingPlayback = true;
    syncProgress(targetMs, duration);
    scWidget.seekTo(targetMs);
  } else {
    if (!spotifyController || !spDuration) return;
    const targetMs = pct * spDuration;
    awaitingPlayback = true;
    syncProgress(targetMs, spDuration);
    spotifyController.seek(Math.round(targetMs / 1000));
  }
});

document.querySelectorAll('[data-track]').forEach(btn => {
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
  if (!track || track.type !== 'soundcloud') return;

  btn.dataset.artLoaded = 'true';
  fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(track.url)}`)
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(data => {
      if (!data?.thumbnail_url) return;
      const art = data.thumbnail_url.replace('-large', '-t300x300');
      btn.style.backgroundImage = `linear-gradient(rgba(10,10,10,0.4), rgba(10,10,10,0.4)), url('${art}')`;
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
if (window.SC) {
  initPlayer();
} else {
  window.addEventListener('load', initPlayer);
}
