const galleryData = [
  {
    src: "assets/images/memory-1.svg",
    title: "First sunrise together",
    message: "This morning we watched the sky light up side by side, and the world felt softer because you were there.",
  },
  {
    src: "assets/images/memory-2.svg",
    title: "Warm autumn stroll",
    message: "Your laughter warmed every leaf in the park. Every step felt like a promise of more joyful days ahead.",
  },
  {
    src: "assets/images/memory-3.svg",
    title: "Quiet candlelight moment",
    message: "In that perfect hush, your eyes held everything I ever wanted to say. It was pure, tender, unforgettable.",
  },
  {
    src: "assets/images/memory-4.svg",
    title: "A night of wishes",
    message: "We traced our hopes into the stars and made a wish for a lifetime of magic, laughter, and gentle days together.",
  },
];

const timelineData = [
  {
    title: "The first hello",
    date: "Our beginning",
    text: "The moment our paths crossed, I knew there was a story waiting to unfold — soft, bright, and full of wonder.",
  },
  {
    title: "A day of adventure",
    date: "A happy memory",
    text: "From hidden cafes to shared glances, we savored every laugh and every unexpected turn along the way.",
  },
  {
    title: "A quiet promise",
    date: "Together forever",
    text: "A promise whispered in gentle light: to hold each other close through the calm and the storms.",
  },
];

let currentSlide = 0;
let modalIndex = 0;
let musicOn = false;
let audioContext = null;
let toneGain = null;
let melodyTimer = null;
let scheduledNotes = [];
let autoplayTimer = null;
let lastFocusedElement = null;

async function loadAnnePicturesManifest() {
  try {
    const res = await fetch("assets/anne-pictures/manifest.json", { cache: "no-cache" });
    if (!res.ok) return;
    const manifest = await res.json();
    if (!Array.isArray(manifest)) return;

    manifest
      .filter((item) => item && item.path)
      .reverse()
      .forEach((item) => {
        galleryData.unshift({
          src: item.path,
          title: item.title || item.filename || "A special memory",
          message: item.message || "A beautiful moment worth remembering.",
        });
      });
  } catch (error) {
    console.warn("Could not load Anne pictures manifest", error);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createParticles() {
  const container = document.querySelector(".particles");
  if (!container) return;

  const count = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 12 : 35;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement("div");
    dot.className = "particle";
    const size = Math.random() * 6 + 3;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.top = `${Math.random() * 100}%`;
    dot.style.animationDuration = `${Math.random() * 18 + 12}s`;
    dot.style.animationDelay = `${Math.random() * 4}s`;
    dot.style.opacity = `${Math.random() * 0.3 + 0.15}`;
    fragment.appendChild(dot);
  }

  container.appendChild(fragment);
}

function renderGallery() {
  const carousel = document.getElementById("galleryCarousel");
  if (!carousel) return;

  carousel.innerHTML = "";

  galleryData.forEach((item, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "gallery-card";
    card.dataset.index = String(index);
    card.setAttribute("aria-label", `Open memory: ${item.title}`);
    card.innerHTML = `
      <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async" />
      <div class="overlay">
        <div>
          <span class="caption">${escapeHtml(item.title)}</span>
          <span class="caption-hint">Tap to open · ${index + 1}/${galleryData.length}</span>
        </div>
      </div>
    `;
    card.addEventListener("click", () => openModal(index));
    carousel.appendChild(card);
  });

  updateGalleryProgress();
}

function renderTimeline() {
  const timeline = document.getElementById("timeline");
  if (!timeline) return;

  timeline.innerHTML = timelineData
    .map(
      (item, index) => `
        <article class="timeline-item">
          <div>
            <time>${escapeHtml(item.date)}</time>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text)}</p>
          </div>
          <div class="circle" aria-hidden="true">${String(index + 1).padStart(2, "0")}</div>
        </article>
      `
    )
    .join("");
}

function updateGalleryStatus() {
  const status = document.getElementById("galleryStatus");
  if (!status || !galleryData.length) return;
  status.textContent = `${galleryData.length} memories to explore. Currently viewing ${currentSlide + 1} of ${galleryData.length}.`;
}

function updateGalleryProgress() {
  const bar = document.getElementById("galleryProgressBar");
  if (bar) {
    const percent = galleryData.length ? ((currentSlide + 1) / galleryData.length) * 100 : 0;
    bar.style.width = `${percent}%`;
  }
  updateGalleryStatus();
}

function goToSlide(index, smooth = true) {
  if (!galleryData.length) return;
  currentSlide = (index + galleryData.length) % galleryData.length;
  const carousel = document.getElementById("galleryCarousel");
  const slide = carousel?.children[currentSlide];

  if (slide) {
    slide.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "nearest", inline: "center" });
  }
  updateGalleryProgress();
}

function openModal(index) {
  if (!galleryData.length) return;
  modalIndex = (index + galleryData.length) % galleryData.length;
  lastFocusedElement = document.activeElement;

  const item = galleryData[modalIndex];
  const modal = document.getElementById("photoModal");
  const image = document.getElementById("modalImage");
  const title = document.getElementById("modalTitle");
  const description = document.getElementById("modalDescription");
  const counter = document.getElementById("modalCounter");

  image.src = item.src;
  image.alt = item.title;
  title.textContent = item.title;
  description.textContent = item.message || "A beautiful moment worth remembering.";
  counter.textContent = `${modalIndex + 1} / ${galleryData.length}`;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  document.getElementById("closeModal")?.focus();
  stopAutoplay();
}

function closeModal() {
  const modal = document.getElementById("photoModal");
  if (!modal?.classList.contains("open")) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  document.getElementById("modalImage").src = "";
  startAutoplay();

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

function moveModal(direction) {
  modalIndex = (modalIndex + direction + galleryData.length) % galleryData.length;
  const item = galleryData[modalIndex];
  document.getElementById("modalImage").src = item.src;
  document.getElementById("modalImage").alt = item.title;
  document.getElementById("modalTitle").textContent = item.title;
  document.getElementById("modalDescription").textContent = item.message || "A beautiful moment worth remembering.";
  document.getElementById("modalCounter").textContent = `${modalIndex + 1} / ${galleryData.length}`;
  goToSlide(modalIndex, false);
}

function initGalleryControls() {
  document.getElementById("galleryPrev")?.addEventListener("click", () => {
    stopAutoplay();
    goToSlide(currentSlide - 1);
    startAutoplay();
  });

  document.getElementById("galleryNext")?.addEventListener("click", () => {
    stopAutoplay();
    goToSlide(currentSlide + 1);
    startAutoplay();
  });

  const carousel = document.getElementById("galleryCarousel");
  carousel?.addEventListener("scroll", () => {
    window.requestAnimationFrame(() => {
      const cards = [...carousel.children];
      if (!cards.length) return;
      const center = carousel.scrollLeft + carousel.clientWidth / 2;
      let nearest = 0;
      let distance = Infinity;
      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const currentDistance = Math.abs(cardCenter - center);
        if (currentDistance < distance) {
          distance = currentDistance;
          nearest = index;
        }
      });
      currentSlide = nearest;
      updateGalleryProgress();
    });
  });
}

function initModalEvents() {
  const modal = document.getElementById("photoModal");
  document.getElementById("closeModal")?.addEventListener("click", closeModal);
  document.getElementById("modalBackdrop")?.addEventListener("click", closeModal);
  document.getElementById("modalPrev")?.addEventListener("click", () => moveModal(-1));
  document.getElementById("modalNext")?.addEventListener("click", () => moveModal(1));

  document.addEventListener("keydown", (event) => {
    if (!modal?.classList.contains("open")) return;
    if (event.key === "Escape") closeModal();
    if (event.key === "ArrowLeft") moveModal(-1);
    if (event.key === "ArrowRight") moveModal(1);
  });
}

function initAudio() {
  const toggle = document.getElementById("musicToggle");
  if (!toggle) return;

  toggle.addEventListener("click", async () => {
    if (!audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        toggle.textContent = "Music unavailable";
        toggle.disabled = true;
        return;
      }
      audioContext = new AudioContext();
      toneGain = audioContext.createGain();
      toneGain.gain.value = 0.035;
      toneGain.connect(audioContext.destination);
    }

    if (audioContext.state === "suspended") await audioContext.resume();

    if (!musicOn) {
      musicOn = true;
      toggle.textContent = "♫ Pause Music";
      toggle.setAttribute("aria-pressed", "true");
      startMelody();
    } else {
      musicOn = false;
      toggle.textContent = "♫ Play Music";
      toggle.setAttribute("aria-pressed", "false");
      stopMelody();
    }
  });
}

function playSequence() {
  if (!audioContext || !toneGain || !musicOn) return;
  const notes = [440, 523.25, 659.25, 587.33, 523.25, 440];
  const now = audioContext.currentTime + 0.08;

  scheduledNotes = notes.map((frequency, index) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now + index * 0.55);
    gain.gain.linearRampToValueAtTime(0.8, now + index * 0.55 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.55 + 0.52);
    osc.connect(gain);
    gain.connect(toneGain);
    osc.start(now + index * 0.55);
    osc.stop(now + index * 0.55 + 0.55);
    return osc;
  });
}

function startMelody() {
  if (melodyTimer || !musicOn) return;
  playSequence();
  melodyTimer = window.setInterval(playSequence, 3400);
}

function stopMelody() {
  if (melodyTimer) {
    window.clearInterval(melodyTimer);
    melodyTimer = null;
  }
  scheduledNotes.forEach((osc) => {
    try { osc.stop(); } catch (_) { /* already stopped */ }
  });
  scheduledNotes = [];
}

function startAutoplay() {
  if (autoplayTimer || galleryData.length < 2 || document.hidden) return;
  autoplayTimer = window.setInterval(() => goToSlide(currentSlide + 1), 6000);
}

function stopAutoplay() {
  if (autoplayTimer) {
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

function initAutoplay() {
  startAutoplay();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else if (!document.getElementById("photoModal")?.classList.contains("open")) startAutoplay();
  });
}

function scrollReveal() {
  const elements = document.querySelectorAll(".section, .gallery-card, .timeline-item, .final-card");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  elements.forEach((element) => observer.observe(element));
}

function initPageNavigation() {
  document.getElementById("openTimeline")?.addEventListener("click", () => {
    document.getElementById("timelineSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

async function init() {
  createParticles();
  await loadAnnePicturesManifest();
  renderGallery();
  renderTimeline();
  initGalleryControls();
  initModalEvents();
  initAudio();
  scrollReveal();
  initAutoplay();
  initPageNavigation();
  updateGalleryStatus();
}

window.addEventListener("DOMContentLoaded", init);
