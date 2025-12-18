/* =========================================================
   CLOCK + DATE (RIGHT STACK) — AM/PM
========================================================= */
function updateClockAndDate() {
  const now = new Date();

  const clock = document.getElementById("clock");
  const date  = document.getElementById("dateText");

  if (clock) {
    clock.textContent = now.toLocaleTimeString("en-CA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).toUpperCase();
  }

  if (date) {
    date.textContent = now.toLocaleDateString("en-CA");
  }
}
updateClockAndDate();
setInterval(updateClockAndDate, 10_000);


/* =========================================================
   DAILY RELOAD @ 2:00 AM
========================================================= */
(function schedule2AMReload(){
  const now = new Date();
  const next = new Date(now);
  next.setHours(2,0,0,0);
  if (next <= now) next.setDate(next.getDate() + 1);
  setTimeout(() => location.reload(), next - now);
})();


/* =========================================================
   PROMO SLIDESHOW (AUTO ADJUST, FADE, CACHE-BUST, 15s)
========================================================= */
const promoCandidates = [
  "promo1.jpg",
  "promo2.jpg",
  "promo3.jpg",
  "promo4.jpg"
];

(async function promoSlideshow(){
  const img = document.getElementById("promoImg");
  if (!img) return;

  async function exists(file){
    try{
      const r = await fetch(file, { method:"HEAD", cache:"no-store" });
      return r.ok;
    }catch{ return false; }
  }

  const promos = [];
  for (const f of promoCandidates){
    if (await exists(f)) promos.push(f);
  }

  if (promos.length === 0) return;

  if (promos.length === 1){
    img.src = promos[0] + "?v=" + Date.now();
    return;
  }

  let i = 0;
  const setSrc = f => img.src = f + "?v=" + Date.now();

  setSrc(promos[i]);

  setInterval(() => {
    img.classList.add("fadeOut");
    setTimeout(() => {
      i = (i + 1) % promos.length;
      setSrc(promos[i]);
    }, 400);
    setTimeout(() => img.classList.remove("fadeOut"), 800);
  }, 15_000);
})();


/* =========================================================
   TICKER CORE
========================================================= */
const track = document.getElementById("forecastTrack");

let weatherText = "WEATHER LOADING…";
let sportsText  = "SPORTS LOADING…";
let localText   = "LOCAL NEWS LOADING…";
let worldText   = "WORLD NEWS LOADING…";

function rebuildTicker(){
  if (!track) return;

  const base =
    `${weatherText}   •   ${sportsText}   •   ${localText}   •   ${worldText}`;

  let combined = base;
  while (combined.length < 2200){
    combined += "   •   " + base;
  }

  track.textContent = combined;
}


/* =========================================================
   WEATHER (CURRENT + 7 DAY)
========================================================= */
async function loadWeather(){
  const lat = 42.93;
  const lon = -80.12;

  const nowIcon = document.getElementById("nowIcon");
  const nowTemp = document.getElementById("nowTemp");
  const nowMeta = document.getElementById("nowMeta");

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat}&longitude=${lon}` +
    `&current_weather=true` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&forecast_days=7&timezone=America%2FToronto`;

  try{
    const res = await fetch(url, { cache:"no-store" });
    const data = await res.json();

    const cw = data.current_weather;
    if (cw && nowIcon && nowTemp && nowMeta){
      nowTemp.textContent = `${Math.round(cw.temperature)}°C`;
      nowIcon.textContent = "🌡️";
      nowMeta.textContent = "CURRENT";
    }

    const parts = data.daily.time.slice(0,7).map((d,i)=>{
      const dt = new Date(d+"T00:00:00");
      const dow = dt.toLocaleDateString("en-CA",{ weekday:"short" }).toUpperCase();
      const md  = dt.toLocaleDateString("en-CA",{ month:"2-digit", day:"2-digit" });
      return `${dow} ${md} ${Math.round(data.daily.temperature_2m_max[i])}°/${Math.round(data.daily.temperature_2m_min[i])}°`;
    });

    weatherText = "WEATHER: " + parts.join("   •   ");
  }catch{
    weatherText = "WEATHER UNAVAILABLE";
  }

  rebuildTicker();
}
loadWeather();
setInterval(loadWeather, 5*60*1000);


/* =========================================================
   RSS HELPER
========================================================= */
async function fetchRss(rssUrl, max){
  const url =
    "https://api.rss2json.com/v1/api.json?rss_url=" +
    encodeURIComponent(rssUrl);
  const res = await fetch(url, { cache:"no-store" });
  const data = await res.json();
  return (data.items || []).slice(0,max).map(i => i.title.toUpperCase());
}


/* =========================================================
   SPORTS
========================================================= */
async function loadSports(){
  try{
    const titles = await fetchRss("https://www.sportsnet.ca/feed/", 10);
    sportsText = "SPORTS: " + titles.map(t=>"🏒 "+t).join("   •   ");
  }catch{
    sportsText = "SPORTS: UNAVAILABLE";
  }
  rebuildTicker();
}
loadSports();
setInterval(loadSports, 5*60*1000);


/* =========================================================
   LOCAL (BRANTFORD / SIX NATIONS / HAMILTON)
========================================================= */
async function loadLocal(){
  const feeds = [
    "https://www.brantfordexpositor.ca/feed/",
    "https://www.cbc.ca/webfeed/rss/rss-canada-hamiltonnews"
  ];

  try{
    const a = await fetchRss(feeds[0], 6);
    const b = await fetchRss(feeds[1], 6);
    const merged = [...a, ...b].slice(0,8);
    localText = "LOCAL: " + merged.map(t=>"🗞️ "+t).join("   •   ");
  }catch{
    localText = "LOCAL: UNAVAILABLE";
  }

  rebuildTicker();
}
loadLocal();
setInterval(loadLocal, 5*60*1000);


/* =========================================================
   WORLD NEWS
========================================================= */
async function loadWorld(){
  try{
    const titles = await fetchRss("https://apnews.com/index.rss", 8);
    worldText = "WORLD: " + titles.map(t=>"🌍 "+t).join("   •   ");
  }catch{
    worldText = "WORLD: UNAVAILABLE";
  }
  rebuildTicker();
}
loadWorld();
setInterval(loadWorld, 5*60*1000);
