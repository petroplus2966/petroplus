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
   DAILY RELOAD @ 2:00 AM (LOCAL DEVICE TIME)
========================================================= */
(function schedule2AMReload(){
  const now  = new Date();
  const next = new Date(now);

  next.setHours(2, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  setTimeout(() => location.reload(), next - now);
})();


/* =========================================================
   TICKER CORE (CONTINUOUS – SPORTS BAR SPEED)
========================================================= */
const track = document.getElementById("forecastTrack");

let weatherText = "WEATHER LOADING…";
let sportsText  = "SPORTS LOADING…";
let localText   = "LOCAL NEWS LOADING…";
let worldText   = "WORLD NEWS LOADING…";

function rebuildTicker() {
  if (!track) return;

  const base =
    `${weatherText}   •   ${sportsText}   •   ${localText}   •   ${worldText}`;

  // Pad heavily so crawl stays readable
  let combined = base;
  while (combined.length < 2200) {
    combined += "   •   " + base;
  }

  track.textContent = combined;
}


/* =========================================================
   RSS → Titles helper (via rss2json)
========================================================= */
async function fetchRssTitles(rssUrl, maxItems = 8) {
  const endpoint =
    "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rssUrl);

  const res = await fetch(endpoint, { cache: "no-store" });
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);

  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];

  return items
    .slice(0, maxItems)
    .map(it => (it?.title || "").trim())
    .filter(Boolean);
}


/* =========================================================
   WEATHER (CURRENT + 7-DAY FORECAST)
========================================================= */
async function loadWeather() {
  const lat = 42.93;   // Ohsweken
  const lon = -80.12;

  const nowIcon = document.getElementById("nowIcon");
  const nowTemp = document.getElementById("nowTemp");
  const nowMeta = document.getElementById("nowMeta");

  if (nowIcon) nowIcon.textContent = "—";
  if (nowTemp) nowTemp.textContent = "—°C";
  if (nowMeta) nowMeta.textContent = "FETCHING CURRENT…";

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat}&longitude=${lon}` +
    `&current_weather=true` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&forecast_days=7&timezone=America%2FToronto`;

  function currentIcon(code) {
    if (code === 0) return { icon:"☀️", text:"CLEAR" };
    if ([1,2].includes(code)) return { icon:"⛅️", text:"PARTLY CLOUDY" };
    if (code === 3) return { icon:"☁️", text:"CLOUDY" };
    if ([45,48].includes(code)) return { icon:"🌫️", text:"FOG" };
    if ([61,63,65].includes(code)) return { icon:"🌧️", text:"RAIN" };
    if ([71,73,75].includes(code)) return { icon:"❄️", text:"SNOW" };
    if ([95,96,99].includes(code)) return { icon:"⛈️", text:"STORM" };
    return { icon:"🌡️", text:"WEATHER" };
  }

  function dailyIcon(rain, hi) {
    if (hi <= 0 && rain > 0) return "❄️";
    if (rain >= 5) return "🌧️";
    if (rain > 0)  return "🌦️";
    return "☀️";
  }

  try {
    const res  = await fetch(url, { cache:"no-store" });
    const data = await res.json();

    // CURRENT
    const c  = data.current || null;
    const cw = data.current_weather || null;

    const temp  = c?.temperature_2m ?? cw?.temperature ?? null;
    const feels = c?.apparent_temperature ?? null;
    const hum   = c?.relative_humidity_2m ?? null;
    const wind  = c?.wind_speed_10m ?? cw?.windspeed ?? null;
    const code  = c?.weather_code ?? cw?.weathercode ?? null;

    if (temp != null && nowIcon && nowTemp && nowMeta) {
      const cond = currentIcon(Number(code));
      nowIcon.textContent = cond.icon;
      nowTemp.textContent = `${Math.round(temp)}°C`;

      const meta = [];
      meta.push(cond.text);
      if (feels != null) meta.push(`FEELS ${Math.round(feels)}°`);
      if (hum != null)   meta.push(`HUM ${Math.round(hum)}%`);
      if (wind != null)  meta.push(`WIND ${Math.round(wind)} KM/H`);
      nowMeta.textContent = meta.join(" • ");
    }

    // 7-DAY (TICKER)
    const days = data.daily.time;
    const hi   = data.daily.temperature_2m_max;
    const lo   = data.daily.temperature_2m_min;
    const rain = data.daily.precipitation_sum;

    const parts = days.slice(0,7).map((d,i)=>{
      const dt  = new Date(d + "T00:00:00");
      const dow = dt.toLocaleDateString("en-CA",{ weekday:"short" }).toUpperCase();
      const md  = dt.toLocaleDateString("en-CA",{ month:"2-digit", day:"2-digit" });
      return `${dow} ${md} ${dailyIcon(rain[i],hi[i])} ${Math.round(hi[i])}°/${Math.round(lo[i])}°`;
    });

    weatherText = `WEATHER: ${parts.join("   •   ")}`;
  } catch {
    weatherText = "WEATHER UNAVAILABLE";
    if (nowMeta) nowMeta.textContent = "WEATHER UNAVAILABLE";
  }

  rebuildTicker();
}

loadWeather();
setInterval(loadWeather, 5 * 60 * 1000);


/* =========================================================
   SPORTS (Sportsnet RSS)
========================================================= */
async function loadSports() {
  const sportsRss = "https://www.sportsnet.ca/feed/";

  function emoji(title){
    const t = (title || "").toLowerCase();
    if (t.includes("leaf") || t.includes("nhl") || t.includes("hockey")) return "🏒";
    if (t.includes("raptor") || t.includes("nba") || t.includes("basketball")) return "🏀";
    if (t.includes("blue jay") || t.includes("mlb") || t.includes("baseball")) return "⚾";
    if (t.includes("nfl") || t.includes("football")) return "🏈";
    if (t.includes("soccer") || t.includes("mls") || t.includes("premier")) return "⚽";
    return "📰";
  }

  try {
    const titles = await fetchRssTitles(sportsRss, 10);
    sportsText =
      "SPORTS: " + titles.map(t => `${emoji(t)} ${t.toUpperCase()}`).join("   •   ");
  } catch {
    sportsText = "SPORTS: HEADLINES UNAVAILABLE";
  }

  rebuildTicker();
}

loadSports();
setInterval(loadSports, 5 * 60 * 1000);


/* =========================================================
   LOCAL + WORLD NEWS
   Local locked to: Brantford / Six Nations / Hamilton
========================================================= */
async function loadNews() {
  // Local sources
  const brantfordFeed = "https://www.brantfordexpositor.ca/feed/";
  const hamiltonFeed  = "https://www.cbc.ca/webfeed/rss/rss-canada-hamiltonnews";

  // World source
  const worldFeed = "https://apnews.com/index.rss";

  try {
    const b = await fetchRssTitles(brantfordFeed, 6);
    const h = await fetchRssTitles(hamiltonFeed, 6);

    // Mix & cap for readability
    const local = [...b, ...h].slice(0, 8);
    localText = local.length
      ? "LOCAL: " + local.map(t => `🗞️ ${t.toUpperCase()}`).join("   •   ")
      : "LOCAL: NO HEADLINES";
  } catch {
    localText = "LOCAL: UNAVAILABLE";
  }

  try {
    const world = await fetchRssTitles(worldFeed, 8);
    worldText = world.length
      ? "WORLD: " + world.map(t => `🌍 ${t.toUpperCase()}`).join("   •   ")
      : "WORLD: NO HEADLINES";
  } catch {
    worldText = "WORLD: UNAVAILABLE";
  }

  rebuildTicker();
}

loadNews();
setInterval(loadNews, 5 * 60 * 1000);


/* =========================================================
   PROMO SCHEDULER
   - Everyday promos always play
   - Day-of-week promos only play that day
   - Auto-adjusts to files that exist
   - Fade + cache-bust + 15s
   - Rebuilds playlist at midnight (America/Toronto)
========================================================= */
const everydayCandidates = [
  "promo1.jpg",
  "promo2.jpg",
  "promo3.jpg",
  "promo4.jpg",
  "promo5.jpg"
];

const dayCandidates = {
  mon: ["mon1.jpg","mon2.jpg","mon3.jpg"],
  tue: ["tue1.jpg","tue2.jpg","tue3.jpg"],
  wed: ["wed1.jpg","wed2.jpg","wed3.jpg"],
  thu: ["thu1.jpg","thu2.jpg","thu3.jpg"],
  fri: ["fri1.jpg","fri2.jpg","fri3.jpg"],
  sat: ["sat1.jpg","sat2.jpg","sat3.jpg"],
  sun: ["sun1.jpg","sun2.jpg","sun3.jpg"]
};

(function promoScheduler(){
  const img = document.getElementById("promoImg");
  if (!img) return;

  let playlist = [];
  let index = 0;
  let slideTimer = null;
  let midnightTimer = null;

  async function exists(file){
    try{
      const r = await fetch(file, { method:"HEAD", cache:"no-store" });
      return r.ok;
    }catch{ return false; }
  }

  function getDayKeyToronto(){
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      weekday: "short"
    }).format(new Date()).toLowerCase();
  }

  function setSrc(file){
    img.src = file + "?v=" + Date.now(); // cache-bust
  }

  function stopSlideshow(){
    if (slideTimer) clearInterval(slideTimer);
    slideTimer = null;
  }

  function startSlideshow(){
    stopSlideshow();

    if (playlist.length === 0) return;

    if (playlist.length === 1){
      setSrc(playlist[0]);
      return;
    }

    index = 0;
    setSrc(playlist[index]);

    slideTimer = setInterval(() => {
      img.classList.add("fadeOut");

      setTimeout(() => {
        index = (index + 1) % playlist.length;
        setSrc(playlist[index]);
      }, 400);

      setTimeout(() => {
        img.classList.remove("fadeOut");
      }, 800);

    }, 15_000);
  }

  async function buildPlaylist(){
    const dayKey = getDayKeyToronto();
    const candidates = [
      ...everydayCandidates,
      ...(dayCandidates[dayKey] || [])
    ];

    const next = [];
    for (const f of candidates){
      if (await exists(f)) next.push(f);
    }

    playlist = next;
    startSlideshow();
  }

  function msUntilTorontoMidnight(){
    // Simple + reliable for signage: schedule next 00:00 local runtime
    const now = new Date();
    const next = new Date(now);
    next.setHours(24,0,0,0); // next local midnight
    return Math.max(5_000, next - now);
  }

  function scheduleMidnightRebuild(){
    if (midnightTimer) clearTimeout(midnightTimer);

    midnightTimer = setTimeout(async () => {
      await buildPlaylist();        // switch day promos at midnight
      scheduleMidnightRebuild();    // schedule next midnight
    }, msUntilTorontoMidnight());
  }

  buildPlaylist();
  scheduleMidnightRebuild();
})();
