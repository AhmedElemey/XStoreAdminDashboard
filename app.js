/* ---------- tiny icon set ---------- */
function ic(n){const p={
 grid:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
 chart:'M3 3v18h18M7 15l3-3 3 3 5-6',
 shield:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
 store:'M3 9l1.5-5h15L21 9M4 9v11h16V9M4 9h16',
 tag:'M20 12l-8 8-9-9V3h8z M7 7h.01',
 box:'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8',
 alert:'M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6A2 2 0 0 0 22 18L13.7 3.9a2 2 0 0 0-3.4 0z',
 users:'M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.9',
 ticket:'M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z',
 image:'M3 3h18v18H3zM3 15l5-5 4 4 3-3 6 6',
 cog:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2.2-1.3L14 2h-4l-.3 2.5a7 7 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.3l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2.2 1.3L10 22h4l.3-2.5a7 7 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6A7 7 0 0 0 19 12z',
 search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
 menu:'M3 6h18M3 12h18M3 18h18',
 bell:'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
 help:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01'
 }[n]||'';
 return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="'+p+'"/></svg>';}

/* ---------- palette helper for avatars ---------- */
const AV=['#2E5C6E','#C68A2E','#3F7A5C','#356F80','#EC4899','#14B8A6','#8B5CF6','#C68A2E'];
const col=s=>AV[[...s].reduce((a,c)=>a+c.charCodeAt(0),0)%AV.length];
const ini=s=>s.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
const avatar=(s,r=9)=>`<span class="ua" style="background:${col(s)};border-radius:${r=='50'?'50%':r+'px'}">${ini(s)}</span>`;
const EGP=n=>'EGP '+n.toLocaleString('en-US');

/* ---------- data (grounded in xStore) ---------- */
const CATS=[['Electronics','📱',4,842,true],['Fashion','👕',4,1290,true],['Home & Garden','🛋️',4,610,true],['Beauty','✨',3,455,true],['Sports','🏋️',3,288,true],['Toys','🧸',3,176,true],['Automotive','🚗',3,203,true],['Food & Drinks','🥤',3,134,false],['Books','📚',3,97,true],['Other','📦',1,58,true]];
const COUPONS=[['WELCOME50','50% off first order','Platform',312,true],['FREESHIP','Free delivery','Platform',890,true],['EID2026','EGP 100 off > EGP 1000','Seasonal',145,false]];
const BANNERS=[['Ramadan Kareem — up to 40% off','Home hero','Active'],['Free delivery this week','Home strip','Active'],['New in: Electronics','Category banner','Scheduled']];
const TEAM=[['Ahmed','Super Admin','Owner · full access'],['Ops Team','Moderator','Orders + disputes'],['Finance','Viewer','Read-only reports']];
const VENDORS=[
 {n:'Cairo Tech Hub',owner:'Ahmed Salah',city:'Giza',cat:'Electronics',status:'active',products:214,gmv:486300,rating:4.7,vok:true,joined:'Jan 2026',wa:'+20 100 123 4567',email:'sales@cairotech.eg'},
 {n:'Zamalek Boutique',owner:'Mona Adel',city:'Cairo',cat:'Fashion',status:'active',products:132,gmv:321400,rating:4.8,vok:true,joined:'Feb 2026',wa:'+20 101 222 3344',email:'hello@zamalekboutique.eg'},
 {n:'Nile Home Décor',owner:'Karim Fouad',city:'Cairo',cat:'Home & Garden',status:'pending',products:0,gmv:0,rating:0,vok:false,joined:'Jul 2026',wa:'+20 106 555 7788',email:'info@nilehome.eg'},
 {n:'Giza Gadgets',owner:'Youssef Ali',city:'Giza',cat:'Electronics',status:'active',products:88,gmv:197500,rating:4.5,vok:true,joined:'Mar 2026',wa:'+20 102 999 1122',email:'shop@gizagadgets.eg'},
 {n:'Alexandria Beauty Bar',owner:'Nour Ibrahim',city:'Alexandria',cat:'Beauty',status:'active',products:156,gmv:264800,rating:4.6,vok:true,joined:'Feb 2026',wa:'+20 103 444 5566',email:'care@alexbeauty.eg'},
 {n:'Maadi Toy Box',owner:'Sara Mostafa',city:'Cairo',cat:'Toys',status:'pending',products:0,gmv:0,rating:0,vok:false,joined:'Jul 2026',wa:'+20 100 777 8899',email:'play@maaditoys.eg'},
 {n:'Heliopolis Sportswear',owner:'Omar Sherif',city:'Cairo',cat:'Sports',status:'suspended',products:41,gmv:52300,rating:3.9,vok:false,joined:'Apr 2026',wa:'+20 106 321 0099',email:'team@heliosport.eg'},
 {n:'Nasr City Books',owner:'Dina Saeed',city:'Cairo',cat:'Books',status:'pending',products:0,gmv:0,rating:0,vok:false,joined:'Jul 2026',wa:'+20 101 654 3210',email:'read@nasrbooks.eg'}];
/* per-vendor product listings (keyed by VENDORS index; pending vendors have none) */
const VLISTINGS={
 0:[ // Cairo Tech Hub — Electronics
  {t:'iPhone 13 Pro 256GB',sub:'Phones & tablets',price:48999,cmp:52999,stock:7,status:'live',sold:42,rating:4.7,emoji:'📱'},
  {t:'Samsung Galaxy S23',sub:'Phones & tablets',price:41500,cmp:45000,stock:12,status:'live',sold:31,rating:4.6,emoji:'📱'},
  {t:'Wireless Earbuds Pro',sub:'Audio',price:1899,cmp:2200,stock:40,status:'live',sold:88,rating:4.4,emoji:'🎧'},
  {t:'Smart Watch Series 8',sub:'Wearables',price:15499,cmp:0,stock:5,status:'live',sold:19,rating:4.5,emoji:'⌚'},
  {t:'65" 4K Smart TV',sub:'TV & audio',price:22999,cmp:25999,stock:3,status:'live',sold:7,rating:4.8,emoji:'📺'},
  {t:'USB-C Fast Charger 65W',sub:'Accessories',price:650,cmp:800,stock:0,status:'out',sold:120,rating:4.3,emoji:'🔌'},
  {t:'Aluminium Laptop Stand',sub:'Accessories',price:480,cmp:0,stock:22,status:'pending',sold:0,rating:0,emoji:'💻'}],
 1:[ // Zamalek Boutique — Fashion
  {t:'Handmade Linen Abaya',sub:"Women's",price:1250,cmp:1600,stock:24,status:'live',sold:54,rating:4.8,emoji:'👗'},
  {t:'Silk Scarf',sub:'Accessories',price:1250,cmp:0,stock:30,status:'live',sold:40,rating:4.7,emoji:'🧣'},
  {t:'Leather Handbag',sub:'Bags',price:2400,cmp:2900,stock:8,status:'live',sold:12,rating:4.6,emoji:'👜'},
  {t:'Cotton Kaftan',sub:"Women's",price:890,cmp:0,stock:15,status:'live',sold:27,rating:4.5,emoji:'👚'},
  {t:'Embroidered Evening Gown',sub:"Women's",price:3600,cmp:4200,stock:4,status:'pending',sold:0,rating:0,emoji:'👗'}],
 3:[ // Giza Gadgets — Electronics
  {t:'Wireless Earbuds Pro',sub:'Audio',price:1899,cmp:0,stock:18,status:'live',sold:33,rating:4.5,emoji:'🎧'},
  {t:'Power Bank 20000mAh',sub:'Accessories',price:750,cmp:900,stock:25,status:'live',sold:61,rating:4.4,emoji:'🔋'},
  {t:'Bluetooth Speaker',sub:'Audio',price:1200,cmp:0,stock:9,status:'live',sold:22,rating:4.3,emoji:'🔊'},
  {t:'Clear Phone Case',sub:'Accessories',price:150,cmp:0,stock:0,status:'out',sold:200,rating:4.1,emoji:'📱'}],
 4:[ // Alexandria Beauty Bar — Beauty
  {t:'Vitamin-C Serum 30ml',sub:'Skincare',price:480,cmp:0,stock:60,status:'live',sold:145,rating:4.7,emoji:'🧴'},
  {t:'Hydrating Face Cream',sub:'Skincare',price:620,cmp:750,stock:33,status:'live',sold:78,rating:4.6,emoji:'🧴'},
  {t:'Matte Lipstick Set',sub:'Makeup',price:390,cmp:0,stock:20,status:'live',sold:52,rating:4.5,emoji:'💄'},
  {t:'Argan Hair Oil 100ml',sub:'Hair care',price:280,cmp:0,stock:0,status:'out',sold:90,rating:4.4,emoji:'💆'}],
 6:[ // Heliopolis Sportswear — Sports (suspended)
  {t:'Running Shoes',sub:'Footwear',price:890,cmp:1100,stock:14,status:'live',sold:25,rating:3.9,emoji:'👟'},
  {t:'Yoga Mat',sub:'Fitness',price:450,cmp:0,stock:8,status:'live',sold:18,rating:4.0,emoji:'🧘'},
  {t:'Gym Gloves',sub:'Fitness',price:220,cmp:0,stock:30,status:'live',sold:11,rating:3.8,emoji:'🧤'}]
};
/* per-vendor commission wallet (mirrors VendorCommissionWallet) — thresholds are owner-configurable */
const VCOMM={
 0:{outstanding:60,warn:100,pause:200},   // healthy
 1:{outstanding:135,warn:100,pause:200},  // warn
 3:{outstanding:210,warn:100,pause:200},  // paused
 4:{outstanding:40,warn:100,pause:200},   // healthy
 6:{outstanding:180,warn:100,pause:200}}; // warn
const vcomm=i=>VCOMM[i]||(VCOMM[i]={outstanding:0,warn:100,pause:200});
const commLevel=c=>c.outstanding>=c.pause?'paused':c.outstanding>=c.warn?'warn':'none';
const PENDING=[
 {t:'iPhone 13 Pro 256GB',v:'Cairo Tech Hub',vok:true,cat:'Electronics',sub:'Phones & tablets',cond:'Like new',brand:'Apple',price:48999,cmp:52999,stock:7,loc:'Giza',ship:60,emoji:'📱',submitted:'2h ago',
  desc:'Factory unlocked, 89% battery health. Includes original box, cable and adapter. Minor scuff on the frame, screen flawless.',
  specs:{Storage:'256GB',RAM:'6GB',Battery:'89%','Screen size':'6.1 inch'},imgs:['📱','📦','🔋']},
 {t:'Handmade Linen Abaya',v:'Zamalek Boutique',vok:true,cat:'Fashion',sub:"Women's",cond:'New',brand:'—',price:1250,cmp:1600,stock:24,loc:'Cairo',ship:40,emoji:'👗',submitted:'5h ago',
  desc:'Premium breathable linen with hand-finished embroidery. Ethically made in Egypt. Available in three sizes.',
  specs:{Size:'S / M / L',Color:'Beige',Material:'100% Linen',Fit:'Relaxed'},imgs:['👗','🧵','✨']},
 {t:'Ergonomic Office Chair',v:'Nile Home Décor',vok:false,cat:'Home & Garden',sub:'Furniture',cond:'New',brand:'ErgoPro',price:3400,cmp:3900,stock:12,loc:'Cairo',ship:150,emoji:'🪑',submitted:'1d ago',
  desc:'Adjustable lumbar support, breathable mesh back, tilt lock, 120kg capacity. Flat-pack, 10-minute assembly.',
  specs:{Dimensions:'66×66×120 cm',Color:'Black',Material:'Mesh + Nylon',Weight:'14 kg'},imgs:['🪑','📦']},
 {t:'Vitamin-C Serum 30ml',v:'Alexandria Beauty Bar',vok:true,cat:'Beauty',sub:'Skincare',cond:'New',brand:'GlowLab',price:480,cmp:0,stock:60,loc:'Alexandria',ship:35,emoji:'🧴',submitted:'1d ago',
  desc:'20% Vitamin-C plus Hyaluronic acid. Brightening daily serum, dermatologically tested, cruelty-free.',
  specs:{Volume:'30 ml','Skin type':'All','Key actives':'Vit-C, HA'},imgs:['🧴','✨']},
 {t:'Wooden Building Blocks',v:'Maadi Toy Box',vok:false,cat:'Toys',sub:'Educational',cond:'New',brand:'—',price:320,cmp:0,stock:40,loc:'Cairo',ship:30,emoji:'🧱',submitted:'2d ago',
  desc:'50-piece non-toxic natural beech-wood set. Encourages motor skills and creativity. Ages 3+.',
  specs:{'Age range':'3+',Material:'Beech wood',Pieces:'50',Battery:'None'},imgs:['🧱','🧸']}];
const ORDERS=[
 {id:'XS-2026-4471',buyer:'Ahmed Hassan',phone:'+20 100 111 2233',addr:'12 Tahrir St, Dokki, Giza',vendor:'Cairo Tech Hub',status:'delivered',items:[['iPhone 13 Pro 256GB',1,48999]]},
 {id:'XS-2026-4470',buyer:'Sara Mostafa',phone:'+20 101 222 3344',addr:'8 Nile Corniche, Maadi, Cairo',vendor:'Zamalek Boutique',status:'shipped',items:[['Handmade Linen Abaya',2,1250]]},
 {id:'XS-2026-4469',buyer:'Karim Fouad',phone:'+20 102 333 4455',addr:'25 Gameat Ad Dowal, Mohandessin, Giza',vendor:'Giza Gadgets',status:'processing',items:[['Wireless Earbuds Pro',1,1899]]},
 {id:'XS-2026-4468',buyer:'Mona Adel',phone:'+20 103 444 5566',addr:'14 Sidi Gaber, Alexandria',vendor:'Alexandria Beauty Bar',status:'confirmed',items:[['Vitamin-C Serum 30ml',2,480]]},
 {id:'XS-2026-4467',buyer:'Youssef Ali',phone:'+20 104 555 6677',addr:'3 Makram Ebeid, Nasr City, Cairo',vendor:'Cairo Tech Hub',status:'pending',items:[['Smart Watch Series 8',1,15499]]},
 {id:'XS-2026-4466',buyer:'Nour Ibrahim',phone:'+20 105 666 7788',addr:'40 Haram St, Giza',vendor:'Zamalek Boutique',status:'delivered',items:[['Silk Scarf',3,1250]]},
 {id:'XS-2026-4465',buyer:'Omar Sherif',phone:'+20 106 777 8899',addr:'7 Roxy Sq, Heliopolis, Cairo',vendor:'Heliopolis Sportswear',status:'cancelled',items:[['Running Shoes',1,890]]}];
const orderTotal=o=>o.items.reduce((s,it)=>s+it[1]*it[2],0);
const OSTAT={pending:['b-grey','Pending'],confirmed:['b-blue','Confirmed'],processing:['b-indigo','Processing'],shipped:['b-amber','Shipped'],delivered:['b-green','Delivered'],cancelled:['b-red','Cancelled']};
const DISPUTES=[
 {id:'XS-2026-4402',buyer:'Layla Kamal',vendor:'Giza Gadgets',reason:'Item not as described',val:720,status:'open',note:'Buyer says the earbuds are a different model than listed. Photos attached to the claim.',sug:'Refund buyer'},
 {id:'XS-2026-4388',buyer:'Tarek Nabil',vendor:'Cairo Tech Hub',reason:'COD refused on delivery',val:48999,status:'open',note:'Customer refused the parcel at the door; vendor requests restocking cover for the failed COD delivery.',sug:'Reject claim (COD refusal)'},
 {id:'XS-2026-4361',buyer:'Dina Saeed',vendor:'Alexandria Beauty Bar',reason:'Damaged on arrival',val:480,status:'open',note:'Serum bottle leaked in transit — likely courier handling fault.',sug:'Refund buyer'},
 {id:'XS-2026-4344',buyer:'Hany Wael',vendor:'Heliopolis Sportswear',reason:'Wrong size shipped',val:890,status:'review',note:'Vendor shipped M instead of L. Vendor has offered a free exchange.',sug:'Partial refund or exchange'},
 {id:'XS-2026-4322',buyer:'Rana Fathy',vendor:'Zamalek Boutique',reason:'Refund not received',val:1250,status:'review',note:'Return accepted 9 days ago, refund still pending from the vendor.',sug:'Refund buyer'},
 {id:'XS-2026-4290',buyer:'Sameh Adel',vendor:'Maadi Toy Box',reason:'Late delivery',val:320,status:'open',note:'Delivered 6 days late; buyer requests partial compensation.',sug:'Partial refund'}];
const CUSTOMERS=[
 {n:'Ahmed Hassan',city:'Cairo',orders:23,spend:142300,joined:'Nov 2025',phone:'+20 100 111 2233'},
 {n:'Sara Mostafa',city:'Giza',orders:18,spend:64200,joined:'Dec 2025',phone:'+20 101 222 3344'},
 {n:'Karim Fouad',city:'Cairo',orders:11,spend:38900,joined:'Jan 2026',phone:'+20 102 333 4455'},
 {n:'Mona Adel',city:'Alexandria',orders:31,spend:98750,joined:'Oct 2025',phone:'+20 103 444 5566'},
 {n:'Youssef Ali',city:'Cairo',orders:7,spend:51600,joined:'Mar 2026',phone:'+20 104 555 6677'},
 {n:'Nour Ibrahim',city:'Giza',orders:14,spend:42100,joined:'Feb 2026',phone:'+20 105 666 7788'}];

/* ---------- view builders ---------- */
const kpi=(ico,val,label,trend,dir,c)=>`<div class="card kpi"><div class="k-top"><div class="k-ico" style="background:${c}22;color:${c}">${ic(ico)}</div><span class="trend ${dir}">${trend}</span></div><div class="k-val">${val}</div><div class="k-label">${label}</div></div>`;

function overview(){
 const catBars=CATS.slice(0,6).map(c=>{const pct=Math.round(c[3]/1290*100);return `<div class="bar-row"><span class="muted">${c[1]} ${c[0]}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><b class="r">${c[3]}</b></div>`}).join('');
 const rev=[62,58,71,69,84,78,96,102,94,115,108,124];
 const max=Math.max(...rev),pts=rev.map((v,i)=>`${20+i*(560/11)},${180-(v/max)*150}`).join(' ');
 const area=`20,180 ${pts} 580,180`;
 const pend=PENDING.slice(0,4).map((p,i)=>`<div class="list-row" style="cursor:pointer" onclick="go('moderation')">${avatar(p.v)}<div style="flex:1"><b>${p.t}</b><small class="muted">${p.v} · ${p.cat}</small></div><span class="badge-s b-amber">Pending</span></div>`).join('');
 const ords=ORDERS.slice(0,5).map((o,i)=>`<div class="list-row" style="cursor:pointer" onclick="go('orders')"><div style="flex:1"><b>${o.id}</b><small class="muted">${o.buyer}</small></div><span class="money">${EGP(orderTotal(o))}</span><span class="badge-s ${OSTAT[o.status][0]}" style="margin-left:12px">${OSTAT[o.status][1]}</span></div>`).join('');
 return `
 <div class="page-head"><div><h2>Marketplace Overview</h2><p>Last 30 days · All vendors · EGP · Cash on Delivery</p></div>
   <div style="display:flex;gap:10px"><button class="btn btn-g">Export</button><button class="btn btn-p" onclick="openAnnouncementForm()">+ New announcement</button></div></div>
 <div class="grid g-4">
   ${kpi('chart',EGP(1240000).replace('EGP ','EGP '),'GMV (30d)','+14%','up','#2E5C6E')}
   ${kpi('box','3,482','Orders (30d)','+9%','up','#C68A2E')}
   ${kpi('store','128','Active vendors','+6','up','#3F7A5C')}
   ${kpi('shield','17','Pending approvals','Action','down','#B4472E')}
 </div>
 <div class="grid g-2 mt">
   <div class="card"><div class="c-head"><h3>Revenue trend</h3><span class="badge-s b-green">▲ 14% vs last month</span></div>
     <div class="c-body"><svg viewBox="0 0 600 190" width="100%" height="190">
       <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E5C6E" stop-opacity=".28"/><stop offset="1" stop-color="#2E5C6E" stop-opacity="0"/></linearGradient></defs>
       <polygon points="${area}" fill="url(#ag)"/><polyline points="${pts}" fill="none" stroke="#2E5C6E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
       ${rev.map((v,i)=>`<circle cx="${20+i*(560/11)}" cy="${180-(v/max)*150}" r="3" fill="#2E5C6E"/>`).join('')}
     </svg><div class="legend"><span><i style="background:#2E5C6E"></i>Monthly GMV (EGP, thousands)</span></div></div></div>
   <div class="card"><div class="c-head"><h3>Sales by category</h3></div><div class="c-body"><div class="bars">${catBars}</div></div></div>
 </div>
 <div class="grid g-2 mt">
   <div class="card"><div class="c-head"><h3>Recent orders</h3><a class="muted" data-jump="orders" style="cursor:pointer;font-size:12.5px">View all →</a></div><div class="c-body" style="padding-top:6px">${ords}</div></div>
   <div class="card"><div class="c-head"><h3>Awaiting your approval</h3><a class="muted" data-jump="moderation" style="cursor:pointer;font-size:12.5px">Review →</a></div><div class="c-body" style="padding-top:6px">${pend}</div></div>
 </div>`;
}

function moderation(){
 const rows=PENDING.map((p,i)=>`<div class="mod" id="mod-${i}" data-status="pending"><div class="thumb" style="cursor:pointer" onclick="productDrawer(${i})">${p.emoji}</div>
   <div class="minfo" style="cursor:pointer" onclick="productDrawer(${i})"><b>${p.t}</b>
     <p>${p.v}${p.vok?' <span class="badge-s b-green" style="padding:1px 7px">✓ verified</span>':' <span class="badge-s b-amber" style="padding:1px 7px">unverified</span>'} · <span class="badge-s b-grey">${p.cat}</span> · <span class="money">${EGP(p.price)}</span> · stock ${p.stock}</p>
     <p class="muted" style="font-size:12px;margin-top:3px">Submitted ${p.submitted} · ${p.imgs.length} photos · ${p.cond}</p></div>
   <div class="mactions">
     <button class="btn btn-g btn-sm" onclick="productDrawer(${i})">Details</button>
     <button class="btn btn-ok btn-sm" onclick="decide(${i},'approve')">✓ Approve</button>
     <button class="btn btn-no btn-sm" onclick="decide(${i},'reject')">✕ Reject</button>
   </div></div>`).join('');
 return `<div class="page-head"><div><h2>Product Moderation</h2><p>New listings go live only after admin approval — click any product to see full details</p></div>
   <div class="tabs"><span class="chip active">Pending</span><span class="chip">Approved</span><span class="chip">Rejected</span></div></div>
   <div class="grid g-4" style="margin-bottom:18px">
     ${kpi('shield',String(PENDING.length),'Pending review','','down','#C68A2E')}
     ${kpi('box','48','Approved (7d)','+12','up','#3F7A5C')}
     ${kpi('alert','5','Rejected (7d)','','down','#B4472E')}
     ${kpi('chart','3.2h','Avg review time','-0.4h','up','#2E5C6E')}</div>
   <div class="grid" style="gap:14px" id="modList"><b id="pendCount" style="display:none">${PENDING.length}</b>${rows}</div>`;
}

function productDrawer(i){
 const p=PENDING[i];
 const imgs=p.imgs.map(e=>`<div style="width:74px;height:74px;border-radius:11px;background:linear-gradient(135deg,#EAF0F1,#DAE6E9);display:flex;align-items:center;justify-content:center;font-size:32px;flex:0 0 74px">${e}</div>`).join('');
 const specs=Object.keys(p.specs).map(k=>kv(k,p.specs[k])).join('');
 const cmp=p.cmp?` <span style="text-decoration:line-through;color:var(--text-3);font-size:15px;font-weight:500">${EGP(p.cmp)}</span> <span class="badge-s b-red">-${Math.round((1-p.price/p.cmp)*100)}%</span>`:'';
 openDrawer('Review product',
   `<div style="display:flex;gap:8px;overflow:auto;margin-bottom:16px">${imgs}</div>
    <h3 style="font-size:17px;margin-bottom:6px">${p.t}</h3>
    <div style="font-size:22px;font-weight:800;color:var(--primary)">${EGP(p.price)}${cmp}</div>
    <div style="margin:12px 0;display:flex;gap:6px;flex-wrap:wrap"><span class="badge-s b-amber">Pending approval</span><span class="badge-s b-grey">${p.cond}</span><span class="badge-s b-indigo">Stock: ${p.stock}</span></div>
    <p class="muted" style="font-size:13px;line-height:1.6;margin-bottom:16px">${p.desc}</p>
    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-3);margin-bottom:4px">Product details</h3>
    ${kv('Vendor (business)',p.v+(p.vok?' · ✓ verified':' · unverified'))}${kv('Category',p.cat+' › '+p.sub)}${kv('Brand',p.brand)}${kv('Condition',p.cond)}${kv('Location',p.loc)}${kv('Shipping',p.ship?EGP(p.ship):'Free')}${kv('Submitted',p.submitted)}
    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-3);margin:16px 0 4px">Specifications</h3>${specs}`,
   `<button class="btn btn-ok" style="flex:1;justify-content:center" onclick="decide(${i},'approve');closeDrawer()">Approve</button><button class="btn btn-g" style="flex:1;justify-content:center" onclick="decide(${i},'changes');closeDrawer()">Request changes</button><button class="btn btn-no" style="flex:1;justify-content:center" onclick="decide(${i},'reject');closeDrawer()">Reject</button>`);
}

function vendors(){
 const rows=VENDORS.map((v,i)=>{const st=v.status==='active'?'b-green':v.status==='pending'?'b-amber':'b-red';
   const act=v.status==='pending'?`<button class="btn btn-ok btn-sm" onclick="vdecide(${i},'approve')">Approve</button><button class="btn btn-no btn-sm" onclick="vdecide(${i},'reject')">Reject</button>`
     :v.status==='suspended'?`<button class="btn btn-g btn-sm" onclick="vdecide(${i},'reinstate')">Reinstate</button>`
     :`<button class="btn btn-g btn-sm" onclick="vdecide(${i},'suspend')">Suspend</button>`;
   return `<tr data-status="${v.status}"><td><div class="u" style="cursor:pointer" onclick="openVendorProducts(${i})" title="View ${v.n}'s listings">${avatar(v.n)}<div><b>${v.n}</b><small>${v.owner} · ${v.city}</small></div></div></td>
     <td><span class="badge-s b-indigo">🏢 Business</span></td>
     <td><span class="badge-s ${st}"><span class="dotb" style="background:currentColor"></span>${v.status[0].toUpperCase()+v.status.slice(1)}</span></td>
     <td><a style="cursor:pointer;color:var(--primary);font-weight:600" onclick="openVendorProducts(${i})">${v.products||'—'}</a></td><td class="money">${v.gmv?EGP(v.gmv):'—'}</td><td>${v.rating?'⭐ '+v.rating:'—'}</td>
     <td class="r"><button class="btn btn-g btn-sm" onclick="openVendorProducts(${i})">Listings</button><button class="btn btn-g btn-sm" onclick="vendorDrawer(${i})">Details</button>${act}</td></tr>`}).join('');
 return `<div class="page-head"><div><h2>Vendors</h2><p><b>Business</b> accounts — sellers on the marketplace (role: vendor). Individual buyers are under <a data-jump="customers" style="color:var(--primary);cursor:pointer">Users</a>.</p></div>
   <div class="tabs"><span class="chip active">All</span><span class="chip">Pending</span><span class="chip">Active</span><span class="chip">Suspended</span></div></div>
   <div class="card"><table><thead><tr><th>Vendor</th><th>Account type</th><th>Status</th><th>Products</th><th>GMV</th><th>Rating</th><th class="r">Action</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function categories(){
 const cards=CATS.map((c,i)=>`<div class="cat"><div class="ci">${c[1]}</div>
   <div class="cmeta"><b>${c[0]}</b><small>${c[2]} subcategories · ${c[3]} live products</small></div>
   <div class="switch ${c[4]?'':'off'}" onclick="this.classList.toggle('off');toast('${c[0]} '+(this.classList.contains('off')?'hidden':'visible'))"></div></div>`).join('');
 return `<div class="page-head"><div><h2>Categories</h2><p>Server-driven taxonomy (10 categories · 31 subcategories) — powers <b>GET /categories</b></p></div>
   <button class="btn btn-p" onclick="openCategoryForm()">+ Add category</button></div>
   <div class="card"><div class="c-body"><div class="cat-grid">${cards}</div></div></div>`;
}

function orders(){
 const rows=ORDERS.map((o,i)=>`<tr data-status="${o.status}"><td><b>${o.id}</b></td><td><div class="u">${avatar(o.buyer)}<b>${o.buyer}</b></div></td>
   <td class="muted">${o.vendor}</td><td class="money">${EGP(orderTotal(o))}</td><td><span class="badge-s b-grey">COD</span></td>
   <td><span class="badge-s ${OSTAT[o.status][0]}">${OSTAT[o.status][1]}</span></td><td class="r"><button class="btn btn-g btn-sm" onclick="orderDrawer(${i})">View</button></td></tr>`).join('');
 return `<div class="page-head"><div><h2>Orders</h2><p>Every order across the marketplace · payment: Cash on Delivery</p></div>
   <div class="tabs" id="ordTabs"><span class="chip active">All</span><span class="chip">Pending</span><span class="chip">Processing</span><span class="chip">Shipped</span><span class="chip">Delivered</span><span class="chip">Cancelled</span></div></div>
   <div class="grid g-4" style="margin-bottom:18px">
     ${kpi('box','3,482','Total orders','','up','#2E5C6E')}${kpi('chart','EGP 356','Avg order value','+3%','up','#3F7A5C')}
     ${kpi('alert','12%','COD refusal rate','watch','down','#C68A2E')}${kpi('shield','98.1%','Fulfillment rate','+1%','up','#356F80')}</div>
   <div class="card"><table><thead><tr><th>Order</th><th>Buyer</th><th>Vendor</th><th>Total</th><th>Payment</th><th>Status</th><th class="r"></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function disputes(){
 const rows=DISPUTES.map((d,i)=>`<tr data-status="${d.status}"><td><b>${d.id}</b></td><td><div class="u">${avatar(d.buyer)}<b>${d.buyer}</b></div></td>
   <td class="muted">${d.vendor}</td><td>${d.reason}</td><td class="money">${EGP(d.val)}</td>
   <td><span class="badge-s ${d.status==='open'?'b-red':'b-amber'}">${d.status==='open'?'Open':'In review'}</span></td>
   <td class="r"><button class="btn btn-p btn-sm" onclick="disputeDrawer(${i})">Resolve</button></td></tr>`).join('');
 return `<div class="page-head"><div><h2>Disputes</h2><p>Buyer–vendor cases needing arbitration · order snapshots attached as evidence</p></div>
   <div class="tabs"><span class="chip active">Open (4)</span><span class="chip">In review (2)</span><span class="chip">Resolved</span></div></div>
   <div class="card"><table><thead><tr><th>Order</th><th>Buyer</th><th>Vendor</th><th>Reason</th><th>Value</th><th>Status</th><th class="r">Action</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function customers(){
 const rows=CUSTOMERS.map((c,i)=>`<tr data-status="active"><td><div class="u" style="cursor:pointer" onclick="userDrawer(${i})">${avatar(c.n,'50')}<div><b>${c.n}</b><small>role: consumer</small></div></div></td><td class="muted">${c.city}</td>
   <td><span class="badge-s b-blue">👤 Customer</span></td>
   <td>${c.orders}</td><td class="money">${EGP(c.spend)}</td><td><span class="badge-s b-green">Active</span></td>
   <td class="r"><button class="btn btn-g btn-sm" onclick="userDrawer(${i})">Profile</button></td></tr>`).join('');
 return `<div class="page-head"><div><h2>Users</h2><p>Individual <b>customer</b> accounts — normal buyers (role: consumer). <b>Business</b> accounts are managed under <a data-jump="vendors" style="color:var(--primary);cursor:pointer">Vendors</a>.</p></div>
   <button class="btn btn-g">Export CSV</button></div>
   <div class="tabs" style="margin-bottom:18px"><span class="chip active">👤 Customers</span><span class="chip" data-jump="vendors">🏢 Business (vendors)</span></div>
   <div class="grid g-3" style="margin-bottom:18px">${kpi('users','41,208','Total customers','+7%','up','#2E5C6E')}${kpi('chart','2.4','Orders per customer','+0.2','up','#C68A2E')}${kpi('box','63%','Repeat rate','+4%','up','#3F7A5C')}</div>
   <div class="card"><table><thead><tr><th>User</th><th>City</th><th>Account type</th><th>Orders</th><th>Lifetime spend</th><th>Status</th><th class="r"></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function coupons(){
 const C=COUPONS;
 const rows=C.map((c,i)=>`<tr><td><b>${c[0]}</b></td><td class="muted">${c[1]}</td><td><span class="badge-s b-indigo">${c[2]}</span></td><td>${c[3]} used</td><td><span class="badge-s ${c[4]?'b-green':'b-grey'}">${c[4]?'Active':'Ended'}</span></td><td class="r" style="white-space:nowrap"><button class="btn btn-g btn-sm" onclick="editCoupon(${i})">Edit</button> <button class="btn btn-no btn-sm" onclick="deleteCoupon(${i})">Delete</button></td></tr>`).join('');
 return `<div class="page-head"><div><h2>Coupons &amp; Promotions</h2><p>Platform-wide discounts (vendor coupons come later)</p></div><button class="btn btn-p" onclick="openCouponForm()">+ New coupon</button></div>
   <div class="split"><div class="card"><table><thead><tr><th>Code</th><th>Offer</th><th>Scope</th><th>Usage</th><th>Status</th><th class="r"></th></tr></thead><tbody>${rows}</tbody></table></div>
   <div class="card"><div class="c-head"><h3>Create coupon</h3></div><div class="c-body">
     <div class="form-row"><label>Code</label><input id="ciCode" placeholder="e.g. SUMMER25"></div>
     <div class="form-row"><label>Type</label><select id="ciType"><option>Percentage</option><option>Fixed amount (EGP)</option><option>Free delivery</option></select></div>
     <div class="form-row"><label>Value</label><input id="ciVal" placeholder="25"></div>
     <div class="form-row"><label>Min. order (EGP)</label><input id="ciMin" placeholder="500"></div>
     <button class="btn btn-p" style="width:100%;justify-content:center" onclick="createCouponInline()">Create coupon</button></div></div></div>`;
}

function content(){
 const B=BANNERS;
 const rows=B.map((b,i)=>`<div class="banner"><div class="bimg"></div><div style="flex:1"><b>${b[0]}</b><br><small class="muted">${b[1]}</small></div><span class="badge-s ${b[2]==='Active'?'b-green':'b-amber'}">${b[2]}</span><button class="btn btn-g btn-sm" onclick="editBanner(${i})">Edit</button><button class="btn btn-no btn-sm" onclick="deleteBanner(${i})">Delete</button></div>`).join('');
 return `<div class="page-head"><div><h2>Content &amp; Banners</h2><p>Merchandise the app home feed and send push broadcasts</p></div><button class="btn btn-p" onclick="openBannerForm()">+ New banner</button></div>
   <div class="split"><div class="card"><div class="c-head"><h3>Home banners</h3></div><div class="c-body" style="display:flex;flex-direction:column;gap:12px">${rows}</div></div>
   <div class="card"><div class="c-head"><h3>Push broadcast</h3></div><div class="c-body">
     <div class="form-row"><label>Title</label><input placeholder="Flash sale ends tonight!"></div>
     <div class="form-row"><label>Audience</label><select><option>All buyers</option><option>Cairo / Giza</option><option>Lapsed buyers</option></select></div>
     <div class="form-row"><label>Message</label><input placeholder="Up to 40% off electronics…"></div>
     <button class="btn btn-p" style="width:100%;justify-content:center" onclick="sendBroadcast()">Send push</button></div></div></div>`;
}

function analytics(){
 const funnel=[['Installs',100],['Sign-ups',58],['Added to cart',34],['Placed order',19],['Repeat order',12]];
 const fb=funnel.map(f=>`<div class="bar-row"><span class="muted">${f[0]}</span><div class="bar-track"><div class="bar-fill" style="width:${f[1]}%"></div></div><b class="r">${f[1]}%</b></div>`).join('');
 const top=VENDORS.filter(v=>v.gmv).sort((a,b)=>b.gmv-a.gmv).slice(0,5).map((v,i)=>`<div class="list-row"><b style="color:var(--text-3);width:18px">${i+1}</b>${avatar(v.n)}<div style="flex:1"><b>${v.n}</b><small class="muted">${v.city}</small></div><span class="money">${EGP(v.gmv)}</span></div>`).join('');
 return `<div class="page-head"><div><h2>Analytics</h2><p>Marketplace health · acquisition → retention</p></div>
   <div class="tabs"><span class="chip">7d</span><span class="chip active">30d</span><span class="chip">90d</span></div></div>
   <div class="grid g-4">${kpi('chart','EGP 1.24M','GMV','+14%','up','#2E5C6E')}${kpi('box','3,482','Orders','+9%','up','#C68A2E')}${kpi('users','2,910','New buyers','+11%','up','#3F7A5C')}${kpi('alert','12%','COD refusals','watch','down','#C68A2E')}</div>
   <div class="grid g-2 mt"><div class="card"><div class="c-head"><h3>Conversion funnel</h3></div><div class="c-body"><div class="bars">${fb}</div><p class="muted" style="margin-top:14px;font-size:12.5px">Biggest drop-off: install → sign-up (login-gated). Test guest browse to lift the top of funnel.</p></div></div>
   <div class="card"><div class="c-head"><h3>Top vendors by GMV</h3></div><div class="c-body" style="padding-top:6px">${top}</div></div></div>`;
}

function settings(){
 const toggles=[['Require admin approval before products go live',true],['Require admin approval for new vendors',true],['Cash on Delivery enabled',true],['Online payment gateway (Paymob/Fawry)',false],['Guest browsing (no login)',false],['Allow vendor-level coupons',false]];
 const rows=toggles.map(t=>`<div class="list-row"><div style="flex:1"><b>${t[0]}</b></div><div class="switch ${t[1]?'':'off'}" onclick="this.classList.toggle('off')"></div></div>`).join('');
 return `<div class="page-head"><div><h2>Settings</h2><p>Marketplace rules &amp; launch configuration</p></div></div>
   <div class="split"><div class="card"><div class="c-head"><h3>Marketplace policies</h3></div><div class="c-body" style="padding-top:4px">${rows}</div></div>
   <div class="card"><div class="c-head"><h3>Roles &amp; access</h3></div><div class="c-body">
     ${TEAM.map(t=>`<div class="list-row">${avatar(t[0])}<div style="flex:1"><b>${t[0]}</b><small class="muted">${t[2]}</small></div><span class="badge-s ${t[1]==='Super Admin'?'b-indigo':t[1]==='Moderator'?'b-blue':'b-grey'}">${t[1]}</span></div>`).join('')}
     <button class="btn btn-g mt" style="width:100%;justify-content:center" onclick="openInviteForm()">+ Invite team member</button></div></div></div>`;
}

const VIEWS={overview,analytics,moderation,vendors,categories,orders,disputes,customers,coupons,content,settings};
const TITLES={overview:'Dashboard',analytics:'Analytics',moderation:'Product Moderation',vendors:'Vendors',categories:'Categories',orders:'Orders',disputes:'Disputes',customers:'Users',coupons:'Coupons',content:'Content & Banners',settings:'Settings'};

/* ---------- responsive sidebar (off-canvas below 1050px) ---------- */
function syncOverlay(){
 const show=document.getElementById('drawer').classList.contains('show')||document.querySelector('.sidebar').classList.contains('open');
 document.getElementById('overlay').classList.toggle('show',show);
}
function toggleSidebar(){document.querySelector('.sidebar').classList.toggle('open');syncOverlay();}
function closeSidebar(){document.querySelector('.sidebar').classList.remove('open');syncOverlay();}

/* ---------- router ---------- */
function go(v){
 document.getElementById('content').innerHTML=VIEWS[v]();
 document.getElementById('topTitle').textContent=TITLES[v];
 document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('active',a.dataset.view===v));
 const s=document.getElementById('searchInput'); if(s) s.value='';
 closeSidebar();
 window.scrollTo(0,0);
}
document.querySelectorAll('#nav a').forEach(a=>a.onclick=()=>go(a.dataset.view));

/* ---------- toast + moderation ---------- */
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200);}
function decide(i,action){const el=document.getElementById('mod-'+i);if(!el)return;el.style.transition='.3s';el.style.opacity='0';el.style.transform='translateX(30px)';setTimeout(()=>{el.remove();const c=document.getElementById('pendCount');const n=c?Math.max(0,(+c.textContent)-1):0;if(c)c.textContent=n;const b=document.querySelector('#nav a[data-view=moderation] .badge');if(b){if(n>0)b.textContent=n;else b.remove();}},300);const msg={approve:'Product approved — now live ✓',reject:'Product rejected — vendor notified',changes:'Sent back to vendor for changes'};toast(msg[action]||'Done');}

/* ---------- detail drawer ---------- */
function openDrawer(title,html,actions){
 const d=document.getElementById('drawer');
 d.innerHTML='<div class="d-head"><b style="font-size:16px">'+title+'</b><div class="d-close" onclick="closeDrawer()">✕</div></div><div class="d-body">'+html+(actions?'<div style="display:flex;gap:8px;margin-top:20px">'+actions+'</div>':'')+'</div>';
 d.classList.add('show');syncOverlay();
}
function closeDrawer(){document.getElementById('drawer').classList.remove('show');syncOverlay();}
const cellTxt=(tr,i)=>tr.children[i]?tr.children[i].innerText.trim():'';
const kv=(k,v)=>'<div class="kv"><span>'+k+'</span><b>'+v+'</b></div>';
const secH=t=>'<h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-3);margin:16px 0 4px">'+t+'</h3>';
function orderDrawer(i){
 const o=ORDERS[i];
 const items=o.items.map(it=>kv(it[0]+' × '+it[1], EGP(it[1]*it[2]))).join('');
 const steps=['Pending','Confirmed','Processing','Shipped','Delivered'];
 const cur=steps.indexOf(OSTAT[o.status][1]);
 const tl=o.status==='cancelled'
   ?'<div class="list-row"><span class="dotb" style="width:11px;height:11px;background:var(--error)"></span><span style="color:var(--error)">Cancelled</span></div>'
   :steps.map((s,x)=>'<div class="list-row"><span class="dotb" style="width:11px;height:11px;background:'+(x<=cur?'var(--success)':'var(--line)')+'"></span><span style="'+(x<=cur?'':'color:var(--text-3)')+'">'+s+'</span></div>').join('');
 const canCancel=['pending','confirmed','processing'].indexOf(o.status)>-1;
 openDrawer('Order '+o.id,
   kv('Status',OSTAT[o.status][1])+kv('Buyer (customer)',o.buyer)+kv('Phone',o.phone)+kv('Vendor (business)',o.vendor)+kv('Payment','Cash on Delivery')
   +secH('Delivery address')+'<p class="muted" style="font-size:13px">'+o.addr+'</p>'
   +secH('Items')+items+kv('<b>Total</b>','<b>'+EGP(orderTotal(o))+'</b>')
   +secH('Fulfilment timeline')+tl,
   '<button class="btn btn-p" style="flex:1;justify-content:center" onclick="toast(\'Message sent to vendor\');closeDrawer()">Contact vendor</button>'
   +(canCancel?'<button class="btn btn-no" style="flex:1;justify-content:center" onclick="toast(\'Order cancelled\');closeDrawer()">Cancel order</button>':'<button class="btn btn-g" style="flex:1;justify-content:center" onclick="closeDrawer()">Close</button>'));
}
function userDrawer(i){
 const c=CUSTOMERS[i];
 openDrawer(c.n,
   '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">'+avatar(c.n,'50')+'<div><b style="font-size:16px">'+c.n+'</b><div class="muted" style="font-size:12.5px">Customer · role: consumer</div></div></div>'
   +'<div style="margin-bottom:8px"><span class="badge-s b-blue">👤 Customer</span> <span class="badge-s b-green">Active</span></div>'
   +secH('Account')
   +kv('City',c.city)+kv('Phone',c.phone)+kv('Joined',c.joined)+kv('Total orders',c.orders)+kv('Lifetime spend',EGP(c.spend))+kv('Avg order',EGP(Math.round(c.spend/c.orders))),
   '<button class="btn btn-p" style="flex:1;justify-content:center" onclick="toast(\'Message sent to customer\');closeDrawer()">Message</button><button class="btn btn-no" style="flex:1;justify-content:center" onclick="toast(\'Customer suspended\');closeDrawer()">Suspend</button>');
}
function disputeDrawer(i){
 const d=DISPUTES[i];
 openDrawer('Dispute — '+d.id,
   kv('Buyer',d.buyer)+kv('Vendor',d.vendor)+kv('Reason',d.reason)+kv('Order value',EGP(d.val))+kv('Status',d.status==='open'?'Open':'In review')
   +secH('Case notes')+'<p class="muted" style="font-size:13px;line-height:1.6">'+d.note+'</p>'
   +'<div style="margin-top:12px;padding:10px 12px;background:#EAF0F1;border-radius:9px;font-size:12.5px"><b>Suggested resolution:</b> '+d.sug+'</div>'
   +'<p class="muted" style="margin-top:12px;font-size:12px">Order snapshot attached as evidence.</p>',
   '<button class="btn btn-ok" style="flex:1;justify-content:center" onclick="toast(\'Buyer refunded ✓\');closeDrawer()">Refund buyer</button><button class="btn btn-g" style="flex:1;justify-content:center" onclick="toast(\'Partial refund issued\');closeDrawer()">Partial</button><button class="btn btn-no" style="flex:1;justify-content:center" onclick="toast(\'Claim rejected\');closeDrawer()">Reject</button>');
}
function vendorDrawer(i){
 const v=VENDORS[i];
 const sm={active:['b-green','Active'],pending:['b-amber','Pending approval'],suspended:['b-red','Suspended']}[v.status];
 const actions=v.status==='pending'
   ?'<button class="btn btn-ok" style="flex:1;justify-content:center" onclick="vdecide('+i+',\'approve\')">Approve vendor</button><button class="btn btn-no" style="flex:1;justify-content:center" onclick="vdecide('+i+',\'reject\')">Reject</button>'
   :v.status==='suspended'
   ?'<button class="btn btn-ok" style="flex:1;justify-content:center" onclick="vdecide('+i+',\'reinstate\')">Reinstate</button><button class="btn btn-g" style="flex:1;justify-content:center" onclick="closeDrawer()">Close</button>'
   :'<button class="btn btn-p" style="flex:1;justify-content:center" onclick="closeDrawer();openVendorProducts('+i+')">View listings</button><button class="btn btn-no" style="flex:1;justify-content:center" onclick="vdecide('+i+',\'suspend\')">Suspend</button>';
 openDrawer('Vendor — '+v.n,
   '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">'+avatar(v.n)+'<div><b style="font-size:16px">'+v.n+'</b><div class="muted" style="font-size:12.5px">'+v.owner+' · '+v.city+'</div></div></div>'
   +'<div style="margin-bottom:8px;display:flex;gap:6px;flex-wrap:wrap"><span class="badge-s b-indigo">🏢 Business</span><span class="badge-s '+sm[0]+'">'+sm[1]+'</span>'+(v.vok?'<span class="badge-s b-green">✓ verified</span>':'<span class="badge-s b-amber">unverified</span>')+'</div>'
   +secH('Business profile')
   +kv('Owner',v.owner)+kv('Primary category',v.cat)+kv('Location',v.city)+kv('Joined',v.joined)+kv('Products',v.products||'—')+kv('GMV',v.gmv?EGP(v.gmv):'—')+kv('Rating',v.rating?'⭐ '+v.rating:'—')+kv('Wallet — owed to platform','<span style="color:'+(commLevel(vcomm(i))==='paused'?'#B4472E':commLevel(vcomm(i))==='warn'?'#C68A2E':'inherit')+'">'+EGP(vcomm(i).outstanding)+'</span>')
   +secH('Contact')+kv('WhatsApp',v.wa)+kv('Email',v.email),
   actions);
}
function vdecide(i,action){
 if(action==='reject'){VENDORS.splice(i,1);toast('Vendor application rejected');closeDrawer();go('vendors');return;}
 const ns={approve:'active',suspend:'suspended',reinstate:'active'}[action];
 if(ns) VENDORS[i].status=ns;
 toast({approve:'Vendor approved — now selling ✓',suspend:'Vendor suspended',reinstate:'Vendor reinstated'}[action]||'Done');
 closeDrawer(); go('vendors');
 const pend=VENDORS.filter(x=>x.status==='pending').length;
 const b=document.querySelector('#nav a[data-view=vendors] .badge'); if(b){if(pend>0)b.textContent=pend;else b.remove();}
}

/* ---------- vendor page (listings + orders) ---------- */
const LSTAT={live:['b-green','Live'],pending:['b-amber','Pending'],out:['b-red','Out of stock']};
const emptyCard=(ico,title,sub)=>`<div class="card"><div class="c-body" style="text-align:center;padding:48px 24px">
   <div style="font-size:40px;margin-bottom:10px">${ico}</div><b style="font-size:15px">${title}</b>
   <p class="muted" style="font-size:13px;margin-top:4px">${sub}</p></div></div>`;
function vendorProducts(i,tab){
 tab=tab||'listings';
 const v=VENDORS[i];
 const list=VLISTINGS[i]||[];
 const vOrders=ORDERS.map((o,idx)=>({o,idx})).filter(x=>x.o.vendor===v.n);
 const sm={active:['b-green','Active'],pending:['b-amber','Pending approval'],suspended:['b-red','Suspended']}[v.status];
 const header=`
  <div style="margin-bottom:14px"><a class="btn btn-g btn-sm" style="cursor:pointer" onclick="go('vendors')">← Back to vendors</a></div>
  <div class="page-head">
    <div style="display:flex;align-items:center;gap:14px">${avatar(v.n)}
      <div><h2 style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${v.n} <span class="badge-s ${sm[0]}">${sm[1]}</span>${v.vok?'<span class="badge-s b-green">✓ verified</span>':''}</h2>
      <p>${v.owner} · ${v.city} · ${v.cat} · joined ${v.joined}</p></div></div>
    <button class="btn btn-p" onclick="vendorDrawer(${i})">Vendor details</button></div>
  <div class="tabs" style="margin-bottom:18px">
    <span class="chip ${tab==='listings'?'active':''}" onclick="event.stopPropagation();openVendorProducts(${i},'listings')">📦 Listings (${list.length})</span>
    <span class="chip ${tab==='orders'?'active':''}" onclick="event.stopPropagation();openVendorProducts(${i},'orders')">🧾 Orders (${vOrders.length})</span>
    <span class="chip ${tab==='commission'?'active':''}" onclick="event.stopPropagation();openVendorProducts(${i},'commission')">💳 Commission</span>
  </div>`;

 if(tab==='commission') return header+commissionPane(i);

 if(tab==='orders'){
   const delivered=vOrders.filter(x=>x.o.status==='delivered').length;
   const ordVal=vOrders.reduce((s,x)=>s+orderTotal(x.o),0);
   const kpis=`<div class="grid g-4" style="margin-bottom:18px">
     ${kpi('box',String(vOrders.length),'Orders (30d)','','up','#2E5C6E')}
     ${kpi('shield',String(delivered),'Delivered','','up','#3F7A5C')}
     ${kpi('alert',String(vOrders.length-delivered),'In progress','','down','#C68A2E')}
     ${kpi('chart',ordVal?EGP(ordVal):'—','Order value','','up','#356F80')}</div>`;
   const rows=vOrders.map(({o,idx})=>`<tr data-status="${o.status}"><td><b>${o.id}</b></td>
     <td><div class="u">${avatar(o.buyer)}<b>${o.buyer}</b></div></td>
     <td class="muted">${o.items.map(it=>it[0]+' ×'+it[1]).join(', ')}</td>
     <td class="money">${EGP(orderTotal(o))}</td><td><span class="badge-s b-grey">COD</span></td>
     <td><span class="badge-s ${OSTAT[o.status][0]}">${OSTAT[o.status][1]}</span></td>
     <td class="r"><button class="btn btn-g btn-sm" onclick="orderDrawer(${idx})">View</button></td></tr>`).join('');
   const pane=vOrders.length
     ?`<div class="tabs" style="margin-bottom:16px"><span class="chip active">All (${vOrders.length})</span><span class="chip">Pending</span><span class="chip">Processing</span><span class="chip">Shipped</span><span class="chip">Delivered</span><span class="chip">Cancelled</span></div>
       <div class="card"><table><thead><tr><th>Order</th><th>Buyer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th class="r"></th></tr></thead><tbody>${rows}</tbody></table></div>`
     :emptyCard('🧾','No orders yet',v.status==='pending'?'This vendor is still pending approval and hasn’t received any orders.':'This vendor has no orders in the selected period.');
   return header+kpis+pane;
 }

 // listings tab
 const live=list.filter(p=>p.status==='live').length;
 const pend=list.filter(p=>p.status==='pending').length;
 const kpis=`<div class="grid g-4" style="margin-bottom:18px">
   ${kpi('box',String(list.length),'Total listings','','up','#2E5C6E')}
   ${kpi('shield',String(live),'Live','','up','#3F7A5C')}
   ${kpi('alert',String(pend),'Pending review','','down','#C68A2E')}
   ${kpi('chart',v.gmv?EGP(v.gmv):'—','GMV (30d)','','up','#356F80')}</div>`;
 const rows=list.map((p,pi)=>{const cmp=p.cmp?` <small style="text-decoration:line-through;color:var(--text-3)">${EGP(p.cmp)}</small>`:'';
   return `<tr data-status="${p.status}"><td><div class="u" style="cursor:pointer" onclick="listingDrawer(${i},${pi})"><span class="ua" style="background:linear-gradient(135deg,#EAF0F1,#DAE6E9);font-size:18px">${p.emoji}</span><div><b>${p.t}</b><small>${p.sub}</small></div></div></td>
     <td class="money">${EGP(p.price)}${cmp}</td>
     <td>${p.stock||'—'}</td>
     <td>${p.sold}</td>
     <td>${p.rating?'⭐ '+p.rating:'—'}</td>
     <td><span class="badge-s ${LSTAT[p.status][0]}">${LSTAT[p.status][1]}</span></td>
     <td class="r"><button class="btn btn-g btn-sm" onclick="listingDrawer(${i},${pi})">View</button></td></tr>`}).join('');
 const pane=list.length
   ? `<div class="tabs" style="margin-bottom:16px"><span class="chip active">All (${list.length})</span><span class="chip">Live</span><span class="chip">Pending</span><span class="chip">Out of stock</span></div>
      <div class="card"><table><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Sold (30d)</th><th>Rating</th><th>Status</th><th class="r"></th></tr></thead><tbody>${rows}</tbody></table></div>`
   : emptyCard('📦','No listings yet',v.status==='pending'?'This vendor is still pending approval and hasn’t published any products.':'This vendor has no products listed.');
 return header+kpis+pane;
}
function openVendorProducts(i,tab){
 tab=tab||'listings';
 document.getElementById('content').innerHTML=vendorProducts(i,tab);
 document.getElementById('topTitle').textContent=VENDORS[i].n+(tab==='orders'?' · Orders':tab==='commission'?' · Commission':' · Listings');
 document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('active',a.dataset.view==='vendors'));
 const s=document.getElementById('searchInput'); if(s) s.value='';
 window.scrollTo(0,0);
}
function commissionPane(i){
 const v=VENDORS[i],c=vcomm(i),lvl=commLevel(c);
 const badge={none:['b-green','Healthy'],warn:['b-amber','Warn — near limit'],paused:['b-red','Paused — publishing blocked']}[lvl];
 const banner=lvl==='none'?''
   :`<div style="display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-radius:12px;margin-bottom:18px;background:${lvl==='paused'?'var(--error-bg)':'var(--warning-bg)'};color:${lvl==='paused'?'#8A3A24':'#7E5A14'}">
       <span style="font-size:20px">${lvl==='paused'?'⛔':'⚠️'}</span>
       <div><b>${lvl==='paused'?'Publishing blocked':'Approaching the pause limit'}</b>
       <p style="font-size:12.5px;margin-top:2px">${lvl==='paused'
         ?`This vendor owes <b>${EGP(c.outstanding)}</b> (≥ pause threshold ${EGP(c.pause)}). New listing publishes are held until the balance is paid down.`
         :`This vendor owes <b>${EGP(c.outstanding)}</b> (≥ warn threshold ${EGP(c.warn)}). Notify them to pay before publishing is paused at ${EGP(c.pause)}.`}</p></div></div>`;
 const kpis=`<div class="grid g-4" style="margin-bottom:18px">
   ${kpi('chart',EGP(c.outstanding),'Outstanding balance','','down',lvl==='paused'?'#B4472E':lvl==='warn'?'#C68A2E':'#3F7A5C')}
   ${kpi('alert',EGP(c.warn),'Warn threshold','','up','#C68A2E')}
   ${kpi('shield',EGP(c.pause),'Pause threshold','','up','#B4472E')}
   ${kpi('box','2%','Commission rate','flat','up','#356F80')}</div>`;
 const form=`<div class="card"><div class="c-head"><h3>Weekly owed-balance thresholds (EGP)</h3><span class="badge-s ${badge[0]}">${badge[1]}</span></div>
   <div class="c-body">
     <div class="form-row"><label>Warn threshold — notify the vendor to pay</label><input id="warnTh" inputmode="numeric" value="${c.warn}"></div>
     <div class="form-row"><label>Pause threshold — block new listing publishes</label><input id="pauseTh" inputmode="numeric" value="${c.pause}"></div>
     <p class="muted" style="font-size:12px;margin:-4px 0 14px">Pause must be ≥ warn. At/above <b>warn</b> the vendor is notified; at/above <b>pause</b> new publishes are blocked until paid.</p>
     <button class="btn btn-p" style="width:100%;justify-content:center" onclick="saveCommThresholds(${i})">Save thresholds</button></div></div>`;
 const owedColor=lvl==='paused'?'#B4472E':lvl==='warn'?'#C68A2E':'#2C6347';
 const pay=`<div class="card"><div class="c-head"><h3>Collect payment</h3><span class="badge-s ${badge[0]}">${badge[1]}</span></div>
   <div class="c-body">
     <p class="muted" style="font-size:13px">Amount this vendor owes the platform right now:</p>
     <div style="font-size:30px;font-weight:800;color:${owedColor};margin:6px 0 14px;font-variant-numeric:tabular-nums">${EGP(c.outstanding)}</div>
     ${c.outstanding>0
       ?`<div class="form-row"><label>Amount received from vendor (EGP)</label><input id="payAmt" inputmode="numeric" value="${c.outstanding}"></div>
         <div style="display:flex;gap:8px"><button class="btn btn-ok" style="flex:1;justify-content:center" onclick="recordPayment(${i})">Record payment</button>
         <button class="btn btn-g" style="flex:1;justify-content:center" onclick="resetWallet(${i})">Mark fully paid</button></div>`
       :`<div style="padding:14px 16px;background:var(--success-bg);color:#2C6347;border-radius:11px;font-size:13px;font-weight:600">✓ Wallet settled — nothing to collect.</div>`}</div></div>`;
 const info=`<div class="card"><div class="c-body" style="font-size:12.5px;line-height:1.7;color:var(--text-2)">
     <b style="color:var(--text)">How the wallet works</b>
     <p style="margin-top:6px">xStore takes a flat <b>2%</b> commission per COD order. Unpaid commission accrues as the vendor's <b>outstanding balance</b>. When the vendor pays you, hit <b>Record payment</b> (partial) or <b>Mark fully paid</b> to reset the wallet to EGP 0.</p>
     <p style="margin-top:8px">Below warn → <span class="badge-s b-green">Healthy</span> · ≥ warn → <span class="badge-s b-amber">Warn</span> · ≥ pause → <span class="badge-s b-red">Paused</span> (publishing blocked).</p>
     <p style="margin-top:8px">Backend: <code>POST /admin/vendors/{id}/commission/settle</code> · thresholds map to <code>warnThresholdEgp</code> / <code>pauseThresholdEgp</code>.</p></div></div>`;
 return kpis+banner+`<div class="split">${pay}${form}</div><div class="mt">${info}</div>`;
}
function resetWallet(i){
 const c=vcomm(i);
 if(c.outstanding===0){toast('Wallet already settled');return;}
 c.outstanding=0;
 toast('Payment recorded — wallet reset to EGP 0 ✓');
 openVendorProducts(i,'commission');
}
function recordPayment(i){
 const c=vcomm(i);
 const amt=parseFloat(document.getElementById('payAmt').value);
 if(isNaN(amt)||amt<=0){toast('Enter a valid amount');document.getElementById('payAmt').focus();return;}
 c.outstanding=Math.max(0,Math.round((c.outstanding-amt)*100)/100);
 toast(c.outstanding===0?'Payment recorded — wallet settled ✓':'Payment recorded — '+EGP(c.outstanding)+' still owed');
 openVendorProducts(i,'commission');
}
function saveCommThresholds(i){
 const warn=parseFloat(document.getElementById('warnTh').value);
 const pause=parseFloat(document.getElementById('pauseTh').value);
 if(isNaN(warn)||warn<0){toast('Enter a valid warn threshold');document.getElementById('warnTh').focus();return;}
 if(isNaN(pause)||pause<0){toast('Enter a valid pause threshold');document.getElementById('pauseTh').focus();return;}
 if(pause<warn){toast('Pause threshold must be ≥ warn threshold');document.getElementById('pauseTh').focus();return;}
 const c=vcomm(i); c.warn=warn; c.pause=pause;
 toast('Commission thresholds saved ✓');
 openVendorProducts(i,'commission');
}
function listingDrawer(vi,pi){
 const v=VENDORS[vi],p=(VLISTINGS[vi]||[])[pi]; if(!p)return;
 const st=LSTAT[p.status];
 const cmp=p.cmp?' <span style="text-decoration:line-through;color:var(--text-3);font-size:15px;font-weight:500">'+EGP(p.cmp)+'</span> <span class="badge-s b-red">-'+Math.round((1-p.price/p.cmp)*100)+'%</span>':'';
 const act=p.status==='pending'
   ?'<button class="btn btn-ok" style="flex:1;justify-content:center" onclick="toast(\'Listing approved — now live ✓\');closeDrawer()">Approve</button><button class="btn btn-no" style="flex:1;justify-content:center" onclick="toast(\'Listing rejected — vendor notified\');closeDrawer()">Reject</button>'
   :p.status==='live'
   ?'<button class="btn btn-g" style="flex:1;justify-content:center" onclick="toast(\'Opening listing editor…\');closeDrawer()">Edit</button><button class="btn btn-no" style="flex:1;justify-content:center" onclick="toast(\'Listing hidden from store\');closeDrawer()">Unpublish</button>'
   :'<button class="btn btn-g" style="flex:1;justify-content:center" onclick="toast(\'Restock reminder sent to vendor\');closeDrawer()">Nudge vendor</button><button class="btn btn-g" style="flex:1;justify-content:center" onclick="closeDrawer()">Close</button>';
 openDrawer('Listing — '+p.t,
   '<div style="width:88px;height:88px;border-radius:14px;background:linear-gradient(135deg,#EAF0F1,#DAE6E9);display:flex;align-items:center;justify-content:center;font-size:40px;margin-bottom:14px">'+p.emoji+'</div>'
   +'<h3 style="font-size:17px;margin-bottom:6px">'+p.t+'</h3>'
   +'<div style="font-size:22px;font-weight:800;color:var(--primary)">'+EGP(p.price)+cmp+'</div>'
   +'<div style="margin:12px 0;display:flex;gap:6px;flex-wrap:wrap"><span class="badge-s '+st[0]+'">'+st[1]+'</span><span class="badge-s b-indigo">Stock: '+p.stock+'</span><span class="badge-s b-grey">'+p.sold+' sold</span></div>'
   +secH('Listing details')
   +kv('Vendor (business)',v.n)+kv('Category',v.cat+' › '+p.sub)+kv('Price',EGP(p.price))+(p.cmp?kv('Compare-at',EGP(p.cmp)):'')+kv('In stock',p.stock)+kv('Sold (30d)',p.sold)+kv('Rating',p.rating?'⭐ '+p.rating:'—'),
   act);
}

/* ---------- reusable add-form (opens in the drawer, actually adds) ---------- */
function formDrawer(title,fields,submitLabel,onSubmit,values){
 const esc=s=>String(s).replace(/"/g,'&quot;');
 const body=fields.map((f,i)=>{const val=values&&values[i]!=null?values[i]:'';
   return f.type==='select'
   ?'<div class="form-row"><label>'+f.label+'</label><select id="ff'+i+'">'+f.options.map(o=>'<option'+(o===val?' selected':'')+'>'+o+'</option>').join('')+'</select></div>'
   :'<div class="form-row"><label>'+f.label+(f.required?' *':'')+'</label><input id="ff'+i+'" value="'+esc(val)+'" placeholder="'+(f.ph||'')+'"></div>';}).join('');
 window._submitForm=function(){
   const vals=fields.map((f,i)=>document.getElementById('ff'+i).value.trim());
   for(let i=0;i<fields.length;i++){if(fields[i].required&&!vals[i]){toast('Please fill in: '+fields[i].label);document.getElementById('ff'+i).focus();return;}}
   onSubmit(vals);
 };
 openDrawer(title,body,'<button class="btn btn-g" style="flex:1;justify-content:center" onclick="closeDrawer()">Cancel</button><button class="btn btn-p" style="flex:1;justify-content:center" onclick="_submitForm()">'+submitLabel+'</button>');
}
function openCategoryForm(){formDrawer('Add category',
 [{label:'Category name',ph:'e.g. Groceries',required:true},{label:'Icon (emoji)',ph:'🛒'},{label:'Subcategories (comma-separated)',ph:'Fruits, Dairy, Bakery'}],
 'Add category',v=>{const subs=v[2]?v[2].split(',').filter(x=>x.trim()).length:0;CATS.push([v[0],v[1]||'📦',subs,0,true]);toast('Category "'+v[0]+'" added ✓');closeDrawer();go('categories');});}
function openCouponForm(){formDrawer('New coupon',
 [{label:'Code',ph:'SUMMER25',required:true},{label:'Offer description',ph:'25% off orders over EGP 500',required:true},{label:'Scope',type:'select',options:['Platform','Seasonal']}],
 'Create coupon',v=>{COUPONS.push([v[0].toUpperCase(),v[1],v[2],0,true]);toast('Coupon "'+v[0].toUpperCase()+'" created ✓');closeDrawer();go('coupons');});}
function openBannerForm(){formDrawer('New banner',
 [{label:'Banner title',ph:'Summer Sale — up to 40% off',required:true},{label:'Placement',type:'select',options:['Home hero','Home strip','Category banner']},{label:'Status',type:'select',options:['Active','Scheduled']}],
 'Add banner',v=>{BANNERS.push([v[0],v[1],v[2]]);toast('Banner added ✓');closeDrawer();go('content');});}
function openInviteForm(){formDrawer('Invite team member',
 [{label:'Full name',ph:'Full name',required:true},{label:'Email',ph:'name@xstore.eg',required:true},{label:'Role',type:'select',options:['Super Admin','Moderator','Viewer']}],
 'Send invite',v=>{const d={'Super Admin':'Full access','Moderator':'Orders + disputes','Viewer':'Read-only reports'}[v[2]]||'';TEAM.push([v[0],v[2],d]);toast('Invite sent to '+v[1]+' ✓');closeDrawer();go('settings');});}
function openAnnouncementForm(){formDrawer('New announcement',
 [{label:'Title',ph:'Scheduled maintenance tonight',required:true},{label:'Audience',type:'select',options:['All users','Vendors only','Customers only']},{label:'Message',ph:'Short message…'}],
 'Publish',v=>{toast('Announcement published to '+v[1]+' ✓');closeDrawer();});}
function createCouponInline(){
 const code=document.getElementById('ciCode').value.trim();
 if(!code){toast('Enter a coupon code');document.getElementById('ciCode').focus();return;}
 const type=document.getElementById('ciType').value,val=document.getElementById('ciVal').value.trim(),min=document.getElementById('ciMin').value.trim();
 let offer=type==='Free delivery'?'Free delivery':type==='Percentage'?(val||'?')+'% off':'EGP '+(val||'?')+' off';
 if(min) offer+=' (min EGP '+min+')';
 COUPONS.push([code.toUpperCase(),offer,'Platform',0,true]);
 toast('Coupon "'+code.toUpperCase()+'" created ✓');go('coupons');
}
function sendBroadcast(){const t=document.getElementById('pbTitle').value.trim();if(!t){toast('Enter a title');return;}toast('Broadcast sent to '+document.getElementById('pbAud').value+' ✓');}
function editCoupon(i){const c=COUPONS[i];formDrawer('Edit coupon',
 [{label:'Code',required:true},{label:'Offer description',required:true},{label:'Scope',type:'select',options:['Platform','Seasonal']}],
 'Save changes',v=>{COUPONS[i]=[v[0].toUpperCase(),v[1],v[2],c[3],c[4]];toast('Coupon "'+v[0].toUpperCase()+'" updated ✓');closeDrawer();go('coupons');},
 [c[0],c[1],c[2]]);}
function editBanner(i){const b=BANNERS[i];formDrawer('Edit banner',
 [{label:'Banner title',required:true},{label:'Placement',type:'select',options:['Home hero','Home strip','Category banner']},{label:'Status',type:'select',options:['Active','Scheduled']}],
 'Save changes',v=>{BANNERS[i]=[v[0],v[1],v[2]];toast('Banner updated ✓');closeDrawer();go('content');},
 [b[0],b[1],b[2]]);}
function deleteCoupon(i){const c=COUPONS[i][0];COUPONS.splice(i,1);toast('Coupon "'+c+'" deleted');go('coupons');}
function deleteBanner(i){BANNERS.splice(i,1);toast('Banner deleted');go('content');}

/* ---------- filter chips ---------- */
const STATUSES=['pending','confirmed','processing','shipped','delivered','cancelled','active','suspended','open','review','resolved','approved','rejected','live','out'];
function onChip(chip){
 const g=chip.closest('.tabs'); if(g) g.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c===chip));
 const label=chip.innerText.replace(/\s*\(\d+\)/,'').trim();
 let key=label.toLowerCase(); if(key==='in review') key='review'; if(key==='out of stock') key='out';
 const view=document.getElementById('content');
 const rows=[...view.querySelectorAll('tr[data-status]')];
 const cards=[...view.querySelectorAll('.mod[data-status]')];
 const items=rows.length?rows:cards;
 if(!items.length){toast('View: '+label);return;}
 if(key==='all'||!STATUSES.includes(key)){items.forEach(el=>el.style.display='');toast('Showing all');return;}
 const matched=items.filter(el=>el.dataset.status===key);
 if(matched.length){items.forEach(el=>el.style.display=matched.indexOf(el)>-1?'':'none');toast(matched.length+' '+label);}
 else{items.forEach(el=>el.style.display='');toast('No '+label+' in demo data — showing all');}
}

/* ---------- generic CTA ---------- */
function onCTA(btn){
 const t=btn.innerText.trim();
 if(/^edit$/i.test(t)){toast('Opening editor…');return;}
 if(/^preview$/i.test(t)){toast('Opening preview…');return;}
 if(/export/i.test(t)){toast('Export started — CSV will download');return;}
 if(t[0]==='+'){toast(t.slice(1).trim()+' — opening form');return;}
 toast(t);
}

/* ---------- search ---------- */
function searchRows(q){
 q=q.trim().toLowerCase();
 const els=document.querySelectorAll('#content tr[data-status], #content .mod[data-status]');
 els.forEach(el=>{el.style.display=(!q||el.innerText.toLowerCase().indexOf(q)>-1)?'':'none';});
}

/* ---------- delegated clicks (wires every CTA) ---------- */
document.addEventListener('click',e=>{
 const jump=e.target.closest('[data-jump]'); if(jump){go(jump.dataset.jump);return;}
 const chip=e.target.closest('.chip'); if(chip){onChip(chip);return;}
 const ib=e.target.closest('.icon-btn'); if(ib){toast(ib.querySelector('[data-ic="bell"]')?'No new notifications':'Help & documentation');return;}
 const btn=e.target.closest('.btn'); if(btn&&!btn.getAttribute('onclick')){onCTA(btn);return;}
});
document.getElementById('searchInput').addEventListener('input',e=>searchRows(e.target.value));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDrawer();closeSidebar();}});

document.querySelectorAll('[data-ic]').forEach(e=>e.innerHTML=ic(e.dataset.ic));
/* boot */
go('overview');
