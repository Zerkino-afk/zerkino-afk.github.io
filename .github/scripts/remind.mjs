// Amintirile Gantera: rulează o dată pe oră (GitHub Actions, în repository-ul site-ului).
// Pentru fiecare abonament din Firestore (colecția push): dacă la el acasă e ora aleasă, iar azi n-a notat nimic
// și nu i-am trimis deja azi, îi trimite o notificare. Abonamentele expirate (404/410) se șterg.
// Secrete în GitHub: FIREBASE_SA (cheia JSON a unui cont de serviciu Firebase) și VAPID_PRIVATE. VAPID_PUBLIC e public.
import { fileURLToPath } from 'node:url';

/* data și ora locală într-un fus orar */
export function localTime(tz, now = new Date()) {
  let zone = tz;
  try { new Intl.DateTimeFormat('en', { timeZone: zone }); } catch (e) { zone = 'Europe/Bucharest'; }
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
    .formatToParts(now).map(x => [x.type, x.value]));
  return { date: p.year + '-' + p.month + '-' + p.day, hour: Number(p.hour) % 24 };
}
const zile = n => n === 1 ? 'o zi' : n + ((n % 100 === 0 && n > 0) || n % 100 >= 20 ? ' de zile' : ' zile');
/* ce trimitem cuiva acum (sau null) */
export function reminderFor(d, now = new Date()) {
  if (!d || !d.sub || !d.sub.endpoint || !Number.isInteger(d.h)) return null;
  const t = localTime(d.tz, now);
  if (t.hour !== d.h || d.done === t.date || d.sent === t.date) return null;
  const n = Number(d.n) || 0;
  return { date: t.date, payload: { title: 'Gantera', tag: 'remind', url: './#azi',
    body: n > 0 ? 'N-ai notat nimic azi. Nu-ți pierde seria de ' + zile(n) + '!' : 'N-ai notat nimic azi. Notează ce ai mâncat și pornești seria.' } };
}

async function main() {
  const { FIREBASE_SA, VAPID_PRIVATE, VAPID_PUBLIC } = process.env;
  /* ce secrete vede workflow-ul (fără să le afișeze) */
  let sa = null; try { sa = FIREBASE_SA ? JSON.parse(FIREBASE_SA) : null; } catch (e) { sa = 'invalid'; }
  console.log('FIREBASE_SA: ' + (!FIREBASE_SA ? 'lipsește' : sa === 'invalid' ? 'există, dar nu e JSON valid' : 'ok (proiect ' + sa.project_id + ', ' + (sa.client_email ? 'are client_email' : 'fără client_email') + ')'));
  console.log('VAPID_PRIVATE: ' + (!VAPID_PRIVATE ? 'lipsește' : VAPID_PRIVATE.trim().length === 43 ? 'ok' : 'există, dar are ' + VAPID_PRIVATE.trim().length + ' caractere în loc de 43'));
  if (!sa || sa === 'invalid' || !VAPID_PRIVATE || !VAPID_PUBLIC) { console.log('Nu trimit nimic până nu sunt amândouă secretele în regulă.'); return; }
  const admin = (await import('firebase-admin')).default, webpush = (await import('web-push')).default;
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  webpush.setVapidDetails('https://zerkino-afk.github.io', VAPID_PUBLIC, VAPID_PRIVATE.trim());
  const snap = await admin.firestore().collection('push').get();
  let sent = 0, gone = 0, failed = 0;
  for (const doc of snap.docs) {
    const r = reminderFor(doc.data()); if (!r) continue;
    try { await webpush.sendNotification(doc.data().sub, JSON.stringify(r.payload), { TTL: 3600, urgency: 'normal' }); await doc.ref.update({ sent: r.date }); sent++; }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) { await doc.ref.delete(); gone++; } else { failed++; console.log('nu s-a trimis', doc.id, e.statusCode || e.message); } }
  }
  console.log('abonamente: ' + snap.size + ', trimise: ' + sent + ', expirate șterse: ' + gone + ', erori: ' + failed);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e); process.exit(1); });
