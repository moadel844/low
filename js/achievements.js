const ROLE_LABELS = { admin: 'مدير', lawyer: 'محامي', secretary: 'سكرتارية' };
let me = null, allActivities = [], allProfiles = [];
let currentFilter = 'today';
const $ = (id) => document.getElementById(id);

function goToLogin() { location.replace('login.html'); }

let toastTimer; 
function flash(text, ok = true) { 
  const t = $('toast'); t.textContent = text; t.className = 'alert toast ' + (ok ? 'ok' : ''); t.hidden = false; 
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 5000); 
}

async function loadData() {
  const { data: profiles } = await sb.from('profiles').select('id, full_name');
  allProfiles = profiles || [];

  const [
    { data: cases }, { data: clients }, { data: sessions }, 
    { data: docs }, { data: payrolls }, { data: profilesData }, { data: events }
  ] = await Promise.all([
    sb.from('cases').select('id, case_number, created_at, responsible_lawyer_id').order('created_at', { ascending: false }).limit(100),
    sb.from('clients').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(100),
    sb.from('case_sessions').select('id, session_date, created_at, case_id, cases(case_number)').order('created_at', { ascending: false }).limit(100),
    sb.from('documents').select('id, title, created_at, case_id, cases(case_number)').order('created_at', { ascending: false }).limit(100),
    sb.from('payrolls').select('id, created_at, profiles(full_name)').order('created_at', { ascending: false }).limit(100),
    sb.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(100),
    sb.from('custom_events').select('id, title, created_at').order('created_at', { ascending: false }).limit(100)
  ]);

  allActivities = [];

  (cases || []).forEach(c => {
    const user = allProfiles.find(p => p.id === c.responsible_lawyer_id);
    allActivities.push({
      date: c.created_at,
      user: user ? user.full_name : 'غير محدد',
      userId: c.responsible_lawyer_id,
      action: 'إضافة قضية ⚖️',
      details: `قضية رقم ${c.case_number}`,
      color: 'action-insert'
    });
  });

  (clients || []).forEach(c => {
    allActivities.push({
      date: c.created_at,
      user: 'المكتب', userId: null,
      action: 'إضافة موكل 👤',
      details: `الموكل: ${c.full_name}`,
      color: 'action-insert'
    });
  });

  (sessions || []).forEach(s => {
    allActivities.push({
      date: s.created_at,
      user: 'المحامي', userId: null,
      action: 'تسجيل جلسة 📝',
      details: `جلسة في القضية رقم ${s.cases?.case_number || ''}`,
      color: 'action-update'
    });
  });

  (docs || []).forEach(d => {
    allActivities.push({
      date: d.created_at,
      user: 'المحامي', userId: null,
      action: 'رفع مستند 📁',
      details: `مستند: ${d.title} (قضية ${d.cases?.case_number || ''})`,
      color: 'action-insert'
    });
  });

  (payrolls || []).forEach(p => {
    allActivities.push({
      date: p.created_at,
      user: 'المدير', userId: null,
      action: 'إضافة راتب 💰',
      details: `راتب للموظف: ${p.profiles?.full_name || ''}`,
      color: 'action-insert'
    });
  });

  (profilesData || []).forEach(p => {
    allActivities.push({
      date: p.created_at,
      user: 'المدير', userId: null,
      action: 'إضافة مستخدم 👥',
      details: `المستخدم: ${p.full_name}`,
      color: 'action-insert'
    });
  });

  (events || []).forEach(e => {
    allActivities.push({
      date: e.created_at,
      user: 'المستخدم', userId: null,
      action: 'إضافة ميعاد 📅',
      details: `الميعاد: ${e.title}`,
      color: 'action-insert'
    });
  });

  allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
  renderTable();
}

window.filterByDate = (type, btn) => {
  currentFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTable();
};

function isDateInRange(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  
  if (currentFilter === 'today') return d.toDateString() === now.toDateString();
  if (currentFilter === 'week') return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) && d <= now;
  if (currentFilter === 'month') return d >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) && d <= now;
  return true;
}

function renderTable() {
  const tbody = $('achievements-list'); if (!tbody) return; tbody.innerHTML = '';
  const filtered = allActivities.filter(act => isDateInRange(act.date));

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;" class="muted">لا يوجد إنجازات مسجلة في هذه الفترة.</td></tr>';
    return;
  }

  filtered.forEach(log => {
    const dateObj = new Date(log.date);
    const dateStr = dateObj.toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' });

    const userDisplay = log.userId 
      ? `<a href="employee.html?id=${log.userId}" style="color: var(--indigo); font-weight: bold; text-decoration: none;">${log.user}</a>`
      : `<strong>${log.user}</strong>`;

    tbody.innerHTML += `
      <tr>
        <td style="white-space: nowrap; font-size: 0.85rem; color: var(--ink-soft);">${dateStr}<br>${timeStr}</td>
        <td>${userDisplay}</td>
        <td><span class="action-badge ${log.color}">${log.action}</span></td>
        <td>${log.details}</td>
      </tr>
    `;
  });
}

async function init() {
  const { data: { session } } = await sb.auth.getSession(); if (!session) return goToLogin();
  const { data: profile, error } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle(); 
  if (error || !profile || !profile.is_active) { await sb.auth.signOut(); return goToLogin(); }
  if (profile.role !== 'admin') { location.replace('index.html'); return; }
  
  me = profile; 
  $('user-name').textContent = profile.full_name || session.user.email; 
  $('user-avatar').textContent = (document.getElementById('user-name').textContent || '?').trim().charAt(0); 
  $('user-role').textContent = ROLE_LABELS[profile.role];
  
  await loadData(); 
  $('app').hidden = false;
}

$('logout-btn').addEventListener('click', async () => { await sb.auth.signOut(); goToLogin(); });
init();