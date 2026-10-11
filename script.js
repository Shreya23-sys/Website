// ==========================================
// KALA LAYA NEPAL — CORE APPLICATION SCRIPT
// ==========================================

// --- 1. LOCAL STORAGE AUTHENTICATION STATE ---
const AUTH_USERS_KEY = "kalalaya_users";
const AUTH_SESSION_KEY = "kalalaya_current_user";

// Seed default demo user if not present
function initializeDemoUsers() {
  if (!localStorage.getItem(AUTH_USERS_KEY)) {
    const defaultUsers = [
      {
        fullName: "Aayush Sharma",
        email: "demo@kalalaya.org",
        password: "password123",
        role: "artist",
        joinedDate: "2026-01-15"
      }
    ];
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(defaultUsers));
  }
}
initializeDemoUsers();

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USERS_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveUser(user) {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY));
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
  updateHeaderAuthState();
}

function logoutUser() {
  setCurrentUser(null);
  showToast("You have been signed out safely. Phir Vetamula!", "info");
}

// Update header UI depending on whether user is logged in
function updateHeaderAuthState() {
  const user = getCurrentUser();
  const userBadges = document.querySelectorAll(".header-user-badge");
  const loginButtons = document.querySelectorAll(".header-login-btn");

  if (user) {
    const initials = user.fullName
      ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
      : "KL";

    userBadges.forEach(badge => {
      badge.style.display = "inline-flex";
      const avatarEl = badge.querySelector(".header-user-avatar");
      const nameEl = badge.querySelector(".header-user-info");
      if (avatarEl) avatarEl.textContent = initials;
      if (nameEl) nameEl.textContent = user.fullName.split(" ")[0];
    });

    loginButtons.forEach(btn => {
      btn.style.display = "none";
    });
  } else {
    userBadges.forEach(badge => {
      badge.style.display = "none";
    });
    loginButtons.forEach(btn => {
      btn.style.display = "inline-flex";
    });
  }
}

// --- 2. TOAST NOTIFICATION UTILITY ---
function showToast(message, type = "success") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast-msg ${type}`;
  const icon = type === "success" ? "✓" : type === "error" ? "⚠" : "ℹ";
  toast.innerHTML = `<span style="font-weight:700;">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}

// --- 3. SHARE LOGIN LINK FEATURE ---
function getShareableLoginUrl() {
  const loc = window.location;
  // If running via http/https or file protocol
  let baseUrl = loc.href.split("#")[0].split("?")[0];
  const lastSlash = baseUrl.lastIndexOf("/");
  const dir = baseUrl.substring(0, lastSlash + 1);
  return dir + "login.html";
}

function copyShareLoginLink() {
  const loginUrl = getShareableLoginUrl();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(loginUrl).then(() => {
      showToast("✨ Login link copied! Share it with your friends or members.", "success");
    }).catch(() => {
      fallbackCopy(loginUrl);
    });
  } else {
    fallbackCopy(loginUrl);
  }
}

function fallbackCopy(text) {
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  try {
    document.execCommand("copy");
    showToast("✨ Login link copied to clipboard!", "success");
  } catch (e) {
    window.prompt("Copy this link to share the login page:", text);
  }
  document.body.removeChild(tempInput);
}

function shareViaWhatsApp() {
  const url = encodeURIComponent(getShareableLoginUrl());
  const text = encodeURIComponent("Namaste! Join me on Kala Laya Nepal Theatre & Art Collective. Log in or create your account here: ");
  window.open(`https://api.whatsapp.com/send?text=${text}${url}`, "_blank");
}

// Wire up all share triggers
document.addEventListener("DOMContentLoaded", () => {
  updateHeaderAuthState();

  document.querySelectorAll(".share-link-btn, .btn-copy-login-link").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      copyShareLoginLink();
    });
  });

  document.querySelectorAll(".btn-share-whatsapp").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      shareViaWhatsApp();
    });
  });

  document.querySelectorAll(".logout-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      logoutUser();
    });
  });
});

// --- 4. LOGIN MODAL SYSTEM ---
const loginModal = document.getElementById("loginModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalSwitchToRegister = document.getElementById("modalSwitchToRegister");
const modalLoginForm = document.getElementById("modalLoginForm");
const modalLoginStatus = document.getElementById("modalLoginStatus");

function openLoginModal() {
  if (!loginModal) {
    // If not on page with modal, navigate to login.html
    window.location.href = "login.html";
    return;
  }
  loginModal.classList.add("open");
  loginModal.setAttribute("aria-hidden", "false");
  const emailInput = document.getElementById("loginEmail");
  if (emailInput) setTimeout(() => emailInput.focus(), 100);
  document.body.style.overflow = "hidden";
}

function closeLoginModal() {
  if (!loginModal) return;
  loginModal.classList.remove("open");
  loginModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// Open modal triggers
document.addEventListener("DOMContentLoaded", () => {
  const triggers = ["loginButton", "headerLoginBtn", "coverLoginLink", "heroLoginBtn"];
  triggers.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("click", (event) => {
        // If it's a link to login.html on other pages, let it navigate unless modal exists
        if (loginModal) {
          event.preventDefault();
          openLoginModal();
        }
      });
    }
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeLoginModal);

  if (loginModal) {
    loginModal.addEventListener("click", (e) => {
      if (e.target === loginModal) closeLoginModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (loginModal && loginModal.classList.contains("open")) closeLoginModal();
      closeLightbox();
      closeArticleModal();
    }
  });

  if (modalSwitchToRegister) {
    modalSwitchToRegister.addEventListener("click", (e) => {
      e.preventDefault();
      closeLoginModal();
      const registerSection = document.getElementById("register");
      if (registerSection) {
        registerSection.scrollIntoView({ behavior: "smooth" });
        const nameInput = document.getElementById("fullName");
        if (nameInput) setTimeout(() => nameInput.focus(), 400);
      } else {
        window.location.href = "index.html#register";
      }
    });
  }
});

// Modal Login Submission
if (modalLoginForm) {
  modalLoginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const emailError = document.getElementById("loginEmailError");
    const passwordError = document.getElementById("loginPasswordError");

    if (emailError) emailError.textContent = "";
    if (passwordError) passwordError.textContent = "";

    let valid = true;
    if (!email) {
      if (emailError) emailError.textContent = "Please enter your email.";
      valid = false;
    }
    if (!password) {
      if (passwordError) passwordError.textContent = "Please enter your password.";
      valid = false;
    }
    if (!valid) return;

    // Check against registered users
    const users = getUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser || foundUser.password !== password) {
      if (passwordError) passwordError.textContent = "Invalid email or password. (Demo: demo@kalalaya.org / password123)";
      return;
    }

    // Success
    setCurrentUser(foundUser);
    if (modalLoginStatus) modalLoginStatus.textContent = `Namaste ${foundUser.fullName}! Welcome back.`;
    showToast(`Welcome back, ${foundUser.fullName}! You are now logged in.`, "success");

    setTimeout(() => {
      closeLoginModal();
    }, 900);
  });
}

// Standalone Login Page form handler (if on login.html)
const pageLoginForm = document.getElementById("pageLoginForm");
if (pageLoginForm) {
  pageLoginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("pageEmail").value.trim();
    const password = document.getElementById("pagePassword").value;
    const emailError = document.getElementById("pageEmailError");
    const passwordError = document.getElementById("pagePasswordError");
    const statusMsg = document.getElementById("pageLoginStatus");

    if (emailError) emailError.textContent = "";
    if (passwordError) passwordError.textContent = "";
    if (statusMsg) statusMsg.textContent = "";

    let valid = true;
    if (!email) {
      if (emailError) emailError.textContent = "Please enter your email.";
      valid = false;
    }
    if (!password) {
      if (passwordError) passwordError.textContent = "Please enter your password.";
      valid = false;
    }
    if (!valid) return;

    const users = getUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser || foundUser.password !== password) {
      if (passwordError) passwordError.textContent = "Invalid email or password. (Try demo@kalalaya.org / password123)";
      return;
    }

    setCurrentUser(foundUser);
    if (statusMsg) statusMsg.textContent = `Welcome, ${foundUser.fullName}! Redirecting to home...`;
    showToast(`Namaste, ${foundUser.fullName}! Login successful.`, "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  });
}

// --- 5. REGISTRATION FORM VALIDATION & PERSISTENCE ---
const registrationForm = document.getElementById("registrationForm");
const statusMessage = document.getElementById("formStatus");

if (registrationForm) {
  const fields = {
    fullName: document.getElementById("fullName"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    confirmPassword: document.getElementById("confirmPassword"),
    role: document.getElementById("role"),
    terms: document.getElementById("terms")
  };

  const errors = {
    fullName: document.getElementById("nameError"),
    email: document.getElementById("emailError"),
    password: document.getElementById("passwordError"),
    confirmPassword: document.getElementById("confirmError"),
    role: document.getElementById("roleError"),
    terms: document.getElementById("termsError")
  };

  function setError(fieldName, message) {
    if (errors[fieldName]) errors[fieldName].textContent = message;
    if (fields[fieldName] && fields[fieldName].type !== "checkbox") {
      fields[fieldName].setAttribute("aria-invalid", message ? "true" : "false");
    }
  }

  function validateRegistration() {
    let valid = true;
    Object.keys(errors).forEach(key => setError(key, ""));

    const name = fields.fullName ? fields.fullName.value.trim() : "";
    const email = fields.email ? fields.email.value.trim() : "";
    const password = fields.password ? fields.password.value : "";
    const confirmPassword = fields.confirmPassword ? fields.confirmPassword.value : "";

    if (name.length < 2) {
      setError("fullName", "Please enter your full name.");
      valid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("email", "Please enter a valid email address.");
      valid = false;
    } else {
      const existing = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        setError("email", "An account with this email already exists. Try logging in.");
        valid = false;
      }
    }

    if (password.length < 8) {
      setError("password", "Password must contain at least 8 characters.");
      valid = false;
    }

    if (confirmPassword !== password || confirmPassword.length === 0) {
      setError("confirmPassword", "The passwords do not match.");
      valid = false;
    }

    if (fields.role && !fields.role.value) {
      setError("role", "Please select your primary role or interest.");
      valid = false;
    }

    if (fields.terms && !fields.terms.checked) {
      setError("terms", "Please accept the community terms and privacy policy.");
      valid = false;
    }

    return valid;
  }

  registrationForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (statusMessage) statusMessage.textContent = "";

    if (!validateRegistration()) {
      const firstInvalid = registrationForm.querySelector('[aria-invalid="true"]') ||
        (fields.terms && fields.terms.checked ? null : fields.terms);
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const newUser = {
      fullName: fields.fullName.value.trim(),
      email: fields.email.value.trim(),
      password: fields.password.value,
      role: fields.role.value,
      joinedDate: new Date().toISOString()
    };

    saveUser(newUser);
    setCurrentUser(newUser);

    if (statusMessage) {
      statusMessage.textContent = "✨ Account created successfully! Welcome to Kala Laya Nepal.";
    }
    showToast(`Welcome to Kala Laya Nepal, ${newUser.fullName}!`, "success");

    registrationForm.reset();
  });

  // Real-time clearing of errors
  Object.entries(fields).forEach(([key, field]) => {
    if (!field) return;
    if (field.type === "checkbox") {
      field.addEventListener("change", () => setError(key, ""));
    } else {
      field.addEventListener("input", () => {
        setError(key, "");
        if (key === "password" && fields.confirmPassword && fields.confirmPassword.value) {
          setError("confirmPassword", fields.confirmPassword.value === field.value ? "" : "The passwords do not match.");
        }
        if (key === "confirmPassword" && field.value && fields.password) {
          setError("confirmPassword", field.value === fields.password.value ? "" : "The passwords do not match.");
        }
      });
    }
  });
}

// Password visibility toggles
document.querySelectorAll(".visibility-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.target);
    if (!target) return;
    const showing = target.type === "password";
    target.type = showing ? "text" : "password";
    button.setAttribute("aria-label", showing ? "Hide password" : "Show password");
    button.textContent = showing ? "⊘" : "◉";
  });
});

// --- 6. MOBILE NAVIGATION ---
const menuToggle = document.getElementById("menuToggle");
const nav = document.querySelector(".main-nav");
if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// --- 7. SEARCH BUTTON ---
const searchBtn = document.getElementById("searchButton");
if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    const query = window.prompt("Search Kala Laya Nepal (Theatre, Paubha, Lakhey, Workshops):");
    if (query && query.trim()) {
      showToast(`Searching archives for "${query.trim()}"... Showing matching gallery & stories.`, "info");
      // If gallery on page, filter
      const galleryInput = document.getElementById("gallerySearch");
      if (galleryInput) {
        galleryInput.value = query.trim();
        galleryInput.dispatchEvent(new Event("input"));
        galleryInput.scrollIntoView({ behavior: "smooth" });
      }
    }
  });
}

// --- 8. GALLERY FILTER & LIGHTBOX SYSTEM ---
const filterButtons = document.querySelectorAll(".filter-btn");
const galleryItems = document.querySelectorAll(".gallery-item");
const lightboxOverlay = document.getElementById("lightboxModal");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxTitle = document.getElementById("lightboxTitle");
const lightboxDesc = document.getElementById("lightboxDesc");
const lightboxClose = document.getElementById("lightboxClose");

if (filterButtons.length > 0) {
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const category = btn.dataset.filter;

      galleryItems.forEach(item => {
        if (category === "all" || item.dataset.category === category) {
          item.style.display = "block";
          item.style.opacity = "1";
        } else {
          item.style.display = "none";
        }
      });
    });
  });
}

if (galleryItems.length > 0) {
  galleryItems.forEach(item => {
    item.addEventListener("click", () => {
      const img = item.querySelector("img");
      const title = item.querySelector(".gallery-title");
      const sub = item.querySelector(".gallery-sub");
      if (lightboxOverlay && img) {
        lightboxImg.src = img.src;
        if (lightboxTitle && title) lightboxTitle.textContent = title.textContent;
        if (lightboxDesc && sub) lightboxDesc.textContent = sub.textContent;
        lightboxOverlay.classList.add("open");
        document.body.style.overflow = "hidden";
      }
    });
  });
}

function closeLightbox() {
  if (!lightboxOverlay) return;
  lightboxOverlay.classList.remove("open");
  document.body.style.overflow = "";
}

if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
if (lightboxOverlay) {
  lightboxOverlay.addEventListener("click", (e) => {
    if (e.target === lightboxOverlay) closeLightbox();
  });
}

// --- 9. BLOG STORIES & READER MODAL ---
const blogArticles = {
  1: {
    title: "The Sacred Geometry of Nepali Wooden Masks: Tales of the Bhairav & Lakhey",
    date: "October 8, 2026 · By Sonu Jayanti",
    category: "Ritual Arts & Theatre",
    img: "cover-bg.jpg",
    content: `
      <p>In the Kathmandu Valley and the traditional towns across Nepal, wooden masks are never merely decorative artifacts. Each contour, carve, and brushstroke embodies centuries of tantric cosmology and dramatic storytelling.</p>
      <p>The wrathful manifestation of Mahakala and Bhairav—marked by the third eye of wisdom, the crown of five skulls representing the transformation of vices into virtues, and the open fanged mouth—was sculpted not to induce terror, but to dissolve ego and protect the sanctuary.</p>
      <p>At Kala Laya Nepal, our theatre productions regularly draw upon this ritual heritage. When an actor dons the Lakhey mask, they surrender their personal identity to become a conduit for living myth. In our upcoming festival showcase, we bridge the ancient Newari ritual dance with modern theatrical pacing, proving that tradition is not an archive of ashes, but the preservation of flame.</p>
    `
  },
  2: {
    title: "Theatre of Resilience: Bringing Stage Plays to Eastern Nepal",
    date: "September 24, 2026 · By Kala Laya Collective",
    category: "Theatre & Performance",
    img: "theatre-stage.jpg",
    content: `
      <p>For more than a decade, Kala Laya has operated out of Itahari, Sunsari, transforming open courtyards, school halls, and rented spaces into pulsating arenas of drama and dialogue.</p>
      <p>While the capital Kathmandu often commands the lion's share of national arts attention, grassroots theatre outside the valley carries a unique vitality. In plays such as our acclaimed production of <em>'Refund'</em> and contemporary social dramas, we engage housewives, students, and everyday workers as both actors and active dialogue participants.</p>
      <p>Without a permanent performance hall, our rehearsals frequently happen under open skies or in community centers. Yet this challenge has become our greatest strength: it stripped away the elitism of conventional theatre and anchored our art deeply into the soil of everyday Nepali life.</p>
    `
  },
  3: {
    title: "Living Pigments: Paubha and Mithila Art in the Modern Era",
    date: "September 12, 2026 · By Visual Arts Wing",
    category: "Fine Arts & Painting",
    img: "art-workshop.jpg",
    content: `
      <p>The visual art tradition of Nepal is one of the world's richest spiritual expressions. From the geometric mandalas of Paubha paintings to the vibrant domestic narratives of Mithila folk art, art has always been deeply communal.</p>
      <p>In Kala Laya's creative workshops, young painters learn the patient craft of preparing organic mineral pigments—grinding cinnabar red, lapis lazuli, and yellow ochre. But alongside traditional iconometry, our artists are invited to express contemporary questions: environmental stewardship, female agency, and cultural migration.</p>
      <p>Every Saturday, our studio welcomes students from all backgrounds, demystifying fine art and reviving skills that were once confined to hereditary guilds.</p>
    `
  },
  4: {
    title: "The Resonant Strings: The Sarangi andBasuri Storytelling Tradition",
    date: "August 30, 2026 · By Cultural Music Circle",
    category: "Folk Music Heritage",
    img: "nepali-music.jpg",
    content: `
      <p>Long before printed newspapers and broadcast media arrived in the Himalayan foothills, the Gaine and Gandharva bards walked from village to village carrying the four-stringed Sarangi. Their music was journalism, history, poetry, and solace.</p>
      <p>At Kala Laya, live music is the emotional spine of our dramatic productions. When the Madal beats synchronize with the breath of the basuri bamboo flute and the weeping cadence of the Sarangi, the audience enters a collective trance.</p>
      <p>We are documenting rare traditional folk melodies while training a new generation of youth to take pride in our acoustic instruments.</p>
    `
  }
};

const articleModal = document.getElementById("articleModal");
const articleModalClose = document.getElementById("articleModalClose");
const articleModalTitle = document.getElementById("articleModalTitle");
const articleModalMeta = document.getElementById("articleModalMeta");
const articleModalImg = document.getElementById("articleModalImg");
const articleModalBody = document.getElementById("articleModalBody");

function openArticle(id) {
  const data = blogArticles[id];
  if (!data || !articleModal) return;

  if (articleModalTitle) articleModalTitle.textContent = data.title;
  if (articleModalMeta) articleModalMeta.textContent = `${data.date} · Category: ${data.category}`;
  if (articleModalImg) articleModalImg.src = data.img;
  if (articleModalBody) articleModalBody.innerHTML = data.content;

  articleModal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeArticleModal() {
  if (!articleModal) return;
  articleModal.classList.remove("open");
  document.body.style.overflow = "";
}

if (articleModalClose) articleModalClose.addEventListener("click", closeArticleModal);
if (articleModal) {
  articleModal.addEventListener("click", (e) => {
    if (e.target === articleModal) closeArticleModal();
  });
}

document.querySelectorAll(".blog-read-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const articleId = btn.dataset.articleId;
    openArticle(articleId);
  });
});

// Blog Search Bar filter
const blogSearchInput = document.getElementById("blogSearchInput");
if (blogSearchInput) {
  blogSearchInput.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase().trim();
    document.querySelectorAll(".blog-card").forEach(card => {
      const title = card.querySelector(".blog-title").textContent.toLowerCase();
      const excerpt = card.querySelector(".blog-excerpt").textContent.toLowerCase();
      if (title.includes(val) || excerpt.includes(val)) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  });
}

// --- 10. FAQ ACCORDION ---
document.querySelectorAll(".faq-question").forEach(q => {
  q.addEventListener("click", () => {
    const item = q.parentElement;
    const isOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("open"));
    if (!isOpen) {
      item.classList.add("open");
    }
  });
});

// --- 11. CONTACT FORM HANDLING ---
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const message = document.getElementById("contactMessage").value.trim();
    const status = document.getElementById("contactStatus");

    if (!name || !email || !message) {
      if (status) status.textContent = "Please fill in all required fields.";
      return;
    }

    if (status) status.textContent = "Thank you! Your message has been sent to Kala Laya Nepal. We will reply shortly.";
    showToast("Dhanyabad! Your message has been sent to Kala Laya Nepal.", "success");
    contactForm.reset();
  });
}

// --- 12. NEWSLETTER FORM HANDLING ---
const newsletterForm = document.getElementById("newsletterForm");
if (newsletterForm) {
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = newsletterForm.querySelector("input[type='email']").value.trim();
    if (email) {
      showToast("Dhanyabad! You are now subscribed to Kala Laya Nepal cultural updates.", "success");
      newsletterForm.reset();
    }
  });
}
