const CASE_STATUS = { open: 'متداولة', reserved: 'محجوزة للحكم', judged: 'محكوم فيها', archived: 'مؤرشفة' };

const DEGREE_LABELS = { 
  first_instance: 'درجة أولى (ابتدائي / جزئي)', 
  appeal: 'استئناف', 
  cassation: 'نقض', 
  objection: 'معارضة (جنح)', 
  appeal_objection: 'معارضة استئنافية (جنح)',
  retrial: 'إعادة إجراءات (جنايات غيابي)',
  felony_first: 'جنايات أول درجة',
  felony_appeal: 'جنايات مستأنف',
  other: 'أخرى' 
};

const COURT_TYPES_MAP = { 
  civil: ['جزئي', 'كلي (ابتدائي)', 'استئناف', 'نقض'], 
  criminal: ['جنح جزئي', 'جنح مستأنف', 'جنايات', 'جنايات مستأنف'], 
  family: ['ابتدائي أسرة', 'استئناف أسرة'], 
  labor: ['ابتدائي عمالي', 'استئناف عمالي'], 
  commercial: ['ابتدائي تجاري', 'استئناف تجاري'], 
  administrative: ['قضاء إداري', 'إدارية عليا'], 
  other: ['أخرى'] 
};

const SUB_TYPES_MAP = { 
  civil: ['مدني', 'صحة وتوقيع', 'مدني حكومة', 'تعويضات', 'عقود', 'ملكية', 'إيجارات', 'أخرى'], 
  criminal: ['جنح سرقة ونصب', 'جنح ضرب وجرح', 'جنح إيصال أمانة', 'جنايات مخدرات', 'جنايات قتل', 'جنايات سلاح', 'أخرى'], 
  family: ['شرعي', 'حبس', 'ولاية', 'أذون زواج', 'نسب', 'طلاق', 'خلع', 'نفقة', 'رؤية', 'أخرى'], 
  labor: ['فصل تعسفي', 'مستحقات', 'عقد عمل', 'إصابة عمل', 'أخرى'], 
  commercial: ['شيكات', 'كمبيالات', 'إفلاس', 'شركات', 'علامات تجارية', 'أخرى'], 
  administrative: ['قرارات إدارية', 'تعويضات', 'عقود حكومية', 'ترقيات', 'أخرى'], 
  other: ['أخرى'] 
};

const DEPT_MAP = { civil: 'مدني', criminal: 'جنائي', family: 'أسرة', labor: 'عمال', commercial: 'تجاري', administrative: 'إداري' };
const EGYPT_COURTS = ["محكمة شمال القاهرة الابتدائية", "محكمة جنوب القاهرة الابتدائية", "محكمة الجيزة الابتدائية", "محكمة استئناف القاهرة", "محكمة النقض"];

const CIVIL_ROLES = [
  { v: 'مدعي / مدعين', t: 'مدعي / مدعين' },
  { v: 'مدعي عليه / مدعي عليهم', t: 'مدعي عليه / مدعي عليهم' },
  { v: 'مستأنف / مستأنفين', t: 'مستأنف / مستأنفين' },
  { v: 'مستأنف ضده / مستأنف ضدهم', t: 'مستأنف ضده / مستأنف ضدهم' },
  { v: 'طاعن / طاعنين', t: 'طاعن / طاعنين' },
  { v: 'مطعون ضده / مطعون ضدهم', t: 'مطعون ضده / مطعون ضدهم' }
];

const CRIMINAL_ROLES = [
  { v: 'متهم / متهمين', t: 'متهم / متهمين' },
  { v: 'مجني عليه / مجني عليهم', t: 'مجني عليه / مجني عليهم' },
  { v: 'مدعي بالحق المدني', t: 'مدعي بالحق المدني / المدعين بالحق المدني' },
  { v: 'مسؤول عن الحق المدني', t: 'مسؤول عن الحق المدني' },
  { v: 'مستأنف / مستأنفين', t: 'مستأنف / مستأنفين' },
  { v: 'مستأنف ضده / مستأنف ضدهم', t: 'مستأنف ضده / مستأنف ضدهم' }
];

let me = null, depts = [], lawyers = [], clients = [], allCases = [], selectedFiles = [], parties = [];
let isEditMode = false, currentCaseId = null, currentCaseData = null;
let isReadOnlyMode = false;

const $ = (id) => document.getElementById(id);
const isAdmin = () => me && me.role === 'admin';
const canEditCase = () => me && (me.role === 'admin' || me.role === 'lawyer');

function el(tag, props = {}, ...kids) { 
    const n = document.createElement(tag); 
    for (const [k, v] of Object.entries(props)) { 
        if (v === undefined || v === null) continue; 
        if (k === 'class') n.className = v; 
        else if (k === 'text') n.textContent = v; 
        else if (['checked', 'disabled', 'selected', 'value', 'hidden'].includes(k)) n[k] = v; 
        else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); 
        else if (v !== false) n.setAttribute(k, v === true ? '' : v); 
    } 
    kids.flat().filter(Boolean).forEach((c) => n.append(c)); 
    return n; 
}

function flash(text, ok = true) { const t = $('toast'); t.textContent = text; t.className = 'alert toast' + (ok ? ' ok' : ''); t.hidden = false; setTimeout(() => { t.hidden = true; }, 5000); }
function goToLogin() { location.replace('login.html'); }
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';
const fmtMoney = (n) => (n || 0).toLocaleString('ar-EG-u-nu-latn');

function formatWhatsApp(phone) {
  if (!phone) return '#';
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '20' + p.substring(1);
  else if (!p.startsWith('20')) p = '20' + p;
  return `https://wa.me/${p}`;
}

// دالة إرسال إشعار
async function sendNotif(title, msg) {
  try {
    await sb.from('notifications').insert({ title, message: msg, target_role: 'all' });
  } catch (e) { console.error("فشل إرسال الإشعار", e); }
}

async function loadInitialData() {
  const [d, l, c, all] = await Promise.all([
      sb.from('departments').select('id, name').order('name'), 
      sb.from('profiles').select('id, full_name').in('role', ['admin', 'lawyer']).eq('is_active', true), 
      sb.from('clients').select('id, full_name, phone').order('full_name'), 
      sb.from('cases').select('id, case_number, case_year').order('created_at', { ascending: false })
  ]);
  if (d.data) depts = d.data; if (l.data) lawyers = l.data; if (c.data) clients = c.data; if (all.data) allCases = all.data;
  lawyers.forEach(law => $('c-lawyer').append(el('option', { value: law.id, text: law.full_name })));
  clients.forEach(cli => $('c-client').append(el('option', { value: cli.id, text: cli.full_name })));
  EGYPT_COURTS.forEach(court => $('courts-list').append(el('option', { value: court })));
  allCases.forEach(caseItem => { $('c-parent-case').append(el('option', { value: caseItem.id, text: `قضية ${caseItem.case_number} لسنة ${caseItem.case_year}` })); });
}

window.updateDynamicDropdowns = () => {
  const typeKey = $('c-type').value;
  
  if (typeKey === 'criminal') {
    $('prosecution-box').style.display = 'grid';
    $('claim-value-box').style.display = 'none';
  } else {
    $('prosecution-box').style.display = 'none';
    $('claim-value-box').style.display = 'block';
  }

  if (typeKey === 'other') {
    $('other-type-box').style.display = 'flex';
    $('sub-type-box').style.display = 'none';
  } else {
    $('other-type-box').style.display = 'none';
    $('sub-type-box').style.display = 'flex';
  }

  const subSelect = $('c-subtype'); subSelect.innerHTML = ''; 
  (SUB_TYPES_MAP[typeKey] || ['أخرى']).forEach(st => subSelect.append(el('option', { value: st, text: st })));
  
  const courtTypeSelect = $('c-court-type'); courtTypeSelect.innerHTML = ''; 
  (COURT_TYPES_MAP[typeKey] || ['أخرى']).forEach(ct => courtTypeSelect.append(el('option', { value: ct, text: ct })));
  
  const deptObj = depts.find(d => d.name.includes(DEPT_MAP[typeKey])); 
  const deptSelect = $('c-dept'); deptSelect.innerHTML = ''; 
  if (deptObj) deptSelect.append(el('option', { value: deptObj.id, text: deptObj.name }));

  const degreeSelect = $('c-degree'); degreeSelect.innerHTML = '';
  if (typeKey === 'criminal') {
    degreeSelect.append(
      el('option', { value: 'first_instance', text: 'جنح أول درجة (جزئي)' }),
      el('option', { value: 'appeal', text: 'جنح مستأنف' }),
      el('option', { value: 'objection', text: 'معارضة (جنح)' }),
      el('option', { value: 'appeal_objection', text: 'معارضة استئنافية (جنح)' }),
      el('option', { value: 'felony_first', text: 'جنايات أول درجة' }),
      el('option', { value: 'retrial', text: 'إعادة إجراءات (جنايات غيابي)' }),
      el('option', { value: 'felony_appeal', text: 'جنايات مستأنف' }),
      el('option', { value: 'cassation', text: 'نقض' })
    );
  } else {
    degreeSelect.append(
      el('option', { value: 'first_instance', text: 'درجة أولى (ابتدائي)' }),
      el('option', { value: 'appeal', text: 'استئناف' }),
      el('option', { value: 'cassation', text: 'نقض' }),
      el('option', { value: 'other', text: 'أخرى' })
    );
  }

  const clientRoleSelect = $('c-client-role'); clientRoleSelect.innerHTML = '';
  const rolesList = (typeKey === 'criminal') ? CRIMINAL_ROLES : CIVIL_ROLES;
  rolesList.forEach(r => clientRoleSelect.append(el('option', { value: r.v, text: r.t })));

  toggleDegreeOptions();
  renderParties();
};

window.toggleDegreeOptions = () => { 
  const deg = $('c-degree').value; 
  if (deg !== 'first_instance' && deg !== 'felony_first') { 
    $('parent-case-wrapper').style.display = 'flex'; 
  } else { 
    $('parent-case-wrapper').style.display = 'none'; 
    $('c-link-parent-check').checked = false; 
    $('c-parent-case').style.display = 'none'; 
    $('c-parent-case').value = ''; 
  } 
};

window.toggleParentSelect = () => { 
  if ($('c-link-parent-check').checked) { 
    $('c-parent-case').style.display = 'block'; 
  } else { 
    $('c-parent-case').style.display = 'none'; 
    $('c-parent-case').value = ''; 
  } 
};

async function loadCases() {
  const term = $('search').value.trim();
  let q = sb.from('cases').select(`id, case_number, case_year, court, status, case_type, sub_type, client_role, degree, clients(full_name, phone)`).order('created_at', { ascending: false }).limit(100);
  if (term) q = q.or(`case_number.ilike.%${term}%, court.ilike.%${term}%`);
  const { data } = await q; const ul = $('cases-list'); ul.replaceChildren();
  if (!data || !data.length) return ul.append(el('li', {}, 'مفيش قضايا.'));
  
  data.forEach((c) => {
    const st = CASE_STATUS[c.status] || c.status; 
    const deg = DEGREE_LABELS[c.degree] || c.degree;
    
    let waLink = c.clients?.phone ? el('a', {
        href: formatWhatsApp(c.clients.phone),
        target: '_blank',
        class: 'wa-btn',
        onclick: (e) => e.stopPropagation()
    }) : '';

    if (waLink) {
        waLink.innerHTML = `<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`;
    }

    const li = el('li', { style: 'display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 1rem;', onclick: () => openCaseDetails(c.id) },
      el('div', {}, el('strong', { text: `قضية ${c.case_number} لسنة ${c.case_year} - ${c.court}` }), el('div', { class: 'muted', style: 'font-size: 0.9rem;' }, `الموكل: ${c.clients?.full_name || '-'} `, waLink, ` | الدرجة: ${deg} | الاختصاص: ${c.sub_type || '-'}`)),
      el('span', { class: 'tag ' + (c.status === 'open' ? 'good' : ''), text: st }));
    ul.append(li);
  });
}

window.openCaseDetails = async (id) => {
  currentCaseId = id; $('list-view').hidden = true; $('add-view').hidden = true; $('details-view').hidden = false; $('d-title').textContent = 'جاري التحميل...'; $('d-info').innerHTML = '<div class="muted">يتم تحميل البيانات...</div>';
  
  try {
    const results = await Promise.allSettled([
      sb.from('cases').select(`*, clients!client_id(full_name, phone), profiles!responsible_lawyer_id(full_name), powers_of_attorney(poa_number, poa_letter)`).eq('id', id).single(),
      sb.from('case_parties').select('*').eq('case_id', id), 
      sb.from('case_sessions').select('*').eq('case_id', id).order('session_date', { ascending: false }),
      sb.from('case_tasks').select('*').eq('case_id', id).order('created_at', { ascending: true }), 
      sb.from('documents').select('*').eq('case_id', id).order('created_at', { ascending: false }),
      sb.from('case_payments').select('*').eq('case_id', id).order('payment_date', { ascending: false }), 
      sb.from('cases').select('id, case_number, case_year').eq('parent_case_id', id)
    ]);
    
    const caseRes = results[0];
    const partiesRes = results[1];
    const sessionsRes = results[2];
    const tasksRes = results[3];
    const docsRes = results[4];
    const paymentsRes = results[5];
    const childCasesRes = results[6];

    if (caseRes.status === 'rejected' || caseRes.value.error || !caseRes.value.data) { 
        $('d-title').textContent = 'خطأ'; 
        $('d-info').innerHTML = '<div class="alert">تعذر تحميل البيانات الأساسية.</div>'; 
        return; 
    }
    
    const c = caseRes.value.data; currentCaseData = c;
    $('d-title').textContent = `قضية ${c.case_number} لسنة ${c.case_year}`; $('d-status').textContent = CASE_STATUS[c.status] || c.status; $('d-status').className = 'tag ' + (c.status === 'open' ? 'good' : '');
    
    if (isReadOnlyMode || !canEditCase()) {
        if ($('btn-edit-case')) $('btn-edit-case').style.display = 'none';
        if ($('btn-delete-case')) $('btn-delete-case').style.display = 'none';
        if ($('btn-add-session')) $('btn-add-session').style.display = 'none';
        if ($('btn-add-payment')) $('btn-add-payment').style.display = 'none';
        if ($('btn-add-task')) $('btn-add-task').style.display = 'none';
        if ($('btn-add-doc')) $('btn-add-doc').style.display = 'none';
    } else {
        if ($('btn-edit-case')) $('btn-edit-case').style.display = 'inline-block';
        if ($('btn-delete-case')) $('btn-delete-case').style.display = 'inline-block';
        if ($('btn-add-session')) $('btn-add-session').style.display = 'inline-block';
        if ($('btn-add-payment')) $('btn-add-payment').style.display = 'inline-block';
        if ($('btn-add-task')) $('btn-add-task').style.display = 'inline-block';
        if ($('btn-add-doc')) $('btn-add-doc').style.display = 'inline-block';
    }

    let parentCaseLink = null;
    if (c.parent_case_id) { const { data: parentData } = await sb.from('cases').select('id, case_number, case_year').eq('id', c.parent_case_id).single(); if (parentData) { parentCaseLink = el('div', {}, el('strong', { text: 'القضية الأصلية' }), el('a', { href: `cases.html?id=${parentData.id}`, text: `قضية ${parentData.case_number} / ${parentData.case_year}`, style: 'color: var(--indigo); text-decoration: underline;' })); } }
    
    let waLink = c.clients?.phone ? el('a', {
        href: formatWhatsApp(c.clients.phone),
        target: '_blank',
        class: 'wa-btn',
        title: 'واتساب',
        onclick: (e) => e.stopPropagation()
    }) : '';

    if (waLink) {
        waLink.innerHTML = `<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`;
    }

    $('d-info').replaceChildren(
      el('div', {}, el('strong', { text: 'درجة التقاضي' }), DEGREE_LABELS[c.degree] || c.degree),
      el('div', {}, el('strong', { text: 'المحكمة' }), c.court || '-'),
      c.prosecution ? el('div', {}, el('strong', { text: 'النيابة المختصة' }), c.prosecution) : null,
      c.police_report ? el('div', {}, el('strong', { text: 'رقم المحضر / العرائض' }), c.police_report) : null,
      
      c.charge ? el('div', { style: 'grid-column: 1 / -1;' }, el('strong', { text: 'التهمة / الموضوع' }), el('span', { style: 'color: var(--stamp); font-weight: bold; font-size: 1.1rem;', text: c.charge })) : null,
      c.judgment ? el('div', { style: 'grid-column: 1 / -1; background: #f0fdf4; padding: 0.5rem; border-radius: 6px; border: 1px solid #bbf7d0;' }, el('strong', { text: 'الحكم / القرار النهائي', style: 'color: #166534;' }), el('span', { style: 'color: #166534; font-weight: bold;', text: c.judgment })) : null,

      el('div', {}, el('strong', { text: 'نوع المحكمة' }), c.circuit || '-'),
      el('div', {}, el('strong', { text: 'الموكل' }), c.clients?.full_name || '-', ' ', waLink),
      el('div', {}, el('strong', { text: 'صفة الموكل' }), c.client_role || '-'),
      el('div', {}, el('strong', { text: 'المحامي' }), c.profiles?.full_name || '-'),
      el('div', {}, el('strong', { text: 'التوكيل' }), c.powers_of_attorney ? `توكيل ${c.powers_of_attorney.poa_letter || ''}/${c.powers_of_attorney.poa_number}` : '-'),
      el('div', {}, el('strong', { text: 'تاريخ رفع الدعوى' }), fmtDate(c.filing_date)),
      el('div', {}, el('strong', { text: 'الجلسة القادمة' }), el('span', { style: 'color: var(--stamp); font-weight: bold;', text: fmtDate(c.next_hearing_date) })),
      c.appeal_deadline ? el('div', {}, el('strong', { text: 'ميعاد الطعن الحاسم' }), el('span', { style: 'color: #dc2626; font-weight: bold;', text: fmtDate(c.appeal_deadline) })) : null,
      el('div', {}, el('strong', { text: 'رقم الرول' }), c.roll_number || '-'),
      el('div', {}, el('strong', { text: 'القاعة / القاضي' }), c.courtroom || '-'),
      el('div', {}, el('strong', { text: 'محامي الخصم' }), c.opponent_lawyer || '-'),
      el('div', { style: 'grid-column: 1 / -1;' }, el('strong', { text: 'ملاحظات إضافية' }), c.subject || '-'),
      parentCaseLink
    );
    
    renderFinance(c, paymentsRes.status === 'fulfilled' ? (paymentsRes.value.data || []) : []);
    
    const partiesBox = $('d-parties'); partiesBox.replaceChildren();
    if (partiesRes.status === 'fulfilled' && partiesRes.value.data && partiesRes.value.data.length) { 
      partiesRes.value.data.forEach(p => { 
        partiesBox.append(el('div', { style: 'margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px dashed var(--line);' }, el('strong', { text: p.name }), el('span', { class: 'muted', style: 'margin-right: 0.5rem;', text: `(${p.party_role})` }))); 
      }); 
    } else { 
      partiesBox.append(el('span', { class: 'muted', text: 'لا يوجد خصوم مسجلين.' })); 
    }
    
    renderDocs(docsRes.status === 'fulfilled' ? (docsRes.value.data || []) : []); 
    renderSessions(sessionsRes.status === 'fulfilled' ? (sessionsRes.value.data || []) : []); 
    renderTasks(tasksRes.status === 'fulfilled' ? (tasksRes.value.data || []) : []);
    $('print-date').textContent = new Date().toLocaleString('ar-EG-u-nu-latn', { dateStyle: 'long', timeStyle: 'short' });
  } catch (err) { 
    console.error(err); 
    $('d-info').innerHTML = '<div class="alert">حدث خطأ غير متوقع في تحميل البيانات.</div>'; 
  }
};

function renderFinance(c, payments) {
  const totalFees = c.client_fees || 0; let totalPaid = 0; payments.forEach(p => totalPaid += p.amount); const remaining = totalFees - totalPaid;
  $('d-finance-summary').replaceChildren(el('div', { class: 'fin-box' }, el('span', { text: 'إجمالي الأتعاب' }), el('strong', { text: fmtMoney(totalFees) })), el('div', { class: 'fin-box paid' }, el('span', { text: 'المحصل' }), el('strong', { text: fmtMoney(totalPaid) })), el('div', { class: 'fin-box rem' }, el('span', { text: 'المتبقي' }), el('strong', { text: fmtMoney(remaining) })));
  const ul = $('d-payments-list'); ul.replaceChildren(); if (!payments.length) return ul.append(el('li', { class: 'muted', text: 'لا يوجد دفعات مسجلة.' }));
  payments.forEach(p => { ul.append(el('li', { class: 'payment-item' }, el('div', {}, el('strong', { text: fmtMoney(p.amount) + ' ج.م' }), p.notes ? el('span', { class: 'muted', style: 'margin-right: 0.5rem;', text: `- ${p.notes}` }) : null), el('span', { class: 'muted', style: 'font-size: 0.8rem;', text: fmtDate(p.payment_date) }))); });
}

window.openPaymentDialog = () => { $('payment-form').reset(); $('p-date').value = new Date().toISOString().split('T')[0]; $('payment-dialog').showModal(); };
$('payment-form').addEventListener('submit', async (e) => {
  e.preventDefault(); const btn = e.target.querySelector('button[type="submit"]'); const amountVal = parseFloat($('p-amount').value);
  if (!amountVal || amountVal <= 0) { alert('اكتب مبلغ صحيح.'); return; } btn.disabled = true;
  const { error } = await sb.from('case_payments').insert({ case_id: currentCaseId, amount: amountVal, payment_date: $('p-date').value, notes: $('p-notes').value.trim() || null });
  btn.disabled = false; if (!error) { $('payment-dialog').close(); flash('تم تسجيل الدفعة.'); openCaseDetails(currentCaseId); } else { console.error(error); flash('حدث خطأ.', false); }
});

function renderDocs(docs) { 
  const ul = $('d-docs-list'); ul.replaceChildren(); 
  if (!docs.length) return ul.append(el('li', { class: 'muted', text: 'لا يوجد مستندات.' })); 
  docs.forEach(d => { 
    const link = el('a', { href: '#', text: 'فتح' });
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const { data } = await sb.storage.from('law-docs').createSignedUrl(d.file_path, 120);
      if (data) window.open(data.signedUrl, '_blank');
    });
    
    const rowDiv = el('div', { class: 'row', style: 'margin: 0;' }, link);
    const li = el('li', {}, el('span', { text: d.title }), rowDiv);
    ul.append(li);
  }); 
}

function renderSessions(sessions) { 
  const ul = $('d-sessions-list'); ul.replaceChildren(); 
  if (!sessions.length) return ul.append(el('li', { class: 'muted', text: 'لا يوجد جلسات مسجلة.' })); 
  sessions.forEach(s => { 
    const actionButtons = el('div', { style: 'display:flex; gap: 0.5rem;' });
    if (!isReadOnlyMode && canEditCase()) {
        actionButtons.append(
            el('button', { type: 'button', class: 'btn small ghost', text: 'تعديل', onclick: () => openSessionDialog(s) }),
            el('button', { type: 'button', class: 'btn small danger', text: 'حذف', onclick: () => deleteSession(s.id) })
        );
    }
    
    const dateDiv = el('div', { class: 'timeline-date' }, el('span', { text: fmtDate(s.session_date) }), actionButtons);
    const cardDiv = el('div', { class: 'timeline-card' }, el('p', { text: s.decision }));
    if (s.next_hearing_date) cardDiv.append(el('div', { class: 'next-date', text: `تم التأجيل إلى: ${fmtDate(s.next_hearing_date)}` }));
    if (s.notes) cardDiv.append(el('div', { class: 'muted', style: 'font-size: 0.85rem; margin-top: 0.3rem;', text: s.notes }));
    
    ul.append(el('li', { class: 'timeline-item' }, dateDiv, cardDiv)); 
  }); 
}

function renderTasks(tasks) { 
  const ul = $('d-tasks-list'); ul.replaceChildren(); 
  if (!tasks.length) return ul.append(el('li', { class: 'muted', text: 'لا يوجد مهام حالياً.' })); 
  tasks.sort((a, b) => a.is_completed - b.is_completed); 
  
  const today = new Date().toISOString().split('T')[0];
  
  tasks.forEach(t => { 
    const isOverdue = !t.is_completed && t.due_date && t.due_date < today;
    const li = el('li', { class: 'task-item' + (t.is_completed ? ' done' : '') + (isOverdue ? ' overdue' : '') }, 
      el('input', { type: 'checkbox', checked: t.is_completed, onchange: (e) => toggleTask(t.id, e.target.checked), disabled: isReadOnlyMode || !canEditCase() }), 
      el('div', { style: 'flex: 1; display:flex; flex-direction: column;' },
        el('span', { text: t.title }),
        t.due_date ? el('span', { style: 'font-size: 0.75rem; color: ' + (isOverdue ? 'var(--stamp)' : 'var(--ink-soft)'), text: `تسليم: ${fmtDate(t.due_date)}` }) : null
      ),
      (!isReadOnlyMode && canEditCase()) ? el('button', { type: 'button', class: 'btn small danger', text: 'حذف', onclick: () => deleteTask(t.id) }) : null
    ); 
    ul.append(li); 
  }); 
}

window.openSessionDialog = (session = null) => { 
  $('session-form').reset(); 
  if (session) {
    $('session-dialog-title').textContent = 'تعديل قرار جلسة';
    $('s-edit-id').value = session.id;
    $('s-date').value = session.session_date;
    $('s-next-date').value = session.next_hearing_date || '';
    $('s-decision').value = session.decision;
    $('s-notes').value = session.notes || '';
  } else {
    $('session-dialog-title').textContent = 'إضافة قرار جلسة';
    $('s-edit-id').value = '';
    $('s-date').value = new Date().toISOString().split('T')[0];
  }
  $('session-dialog').showModal(); 
};

$('session-form').addEventListener('submit', async (e) => {
  e.preventDefault(); const btn = e.target.querySelector('button[type="submit"]'); btn.disabled = true;
  const editId = $('s-edit-id').value;
  const payload = { case_id: currentCaseId, session_date: $('s-date').value, decision: $('s-decision').value.trim(), next_hearing_date: $('s-next-date').value || null, notes: $('s-notes').value.trim() || null };
  
  let error;
  if (editId) {
    const res = await sb.from('case_sessions').update(payload).eq('id', editId);
    error = res.error;
  } else {
    const res = await sb.from('case_sessions').insert(payload);
    error = res.error;
  }
  
  if (!error) { 
    if (payload.next_hearing_date) await sb.from('cases').update({ next_hearing_date: payload.next_hearing_date }).eq('id', currentCaseId); 
    
    // إشعار قرار جلسة
    if (!editId) {
      await sendNotif('تسجيل قرار جلسة 📝', `تم تسجيل قرار جلسة في القضية رقم ${currentCaseData.case_number} بواسطة ${me.full_name}`);
    }

    $('session-dialog').close(); flash(editId ? 'تم تعديل الجلسة.' : 'تم إضافة الجلسة.'); openCaseDetails(currentCaseId); 
  } else { flash('حدث خطأ.', false); } 
  btn.disabled = false;
});

async function deleteSession(id) { if (!confirm('حذف هذه الجلسة من السجل؟')) return; await sb.from('case_sessions').delete().eq('id', id); flash('تم حذف الجلسة.'); openCaseDetails(currentCaseId); }

$('task-form').addEventListener('submit', async (e) => { 
  e.preventDefault(); 
  const title = $('t-title').value.trim(); if (!title) return; 
  const btn = e.target.querySelector('button[type="submit"]'); btn.disabled = true; 
  await sb.from('case_tasks').insert({ case_id: currentCaseId, title, due_date: $('t-due').value || null }); 
  
  // إشعار إضافة مهمة
  await sendNotif('إضافة مهمة جديدة ✅', `تم إضافة مهمة: "${title}" في القضية رقم ${currentCaseData.case_number} بواسطة ${me.full_name}`);

  $('t-title').value = ''; $('t-due').value = ''; btn.disabled = false; openCaseDetails(currentCaseId); 
});

async function toggleTask(id, isDone) { await sb.from('case_tasks').update({ is_completed: isDone }).eq('id', id); openCaseDetails(currentCaseId); }
async function deleteTask(id) { if (!confirm('حذف هذه المهمة؟')) return; await sb.from('case_tasks').delete().eq('id', id); openCaseDetails(currentCaseId); }

window.startAddCase = () => {
  isEditMode = false; isReadOnlyMode = false; $('form-title').textContent = 'إضافة قضية جديدة'; $('list-view').hidden = true; $('details-view').hidden = true; $('add-view').hidden = false;
  $('case-form').reset(); $('c-year').value = new Date().getFullYear(); $('c-type').value = 'civil'; 
  updateDynamicDropdowns(); 
  parties = []; renderParties(); selectedFiles = []; updateDocs(); $('file-docs').disabled = false; $('c-poa').innerHTML = '<option value="">— اختر الموكل أولاً —</option>';
};

window.editCase = () => {
  isEditMode = true; $('form-title').textContent = 'تعديل القضية'; $('details-view').hidden = true; $('add-view').hidden = false;
  const c = currentCaseData; 
  $('c-type').value = c.case_type; 
  updateDynamicDropdowns(); 
  $('c-degree').value = c.degree || 'first_instance'; 
  toggleDegreeOptions();
  if (c.parent_case_id) { $('c-link-parent-check').checked = true; $('c-parent-case').style.display = 'block'; $('c-parent-case').value = c.parent_case_id; } else { $('c-link-parent-check').checked = false; $('c-parent-case').style.display = 'none'; $('c-parent-case').value = ''; }
  $('c-subtype').value = c.sub_type; $('c-court-type').value = c.circuit; $('c-lawyer').value = c.responsible_lawyer_id || ''; $('c-client').value = c.client_id; $('c-client-role').value = c.client_role || ''; loadPOAs(c.client_id, c.poa_id);
  $('c-prosecution').value = c.prosecution || ''; $('c-police-report').value = c.police_report || '';
  $('c-charge').value = c.charge || ''; 
  $('c-judgment').value = c.judgment || ''; 
  if (c.case_type === 'other') { $('c-other-type').value = c.sub_type || ''; }
  
  $('c-opponent-lawyer').value = c.opponent_lawyer || ''; $('c-number').value = c.case_number; $('c-year').value = c.case_year; $('c-filing-date').value = c.filing_date || ''; $('c-claim-value').value = c.claim_value || ''; $('c-court').value = c.court; $('c-roll-number').value = c.roll_number || ''; $('c-courtroom').value = c.courtroom || ''; $('c-first-hearing').value = c.first_hearing_date || ''; $('c-next-hearing').value = c.next_hearing_date || ''; $('c-appeal-deadline').value = c.appeal_deadline || ''; $('c-status').value = c.status; $('c-subject').value = c.subject || ''; $('c-client-fees').value = c.client_fees || ''; $('c-court-fees').value = c.court_fees || ''; $('c-petty-expenses').value = c.petty_expenses || '';
  parties = currentCaseData.case_parties ? currentCaseData.case_parties.map(p => ({ name: p.name, role: p.party_role })) : []; renderParties();
};

window.showList = () => { $('add-view').hidden = true; $('details-view').hidden = true; $('list-view').hidden = false; isReadOnlyMode = false; loadCases(); };

$('case-form').addEventListener('submit', async (e) => {
  e.preventDefault(); const btn = $('case-save'); btn.disabled = true; btn.textContent = 'جاري الحفظ...';
  let parentId = null; if ($('c-degree').value !== 'first_instance' && $('c-degree').value !== 'felony_first' && $('c-link-parent-check').checked) { parentId = $('c-parent-case').value || null; }
  
  let finalSubType = $('c-subtype').value;
  if ($('c-type').value === 'other' && $('c-other-type').value.trim()) {
      finalSubType = $('c-other-type').value.trim();
  }

  const payload = { 
    case_type: $('c-type').value, 
    sub_type: finalSubType, 
    degree: $('c-degree').value, 
    client_id: $('c-client').value, 
    client_role: $('c-client-role').value, 
    department_id: $('c-dept').value, 
    responsible_lawyer_id: $('c-lawyer').value || null, 
    parent_case_id: parentId, 
    poa_id: $('c-poa').value || null, 
    prosecution: $('c-prosecution').value.trim() || null,
    police_report: $('c-police-report').value.trim() || null,
    charge: $('c-charge').value.trim() || null, 
    judgment: $('c-judgment').value.trim() || null, 
    opponent_lawyer: $('c-opponent-lawyer').value.trim() || null, 
    case_number: $('c-number').value.trim(), 
    case_year: parseInt($('c-year').value, 10), 
    filing_date: $('c-filing-date').value || null, 
    claim_value: parseFloat($('c-claim-value').value) || null, 
    court: $('c-court').value.trim(), 
    circuit: $('c-court-type').value, 
    roll_number: $('c-roll-number').value.trim() || null, 
    courtroom: $('c-courtroom').value.trim() || null, 
    first_hearing_date: $('c-first-hearing').value || null, 
    next_hearing_date: $('c-next-hearing').value || null, 
    appeal_deadline: $('c-appeal-deadline').value || null,
    status: $('c-status').value, 
    subject: $('c-subject').value.trim() || null, 
    client_fees: parseFloat($('c-client-fees').value) || null, 
    court_fees: parseFloat($('c-court-fees').value) || null,
    petty_expenses: parseFloat($('c-petty-expenses').value) || null
  };

  try {
    if (isEditMode) { const { error } = await sb.from('cases').update(payload).eq('id', currentCaseId); if (error) throw error; await sb.from('case_parties').delete().eq('case_id', currentCaseId); if (parties.length > 0) { await sb.from('case_parties').insert(parties.map(p => ({ case_id: currentCaseId, name: p.name, party_role: p.role }))); } flash('تم تعديل القضية بنجاح.'); openCaseDetails(currentCaseId); }
    else { 
      const { data: newCase, error } = await sb.from('cases').insert(payload).select('id').single(); 
      if (error) throw error; 
      const caseId = newCase.id; 
      if (parties.length > 0) { await sb.from('case_parties').insert(parties.map(p => ({ case_id: caseId, name: p.name, party_role: p.role }))); } 
      for (const file of selectedFiles) { const ext = file.name.split('.').pop() || 'bin'; const path = `cases/${caseId}/${crypto.randomUUID()}.${ext}`; const up = await sb.storage.from('law-docs').upload(path, file); if (!up.error) { await sb.from('documents').insert({ case_id: caseId, doc_type: 'other', title: file.name, file_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size }); } } 
      
      // إشعار إضافة قضية جديدة
      await sendNotif('إضافة قضية جديدة ⚖️', `تم إضافة قضية رقم ${payload.case_number} لسنة ${payload.case_year} بواسطة ${me.full_name}`);
      
      flash('تم إضافة القضية بنجاح.'); showList(); 
    }
  } catch (err) { $('case-error').textContent = err.message || 'حدث خطأ.'; $('case-error').hidden = false; } finally { btn.disabled = false; btn.textContent = 'حفظ القضية'; }
});

window.addPartyRow = () => { parties.push({ name: '', role: ($('c-type').value === 'criminal') ? 'متهم / متهمين' : 'مدعي عليه / مدعي عليهم' }); renderParties(); };
window.removePartyRow = (i) => { parties.splice(i, 1); renderParties(); };
window.updateParty = (i, k, v) => { parties[i][k] = v; };

function renderParties() { 
  const c = $('parties-container'); c.replaceChildren(); 
  const typeKey = $('c-type').value;
  const rolesList = (typeKey === 'criminal') ? CRIMINAL_ROLES : CIVIL_ROLES;
  
  parties.forEach((p, i) => { 
    c.append(el('div', { class: 'party-card' }, 
      el('div', { class: 'field' }, el('label', { text: 'الاسم' }), el('input', { type: 'text', value: p.name, oninput: (e) => updateParty(i, 'name', e.target.value) })), 
      el('div', { class: 'field' }, el('label', { text: 'الصفة' }), el('select', { onchange: (e) => updateParty(i, 'role', e.target.value) }, rolesList.map(r => el('option', { value: r.v, text: r.t, selected: p.role === r.v })))), 
      el('button', { type: 'button', class: 'btn small danger btn-remove', text: 'حذف', onclick: () => removePartyRow(i) })
    )); 
  }); 
}

window.updateDocs = () => { $('docs-status').textContent = selectedFiles.length ? `تم اختيار ${selectedFiles.length} ملف.` : 'لم يتم اختيار ملفات.'; };
$('file-docs').addEventListener('change', (e) => { if (e.target.files.length) selectedFiles.push(...Array.from(e.target.files)); updateDocs(); e.target.value = ''; });
async function loadPOAs(clientId, selectedPoaId = null) { const poaSelect = $('c-poa'); poaSelect.innerHTML = '<option value="">— اختر التوكيل —</option>'; if (!clientId) return; const { data } = await sb.from('powers_of_attorney').select('id, poa_number, poa_letter').eq('client_id', clientId).eq('status', 'active'); if (data) data.forEach(p => poaSelect.append(el('option', { value: p.id, text: p.poa_letter ? `توكيل ${p.poa_letter}/${p.poa_number}` : `توكيل ${p.poa_number}`, selected: p.id === selectedPoaId }))); }
$('c-client').addEventListener('change', (e) => loadPOAs(e.target.value));
$('d-file-docs').addEventListener('change', async (e) => { 
  if (!e.target.files.length) return; 
  for (const file of Array.from(e.target.files)) { 
    const ext = file.name.split('.').pop() || 'bin'; 
    const path = `cases/${currentCaseId}/${crypto.randomUUID()}.${ext}`; 
    const up = await sb.storage.from('law-docs').upload(path, file); 
    if (!up.error) await sb.from('documents').insert({ case_id: currentCaseId, doc_type: 'other', title: file.name, file_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size }); 
  } 
  
  // إشعار رفع مستند للقضية
  await sendNotif('رفع مستندات 📁', `تم رفع مستند جديد للقضية رقم ${currentCaseData.case_number} بواسطة ${me.full_name}`);
  
  flash('تم رفع المستندات.'); openCaseDetails(currentCaseId); e.target.value = ''; 
});
async function deleteCurrentCase() { if (!confirm(`حذف القضية ${currentCaseData.case_number} نهائياً؟`)) return; const { error } = await sb.from('cases').delete().eq('id', currentCaseId); if (error) return flash('تعذر الحذف.', false); flash('تم حذف القضية.'); showList(); }

async function init() {
  try {
    const { data: { session } } = await sb.auth.getSession(); if (!session) return goToLogin();
    const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle(); if (!profile || !profile.is_active) { await sb.auth.signOut(); return goToLogin(); }
    me = profile; $('user-name').textContent = profile.full_name; $('user-avatar').textContent = profile.full_name.charAt(0); $('user-role').textContent = profile.role; if (isAdmin()) $('admin-link').hidden = false;
    
    const urlParams = new URLSearchParams(window.location.search); 
    const caseId = urlParams.get('id');
    isReadOnlyMode = urlParams.get('mode') === 'view';

    await loadInitialData(); 
    await loadCases(); 
    updateDynamicDropdowns();
    $('app').hidden = false;
    
    if (caseId) openCaseDetails(caseId);
  } catch (err) {
    console.error("Init Error:", err);
    $('toast').textContent = 'حدث خطأ في تحميل الصفحة. برجاء تحديث الصفحة.';
    $('toast').className = 'alert toast';
    $('toast').hidden = false;
    $('app').hidden = false;
  }
}
$('logout-btn').addEventListener('click', async () => { await sb.auth.signOut(); goToLogin(); });
$('search').addEventListener('input', () => setTimeout(loadCases, 300));
$('btn-add-case').addEventListener('click', startAddCase);
init();