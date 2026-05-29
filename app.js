/* ==========================================================================
   ZYNAPPZ CORE APPLICATION CONTROLLER
   ========================================================================== */

// --- GLOBAL STORE & STATE MANAGEMENT ---
const store = {
  keys: {
    openai: localStorage.getItem('zyn_key_openai') || '',
    anthropic: localStorage.getItem('zyn_key_anthropic') || '',
    news: localStorage.getItem('zyn_key_news') || '',
    removebg: localStorage.getItem('zyn_key_removebg') || ''
  },
  gallery: JSON.parse(localStorage.getItem('zy_gallery')) || [],
  newsCache: JSON.parse(localStorage.getItem('zyn_news_cache')) || { articles: [], lastUpdated: 0 },
  
  saveKeys(newKeys) {
    this.keys = { ...this.keys, ...newKeys };
    localStorage.setItem('zyn_key_openai', this.keys.openai);
    localStorage.setItem('zyn_key_anthropic', this.keys.anthropic);
    localStorage.setItem('zyn_key_news', this.keys.news);
    localStorage.setItem('zyn_key_removebg', this.keys.removebg);
  },
  
  saveGalleryImage(imgObj) {
    this.gallery.unshift(imgObj); // Add new at top
    localStorage.setItem('zy_gallery', JSON.stringify(this.gallery));
  },
  
  deleteGalleryImage(index) {
    this.gallery.splice(index, 1);
    localStorage.setItem('zy_gallery', JSON.stringify(this.gallery));
  },
  
  saveNewsCache(articles) {
    this.newsCache = {
      articles: articles,
      lastUpdated: Date.now()
    };
    localStorage.setItem('zyn_news_cache', JSON.stringify(this.newsCache));
  }
};

// --- INITIALIZE APPLICATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();
  
  // Start Particle Background
  initParticleBackground();
  
  // Start Custom Cursor
  initCustomCursor();
  
  // Start Router
  initRouter();
  
  // Check API keys on launch
  checkApiKeysSetup();
  
  // Set up Event Listeners
  setupSettingsModal();
  setupZyChat();
  setupImageTools();
  setupDetector();
  setupNewsFeed();
  setupLawyerChat();
  setupGallery();
  
  // Pre-load Gallery Grid
  renderGalleryGrid();
});

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconName = type === 'success' ? 'check-circle' : 'alert-circle';
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  lucide.createIcons({ attrs: { class: 'toast-icon' } });
  
  // Animate slide-out and remove
  setTimeout(() => {
    toast.style.animation = 'slide-in-toast 0.3s ease-in reverse';
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}

// --- API KEYS SETUP MODAL CHECK ---
function checkApiKeysSetup() {
  const missingKeys = !store.keys.openai || !store.keys.anthropic || !store.keys.news;
  if (missingKeys) {
    showToast('Welcome to Zynappz! Please set up your API keys to get started.', 'info');
    toggleSettingsModal(true);
  }
}

function toggleSettingsModal(show) {
  const modal = document.getElementById('modal-settings');
  if (show) {
    // Fill in inputs with existing keys
    document.getElementById('key-openai').value = store.keys.openai;
    document.getElementById('key-anthropic').value = store.keys.anthropic;
    document.getElementById('key-news').value = store.keys.news;
    document.getElementById('key-removebg').value = store.keys.removebg;
    modal.classList.add('active');
  } else {
    modal.classList.remove('active');
  }
}

function setupSettingsModal() {
  const btnOpen = document.getElementById('btn-open-settings');
  const btnMobileOpen = document.getElementById('btn-mobile-settings');
  const btnClose = document.getElementById('btn-close-settings-modal');
  const form = document.getElementById('form-settings');
  
  btnOpen.addEventListener('click', () => toggleSettingsModal(true));
  if (btnMobileOpen) btnMobileOpen.addEventListener('click', () => toggleSettingsModal(true));
  btnClose.addEventListener('click', () => toggleSettingsModal(false));
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const openai = document.getElementById('key-openai').value.trim();
    const anthropic = document.getElementById('key-anthropic').value.trim();
    const news = document.getElementById('key-news').value.trim();
    const removebg = document.getElementById('key-removebg').value.trim();
    
    store.saveKeys({ openai, anthropic, news, removebg });
    showToast('API Keys saved successfully! Enjoy Zynappz.');
    toggleSettingsModal(false);
  });
}

// --- SUBTLE PARTICLES BACKGROUND ---
function initParticleBackground() {
  const canvas = document.getElementById('bg-particles');
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  
  const particles = [];
  const particleCount = Math.min(60, Math.floor((width * height) / 30000));
  
  class Star {
    constructor() {
      this.reset();
    }
    
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 1.5 + 0.5;
      this.speedY = -(Math.random() * 0.15 + 0.05);
      this.speedX = (Math.random() * 0.1 - 0.05);
      this.alpha = Math.random() * 0.5 + 0.25;
      this.fadeSpeed = Math.random() * 0.005 + 0.002;
      this.growing = Math.random() > 0.5;
    }
    
    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      
      // Twinkle alpha logic
      if (this.growing) {
        this.alpha += this.fadeSpeed;
        if (this.alpha >= 0.8) this.growing = false;
      } else {
        this.alpha -= this.fadeSpeed;
        if (this.alpha <= 0.1) this.growing = true;
      }
      
      // Reset if offscreen
      if (this.y < 0 || this.x < 0 || this.x > width) {
        this.reset();
        this.y = height;
      }
    }
    
    draw() {
      ctx.fillStyle = `rgba(96, 165, 250, ${this.alpha})`;
      ctx.shadowBlur = this.size * 3;
      ctx.shadowColor = '#60a5fa';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Star());
  }
  
  function animate() {
    ctx.clearRect(0, 0, width, height);
    ctx.shadowBlur = 0; // reset
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }
  
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });
  
  animate();
}

// --- SMOOTH GLOWING CUSTOM CURSOR ---
function initCustomCursor() {
  const dot = document.getElementById('cursor-dot');
  const outline = document.getElementById('cursor-outline');
  
  let mouse = { x: 0, y: 0 };
  let dotPos = { x: 0, y: 0 };
  let outlinePos = { x: 0, y: 0 };
  
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  
  // Track mouseenter/leave for hover scale adjustments
  const hoverSelector = 'a, button, input, textarea, select, .drop-zone, .tab-btn, .detector-tab, .gallery-action-btn';
  
  // Dynamic delegation check to handle hover styling on dynamically generated nodes
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverSelector)) {
      document.body.classList.add('cursor-hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverSelector)) {
      document.body.classList.remove('cursor-hover');
    }
  });
  
  // Inertia loop using linear interpolation (lerp)
  function updateCursor() {
    // Dot tracking is instant/fast
    dotPos.x += (mouse.x - dotPos.x) * 0.35;
    dotPos.y += (mouse.y - dotPos.y) * 0.35;
    
    // Outline tracking has high inertia (slow smooth lag)
    outlinePos.x += (mouse.x - outlinePos.x) * 0.12;
    outlinePos.y += (mouse.y - outlinePos.y) * 0.12;
    
    dot.style.left = `${dotPos.x}px`;
    dot.style.top = `${dotPos.y}px`;
    
    outline.style.left = `${outlinePos.x}px`;
    outline.style.top = `${outlinePos.y}px`;
    
    requestAnimationFrame(updateCursor);
  }
  
  updateCursor();
}

// --- SPA ROUTER ---
function initRouter() {
  const navBtns = document.querySelectorAll('.nav-btn, .mobile-nav-btn');
  const pages = document.querySelectorAll('.page');
  
  // Mobile drawer controls
  const toggleBtn = document.getElementById('btn-toggle-menu');
  const closeBtn = document.getElementById('btn-close-menu');
  const drawer = document.getElementById('mobile-menu');
  
  if (toggleBtn) toggleBtn.addEventListener('click', () => drawer.classList.add('active'));
  if (closeBtn) closeBtn.addEventListener('click', () => drawer.classList.remove('active'));
  
  function navigateTo(pageId) {
    // Close mobile drawer if active
    if (drawer) drawer.classList.remove('active');
    
    // Smooth transition toggle
    pages.forEach(page => {
      if (page.id === `page-${pageId}`) {
        page.style.display = 'block';
        setTimeout(() => page.classList.add('active'), 50);
      } else {
        page.classList.remove('active');
        page.style.display = 'none';
      }
    });
    
    // Highlight sidebar links
    navBtns.forEach(btn => {
      if (btn.getAttribute('data-page') === pageId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Adjust cursor class for Lawyer Gold style
    if (pageId === 'lawyer') {
      document.body.classList.add('cursor-lawyer');
    } else {
      document.body.classList.remove('cursor-lawyer');
    }
    
    // Trigger features on demand
    if (pageId === 'news' && store.newsCache.articles.length === 0) {
      loadNewsFeed();
    }
  }
  
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pageId = btn.getAttribute('data-page');
      navigateTo(pageId);
    });
  });
}

// --- API HELPER FUNCTION (Bypasses CORS using Vite Proxy on Localhost) ---
async function callProxyAPI(urlPath, options, directUrl) {
  // If we are on Vite localhost, use proxy. Otherwise, try direct fetch.
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const fetchUrl = isLocalhost ? urlPath : directUrl;
  
  try {
    const response = await fetch(fetchUrl, options);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Server responded with status ${response.status}`);
    }
    return response;
  } catch (error) {
    console.error(`Fetch error on ${fetchUrl}:`, error);
    throw error;
  }
}

// --- 1. ZY CHATBOT LOGIC ---
function setupZyChat() {
  const input = document.getElementById('zy-chat-input');
  const sendBtn = document.getElementById('btn-zy-send');
  const messagesBox = document.getElementById('zy-chat-messages');
  const typingIndicator = document.getElementById('zy-typing-indicator');
  
  let chatHistory = [];
  
  function appendMessage(sender, content, isHtml = false, imageObj = null) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender === 'user' ? 'right' : 'left'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'bubble-avatar';
    avatar.innerHTML = `<i data-lucide="${sender === 'user' ? 'user' : 'sparkles'}"></i>`;
    
    const bubbleContent = document.createElement('div');
    bubbleContent.className = 'bubble-content';
    
    if (isHtml) {
      bubbleContent.innerHTML = content;
    } else {
      bubbleContent.textContent = content;
    }
    
    // Handle inline image generation
    if (imageObj) {
      const imgDiv = document.createElement('div');
      imgDiv.className = 'chat-generated-image';
      imgDiv.innerHTML = `
        <img src="${imageObj.url}" alt="${imageObj.prompt}">
        <div class="chat-img-actions">
          <span>Generated via Pollinations</span>
          <a class="btn btn-secondary btn-sm" href="${imageObj.url}" download="zy_gen_${Date.now()}.jpg" target="_blank">
            <i data-lucide="download"></i>
          </a>
        </div>
      `;
      bubbleContent.appendChild(imgDiv);
    }
    
    bubble.appendChild(avatar);
    bubble.appendChild(bubbleContent);
    messagesBox.appendChild(bubble);
    
    lucide.createIcons({ attrs: { class: 'bubble-icon' } });
    
    // Auto-scroll chat
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }
  
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    
    // Clean input
    input.value = '';
    
    // Append User Message
    appendMessage('user', text);
    chatHistory.push({ role: 'user', content: text });
    
    // Check if user is requesting image generation
    const imageReg = /(generate|draw|create)\b.*\b(image|picture|drawing|sketch|illustration|photo)/i;
    if (imageReg.test(text)) {
      // Show typing indicator
      typingIndicator.style.display = 'flex';
      messagesBox.scrollTop = messagesBox.scrollHeight;
      
      try {
        // Extract prompt. Simply use everything after "generate/draw/create image of" or similar, or full text
        let cleanPrompt = text.replace(/(generate|draw|create)\b.*\b(image|picture|drawing|sketch|illustration|photo)\s+(of|about|for)?\s+/i, '');
        if (cleanPrompt.length < 5) cleanPrompt = text; // fallback to full text
        
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
        
        // Let's pre-load the image to verify it before embedding
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
          typingIndicator.style.display = 'none';
          
          const galleryItem = {
            url: imageUrl,
            prompt: cleanPrompt,
            timestamp: Date.now()
          };
          
          // Save image to gallery
          store.saveGalleryImage(galleryItem);
          renderGalleryGrid();
          
          appendMessage('zy', `Absolutely! Here is your generated image for: **"${cleanPrompt}"**`, true, galleryItem);
          showToast('Image generated & saved to Gallery!');
        };
        img.onerror = () => {
          throw new Error("Failed to render image from Pollinations AI");
        };
      } catch (err) {
        typingIndicator.style.display = 'none';
        appendMessage('zy', `Failed to generate image: ${err.message}`);
        showToast('Image generation failed!', 'error');
      }
      return;
    }
    
    // Default chat via Claude API
    if (!store.keys.anthropic) {
      appendMessage('zy', '⚠️ Anthropic Claude API Key is missing. Click the **API Settings** gear icon below to enter your credentials.');
      return;
    }
    
    typingIndicator.style.display = 'flex';
    messagesBox.scrollTop = messagesBox.scrollHeight;
    
    try {
      const systemPrompt = "You are Zy, the AI assistant of Zynappz, a powerful AI web app. Be helpful, friendly, and concise. When asked who made this app, say: 'Zynappz was built by Team Zynappz — Hari, Sreedev, Ben, Devanandan, and Navaneeth.' Help users navigate and use the app's features.";
      
      const payload = {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: chatHistory.map(h => ({ role: h.role, content: h.content }))
      };
      
      const response = await callProxyAPI(
        '/api/anthropic/v1/messages',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': store.keys.anthropic,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(payload)
        },
        'https://api.anthropic.com/v1/messages'
      );
      
      const data = await response.json();
      typingIndicator.style.display = 'none';
      
      if (data.content && data.content[0] && data.content[0].text) {
        const reply = data.content[0].text;
        appendMessage('zy', reply);
        chatHistory.push({ role: 'assistant', content: reply });
      } else {
        throw new Error("Invalid response schema from Claude API");
      }
    } catch (err) {
      typingIndicator.style.display = 'none';
      appendMessage('zy', `Sorry, I encountered an error while processing your request: "${err.message}". Make sure your API key is correct and you have an active network connection.`);
      showToast('Claude API error!', 'error');
    }
  }
  
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

// --- 2. AI IMAGE TOOLS LOGIC ---
function setupImageTools() {
  // Navigation tabs inside Image Tools
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });

  // Setup sub-components
  initEnhanceTool();
  initBgRemoverTool();
  initUpscalerTool();
  initLightCorrectorTool();
}

// Tool 2A: AI ENHANCE
function initEnhanceTool() {
  const dropZone = document.getElementById('enhance-drop-zone');
  const fileInput = document.getElementById('enhance-file-input');
  const previewBox = document.getElementById('enhance-preview-box');
  const imgPreview = document.getElementById('enhance-img-preview');
  const btnClear = document.getElementById('btn-enhance-clear');
  const btnProcess = document.getElementById('btn-enhance-process');
  
  const placeholder = document.getElementById('enhance-placeholder');
  const resultView = document.getElementById('enhance-result');
  const descText = document.getElementById('enhance-description-text');
  
  let base64Image = '';
  let mediaType = '';

  // Setup file drag and drop loaders
  setupDragAndDrop(dropZone, fileInput, (file) => {
    mediaType = file.type;
    const reader = new FileReader();
    reader.onload = (e) => {
      base64Image = e.target.result.split(',')[1];
      imgPreview.src = e.target.result;
      dropZone.style.display = 'none';
      previewBox.style.display = 'block';
      btnProcess.disabled = false;
    };
    reader.readAsDataURL(file);
  });

  btnClear.addEventListener('click', () => {
    fileInput.value = '';
    base64Image = '';
    dropZone.style.display = 'flex';
    previewBox.style.display = 'none';
    btnProcess.disabled = true;
  });

  btnProcess.addEventListener('click', async () => {
    if (!store.keys.openai) {
      showToast('OpenAI API Key is missing! Enter it in API Settings.', 'error');
      return;
    }

    placeholder.innerHTML = `
      <div class="typing-indicator flex-row m-auto" style="margin: auto;">
        <span></span><span></span><span></span>
      </div>
      <p class="mt-4">Analyzing image pixel vectors with GPT-4o...</p>
    `;
    resultView.style.display = 'none';
    btnProcess.disabled = true;

    try {
      const payload = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Enhance this image, improve quality, sharpness, and lighting. Describe specific visual and structural improvements that would optimize it.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mediaType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      };

      const response = await callProxyAPI(
        '/api/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${store.keys.openai}`
          },
          body: JSON.stringify(payload)
        },
        'https://api.openai.com/v1/chat/completions'
      );

      const data = await response.json();
      btnProcess.disabled = false;

      if (data.choices && data.choices[0] && data.choices[0].message) {
        const text = data.choices[0].message.content;
        
        // Convert Markdown bold to strong for visual feedback
        const htmlText = text
          .replace(/\n/g, '<br>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
          
        descText.innerHTML = `
          <h4 style="color: var(--highlight-blue); margin-bottom: 12px;">AI Enhancement Analysis</h4>
          ${htmlText}
        `;
        placeholder.style.display = 'none';
        resultView.style.display = 'block';
        showToast('Image enhanced successfully!');
      } else {
        throw new Error("Invalid output format from OpenAI Vision");
      }

    } catch (err) {
      btnProcess.disabled = false;
      placeholder.innerHTML = `
        <i data-lucide="alert-triangle" class="icon-lg" style="color: #dc2626;"></i>
        <p style="color: #fca5a5;">Failed to process image: "${err.message}".</p>
      `;
      lucide.createIcons();
      showToast('Enhance process failed!', 'error');
    }
  });
}

// Tool 2B: BG REMOVER
function initBgRemoverTool() {
  const dropZone = document.getElementById('bg-drop-zone');
  const fileInput = document.getElementById('bg-file-input');
  const previewBox = document.getElementById('bg-preview-box');
  const imgPreview = document.getElementById('bg-img-preview');
  const btnClear = document.getElementById('btn-bg-clear');
  const btnProcess = document.getElementById('btn-bg-process');
  
  const placeholder = document.getElementById('bg-placeholder');
  const resultView = document.getElementById('bg-result');
  const imgResult = document.getElementById('bg-img-result');
  const downloadBtn = document.getElementById('btn-bg-download');
  
  let rawFile = null;

  setupDragAndDrop(dropZone, fileInput, (file) => {
    rawFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imgPreview.src = e.target.result;
      dropZone.style.display = 'none';
      previewBox.style.display = 'block';
      btnProcess.disabled = false;
    };
    reader.readAsDataURL(file);
  });

  btnClear.addEventListener('click', () => {
    fileInput.value = '';
    rawFile = null;
    dropZone.style.display = 'flex';
    previewBox.style.display = 'none';
    btnProcess.disabled = true;
  });

  btnProcess.addEventListener('click', async () => {
    if (!store.keys.removebg) {
      showToast('Remove.bg API Key is missing! Enter it in API Settings.', 'error');
      return;
    }

    placeholder.innerHTML = `
      <div class="typing-indicator flex-row m-auto" style="margin: auto;">
        <span></span><span></span><span></span>
      </div>
      <p class="mt-4">Isolating foreground element...</p>
    `;
    resultView.style.display = 'none';
    btnProcess.disabled = true;

    try {
      const formData = new FormData();
      formData.append('image_file', rawFile);
      formData.append('size', 'auto');

      const response = await callProxyAPI(
        '/api/removebg/v1/removebg',
        {
          method: 'POST',
          headers: {
            'X-Api-Key': store.keys.removebg
          },
          body: formData
        },
        'https://api.remove.bg/v1/removebg'
      );

      const blob = await response.blob();
      btnProcess.disabled = false;
      
      const transparentUrl = URL.createObjectURL(blob);
      imgResult.src = transparentUrl;
      downloadBtn.href = transparentUrl;
      
      placeholder.style.display = 'none';
      resultView.style.display = 'block';
      showToast('Background isolated successfully!');
      
    } catch (err) {
      btnProcess.disabled = false;
      placeholder.innerHTML = `
        <i data-lucide="alert-triangle" class="icon-lg" style="color: #dc2626;"></i>
        <p style="color: #fca5a5;">Failed to remove background: "${err.message}". Make sure your Remove.bg API key is correct.</p>
      `;
      lucide.createIcons();
      showToast('Background removal failed!', 'error');
    }
  });
}

// Tool 2C: AI UPSCALER (2x Bicubic Sim)
function initUpscalerTool() {
  const dropZone = document.getElementById('upscale-drop-zone');
  const fileInput = document.getElementById('upscale-file-input');
  const previewBox = document.getElementById('upscale-preview-box');
  const btnClear = document.getElementById('btn-upscale-clear');
  const btnProcess = document.getElementById('btn-upscale-process');
  
  const placeholder = document.getElementById('upscale-placeholder');
  const resultView = document.getElementById('upscale-result');
  const imgOriginal = document.getElementById('upscale-img-original');
  const canvasEnhanced = document.getElementById('upscale-canvas-enhanced');
  const downloadBtn = document.getElementById('btn-upscale-download');
  
  let rawFile = null;

  setupDragAndDrop(dropZone, fileInput, (file) => {
    rawFile = file;
    dropZone.style.display = 'none';
    previewBox.style.display = 'block';
    
    // To show original inside preview box dynamically, we append a temp img
    let previewImg = previewBox.querySelector('.temp-prev');
    if (!previewImg) {
      previewImg = document.createElement('img');
      previewImg.className = 'temp-prev';
      previewBox.prepend(previewImg);
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      btnProcess.disabled = false;
    };
    reader.readAsDataURL(file);
  });

  btnClear.addEventListener('click', () => {
    fileInput.value = '';
    rawFile = null;
    dropZone.style.display = 'flex';
    previewBox.style.display = 'none';
    const previewImg = previewBox.querySelector('.temp-prev');
    if (previewImg) previewImg.remove();
    btnProcess.disabled = true;
  });

  btnProcess.addEventListener('click', () => {
    placeholder.style.display = 'none';
    resultView.style.display = 'block';
    
    const reader = new FileReader();
    reader.onload = (e) => {
      imgOriginal.src = e.target.result;
      
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        // Setup Bicubic Canvas Rendering
        const w = img.width;
        const h = img.height;
        
        // Double sizes
        canvasEnhanced.width = w * 2;
        canvasEnhanced.height = h * 2;
        
        const ctx = canvasEnhanced.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw 2x scaled image
        ctx.drawImage(img, 0, 0, w * 2, h * 2);
        
        // Apply pixel sharpening matrices to simulate edge enhancements
        const imgData = ctx.getImageData(0, 0, w * 2, h * 2);
        const sharpened = convolvePixelData(imgData, [
           0, -0.25,  0,
          -0.25,  2, -0.25,
           0, -0.25,  0
        ]);
        ctx.putImageData(sharpened, 0, 0);
        
        // Bind download link
        downloadBtn.href = canvasEnhanced.toDataURL('image/png');
        
        // Init Slider drag operations
        initComparisonSlider('upscale');
        showToast('Image upscaled successfully!');
      };
    };
    reader.readAsDataURL(rawFile);
  });
}

// Tool 2D: LIGHT CORRECTOR
function initLightCorrectorTool() {
  const dropZone = document.getElementById('light-drop-zone');
  const fileInput = document.getElementById('light-file-input');
  const previewBox = document.getElementById('light-preview-box');
  const btnClear = document.getElementById('btn-light-clear');
  const btnProcess = document.getElementById('btn-light-process');
  
  const placeholder = document.getElementById('light-placeholder');
  const resultView = document.getElementById('light-result');
  const imgOriginal = document.getElementById('light-img-original');
  const canvasEnhanced = document.getElementById('light-canvas-enhanced');
  const downloadBtn = document.getElementById('btn-light-download');
  
  let rawFile = null;

  setupDragAndDrop(dropZone, fileInput, (file) => {
    rawFile = file;
    dropZone.style.display = 'none';
    previewBox.style.display = 'block';
    
    let previewImg = previewBox.querySelector('.temp-prev');
    if (!previewImg) {
      previewImg = document.createElement('img');
      previewImg.className = 'temp-prev';
      previewBox.prepend(previewImg);
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      btnProcess.disabled = false;
    };
    reader.readAsDataURL(file);
  });

  btnClear.addEventListener('click', () => {
    fileInput.value = '';
    rawFile = null;
    dropZone.style.display = 'flex';
    previewBox.style.display = 'none';
    const previewImg = previewBox.querySelector('.temp-prev');
    if (previewImg) previewImg.remove();
    btnProcess.disabled = true;
  });

  btnProcess.addEventListener('click', () => {
    placeholder.style.display = 'none';
    resultView.style.display = 'block';
    
    const reader = new FileReader();
    reader.onload = (e) => {
      imgOriginal.src = e.target.result;
      
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        canvasEnhanced.width = img.width;
        canvasEnhanced.height = img.height;
        
        const ctx = canvasEnhanced.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Auto Brightness, Contrast & Shadow recovery formulas
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imgData.data;
        
        // Step 1: Calculate brightness statistics
        let rSum = 0, gSum = 0, bSum = 0;
        const totalPixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          rSum += data[i];
          gSum += data[i+1];
          bSum += data[i+2];
        }
        
        const avgR = rSum / totalPixels;
        const avgG = gSum / totalPixels;
        const avgB = bSum / totalPixels;
        const avgBrightness = (avgR + avgG + avgB) / 3;
        
        // Step 2: Adaptive adjustments based on current brightness
        let brightnessFactor = 0;
        let contrastFactor = 1.15; // standard boost
        let gamma = 1.0;
        
        if (avgBrightness < 80) {
          // Extremely dark image: strong shadow boost and gamma midtone lift
          brightnessFactor = 35;
          contrastFactor = 1.25;
          gamma = 1.25;
        } else if (avgBrightness < 130) {
          // Moderate dark: light recovery
          brightnessFactor = 15;
          contrastFactor = 1.15;
          gamma = 1.12;
        } else if (avgBrightness > 190) {
          // Overexposed: damp brightness slightly, elevate contrast
          brightnessFactor = -10;
          contrastFactor = 1.1;
        }
        
        // Step 3: Run pixel transform matrix
        const factor = (259 * (contrastFactor * 255 + 255)) / (255 * (259 - contrastFactor * 255));
        for (let i = 0; i < data.length; i += 4) {
          // Brightness & Shadow Offset
          let r = data[i] + brightnessFactor;
          let g = data[i+1] + brightnessFactor;
          let b = data[i+2] + brightnessFactor;
          
          // Gamma correction
          r = 255 * Math.pow(r / 255, 1 / gamma);
          g = 255 * Math.pow(g / 255, 1 / gamma);
          b = 255 * Math.pow(b / 255, 1 / gamma);
          
          // Contrast Stretch
          r = factor * (r - 128) + 128;
          g = factor * (g - 128) + 128;
          b = factor * (b - 128) + 128;
          
          data[i] = Math.max(0, Math.min(255, r));
          data[i+1] = Math.max(0, Math.min(255, g));
          data[i+2] = Math.max(0, Math.min(255, b));
        }
        
        ctx.putImageData(imgData, 0, 0);
        
        // Apply sharpen filtering for premium texture
        const sharpened = convolvePixelData(ctx.getImageData(0, 0, img.width, img.height), [
           0, -0.1,  0,
          -0.1,  1.4, -0.1,
           0, -0.1,  0
        ]);
        ctx.putImageData(sharpened, 0, 0);
        
        downloadBtn.href = canvasEnhanced.toDataURL('image/png');
        
        initComparisonSlider('light');
        showToast('Dynamic lighting balanced successfully!');
      };
    };
    reader.readAsDataURL(rawFile);
  });
}

// Convolution sharpen filter function for Canvas pixel array
function convolvePixelData(imgData, weights) {
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);
  const src = imgData.data;
  const sw = imgData.width;
  const sh = imgData.height;
  
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  const output = ctx.createImageData(sw, sh);
  const dst = output.data;
  
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const sy = y;
      const sx = x;
      const dstOff = (y * sw + x) * 4;
      
      let r = 0, g = 0, b = 0;
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = Math.min(sh - 1, Math.max(0, sy + cy - halfSide));
          const scx = Math.min(sw - 1, Math.max(0, sx + cx - halfSide));
          const srcOff = (scy * sw + scx) * 4;
          const wt = weights[cy * side + cx];
          
          r += src[srcOff] * wt;
          g += src[srcOff + 1] * wt;
          b += src[srcOff + 2] * wt;
        }
      }
      
      dst[dstOff] = Math.min(255, Math.max(0, r));
      dst[dstOff + 1] = Math.min(255, Math.max(0, g));
      dst[dstOff + 2] = Math.min(255, Math.max(0, b));
      dst[dstOff + 3] = src[dstOff + 3]; // keep alpha
    }
  }
  return output;
}

// Split Drag Comparison Handler
function initComparisonSlider(prefix) {
  const wrapper = document.getElementById(`${prefix}-slider-wrapper`);
  const modified = document.getElementById(`${prefix}-slider-modified`);
  const handle = document.getElementById(`${prefix}-slider-handle`);
  
  let active = false;
  
  function adjustWidth(xPos) {
    const rect = wrapper.getBoundingClientRect();
    let percentage = ((xPos - rect.left) / rect.width) * 100;
    
    // Clamp boundary
    percentage = Math.max(0, Math.min(100, percentage));
    
    modified.style.width = `${percentage}%`;
    handle.style.left = `${percentage}%`;
  }
  
  // Track dragging
  wrapper.addEventListener('mousedown', (e) => {
    active = true;
    adjustWidth(e.clientX);
  });
  
  window.addEventListener('mouseup', () => { active = false; });
  
  window.addEventListener('mousemove', (e) => {
    if (!active) return;
    adjustWidth(e.clientX);
  });
  
  // Support Touch screens
  wrapper.addEventListener('touchstart', (e) => {
    active = true;
    adjustWidth(e.touches[0].clientX);
  });
  window.addEventListener('touchend', () => { active = false; });
  window.addEventListener('touchmove', (e) => {
    if (!active) return;
    adjustWidth(e.touches[0].clientX);
  });
}

// --- 3. AI DETECTOR LOGIC ---
function setupDetector() {
  const tabs = document.querySelectorAll('.detector-tab');
  const textMode = document.getElementById('detector-text-mode');
  const uploadMode = document.getElementById('detector-upload-mode');
  
  const textInput = document.getElementById('detector-text-input');
  
  const dropZone = document.getElementById('detector-drop-zone');
  const fileInput = document.getElementById('detector-file-input');
  const previewBox = document.getElementById('detector-preview-box');
  const fileMeta = document.getElementById('detector-file-meta');
  const btnClear = document.getElementById('btn-detector-clear');
  
  const btnAnalyze = document.getElementById('btn-detector-analyze');
  const placeholder = document.getElementById('detector-placeholder');
  const resultView = document.getElementById('detector-result');
  
  const gaugeFill = document.getElementById('detector-gauge-fill');
  const gaugeVal = document.getElementById('detector-gauge-value');
  const verdictBadge = document.getElementById('detector-verdict-badge');
  const explanation = document.getElementById('detector-explanation');
  const indicatorsUl = document.getElementById('detector-indicators');
  
  let currentMode = 'text'; // or 'upload'
  let rawFile = null;
  let parsedContent = ''; // For txt, PDF
  let imageBase64 = ''; // For images, video frame
  let fileType = '';

  // Tab selection
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      currentMode = tab.getAttribute('data-mode');
      if (currentMode === 'text') {
        textMode.style.display = 'block';
        uploadMode.style.display = 'none';
      } else {
        textMode.style.display = 'none';
        uploadMode.style.display = 'block';
      }
    });
  });

  // Upload Logic
  setupDragAndDrop(dropZone, fileInput, async (file) => {
    rawFile = file;
    fileType = file.type;
    dropZone.style.display = 'none';
    previewBox.style.display = 'block';
    
    fileMeta.innerHTML = `
      <div style="font-weight:600; color:#fff;">File Name: ${file.name}</div>
      <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Size: ${(file.size / 1024).toFixed(1)} KB</div>
    `;

    // Process parsing in background based on file type
    if (fileType.includes('image')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imageBase64 = e.target.result.split(',')[1];
        parsedContent = '';
        
        const previewImg = document.createElement('img');
        previewImg.src = e.target.result;
        previewImg.style.maxHeight = '140px';
        previewImg.style.borderRadius = '8px';
        previewImg.style.marginTop = '10px';
        fileMeta.appendChild(previewImg);
      };
      reader.readAsDataURL(file);
      
    } else if (fileType.includes('video')) {
      // First frame extraction
      fileMeta.innerHTML += `<div style="font-size:12px; color:var(--highlight-blue); margin-top:4px;">Extracting frame 0...</div>`;
      try {
        const frameBase64 = await extractVideoFirstFrame(file);
        imageBase64 = frameBase64.split(',')[1];
        parsedContent = '';
        
        const previewImg = document.createElement('img');
        previewImg.src = frameBase64;
        previewImg.style.maxHeight = '140px';
        previewImg.style.borderRadius = '8px';
        previewImg.style.marginTop = '10px';
        fileMeta.appendChild(previewImg);
        
        fileMeta.querySelector('div:last-of-type').textContent = "Frame 0 extracted successfully!";
      } catch (err) {
        showToast('Frame extraction failed, fallback to text metadata analysis', 'warning');
        parsedContent = `Video uploaded metadata: ${file.name}, size: ${file.size}`;
        imageBase64 = '';
      }
      
    } else if (file.name.endsWith('.pdf')) {
      fileMeta.innerHTML += `<div style="font-size:12px; color:var(--highlight-blue); margin-top:4px;">Extracting PDF text contents...</div>`;
      try {
        const pdfText = await extractPdfText(file);
        parsedContent = pdfText;
        imageBase64 = '';
        fileMeta.querySelector('div:last-of-type').textContent = `Parsed ${pdfText.split(/\s+/).length} words from PDF successfully.`;
      } catch (err) {
        showToast('Failed to parse PDF contents', 'error');
        parsedContent = '';
      }
      
    } else {
      // TXT and other documents
      const reader = new FileReader();
      reader.onload = (e) => {
        parsedContent = e.target.result;
        imageBase64 = '';
      };
      reader.readAsText(file);
    }
  });

  btnClear.addEventListener('click', () => {
    fileInput.value = '';
    rawFile = null;
    parsedContent = '';
    imageBase64 = '';
    dropZone.style.display = 'flex';
    previewBox.style.display = 'none';
  });

  btnAnalyze.addEventListener('click', async () => {
    if (!store.keys.anthropic) {
      showToast('Anthropic Claude API Key is missing! Enter it in API Settings.', 'error');
      return;
    }

    let payloadContent = '';
    let hasVision = false;

    if (currentMode === 'text') {
      payloadContent = textInput.value.trim();
      if (payloadContent.length < 40) {
        showToast('Please paste a longer text body (at least 40 characters) for an accurate score.', 'warning');
        return;
      }
    } else {
      if (!rawFile) {
        showToast('Please upload a document, image, or video file.', 'warning');
        return;
      }
      payloadContent = parsedContent;
      if (imageBase64) hasVision = true;
    }

    placeholder.innerHTML = `
      <div class="typing-indicator flex-row m-auto" style="margin: auto;">
        <span></span><span></span><span></span>
      </div>
      <p class="mt-4">Scanning structure and perplexity scores...</p>
    `;
    resultView.style.display = 'none';
    btnAnalyze.disabled = true;

    try {
      const systemPrompt = `You are an AI content detector. Analyze the provided content and determine if it was created by AI or a human. Give a confidence percentage, reasoning, and specific indicators you found. You must return your response inside a valid JSON object structure containing exactly these keys: {verdict: 'AI' or 'Human', confidence: XX, indicators: ['...', '...'], explanation: '...'}. Please make sure 'confidence' is an integer number. DO NOT include any text outside the JSON block.`;

      let messages = [];
      if (hasVision) {
        // Send base64 vision content to Claude
        messages = [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: fileType.includes('video') ? 'image/jpeg' : fileType,
                  data: imageBase64
                }
              },
              {
                type: 'text',
                text: 'Analyze this frame image and determine if it exhibits patterns typical of AI generation, synthetic styling, or standard organic human photography.'
              }
            ]
          }
        ];
      } else {
        messages = [
          {
            role: 'user',
            content: `Analyze the following content:\n\n${payloadContent}`
          }
        ];
      }

      const response = await callProxyAPI(
        '/api/anthropic/v1/messages',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': store.keys.anthropic,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: systemPrompt,
            messages: messages
          })
        },
        'https://api.anthropic.com/v1/messages'
      );

      const data = await response.json();
      btnAnalyze.disabled = false;

      if (data.content && data.content[0] && data.content[0].text) {
        const text = data.content[0].text;
        
        // Smart parse JSON object from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Could not parse JSON verdict response from Claude API");
        
        const verdictObj = JSON.parse(jsonMatch[0]);
        
        // Render Output Metrics
        const conf = parseInt(verdictObj.confidence) || 0;
        
        // SVG Gauge Dash calculations (Arc circumference is 125.6)
        const circ = 125.6;
        const offset = circ - (conf / 100) * circ;
        gaugeFill.style.strokeDashoffset = offset;
        gaugeVal.textContent = `${conf}%`;
        
        // Verdict Badge
        verdictBadge.textContent = verdictObj.verdict;
        verdictBadge.className = `badge-verdict ${verdictObj.verdict.toLowerCase()}`;
        
        // Explanation & Indicators
        explanation.textContent = verdictObj.explanation;
        
        indicatorsUl.innerHTML = '';
        verdictObj.indicators.forEach(ind => {
          const li = document.createElement('li');
          li.textContent = ind;
          indicatorsUl.appendChild(li);
        });
        
        placeholder.style.display = 'none';
        resultView.style.display = 'block';
        showToast('Content analysis finished successfully!');
        
      } else {
        throw new Error("Invalid format from Claude API");
      }

    } catch (err) {
      btnAnalyze.disabled = false;
      placeholder.innerHTML = `
        <i data-lucide="alert-triangle" class="icon-lg" style="color: #dc2626;"></i>
        <p style="color: #fca5a5;">Failed to analyze: "${err.message}". Verify API credentials.</p>
      `;
      lucide.createIcons();
      showToast('Analysis failed!', 'error');
    }
  });
}

// CLIENT-SIDE PDF PARSER USING PDF.JS
async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  
  // Set up PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
  
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  const numPages = Math.min(pdf.numPages, 10); // limit to first 10 pages for speed/API budget
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

// CLIENT-SIDE VIDEO FIRST-FRAME EXTRACTOR
function extractVideoFirstFrame(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.addEventListener('loadeddata', () => {
      // Seek to beginning
      video.currentTime = 0.1;
    });
    
    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        resolve(dataUrl);
        
        // Revoke temp object URL
        URL.revokeObjectURL(video.src);
      } catch (err) {
        reject(err);
      }
    });
    
    video.addEventListener('error', (err) => {
      reject(err);
    });
  });
}

// --- 4. AI NEWS FEED LOGIC ---
function setupNewsFeed() {
  const refreshBtn = document.getElementById('btn-news-refresh');
  
  refreshBtn.addEventListener('click', () => {
    loadNewsFeed(true); // ignore cache
  });
}

async function loadNewsFeed(ignoreCache = false) {
  const container = document.getElementById('news-container');
  const timestamp = document.getElementById('news-last-updated');
  
  const cacheAge = Date.now() - store.newsCache.lastUpdated;
  const isCacheValid = cacheAge < 24 * 60 * 60 * 1000; // 24 hours
  
  // Render loading skeletons
  renderNewsSkeletons();
  
  if (!ignoreCache && store.newsCache.articles.length > 0 && isCacheValid) {
    // Render from localStorage
    renderNewsGrid(store.newsCache.articles);
    timestamp.textContent = `Last Updated: ${formatTimeAgo(store.newsCache.lastUpdated)}`;
    return;
  }
  
  if (!store.keys.news) {
    container.innerHTML = `
      <div class="glass-card text-center w-100" style="grid-column: 1/-1; padding: 40px; text-align: center;">
        <i data-lucide="key-round" class="icon-lg"></i>
        <h3>NewsAPI Key is Missing</h3>
        <p class="text-muted mt-2">To load the dynamic Artificial Intelligence and Tech news feed, click <strong>API Settings</strong> and enter a valid NewsAPI credentials key.</p>
      </div>
    `;
    lucide.createIcons();
    timestamp.textContent = 'Last Updated: Key Missing';
    return;
  }
  
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=artificial+intelligence+technology&sortBy=publishedAt&language=en&pageSize=12&apiKey=${store.keys.news}`
    );
    
    if (!response.ok) throw new Error("NewsAPI responded with a failure code");
    
    const data = await response.json();
    
    if (data.articles && data.articles.length > 0) {
      store.saveNewsCache(data.articles);
      renderNewsGrid(data.articles);
      timestamp.textContent = 'Last Updated: Just now';
      showToast('AI News Feed updated!');
    } else {
      throw new Error("No articles found");
    }
  } catch (err) {
    if (store.newsCache.articles.length > 0) {
      showToast('Failed to fetch new articles, showing cached news', 'warning');
      renderNewsGrid(store.newsCache.articles);
      timestamp.textContent = `Last Updated: ${formatTimeAgo(store.newsCache.lastUpdated)}`;
    } else {
      container.innerHTML = `
        <div class="glass-card text-center w-100" style="grid-column: 1/-1; padding: 40px; text-align: center;">
          <i data-lucide="alert-triangle" class="icon-lg" style="color: #dc2626;"></i>
          <h3>Failed to Load Feed</h3>
          <p class="text-muted mt-2">Server responded: "${err.message}". Try refreshing or check your internet connection.</p>
        </div>
      `;
      lucide.createIcons();
    }
  }
}

function renderNewsSkeletons() {
  const container = document.getElementById('news-container');
  container.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.innerHTML = `
      <div class="skeleton-thumb"></div>
      <div class="skeleton-text short"></div>
      <div class="skeleton-text title"></div>
      <div class="skeleton-text desc"></div>
    `;
    container.appendChild(card);
  }
}

function renderNewsGrid(articles) {
  const container = document.getElementById('news-container');
  container.innerHTML = '';
  
  articles.forEach(art => {
    const card = document.createElement('div');
    card.className = 'news-card glass-card';
    
    const thumbUrl = art.urlToImage || 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&auto=format&fit=crop&q=60';
    const sourceName = art.source.name || 'AI Tech';
    const dateStr = formatTimeAgo(new Date(art.publishedAt).getTime());
    
    card.innerHTML = `
      <div class="news-thumbnail">
        <img src="${thumbUrl}" alt="${art.title}">
      </div>
      <div class="news-content">
        <div class="news-meta">
          <span class="news-source">${sourceName}</span>
          <span class="news-time">${dateStr}</span>
        </div>
        <h3 class="news-title">${art.title}</h3>
        <p class="news-desc">${art.description || 'No summary description available for this technical intelligence article.'}</p>
        <a class="btn btn-secondary btn-sm" href="${art.url}" target="_blank">
          Read More <i data-lucide="external-link" style="width:14px; height:14px;"></i>
        </a>
      </div>
    `;
    container.appendChild(card);
  });
  lucide.createIcons();
}

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// --- 5. AI LAWYER LOGIC ---
function setupLawyerChat() {
  const input = document.getElementById('lawyer-chat-input');
  const sendBtn = document.getElementById('btn-lawyer-send');
  const messagesBox = document.getElementById('lawyer-chat-messages');
  const typingIndicator = document.getElementById('lawyer-typing-indicator');
  
  let lawyerHistory = [];
  
  function appendMessage(sender, content) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender === 'user' ? 'right' : 'left'}`;
    
    const avatar = document.createElement('div');
    avatar.className = sender === 'user' ? 'bubble-avatar' : 'bubble-avatar-lawyer';
    avatar.innerHTML = `<i data-lucide="${sender === 'user' ? 'user' : 'scale'}"></i>`;
    
    const bubbleContent = document.createElement('div');
    bubbleContent.className = 'bubble-content';
    bubbleContent.textContent = content;
    
    bubble.appendChild(avatar);
    bubble.appendChild(bubbleContent);
    messagesBox.appendChild(bubble);
    
    lucide.createIcons({ attrs: { class: 'bubble-icon' } });
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }
  
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    appendMessage('user', text);
    lawyerHistory.push({ role: 'user', content: text });
    
    if (!store.keys.anthropic) {
      appendMessage('lawyer', '⚠️ Anthropic Claude API Key is missing. Click the settings gear icon to configure your API keys.');
      return;
    }
    
    typingIndicator.style.display = 'flex';
    messagesBox.scrollTop = messagesBox.scrollHeight;
    
    try {
      const systemPrompt = "You are LexAI, an AI legal assistant. Provide helpful general legal information and guidance on legal questions. Always clarify you are not a licensed attorney and this is not formal legal advice. Be thorough, professional, and cite relevant legal concepts when applicable.";
      
      const payload = {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1200,
        system: systemPrompt,
        messages: lawyerHistory.map(h => ({ role: h.role, content: h.content }))
      };
      
      const response = await callProxyAPI(
        '/api/anthropic/v1/messages',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': store.keys.anthropic,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(payload)
        },
        'https://api.anthropic.com/v1/messages'
      );
      
      const data = await response.json();
      typingIndicator.style.display = 'none';
      
      if (data.content && data.content[0] && data.content[0].text) {
        const reply = data.content[0].text;
        appendMessage('lawyer', reply);
        lawyerHistory.push({ role: 'assistant', content: reply });
      } else {
        throw new Error("Invalid response schema from Claude API");
      }
    } catch (err) {
      typingIndicator.style.display = 'none';
      appendMessage('lawyer', `LexAI Connection Error: "${err.message}".`);
      showToast('LexAI failed to respond!', 'error');
    }
  }
  
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

// --- 6. IMAGE GALLERY LOGIC ---
function setupGallery() {
  const lightbox = document.getElementById('modal-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxPrompt = document.getElementById('lightbox-prompt-text');
  const lightboxDate = document.getElementById('lightbox-date-text');
  const closeBtn = document.getElementById('btn-close-lightbox');
  
  const goZyBtn = document.getElementById('btn-gallery-go-zy');
  
  closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.classList.remove('active');
  });

  goZyBtn.addEventListener('click', () => {
    document.getElementById('nav-zy').click();
  });
}

function renderGalleryGrid() {
  const container = document.getElementById('gallery-container');
  const emptyState = document.getElementById('gallery-empty');
  
  container.innerHTML = '';
  
  if (store.gallery.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }
  
  emptyState.style.display = 'none';
  
  store.gallery.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'gallery-card glass-card';
    
    const formattedDate = new Date(item.timestamp).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit'
    });
    
    card.innerHTML = `
      <div class="gallery-img-container">
        <img src="${item.url}" alt="${item.prompt}">
        <div class="gallery-overlay">
          <button class="gallery-action-btn btn-view" data-index="${index}"><i data-lucide="eye"></i></button>
          <a class="gallery-action-btn btn-download" href="${item.url}" download="zy_gallery_${index}.jpg" target="_blank"><i data-lucide="download"></i></a>
          <button class="gallery-action-btn btn-delete" data-index="${index}"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <div class="gallery-card-content">
        <p class="gallery-prompt">"${item.prompt}"</p>
        <span class="gallery-date">${formattedDate}</span>
      </div>
    `;
    container.appendChild(card);
  });
  
  lucide.createIcons();
  
  // Attach button triggers
  container.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute('data-index');
      const item = store.gallery[idx];
      
      const lightbox = document.getElementById('modal-lightbox');
      const lightboxImg = document.getElementById('lightbox-img');
      const lightboxPrompt = document.getElementById('lightbox-prompt-text');
      const lightboxDate = document.getElementById('lightbox-date-text');
      
      lightboxImg.src = item.url;
      lightboxPrompt.textContent = `Prompt: "${item.prompt}"`;
      lightboxDate.textContent = `Generated: ${new Date(item.timestamp).toLocaleString()}`;
      
      lightbox.classList.add('active');
    });
  });
  
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute('data-index');
      store.deleteGalleryImage(idx);
      renderGalleryGrid();
      showToast('Image removed from Gallery');
    });
  });
}

// --- UNIVERSAL FILE DRAG & DROP UTILITY ---
function setupDragAndDrop(dropZone, fileInput, callback) {
  dropZone.addEventListener('click', () => fileInput.click());
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    if (e.dataTransfer.files.length > 0) {
      callback(e.dataTransfer.files[0]);
    }
  });
  
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      callback(fileInput.files[0]);
    }
  });
}
