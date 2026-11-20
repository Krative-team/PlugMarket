// PlugMarket shared logic
let client, allListings=[], activeFilter='All', currentUser=null, currentBuy=null;
const ADMIN_EMAIL="etoabasis@gmail.com";
const PAYSTACK_PUBLIC_KEY="pk_test_cd05ccca0a0a6c2a5eb37fe6688ebaee90fef336";
const PLUGMARKET_USDT_WALLET="TvcrioxeHesHcA8LQAAwZvrZKLTAcZpEvUPFkLeFNWY";
const PLUGMARKET_USDT_NETWORK="TRC20 (Tron)";
const VERIFY_URL="https://pfrpgijjqajwuhyfcdgw.supabase.co/functions/v1/verify-payment";
const NGN_PER_USDT=1500;
const calcFee=p=>Math.round(Number(p||0)*15/100);
const calcSellerShare=p=>Number(p||0)-calcFee(p);
const isAdmin=()=>currentUser && currentUser.email?.toLowerCase().trim()===ADMIN_EMAIL;

function getClient(){
  if(!client) client=window.supabase.createClient("https://pfrpgijjqajwuhyfcdgw.supabase.co","sb_publishable_XCDG8j8Te4UHw_qw8yOnJA_hThHuRdT");
  return client;
}

function updateAuthUI(){
  const authBtn=document.getElementById('authBtn');
  const logoutBtn=document.getElementById('logoutBtn');
  const navAdmin=document.getElementById('nav-admin');
  if(currentUser){
    if(authBtn) authBtn.style.display='none';
    if(logoutBtn) logoutBtn.style.display='inline-block';
    if(navAdmin) navAdmin.style.display = isAdmin() ? 'block' : 'none';
  } else {
    if(authBtn) authBtn.style.display='inline-block';
    if(logoutBtn) logoutBtn.style.display='none';
    if(navAdmin) navAdmin.style.display='none';
  }
  const emailEl=document.getElementById('userEmailText');
  if(emailEl) emailEl.innerText = currentUser && currentUser.email ? currentUser.email : 'Please login to buy';
  const userInfo=document.getElementById('userInfo');
  if(userInfo && currentUser && currentUser.email && !emailEl) userInfo.innerText = currentUser.email;
}

async function loadListings(mode){
  getClient();
  const {data:{user}}=await client.auth.getUser(); currentUser=user;
  updateAuthUI();
  const {data,error}=await client.from('market_listings').select('*').order('created_at',{ascending:false});
  if(error){document.getElementById('status')&&(document.getElementById('status').innerText="Error: "+error.message); return}
  allListings=data||[];
  if(mode==='market') renderMarket();
}

function platformIcon(platform, size=30){
  const paths={
    TikTok:'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z',
    Instagram:'M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.15A4 4 0 1 1 16 12a4 4 0 0 1-4 3.99zm6.4-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z',
    YouTube:'M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z',
    Facebook:'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.09 24 18.1 24 12.07z',
    X:'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
  };
  const d = paths[platform] || paths.X;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#00E676"><path d="${d}"/></svg>`;
}

// --- Hide ONLY contact: keywords + bare phone numbers like 09012465478 / +2349012465478 / wa.me / emails ---
// Monetization, Age, Followers, etc. are NOT touched.
function cleanDesc(t){
  if(!t) return '';
  const PHONE = /(\+?234[\s\-]?[789]\d{9}|0[789]\d{9}|\+?\d[\d\s\-]{7,}\d)/;
  let out = t.split('\n').filter(line=>{
    const l = line.toLowerCase();
    if(l.includes('monetiz')) return true; // keep monetization lines
    if(PHONE.test(line)) return false; // bare phone number line
    return !l.includes('contact') && !l.includes('whatsapp') && !l.includes('wa.me') && !l.includes('phone') && !l.includes('call me') && !l.includes('dm me') && !l.includes('telegram') && !l.includes('email me') && !l.includes('@gmail') && !l.includes('@yahoo') && !l.includes('@hotmail');
  }).join(' ');
  // Remove any phone number left inside a kept line (e.g. "Nice account 090...")
  out = out.replace(/\+?234[\s\-]?[789]\d{9}/g,'').replace(/\b0[789]\d{9}\b/g,'').replace(/wa\.me\/\d+/gi,'');
  return out.replace(/\s+/g,' ').trim();
}

function getAgeText(l){
  const v = l.account_age || l.age || l.account_age_years || l.accountAge || '';
  return v ? String(v) : 'Not specified';
}

// Monetization: supports text field OR boolean
function getMonetizationText(l){
  const v = l.monetization_status ?? l.monetization ?? l.monetised ?? l.monetized ?? l.is_monetized ?? '';
  if(v === true || String(v).toLowerCase() === 'true' || String(v).toLowerCase() === 'yes' || String(v).toLowerCase() === 'monetized') return 'Monetized';
  if(v === false || String(v).toLowerCase() === 'false' || String(v).toLowerCase() === 'no' || String(v).toLowerCase() === 'not monetized') return 'Not Monetized';
  if(v) return String(v);
  // Fallback: check if description mentions it (cleanDesc keeps monetization lines)
  const d = (l.description || '').toLowerCase();
  if(d.includes('not monetized') || d.includes('not monetised')) return 'Not Monetized';
  if(d.includes('monetized') || d.includes('monetised')) return 'Monetized';
  return 'Not specified';
}

function cardHTML(l){
  const ageText = getAgeText(l);
  const monText = getMonetizationText(l);
  const safeDesc = cleanDesc(l.description);
  const monColor = monText === 'Monetized' ? '#00E676' : '#9AA0B0';
  return `<div class="card"><div class="card-top">${platformIcon(l.platform)}</div>
  <div class="card-body"><span class="tag">${l.platform} | ${l.country}</span> ${l.is_verified?'<span class="verified">Verified</span>':''}
  <h3>${l.title}</h3><p class="desc">${safeDesc}</p>
  <div class="meta"><span>${Number(l.followers).toLocaleString()} followers</span><span style="margin-left:10px;color:#9AA0B0">• Account Age: ${ageText}</span></div>
  <div class="meta" style="margin-top:0"><span style="color:${monColor}">• Monetization: ${monText}</span></div>
  <div class="footer"><div><div class="price">NGN ${Number(l.price_naira).toLocaleString()}</div><div class="usdt">$${l.price_usdt} USDT</div></div>
  <button class="buy" onclick="location.href='checkout.html?id=${l.id}'">Buy Now &rarr;</button></div>
  ${l.video_url?'<div style="font-size:11px;color:#00E676;margin-top:8px;display:flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="#00E676"><path d="M8 5v14l11-7z"/></svg> Video Proof</div>':''}</div></div>`;
}

function setFilter(f){ activeFilter=f; ['All','TikTok','Instagram','YouTube','Facebook','X'].forEach(p=>{const b=document.getElementById('btn-'+p); if(b) b.classList.toggle('active',p===f)}); renderMarket(); }

function renderMarket(){
  updateAuthUI();
  const q=(document.getElementById('search')?.value||'').toLowerCase();
  const live=allListings.filter(l=>l.status==='live');
  const filtered=live.filter(l=> (activeFilter==='All'||l.platform===activeFilter||(activeFilter==='X'&&l.platform==='Twitter / X')) && (l.title+' '+l.country+' '+l.platform+' '+cleanDesc(l.description)).toLowerCase().includes(q));
  const st=document.getElementById('status'); if(st) st.innerText=filtered.length+" listings";
  const g=document.getElementById('grid'); if(g) g.innerHTML=filtered.map(cardHTML).join('')||'<p style="color:#aaa">No listings found.</p>';
}

async function doLogout(){ await getClient().auth.signOut(); location.href='index.html'; }
