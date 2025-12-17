/* =========================================================
   CLOCK + DATE (RIGHT STACK)
========================================================= */
function updateClockAndDate() {
  const now = new Date();

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  document.getElementById("clock").textContent = `${hh}:${mm}`;
  document.getElementById("dateText").textContent =
    now.toLocaleDateString("en-CA");
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

function rebuildTicker() {
  if (!track) return;

  const base = `${weatherText}   •   ${sportsText}`;

  // Heavy padding for slow, readable crawl
  let combined = base;
  while (combined.length < 1600) {
    combined += "   •   " + base;
  }

  track.textContent = combined;
}


/* =========================================================
   WEATHER (CURRENT + 7-DAY)
========================================================= */
async function loadWeather() {
  const lat = 42.93;   // Ohsweken
  const lon = -80.12;

  const nowIcon = document.getElementById("nowIcon");
  const nowTemp = document.getElementById("nowTemp");
  const nowMeta = document.getElementById("nowMeta");

  if (nowIcon) nowIcon.textContent = "—";
  if (nowTemp) nowTemp.textContent = "—°C";
  if (nowMeta) nowMeta.textContent = "LOADING…";

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&forecast_days=7&timezone=America%2FToronto`;

  function currentIcon(code) {
    if (code === 0) return { icon: "☀️", text: "CLEAR" };
    if ([1,2].includes(code)) return { icon: "⛅️", text: "PARTLY CLOUDY" };
    if (code === 3) return { icon: "☁️", text: "CLOUDY" };
    if ([61,63,65].includes(code)) return { icon: "🌧️", text: "RAIN" };
    if ([71,73,75].includes(code)) return { icon: "❄️", text: "SNOW" };
    if ([95,96,99].includes(code)) return { icon: "⛈️", text: "STORM" };
    return { icon: "🌡️", text: "WEATHER" };
  }

  function dailyIcon(rain, hi) {
    if (rain >= 5) return "🌧️";
    if (rain > 0)  return "🌦️";
    if (hi <= 0)   return "❄️";
    return "☀️";
  }

  try {
    const res  = await fetch(url, { cache:"no-store" });
    const data = await res.json();

    /* ---------- CURRENT CONDITIONS ---------- */
    const c = data.current;
    if (c && nowIcon && nowTemp && nowMeta) {
      const cond = currentIcon(c.weather_code);

      nowIcon.textContent = cond.icon;
      nowTemp.textContent = `${Math.round(c.temperature_2m)}°C`;

      const meta = [];
      meta.push(cond.text);
      if (c.apparent_temperature != null)
        meta.push(`FEELS ${Math.round(c.apparent_temperature)}°`);
      if (c.relative_humidity_2m != null)
        meta.push(`HUM ${Math.round(c.relative_humidity_2m)}%`);
      if (c.wind_speed_10m != null)
        meta.push(`WIND ${Math.round(c.wind_speed_10m)} KM/H`);

      nowMeta.textContent = meta.join(" • ");
    }

    /* ---------- 7-DAY FORECAST ---------- */
    const days = data.daily.time;
    const hi   = data.daily.temperature_2m_max;
    const lo   = data.daily.temperature_2m_min;
    const rain = data.daily.precipitation_sum;

    const parts = days.map((d, i) => {
      const date = new Date(d + "T00:00:00");
      const dow  = date.toLocaleDateString("en-CA",{ weekday:"short" }).toUpperCase();
      const md   = date.toLocaleDateString("en-CA",{ month:"2-digit", day:"2-digit" });
      return `${dow} ${md} ${dailyIcon(rain[i], hi[i])} ${Math.round(hi[i])}°/${Math.round(lo[i])}°`;
    });

    weatherText = `WEATHER: ${parts.join("   •   ")}`;
    rebuildTicker();

  } catch {
    weatherText = "WEATHER UNAVAILABLE";
    if (nowMeta) nowMeta.textContent = "WEATHER UNAVAILABLE";
    rebuildTicker();
  }
}

loadWeather();
setInterval(loadWeather, 5 * 60 * 1000);


/* =========================================================
   SPORTSNET RSS (HEADLINES)
========================================================= */
async function loadSports() {
  const rss =
    "https://api.rss2json.com/v1/api.json?rss_url=" +
    encodeURIComponent("https://www.sportsnet.ca/feed/");

  function emoji(title){
    const t = title.toLowerCase();
    if (t.includes("leaf") || t.includes("nhl")) return "🏒";
    if (t.includes("raptor") || t.includes("nba")) return "🏀";
    if (t.includes("blue jay") || t.includes("mlb")) return "⚾";
    if (t.includes("soccer")) return "⚽";
    return "📰";
  }

  try {
    const res  = await fetch(rss, { cache:"no-store" });
    const data = await res.json();

    const headlines = data.items
      .slice(0, 10)
      .map(h => `${emoji(h.title)} ${h.title.toUpperCase()}`);

    sportsText = `SPORTS: ${headlines.join("   •   ")}`;
    rebuildTicker();

  } catch {
    sportsText = "SPORTS HEADLINES UNAVAILABLE";
    rebuildTicker();
  }
}

loadSports();
setInterval(loadSports, 5 * 60 * 1000);
