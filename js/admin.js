const ROLE_LABELS = { admin: 'مدير', lawyer: 'محامي', secretary: 'سكرتارية' };
const ACTION_LABELS = { INSERT: 'إضافة', UPDATE: 'تعديل', DELETE: 'حذف' };
const TABLE_LABELS = { clients: 'موكل', powers_of_attorney: 'توكيل', cases: 'قضية', documents: 'مستند', profiles: 'مستخدم' };
let me = null, profiles = [], depts = [], links = [], editRequests = [];
let createChecks = [], editChecks = [];
const $ = (id) => document.getElementById(id);

function el(tag, props = {}, ...kids) { 
  const n = document.createElement(tag); 
  for (const [k, v] of Object.entries(props)) { 
    if (v === undefined || v === null || v === false && !['checked', 'disabled', 'selected'].includes(k)) continue; 
    if (k === 'class') n.className = v; 
    else if (k === 'text') n.textContent = v; 
    else if (['checked', 'disabled', 'selected', 'value'].includes(k)) n[k] = v; 
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); 
    else n.setAttribute(k, v === true ? '' : v); 
  } 
  kids.flat().forEach((c) => n.append(c)); 
  return n; 
}

let toastTimer; 
function flash(text, ok = true) { 
  const t = $('toast'); 
  t.textContent = text; 
  t.className = 'alert ' + (ok ? 'ok' : ''); 
  t.hidden = false; 
  clearTimeout(toastTimer); 
  toastTimer = setTimeout(() => { t.hidden = true; }, 6000); 
}

function goTo(page) { location.replace(page); }
async function fnError(error) { try { const body = await error.context.json(); if (body && body.error) return body.error; } catch (_) { } return error.message || 'تعذّر تنفيذ العملية.'; }

async function loadAll() {
  const [p, d, l, r] = await Promise.all([
    sb.from('profiles').select('*').order('created_at'), 
    sb.from('departments').select('id, name').order('name'), 
    sb.from('profile_departments').select('profile_id, department_id'),
    sb.from('edit_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false })
  ]);
  
  if (p.error) { console.error('Profiles Error:', p.error); flash('خطأ في جدول المستخدمين: ' + p.error.message, false); return false; }
  if (d.error) { console.error('Depts Error:', d.error); flash('خطأ في جدول الأقسام: ' + d.error.message, false); return false; }
  if (l.error) { console.error('Links Error:', l.error); flash('خطأ في جدول الربط: ' + l.error.message, false); return false; }
  if (r.error) { console.error('Requests Error:', r.error); flash('خطأ في جدول الطلبات: ' + r.error.message, false); return false; }
  
  profiles = p.data || []; 
  depts = d.data || []; 
  links = l.data || []; 
  editRequests = r.data || []; 
  return true;
}

function deptChecks(selectedSet) { 
  return depts.map((d) => { 
    const cb = el('input', { type: 'checkbox', checked: selectedSet.has(d.id) }); 
    cb.dataset.id = d.id; 
    return { cb, node: el('label', { class: 'chk' }, cb, d.name) }; 
  }); 
}

window.generateUsername = (inputId) => {
  const input = document.getElementById(inputId);
  let base = input.value.trim().replace(/[0-9]+$/, '');
  if (!base) base = 'mstshar';

  let maxNum = 0;
  profiles.forEach(p => {
    if (p.username && p.username.startsWith(base)) {
      const suffix = p.username.substring(base.length);
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });

  const newUsername = base + (maxNum + 1);
  input.value = newUsername;

  if (inputId === 'c-username') {
    const emailInput = document.getElementById('c-email');
    if (emailInput) emailInput.value = `${newUsername}@user.com`;
  } else if (inputId === 'edit-username') {
    const emailInput = document.getElementById('edit-email');
    if (emailInput) emailInput.value = `${newUsername}@user.com`;
  }
};

document.getElementById('c-username')?.addEventListener('input', (e) => {
  document.getElementById('c-email').value = e.target.value ? `${e.target.value}@user.com` : '';
});
document.getElementById('edit-username')?.addEventListener('input', (e) => {
  document.getElementById('edit-email').value = e.target.value ? `${e.target.value}@user.com` : '';
});

function userCard(p) {
  const isMe = p.id === me.id;
  const head = el('h3', { text: p.full_name || 'بدون اسم', style: 'margin-bottom: 1rem; display:flex; align-items:center; gap:0.5rem; color: var(--primary);' });
  if (isMe) head.append(el('span', { class: 'tag', text: 'حسابك' }));
  if (!p.is_active) head.append(el('span', { class: 'tag warn', text: 'بانتظار التفعيل' }));

  const mine = links.filter(l => l.profile_id === p.id).map(l => depts.find(d => d.id === l.department_id)?.name).filter(Boolean);
  const deptsStr = mine.length ? mine.join(', ') : 'لا يوجد أقسام';

  return el('div', { class: 'card' + (p.is_active ? '' : ' pending') },
    head,
    el('div', { class: 'kv-grid', style: 'margin-bottom:1rem' },
      el('div', {}, el('strong', {text:'اليوزر نيم'}), el('span', {dir:'ltr', text: p.username || '-'})),
      el('div', {}, el('strong', {text:'الإيميل'}), el('span', {dir:'ltr', text: p.email || '-'})),
      el('div', {}, el('strong', {text:'الموبايل'}), el('span', {dir:'ltr', text: p.phone || '-'})),
      el('div', {}, el('strong', {text:'الدور'}), el('span', {text: ROLE_LABELS[p.role] || p.role})),
      el('div', {style:'grid-column: 1 / -1;'}, el('strong', {text:'الأقسام'}), el('span', {text: deptsStr}))
    ),
    el('div', { class: 'row', style: 'justify-content: flex-end; border-top: 1px solid var(--line); padding-top: 1rem;' },
      el('button', { type: 'button', class: 'btn inline', text: 'تعديل البيانات ⚙️', onclick: () => openEditModal(p) })
    )
  );
}

window.openEditModal = (p) => {
  document.getElementById('edit-user-id').value = p.id;
  document.getElementById('edit-name').value = p.full_name || '';
  document.getElementById('edit-username').value = p.username || '';
  document.getElementById('edit-email').value = p.email || '';
  document.getElementById('edit-phone').value = p.phone || '';
  document.getElementById('edit-password').value = '';
  document.getElementById('edit-active').checked = p.is_active;

  const roleSel = document.getElementById('edit-role');
  roleSel.innerHTML = '';
  Object.entries(ROLE_LABELS).forEach(([v, label]) => { roleSel.append(new Option(label, v)); });
  roleSel.value = p.role;

  const mine = new Set(links.filter(l => l.profile_id === p.id).map(l => l.department_id));
  editChecks = deptChecks(mine);
  document.getElementById('edit-depts').replaceChildren(...editChecks.map(c => c.node));

  document.getElementById('edit-error').hidden = true;
  document.getElementById('edit-user-dialog').showModal();
};

$('edit-user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('edit-save-btn');
  const id = $('edit-user-id').value;
  const name = $('edit-name').value.trim();
  const username = $('edit-username').value.trim();
  const email = $('edit-email').value.trim();
  const phone = $('edit-phone').value.trim();
  const role = $('edit-role').value;
  const active = $('edit-active').checked;
  const password = $('edit-password').value;
  const msg = $('edit-error');

  if (!name || !username) { msg.textContent = 'الاسم واليوزر مطلوبين.'; msg.hidden = false; return; }

  btn.disabled = true; btn.textContent = 'جاري الحفظ...'; msg.hidden = true;

  try {
    const upd = { full_name: name, username, phone: phone || null, role, is_active: active, email: email || null };
    const { error: profileErr } = await sb.from('profiles').update(upd).eq('id', id);
    if (profileErr) throw profileErr;

    const want = editChecks.filter(c => c.cb.checked).map(c => c.cb.dataset.id);
    const mine = new Set(links.filter(l => l.profile_id === id).map(l => l.department_id));
    const add = want.filter(dept => !mine.has(dept));
    const remove = [...mine].filter(dept => !want.includes(dept));

    if (remove.length) await sb.from('profile_departments').delete().eq('profile_id', id).in('department_id', remove);
    if (add.length) await sb.from('profile_departments').insert(add.map(department_id => ({ profile_id: id, department_id })));

    const currentProfile = profiles.find(p => p.id === id);
    if (email && email !== currentProfile.email) {
       await sb.functions.invoke('admin-users', { body: { action: 'update_email', user_id: id, email } });
    }
    if (password) {
      if (password.length < 8) throw new Error('كلمة المرور يجب أن تكون 8 حروف على الأقل.');
      await sb.functions.invoke('admin-users', { body: { action: 'set_password', user_id: id, password } });
    }

    // إشعار بتعديل بيانات مستخدم (للكل)
    await sb.from('notifications').insert({
      title: 'تحديث بيانات مستخدم ✏️',
      message: `قام المدير بتحديث بيانات المستخدم: ${name}`,
      target_role: 'all'
    });

    document.getElementById('edit-user-dialog').close();
    flash('تم حفظ البيانات بنجاح.');
    await refresh();
  } catch (err) {
    msg.textContent = err.message || 'حدث خطأ.';
    msg.hidden = false;
  } finally {
    btn.disabled = false; btn.textContent = 'حفظ التعديلات';
  }
});

function renderUsers() { 
  const box = $('users'); box.replaceChildren(); 
  if (!profiles || !profiles.length) {
    box.innerHTML = '<p class="muted">لا يوجد مستخدمين أو حدث خطأ في تحميلهم.</p>';
    return;
  }
  [...profiles].sort((a, b) => (Number(a.is_active) - Number(b.is_active)) || a.created_at.localeCompare(b.created_at)).forEach((p) => box.append(userCard(p))); 
}

function renderEditRequests() {
  const ul = $('edit-requests-list'); ul.replaceChildren();
  if (!editRequests || !editRequests.length) {
    ul.innerHTML = '<li class="muted">لا يوجد طلبات تعديل حالياً.</li>'; return;
  }
  editRequests.forEach(req => {
    const user = profiles.find(p => p.id === req.user_id);
    const li = el('li', { style: 'display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem;' },
      el('div', {},
        el('strong', { text: user?.full_name || 'مستخدم غير معروف' }),
        el('div', { style: 'font-size:0.9rem; color:var(--text-muted); margin-top:0.5rem;' }, 
          req.requested_name ? `الاسم الجديد: ${req.requested_name} | ` : '',
          req.requested_phone ? `الموبايل: ${req.requested_phone} | ` : '',
          req.requested_email ? `الإيميل: ${req.requested_email}` : ''
        ),
        el('div', { style: 'font-size:0.85rem; margin-top:0.5rem; background:#f1f5f9; padding:0.5rem; border-radius:4px;' }, `ملاحظات: ${req.notes || 'لا يوجد'}`)
      ),
      el('div', { style: 'display:flex; gap:0.5rem;' },
        el('button', { type: 'button', class: 'btn inline', style: 'background:#10b981; border-color:#10b981;', text: 'موافقة', onclick: () => approveRequest(req) }),
        el('button', { type: 'button', class: 'btn inline ghost', style: 'color:#ef4444; border-color:#fecaca;', text: 'رفض', onclick: () => rejectRequest(req) })
      )
    );
    ul.append(li);
  });
}

async function approveRequest(req) {
  if (!confirm('هل أنت متأكد من تطبيق التعديلات؟')) return;
  try {
    const upd = {};
    if (req.requested_name) upd.full_name = req.requested_name;
    if (req.requested_phone) upd.phone = req.requested_phone;
    
    if (Object.keys(upd).length > 0) {
      await sb.from('profiles').update(upd).eq('id', req.user_id);
    }
    
    if (req.requested_email) {
      await sb.functions.invoke('admin-users', { body: { action: 'update_email', user_id: req.user_id, email: req.requested_email } });
    }
    
    await sb.from('edit_requests').update({ status: 'approved' }).eq('id', req.id);

    // إشعار للموظف نفسه
    await sb.from('notifications').insert({
      title: 'تمت الموافقة على طلبك ✅',
      message: `تمت الموافقة على طلب تعديل بياناتك وتحديثها بنجاح.`,
      target_role: 'all',
      user_id: req.user_id
    });

    flash('تم تطبيق التعديلات بنجاح.'); await refresh();
  } catch (err) {
    flash('خطأ في تطبيق التعديلات: ' + err.message, false);
  }
}

async function rejectRequest(req) {
  if (!confirm('هل أنت متأكد من رفض الطلب؟')) return;
  await sb.from('edit_requests').update({ status: 'rejected' }).eq('id', req.id);

  // إشعار للموظف نفسه
  await sb.from('notifications').insert({
    title: 'تم رفض طلب التعديل ❌',
    message: `نأسف، تم رفض طلب تعديل بياناتك من قبل الإدارة.`,
    target_role: 'all',
    user_id: req.user_id
  });

  flash('تم رفض الطلب.'); await refresh();
}

function renderCreateForm() { 
  const roleSel = $('c-role'); roleSel.replaceChildren(); 
  Object.entries(ROLE_LABELS).forEach(([v, label]) => { roleSel.append(el('option', { value: v, text: label, selected: v === 'lawyer' })); }); 
  createChecks = deptChecks(new Set()); 
  $('c-depts').replaceChildren(...createChecks.map((c) => c.node)); 
}

$('create-form').addEventListener('submit', async (e) => {
  e.preventDefault(); 
  const btn = $('c-btn');
  const body = { 
    action: 'create', 
    full_name: $('c-name').value.trim(), 
    username: $('c-username').value.trim(),
    email: $('c-email').value.trim(), 
    password: $('c-pass').value, 
    phone: $('c-phone').value.trim(), 
    role: $('c-role').value, 
    department_ids: createChecks.filter((c) => c.cb.checked).map((c) => c.cb.dataset.id),
    security_question: $('c-q').value.trim(),
    security_answer: $('c-a').value.trim()
  };
  
  if (!body.full_name || !body.email || !body.password || !body.username) { flash('اكتب الاسم، اليوزر، البريد، وكلمة المرور.', false); return; } 
  
  btn.disabled = true; btn.textContent = 'جاري الإنشاء...';
  
  try { 
    const { error } = await sb.functions.invoke('admin-users', { body }); 
    if (error) { flash('فشل الإنشاء: ' + await fnError(error), false); return; } 
    
    // إشعار بإضافة مستخدم جديد
    await sb.from('notifications').insert({
      title: 'إضافة مستخدم جديد 👤',
      message: `تم إضافة مستخدم جديد للنظام: ${body.full_name} (${ROLE_LABELS[body.role]})`,
      target_role: 'all'
    });

    flash('تم إنشاء الحساب بنجاح.'); e.target.reset(); await refresh(); 
  } catch (err) {
    flash('خطأ: ' + err.message, false);
  } finally { 
    btn.disabled = false; btn.textContent = 'إنشاء الحساب'; 
  }
});

function renderDepts() { 
  const ul = $('dept-list'); ul.replaceChildren(); 
  depts.forEach((d) => { 
    const rename = async () => { 
      const nn = prompt('الاسم الجديد للقسم:', d.name); 
      if (nn === null) return; 
      const v = nn.trim(); 
      if (!v || v === d.name) return; 
      const { error } = await sb.from('departments').update({ name: v }).eq('id', d.id); 
      if (error) flash(error.code === '23505' ? 'فيه قسم بنفس الاسم.' : 'تعذّر تعديل القسم.', false); 
      else { flash('اتعدّل.'); await refresh(); } 
    }; 
    ul.append(el('li', {}, el('span', { text: d.name }), el('button', { type: 'button', class: 'btn ghost small', text: 'تعديل الاسم', onclick: rename }))); 
  }); 
}

$('dept-form').addEventListener('submit', async (e) => { 
  e.preventDefault(); const input = $('dept-name'); const v = input.value.trim(); 
  if (!v) return; 
  const { error } = await sb.from('departments').insert({ name: v }); 
  if (error) { flash(error.code === '23505' ? 'فيه قسم بنفس الاسم.' : 'تعذّر إضافة القسم.', false); return; } 
  input.value = ''; flash('اتضاف القسم.'); await refresh(); 
});

async function loadLog() {
  const ul = $('log-list'); 
  const { data, error } = await sb.from('activity_log').select('id, user_id, action, table_name, record_id, created_at').order('created_at', { ascending: false }).limit(100);
  ul.replaceChildren(); 
  if (error) { flash('مقدرتش أحمّل سجل النشاط.', false); return; } 
  if (!data.length) { ul.append(el('li', { class: 'muted', text: 'مفيش نشاط لسه.' })); return; }
  const names = new Map(profiles.map((p) => [p.id, p.full_name || 'بدون اسم']));
  data.forEach((r) => { 
    const who = r.user_id ? (names.get(r.user_id) || 'مستخدم محذوف') : 'النظام'; 
    const what = `${ACTION_LABELS[r.action] || r.action} ${TABLE_LABELS[r.table_name] || r.table_name}`; 
    ul.append(el('li', {}, el('span', { text: `${who} — ${what}`, style: 'font-weight: 600;' }), el('span', { class: 'log-time', text: new Date(r.created_at).toLocaleString('ar-EG-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' }) }))); 
  });
}
$('log-refresh').addEventListener('click', loadLog);

async function refresh() { if (!(await loadAll())) return; renderUsers(); renderEditRequests(); renderCreateForm(); renderDepts(); await loadLog(); }

async function init() {
  const { data: { session } } = await sb.auth.getSession(); if (!session) { goTo('login.html'); return; }
  const { data: profile, error } = await sb.from('profiles').select('id, full_name, role, is_active').eq('id', session.user.id).maybeSingle();
  if (error) { flash('مفيش اتصال بالخادم.', false); $('app').hidden = false; return; } 
  if (!profile || !profile.is_active) { await sb.auth.signOut(); goTo('login.html'); return; } 
  if (profile.role !== 'admin') { goTo('index.html'); return; }
  me = profile; $('user-name').textContent = profile.full_name || session.user.email; $('user-avatar').textContent = (document.getElementById('user-name').textContent || '?').trim().charAt(0); $('user-role').textContent = ROLE_LABELS[profile.role];
  await refresh(); $('app').hidden = false;
}

$('logout-btn').addEventListener('click', async () => { await sb.auth.signOut(); goTo('login.html'); });
sb.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') goTo('login.html'); });
init();