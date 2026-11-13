const ROLE_LABELS = { admin: 'مدير', lawyer: 'محامي', secretary: 'سكرتارية' };
const DOC_TYPES = { poa: 'سكان توكيل', id_copy: 'بطاقة موكل', memo: 'مذكرة / عريضة', judgment: 'حكم / قرار', evidence: 'مستند إثبات', notice: 'إعلان', other: 'أخرى' };
let me = null, searchTimer;
const $ = (id) => document.getElementById(id);
const isAdmin = () => me && me.role === 'admin';
function goToLogin() { location.replace('login.html'); }
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
const fmtSize = (b) => b ? (b >= 1048576 ? (b / 1048576).toFixed(1) + ' ميجا' : Math.max(1, Math.round(b / 1024)) + ' كيلو') : '-';

async function loadDocuments() {
  const term = $('search').value.trim(), type = $('filter-type').value;
  let q = sb.from('documents').select(`id, title, file_path, file_name, mime_type, size_bytes, doc_type, created_at, clients!client_id(full_name), cases!case_id(case_number, case_year)`).order('created_at', { ascending: false }).limit(100);
  if (term) q = q.ilike('title', `%${term}%`); if (type) q = q.eq('doc_type', type);
  const { data, error } = await q; const container = $('documents-list'); container.replaceChildren();
  if (error) { container.innerHTML = '<div class="alert">تعذر تحميل المستندات.</div>'; return; }
  if (!data || !data.length) { container.innerHTML = '<div class="empty">مفيش مستندات مطابقة للبحث.</div>'; return; }
  data.forEach(d => {
    let context = ''; if (d.cases) context = `قضية ${d.cases.case_number} / ${d.cases.case_year}`; else if (d.clients) context = d.clients.full_name;
    container.append(el('div', { class: 'doc-card' }, el('div', { class: 'doc-info' }, el('div', { class: 'doc-icon' }, el('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, el('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }), el('path', { d: 'M14 2v6h6M16 13H8M16 17H8M10 9H8' }))), el('div', { class: 'doc-details' }, el('h4', { text: d.title }), el('p', { text: `${DOC_TYPES[d.doc_type] || d.doc_type} ${context ? '| ' + context : ''}` }), el('div', { class: 'doc-meta' }, el('span', {}, `التاريخ: ${fmtDate(d.created_at)}`), el('span', {}, `الحجم: ${fmtSize(d.size_bytes)}`)))), el('div', { class: 'doc-actions' }, el('button', { type: 'button', class: 'btn inline', onclick: () => openDoc(d.file_path) }, 'فتح المستند'))));
  });
}

async function openDoc(path) { const w = window.open('about:blank', '_blank'); const { data, error } = await sb.storage.from('law-docs').createSignedUrl(path, 120); if (error || !data) { if (w) w.close(); flash('تعذّر فتح الملف.', false); return; } if (w) w.location.href = data.signedUrl; else location.href = data.signedUrl; }
function el(tag, props = {}, ...kids) { const n = document.createElement(tag); for (const [k, v] of Object.entries(props)) { if (v === undefined || v === null) continue; if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v); } kids.flat().filter(Boolean).forEach((c) => n.append(c)); return n; }
function flash(text, ok = true) { const t = $('toast'); t.textContent = text; t.className = 'alert toast' + (ok ? ' ok' : ''); t.hidden = false; setTimeout(() => { t.hidden = true; }, 5000); }

$('search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadDocuments, 300); });
$('filter-type').addEventListener('change', loadDocuments);

async function init() {
  const { data: { session } } = await sb.auth.getSession(); if (!session) return goToLogin();
  const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle(); if (!profile || !profile.is_active) { await sb.auth.signOut(); return goToLogin(); }
  me = profile; $('user-name').textContent = profile.full_name; $('user-avatar').textContent = profile.full_name.charAt(0); $('user-role').textContent = ROLE_LABELS[profile.role] || profile.role; if (isAdmin()) $('admin-link').hidden = false;
  await loadDocuments(); $('app').hidden = false;
}
$('logout-btn').addEventListener('click', async () => { await sb.auth.signOut(); goToLogin(); });
init();