/* =====================================================
   PORTAFOLIO DIGITAL — app.js
   Arquitectura de Software · Aliaga Llocclla Hector
   ===================================================== */

// ── SUPABASE CONFIG ──────────────────────────────────
const SUPABASE_URL  = 'https://orteprlqntalzlinziqp.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydGVwcmxxbnRhbHpsaW56aXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NjYxNDcsImV4cCI6MjA5MzM0MjE0N30.CVOm_D5vzq0YuQbMPu-_0-giMJS09Xer1vNEBGmn-YA';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── ADMIN CREDENTIALS (puedes cambiarlas) ────────────
const ADMIN_USER = 'hector';
const ADMIN_PASS = 'arquitectura2024';

// ── STATE ────────────────────────────────────────────
let isAdmin       = false;
let currentUnit   = 1;
let currentWeek   = null;
let selectedFile  = null;
let allFiles      = [];

// ── UNIT DATA ────────────────────────────────────────
const units = {
  1: {
    label:   'Unidad 1',
    title:   'Fundamentos de Arquitectura',
    desc:    'Introducción a conceptos base: estilos arquitectónicos, atributos de calidad y vistas del sistema.',
    weeks:   [1, 2, 3, 4],
    weekNames: {
      1: 'Introducción y Conceptos',
      2: 'Estilos Arquitectónicos',
      3: 'Atributos de Calidad',
      4: 'Vistas y Perspectivas'
    }
  },
  2: {
    label:   'Unidad 2',
    title:   'Diseño Arquitectónico',
    desc:    'Metodologías de diseño, diagramas UML, C4 Model y documentación arquitectónica.',
    weeks:   [5, 6, 7, 8],
    weekNames: {
      5: 'Metodologías de Diseño',
      6: 'Diagramas UML',
      7: 'C4 Model',
      8: 'Documentación'
    }
  },
  3: {
    label:   'Unidad 3',
    title:   'Patrones y Tácticas',
    desc:    'Patrones arquitectónicos (MVC, MVVM, microservicios, etc.), tácticas y decisiones de diseño.',
    weeks:   [9, 10, 11, 12],
    weekNames: {
      9:  'Patrones Estructurales',
      10: 'Microservicios',
      11: 'Tácticas Arquitectónicas',
      12: 'Decisiones de Diseño'
    }
  },
  4: {
    label:   'Unidad 4',
    title:   'Evaluación y Entrega',
    desc:    'Evaluación de arquitecturas, ATAM, revisión final y presentación del proyecto integrador.',
    weeks:   [13, 14, 15, 16],
    weekNames: {
      13: 'Evaluación con ATAM',
      14: 'Revisión Arquitectónica',
      15: 'Proyecto Integrador',
      16: 'Presentación Final'
    }
  }
};

// ── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setupDropZone();
  await loadAllFiles();
  renderUnit(1);
});

// ── LOAD ALL FILES ───────────────────────────────────
async function loadAllFiles() {
  try {
    const { data, error } = await db
      .from('portfolio_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Si la tabla no existe aún, continua sin archivos
      console.warn('Supabase:', error.message);
      allFiles = [];
    } else {
      allFiles = data || [];
    }
    updateTotalFiles();
  } catch (e) {
    console.warn('Error cargando archivos:', e);
    allFiles = [];
  }
}

function updateTotalFiles() {
  document.getElementById('totalFiles').textContent = allFiles.length;
}

// ── UNIT / WEEK RENDER ───────────────────────────────
function switchUnit(unitNum) {
  currentUnit = unitNum;

  // Update tabs
  document.querySelectorAll('.unit-tab').forEach(t => {
    t.classList.toggle('active', parseInt(t.dataset.unit) === unitNum);
  });

  renderUnit(unitNum);
}

function renderUnit(unitNum) {
  const u = units[unitNum];

  document.getElementById('unitLabel').textContent   = u.label;
  document.getElementById('unitTitle').textContent   = u.title;
  document.getElementById('unitDesc').textContent    = u.desc;
  document.getElementById('unitWeeksCount').textContent =
    `Semanas ${u.weeks[0]}–${u.weeks[u.weeks.length - 1]}`;

  const grid = document.getElementById('weeksGrid');
  grid.innerHTML = '';

  u.weeks.forEach((weekNum, i) => {
    const card = buildWeekCard(weekNum, u.weekNames[weekNum], i);
    grid.appendChild(card);
  });
}

function buildWeekCard(weekNum, weekName, delay) {
  const card = document.createElement('div');
  card.className = 'week-card';
  card.style.animationDelay = `${delay * 0.08}s`;

  const weekFiles = allFiles.filter(f => f.week_number === weekNum);

  const filesHtml = weekFiles.length === 0
    ? `<div class="no-files">Sin archivos aún</div>`
    : weekFiles.map(f => buildFileItemHtml(f)).join('');

  const uploadBtn = isAdmin
    ? `<button class="btn-upload" onclick="openUploadModal(${weekNum})">
         <i class="fa fa-plus"></i> Subir
       </button>`
    : '';

  card.innerHTML = `
    <div class="week-num">Semana ${weekNum}</div>
    <div class="week-title">${weekName}</div>
    <div class="week-files" id="files-week-${weekNum}">${filesHtml}</div>
    <div class="week-footer">
      <span class="week-file-count">${weekFiles.length} archivo${weekFiles.length !== 1 ? 's' : ''}</span>
      ${uploadBtn}
    </div>
  `;

  return card;
}

function buildFileItemHtml(file) {
  const ext = file.file_type || '';
  const isPdf = ext === 'pdf';
  const iconClass = isPdf ? 'pdf' : 'img';
  const iconName  = isPdf ? 'fa-file-pdf' : 'fa-file-image';

  const date = new Date(file.created_at).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  const deleteBtn = isAdmin
    ? `<button class="file-action-btn del" title="Eliminar" onclick="deleteFile(event,'${file.id}','${file.storage_path}')">
         <i class="fa fa-trash"></i>
       </button>`
    : '';

  return `
    <div class="file-item" onclick="viewFile('${file.id}')">
      <i class="fa ${iconName} file-icon ${iconClass}"></i>
      <div class="file-info">
        <span class="file-name">${escHtml(file.title)}</span>
        <span class="file-meta">${ext.toUpperCase()} · ${date}</span>
      </div>
      <div class="file-actions" onclick="event.stopPropagation()">
        ${deleteBtn}
      </div>
    </div>
  `;
}

// ── VIEW FILE ────────────────────────────────────────
async function viewFile(fileId) {
  const file = allFiles.find(f => f.id === fileId);
  if (!file) return;

  // Get public URL
  const { data } = db.storage.from('portfolio_files').getPublicUrl(file.storage_path);
  const url = data.publicUrl;

  const isPdf = file.file_type === 'pdf';
  const preview = isPdf
    ? `<iframe src="${url}" title="${escHtml(file.title)}"></iframe>`
    : `<img src="${url}" alt="${escHtml(file.title)}"/>`;

  const desc = file.description
    ? `<p style="color:var(--text2);font-size:.88rem;margin:0.6rem 0 1rem">${escHtml(file.description)}</p>`
    : '';

  document.getElementById('viewContent').innerHTML = `
    <div class="view-file-header">
      <h2 class="view-file-title">${escHtml(file.title)}</h2>
      ${desc}
      <div class="view-file-meta">
        Semana ${file.week_number} · ${file.file_type.toUpperCase()} ·
        ${new Date(file.created_at).toLocaleDateString('es-PE')}
      </div>
    </div>
    <div class="view-file-body">${preview}</div>
    <a href="${url}" target="_blank" download class="view-file-download">
      <i class="fa fa-download"></i> Descargar
    </a>
  `;

  document.getElementById('viewModal').classList.remove('hidden');
}

function closeViewModal() {
  document.getElementById('viewModal').classList.add('hidden');
}

// ── LOGIN ────────────────────────────────────────────
function openLoginModal() {
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').classList.add('hidden');
  document.getElementById('loginModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('loginUser').focus(), 100);
}

document.getElementById('closeLogin').onclick = () => {
  document.getElementById('loginModal').classList.add('hidden');
};

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('uploadModal').classList.add('hidden');
    document.getElementById('viewModal').classList.add('hidden');
  }
  if (e.key === 'Enter' && !document.getElementById('loginModal').classList.contains('hidden')) {
    handleLogin();
  }
});

function handleLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  const btn   = document.getElementById('btnLogin');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    isAdmin = true;
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('adminBtn').classList.add('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    showToast('¡Bienvenido, Administrador!', 'success');
    renderUnit(currentUnit);
  } else {
    errEl.classList.remove('hidden');
    btn.style.animation = 'shake 0.4s ease';
    setTimeout(() => btn.style.animation = '', 400);
  }
}

function logout() {
  isAdmin = false;
  document.getElementById('adminBtn').classList.remove('hidden');
  document.getElementById('logoutBtn').classList.add('hidden');
  showToast('Sesión cerrada', 'info');
  renderUnit(currentUnit);
}

function togglePass() {
  const inp = document.getElementById('loginPass');
  const ico = document.getElementById('eyeIcon');
  if (inp.type === 'password') {
    inp.type = 'text';
    ico.className = 'fa fa-eye-slash';
  } else {
    inp.type = 'password';
    ico.className = 'fa fa-eye';
  }
}

// ── UPLOAD MODAL ─────────────────────────────────────
function openUploadModal(weekNum) {
  if (!isAdmin) return;
  currentWeek = weekNum;
  selectedFile = null;

  document.getElementById('fileTitle').value = '';
  document.getElementById('fileDesc').value  = '';
  document.getElementById('fileInput').value = '';
  document.getElementById('filePreview').classList.add('hidden');
  document.getElementById('filePreview').innerHTML = '';
  document.getElementById('uploadProgress').classList.add('hidden');
  document.getElementById('uploadError').classList.add('hidden');

  const unitForWeek = Object.values(units).find(u => u.weeks.includes(weekNum));
  document.getElementById('uploadSubtitle').textContent =
    `Semana ${weekNum} · ${unitForWeek ? unitForWeek.label : ''}`;

  document.getElementById('uploadModal').classList.remove('hidden');
}

function closeUploadModal() {
  document.getElementById('uploadModal').classList.add('hidden');
}

// ── DROP ZONE ────────────────────────────────────────
function setupDropZone() {
  const zone  = document.getElementById('dropZone');
  const input = document.getElementById('fileInput');

  zone.addEventListener('click', () => input.click());

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  });

  input.addEventListener('change', () => {
    if (input.files[0]) handleFileSelect(input.files[0]);
  });
}

function handleFileSelect(file) {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (!allowed.includes(file.type)) {
    showToast('Solo se permiten PDF, JPG y PNG', 'error');
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    showToast('El archivo supera los 20MB', 'error');
    return;
  }
  selectedFile = file;

  const ext  = file.name.split('.').pop().toLowerCase();
  const icon = ext === 'pdf' ? 'fa-file-pdf' : 'fa-file-image';
  const size = (file.size / 1024).toFixed(1) + ' KB';
  const prev = document.getElementById('filePreview');
  prev.innerHTML = `<i class="fa ${icon}"></i> ${escHtml(file.name)} <span style="color:var(--text3);font-size:.72rem">(${size})</span>`;
  prev.classList.remove('hidden');
}

// ── UPLOAD FILE ──────────────────────────────────────
async function uploadFile() {
  if (!isAdmin || !currentWeek) return;

  const title = document.getElementById('fileTitle').value.trim();
  const desc  = document.getElementById('fileDesc').value.trim();
  const errEl = document.getElementById('uploadError');
  const prog  = document.getElementById('uploadProgress');
  const btn   = document.getElementById('btnUpload');

  errEl.classList.add('hidden');

  if (!title) { showUploadError('El título es requerido.'); return; }
  if (!selectedFile) { showUploadError('Selecciona un archivo.'); return; }

  const ext  = selectedFile.name.split('.').pop().toLowerCase();
  const path = `semana-${currentWeek}/${Date.now()}-${sanitizeName(selectedFile.name)}`;

  btn.disabled = true;
  prog.classList.remove('hidden');
  animateProgress(0, 50, 600);

  try {
    // Upload to Supabase Storage
    const { error: storageErr } = await db.storage
      .from('portfolio_files')
      .upload(path, selectedFile, { contentType: selectedFile.type, upsert: false });

    if (storageErr) throw storageErr;

    animateProgress(50, 85, 400);

    // Insert record in DB
    const { error: dbErr } = await db
      .from('portfolio_files')
      .insert({
        title,
        description: desc || null,
        file_type:   ext,
        storage_path: path,
        week_number: currentWeek
      });

    if (dbErr) throw dbErr;

    animateProgress(85, 100, 300);

    setTimeout(async () => {
      prog.classList.add('hidden');
      btn.disabled = false;
      closeUploadModal();
      await loadAllFiles();
      renderUnit(currentUnit);
      showToast('¡Archivo subido exitosamente!', 'success');
    }, 400);

  } catch (err) {
    prog.classList.add('hidden');
    btn.disabled = false;
    showUploadError(err.message || 'Error al subir el archivo.');
    console.error(err);
  }
}

function animateProgress(from, to, duration) {
  const fill = document.getElementById('progressFill');
  const text = document.getElementById('progressText');
  const steps = 20;
  const inc = (to - from) / steps;
  let current = from;
  let i = 0;
  const interval = setInterval(() => {
    current += inc;
    fill.style.width = current + '%';
    text.textContent = `Subiendo... ${Math.round(current)}%`;
    i++;
    if (i >= steps) clearInterval(interval);
  }, duration / steps);
}

// ── DELETE FILE ──────────────────────────────────────
async function deleteFile(event, fileId, storagePath) {
  event.stopPropagation();
  if (!isAdmin) return;
  if (!confirm('¿Eliminar este archivo?')) return;

  try {
    // Delete from storage
    const { error: storageErr } = await db.storage
      .from('portfolio_files')
      .remove([storagePath]);

    if (storageErr) console.warn('Storage delete:', storageErr.message);

    // Delete from DB
    const { error: dbErr } = await db
      .from('portfolio_files')
      .delete()
      .eq('id', fileId);

    if (dbErr) throw dbErr;

    await loadAllFiles();
    renderUnit(currentUnit);
    showToast('Archivo eliminado', 'info');
  } catch (err) {
    showToast('Error al eliminar: ' + err.message, 'error');
    console.error(err);
  }
}

// ── SCROLL TO CONTENT ────────────────────────────────
function scrollToContent() {
  document.getElementById('main-content').scrollIntoView({ behavior: 'smooth' });
}

// ── TOAST ─────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa ${icons[type]}"></i> ${escHtml(msg)}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

// ── HELPERS ──────────────────────────────────────────
function showUploadError(msg) {
  const el = document.getElementById('uploadError');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// ── SHAKE ANIMATION ───────────────────────────────────
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-6px)}
    40%{transform:translateX(6px)}
    60%{transform:translateX(-4px)}
    80%{transform:translateX(4px)}
  }
`;
document.head.appendChild(shakeStyle);
