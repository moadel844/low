(function() {
  const modalHtml = `
    <dialog id="edit-request-dialog" style="border: none; border-radius: 12px; padding: 0; box-shadow: 0 10px 30px rgba(0,0,0,0.2); background: var(--surface);">
      <div class="dialog-body" style="padding: 2rem; max-width: 400px;">
        <h2 style="margin-top: 0; color: var(--indigo); margin-bottom: 0.5rem;">طلب تعديل البيانات</h2>
        <p class="muted" style="margin-bottom: 1.5rem; font-size: 0.9rem;">اكتب البيانات اللي عايز تعدلها، وهنبعتها للمدير للموافقة.</p>
        
        <form id="edit-request-form">
          <div class="field"><label>الاسم الجديد (اختياري)</label><input type="text" id="req-name" style="width: 100%; padding: 0.8rem; border: 1px solid var(--line); border-radius: 8px;"></div>
          <div class="field" style="margin-top: 1rem;"><label>رقم الموبايل الجديد (اختياري)</label><input type="tel" id="req-phone" dir="ltr" style="width: 100%; padding: 0.8rem; border: 1px solid var(--line); border-radius: 8px;"></div>
          <div class="field" style="margin-top: 1rem;"><label>البريد الإلكتروني الجديد (اختياري)</label><input type="email" id="req-email" dir="ltr" style="width: 100%; padding: 0.8rem; border: 1px solid var(--line); border-radius: 8px;"></div>
          <div class="field" style="margin-top: 1rem;"><label>ملاحظات إضافية</label><textarea id="req-notes" style="width: 100%; padding: 0.8rem; border: 1px solid var(--line); border-radius: 8px; min-height: 60px;"></textarea></div>
          
          <p id="req-msg" class="alert" hidden style="margin-top: 1rem;"></p>
          
          <div class="row" style="justify-content: flex-end; margin-top: 1.5rem;">
            <button type="submit" id="req-btn" class="btn inline">إرسال الطلب</button>
            <button type="button" class="btn inline ghost" onclick="document.getElementById('edit-request-dialog').close()">إلغاء</button>
          </div>
        </form>
      </div>
    </dialog>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  window.addEventListener('load', () => {
    const userBox = document.querySelector('.user-box');
    const logoutBtn = document.getElementById('logout-btn');
    if (userBox && logoutBtn) {
      const reqBtn = document.createElement('button');
      reqBtn.className = 'btn btn-quiet';
      reqBtn.style.marginLeft = '0.5rem';
      reqBtn.textContent = 'طلب تعديل';
      reqBtn.onclick = () => {
        document.getElementById('edit-request-form').reset();
        document.getElementById('req-msg').hidden = true;
        document.getElementById('edit-request-dialog').showModal();
      };
      userBox.insertBefore(reqBtn, logoutBtn);
    }
  });

  document.getElementById('edit-request-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('req-msg');
    const btn = document.getElementById('req-btn');
    const name = document.getElementById('req-name').value.trim();
    const phone = document.getElementById('req-phone').value.trim();
    const email = document.getElementById('req-email').value.trim();
    const notes = document.getElementById('req-notes').value.trim();

    if (!name && !phone && !email) {
      msg.textContent = 'اكتب حاجة واحدة على الأقل عايز تعدلها.'; msg.className = 'alert'; msg.hidden = false; return;
    }

    btn.disabled = true; btn.textContent = 'جاري الإرسال...'; msg.hidden = true;

    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;

    const { error } = await sb.from('edit_requests').insert({
      user_id: session.user.id,
      requested_name: name || null,
      requested_phone: phone || null,
      requested_email: email || null,
      notes: notes || null
    });

    btn.disabled = false; btn.textContent = 'إرسال الطلب';

    if (error) {
      msg.textContent = 'حدث خطأ: ' + error.message; msg.className = 'alert'; msg.hidden = false;
    } else {
      msg.textContent = 'تم إرسال الطلب للمدير بنجاح!'; msg.className = 'alert ok'; msg.hidden = false;
      setTimeout(() => { document.getElementById('edit-request-dialog').close(); }, 2000);
    }
  });
})();