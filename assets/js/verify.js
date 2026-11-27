(() => {
  const form = document.querySelector('#verify-form');
  const resultBox = document.querySelector('#verify-result');
  if (!form || !resultBox) return;
  const params = new URLSearchParams(location.search);
  const result = params.get('result');
  const errorKey = params.get('error');
  if (result === 'found') {
    const name = params.get('name') || '';
    const course = params.get('course') || '';
    const issued = params.get('issued') || '';
    resultBox.innerHTML = '<p class="verify-found"><strong>Certificate verified.</strong><br>Name: ' + name + '<br>Course: ' + course + '<br>Issued: ' + issued + '</p>';
  } else if (result === 'not-found') {
    resultBox.innerHTML = '<p class="verify-error">No certificate found with that number. Please check the number and try again, or contact us on WhatsApp.</p>';
  } else if (errorKey === 'limit') {
    resultBox.innerHTML = '<p class="verify-error">Too many attempts. Please try again later.</p>';
  } else if (errorKey) {
    resultBox.innerHTML = '<p class="verify-error">Verification is not available right now. Please try again shortly.</p>';
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = form.elements.code?.value?.trim();
    if (!code) return;
    resultBox.innerHTML = '<p>Checking…</p>';
    try {
      const res = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ code }) });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        resultBox.innerHTML = '<p class="verify-found"><strong>Certificate verified.</strong><br>Name: ' + (data.name || '') + '<br>Course: ' + (data.course || '') + '<br>Issued: ' + (data.issuedOn || '') + '</p>';
      } else {
        resultBox.innerHTML = '<p class="verify-error">' + (data.message || 'No certificate found with that number.') + '</p>';
      }
    } catch { resultBox.innerHTML = '<p class="verify-error">Could not connect. Please try again.</p>'; }
  });
})();