const BASE = 'http://localhost:5000/api';

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log('1) Admin login');
  let r = await fetchJson(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@company.com', password: 'Admin@123' }),
  });
  console.log('admin login', r.status, r.data);
  if (!r.ok) return;
  const adminToken = r.data.accessToken ?? r.data.data?.accessToken ?? r.data.data?.accessToken;

  console.log('2) Fetch HR users');
  r = await fetchJson(`${BASE}/users/role/hr`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('hr users', r.status, r.data?.length ?? Object.keys(r.data ?? {}).length);
  if (!r.ok) return;
  const hrUsers = Array.isArray(r.data) ? r.data : r.data.data;
  const hr = hrUsers[0];
  console.log('chosen HR', hr?._id ?? hr?.id, hr?.email, hr?.name);
  if (!hr) return;

  console.log('3) Fetch candidates');
  r = await fetchJson(`${BASE}/candidates`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('candidates status', r.status);
  if (!r.ok) return;
  const candidatesPayload = r.data.data ?? r.data;
  const cands = Array.isArray(candidatesPayload) ? candidatesPayload : candidatesPayload.candidates ?? [];
  console.log('candidate count', cands.length);
  if (cands.length === 0) return;
  const cand = cands[0];
  console.log('selected candidate', cand._id ?? cand.id, cand.name, 'assignedHR', cand.assignedHR);

  console.log('4) Assign candidate to HR');
  r = await fetchJson(`${BASE}/candidates/${cand._id ?? cand.id}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ hrId: hr._id ?? hr.id }),
  });
  console.log('assign response', r.status, r.data);
  
  console.log('5) HR login');
  r = await fetchJson(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hr@company.com', password: 'Hr@123' }),
  });
  console.log('hr login', r.status, r.data);
  if (!r.ok) return;
  const hrToken = r.data.accessToken ?? r.data.data?.accessToken;

  console.log('6) HR fetch notifications');
  r = await fetchJson(`${BASE}/notifications`, {
    headers: { Authorization: `Bearer ${hrToken}` },
  });
  console.log('notifications status', r.status, JSON.stringify(r.data, null, 2).slice(0, 2000));

  const notifications = r.data.data ?? r.data;
  const firstNotification = Array.isArray(notifications) ? notifications[0] : notifications[0];
  if (firstNotification) {
    console.log('7) Mark first notification as read');
    const markResp = await fetchJson(`${BASE}/notifications/${firstNotification._id ?? firstNotification.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    console.log('mark read status', markResp.status, markResp.data);

    console.log('8) Fetch notifications after mark-read');
    const after = await fetchJson(`${BASE}/notifications`, {
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    console.log('notifications after mark-read', after.status, JSON.stringify(after.data, null, 2).slice(0, 2000));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
