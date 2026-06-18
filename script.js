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

async function loadAnnePicturesManifest() {
  try {
    const res = await fetch('assets/anne-pictures/manifest.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const manifest = await res.json();
    // Insert discovered images at the front of the gallery
    manifest.forEach((m) => {
      galleryData.unshift({ src: m.path, title: m.filename, message: '' });
    });
  } catch (err) {
    // fail silently if manifest isn't available
    console.warn('Could not load anne pictures manifest', err);
  }
}

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
let musicOn = false;
let audioContext;
let toneGain;
let scheduledNotes = [];
let melodyTimer = null;

function createParticles() {
  const container = document.querySelector('.particles');
  const count = 35;

  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement('div');
    dot.className = 'particle';
    const size = Math.random() * 6 + 4;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.top = `${Math.random() * 100}%`;
    dot.style.animationDuration = `${Math.random() * 18 + 12}s`;
    dot.style.animationDelay = `${Math.random() * 4}s`;
    dot.style.opacity = `${Math.random() * 0.3 + 0.2}`;
    container.appendChild(dot);
  }
}

function renderGallery() {
  const carousel = document.getElementById('galleryCarousel');
  carousel.innerHTML = '';
  galleryData.forEach((item, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'gallery-card';
    card.innerHTML = `
      <img src="${item.src}" alt="${item.title}" loading="lazy" />
      <div class="overlay">
        <span class="caption">${item.title}</span>
      </div>
    `;
    card.addEventListener('click', () => openModal(index));
    carousel.appendChild(card);
  });
}

function renderTimeline() {
  const timeline = document.getElementById('timeline');
  timelineData.forEach((item, index) => {
    const element = document.createElement('article');
    element.className = 'timeline-item';
    element.innerHTML = `
      <div>
        <time>${item.date}</time>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      </div>
      <div class="circle">${String(index + 1).padStart(2, '0')}</div>
    `;
    timeline.appendChild(element);
  });
}

function openModal(index) {
  const item = galleryData[index];
  const modal = document.getElementById('photoModal');
  const image = document.getElementById('modalImage');
  const title = document.getElementById('modalTitle');
  const description = document.getElementById('modalDescription');

  image.src = item.src;
  image.alt = item.title;
  title.textContent = item.title;
  description.textContent = item.message;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  const modal = document.getElementById('photoModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function initAudio() {
  const toggle = document.getElementById('musicToggle');
  toggle.addEventListener('click', () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      toneGain = audioContext.createGain();
      toneGain.gain.value = 0.04;
      toneGain.connect(audioContext.destination);
    }

    if (!musicOn) {
      musicOn = true;
      toggle.textContent = 'Pause Music';
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      startMelody();
    } else {
      musicOn = false;
      toggle.textContent = 'Play Music';
      stopMelody();
    }
  });
}

function playSequence() {
  const notes = [440, 523, 659, 587, 523];
  let time = audioContext.currentTime + 0.18;

  scheduledNotes = notes.map((freq, index) => {
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(toneGain);
    osc.start(time + index * 0.6);
    osc.stop(time + index * 0.6 + 1.3);
    return osc;
  });
}

function startMelody() {
  if (melodyTimer) {
    return;
  }
  playSequence();
  melodyTimer = setInterval(playSequence, 4300);
}

function stopMelody() {
  if (melodyTimer) {
    clearInterval(melodyTimer);
    melodyTimer = null;
  }

  scheduledNotes.forEach((osc) => {
    if (osc && osc.stop) {
      try {
        osc.stop();
      } catch (error) {
        // ignore if already stopped
      }
    }
  });
  scheduledNotes = [];
}

function setupModalEvents() {
  const modal = document.getElementById('photoModal');
  const backdrop = document.getElementById('modalBackdrop');
  const closeButton = document.getElementById('closeModal');

  closeButton.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

function scrollReveal() {
  const revealElements = document.querySelectorAll('.section, .gallery-card, .timeline-item, .final-card');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'none';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealElements.forEach((element) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(24px)';
    element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(element);
  });
}

function initCarouselAutoplay() {
  const carousel = document.getElementById('galleryCarousel');
  setInterval(() => {
    currentSlide = (currentSlide + 1) % galleryData.length;
    const slide = carousel.children[currentSlide];
    if (slide) {
      slide.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  }, 5200);
}

async function init() {
  createParticles();
  await loadAnnePicturesManifest();
  renderGallery();
  renderTimeline();
  setupModalEvents();
  initAudio();
  scrollReveal();
  initCarouselAutoplay();

  document.getElementById('openTimeline').addEventListener('click', () => {
    document.getElementById('timelineSection').scrollIntoView({ behavior: 'smooth' });
  });
}

window.addEventListener('DOMContentLoaded', init);
