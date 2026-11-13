const ROLE_LABELS = { admin: 'مدير', lawyer: 'محامي', secretary: 'سكرتارية' };
let me = null;
const $ = (id) => document.getElementById(id);

function el(tag, props = {}, ...kids) { 
  const n = document.createElement(tag); 
  for (const [k, v] of Object.entries(props)) { 
    if (v === undefined || v === null) continue; 
    if (k === 'class') n.className = v; 
    else if (k === 'text') n.textContent = v; 
    else if (['checked', 'disabled', 'selected', 'value', 'hidden'].includes(k)) n[k] = v; 
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); 
    else n.setAttribute(k, v === true ? '' : v); 
  } 
  kids.flat().filter(Boolean).forEach((c) => n.append(c)); 
  return n; 
}

let toastTimer; 
function flash(text, ok = true) { 
  const t = $('toast'); 
  t.textContent = text; 
  t.className = 'alert toast ' + (ok ? 'ok' : ''); 
  t.hidden = false; 
  clearTimeout(toastTimer); 
  toastTimer = setTimeout(() => { t.hidden = true; }, 5000); 
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';

async function loadProfile() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return location.replace('login.html');

  const [profileRes, casesRes, tasksRes] = await Promise.all([
    sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
    sb.from('cases').select('id, next_hearing_date').eq('responsible_lawyer_id', session.user.id).eq('status', 'open'),
    sb.from('case_tasks').select('id').eq('is_completed', false).eq('assigned_to', session.user.id) // لو مفيش assigned_to سيبها فاضية
  ]);

  if (profileRes.error || !profileRes.data) return flash('خطأ في تحميل البيانات', false);
  me = profileRes.data;

  // تحديث الواجهة
  $('p-name').textContent = me.full_name || 'مستخدم';
  $('p-role').textContent = ROLE_LABELS[me.role] || me.role;
  $('p-username').textContent = me.username ? `@${me.username}` : '-';
  $('p-email').textContent = me.email || '-';
  $('p-phone').textContent = me.phone || '-';
  $('p-date').textContent = fmtDate(me.created_at);
  $('p-bio').value = me.bio || '';

  // الإحصائيات
  $('stat-cases').textContent = casesRes.data?.length || 0;
  const upcoming = casesRes.data?.filter(c => c.next_hearing_date && c.next_hearing_date >= new Date().toISOString().split('T')[0]).length || 0;
  $('stat-hearings').textContent = upcoming;
  $('stat-tasks').textContent = tasksRes.data?.length || 0;

  // الصورة
  if (me.avatar_url) {
    $('avatar-img').src = me.avatar_url;
    $('avatar-img').style.display = 'block';
    $('avatar-placeholder').style.display = 'none';
  }

  // ملء الفورم
  $('form-name').value = me.full_name || '';
  $('form-phone').value = me.phone || '';
  $('form-q').value = me.security_question || '';
  $('form-a').value = me.security_answer || '';
}

// رفع الصورة
$('avatar-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const btn = $('avatar-label');
  btn.innerHTML = 'جاري الرفع...';

  const ext = file.name.split('.').pop();
  const path = `${me.id}/${Date.now()}.${ext}`;

  const { error: upErr } = await sb.storage.from('avatars').upload(path, file, { upsert: true });
  if (upErr) { flash('فشل رفع الصورة', false); btn.innerHTML = '📷'; return; }

  const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(path);
  await sb.from('profiles').update({ avatar_url: publicUrl }).eq('id', me.id);
  
  $('avatar-img').src = publicUrl;
  $('avatar-img').style.display = 'block';
  $('avatar-placeholder').style.display = 'none';
  flash('تم تحديث الصورة بنجاح');
  btn.innerHTML = '📷';
});

// حفظ البيانات الشخصية
$('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('save-profile-btn');
  btn.disabled = true; btn.textContent = 'جاري الحفظ...';

  const updates = {
    full_name: $('form-name').value.trim(),
    phone: $('form-phone').value.trim(),
    bio: $('p-bio').value.trim()
  };

  const { error } = await sb.from('profiles').update(updates).eq('id', me.id);
  
  btn.disabled = false; btn.textContent = 'حفظ التعديلات';
  if (error) return flash('فشل الحفظ: ' + error.message, false);
  
  flash('تم حفظ البيانات بنجاح');
  loadProfile();
});
$('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('save-profile-btn');
  btn.disabled = true; btn.textContent = 'جاري الحفظ...';

  const updates = {
    full_name: $('form-name').value.trim(),
    phone: $('form-phone').value.trim(),
    bio: $('p-bio').value.trim()
  };

  const { error } = await sb.from('profiles').update(updates).eq('id', me.id);
  
  btn.disabled = false; btn.textContent = 'حفظ التعديلات';
  if (error) return flash('فشل الحفظ: ' + error.message, false);
  
  // إشعار للكل
  await sb.from('notifications').insert({
    title: 'تحديث بيانات شخصية ✏️',
    message: `قام المستخدم ${updates.full_name} بتحديث بياناته الشخصية.`,
    target_role: 'all'
  });

  flash('تم حفظ البيانات بنجاح');
  loadProfile();
});

// تغيير الباسورد
$('password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPass = $('form-new-pass').value;
  if (newPass.length < 8) return flash('الباسورد لازم 8 حروف على الأقل', false);

  const btn = $('save-pass-btn');
  btn.disabled = true; btn.textContent = 'جاري التغيير...';

  const { error } = await sb.auth.updateUser({ password: newPass });
  
  btn.disabled = false; btn.textContent = 'تغيير الباسورد';
  if (error) return flash('فشل التغيير: ' + error.message, false);
  
  flash('تم تغيير الباسورد بنجاح');
  $('password-form').reset();
});

// تغيير السؤال السري
$('security-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('save-security-btn');
  btn.disabled = true; btn.textContent = 'جاري الحفظ...';

  const updates = {
    security_question: $('form-q').value.trim(),
    security_answer: $('form-a').value.trim()
  };

  const { error } = await sb.from('profiles').update(updates).eq('id', me.id);
  
  btn.disabled = false; btn.textContent = 'حفظ السؤال السري';
  if (error) return flash('فشل الحفظ: ' + error.message, false);
  
  flash('تم حفظ السؤال السري');
});

async function init() {
  const { data: { session } } = await sb.auth.getSession(); 
  if (!session) return location.replace('login.html');
  
  await loadProfile(); 
  $('app').hidden = false;
}

$('logout-btn').addEventListener('click', async () => { 
  await sb.auth.signOut(); 
  location.replace('login.html'); 
});

init();