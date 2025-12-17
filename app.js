function setClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  document.getElementById("clock").textContent = `${hh}:${mm}`;

  const dateFmt = now.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  document.getElementById("dateText").textContent = dateFmt;
}
setClock();
setInterval(setClock, 10_000);

async function loadWeather() {
  const lat = 42.93;   // Ohsweken approx
  const lon = -80.12;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FToronto`;
  const res = await fetch(url);
  const data = await res.json();

  const tMax0 = Math.round(data.daily.temperature_2m_max[0]);
  const tMin0 = Math.round(data.daily.temperature_2m_min[0]);
  const tMax1 = Math.round(data.daily.temperature_2m_max[1]);
  const tMin1 = Math.round(data.daily.temperature_2m_min[1]);

  document.getElementById("todayWeather").textContent = `${tMax0}°C / ${tMin0}°C`;
  document.getElementById("tomorrowWeather").textContent = `${tMax1}°C / ${tMin1}°C`;
}
loadWeather().catch(() => {});

/* Optional: rotate promos if you add more files */
const promos = ["promo1.jpg", "promo2.jpg", "promo3.jpg", "promo4.jpg"];

(async () => {
  async function exists(f){
    try { return (await fetch(f, { method:"HEAD", cache:"no-store" })).ok; }
    catch { return false; }
  }
  const available = [];
  for (const p of promos) if (await exists(p)) available.push(p);

  if (available.length < 2) return;

  const top = document.getElementById("promoTopImg");
  const bot = document.getElementById("promoBottomImg");

  let i = 0;
  top.src = available[i++ % available.length];
  bot.src = available[i++ % available.length];

  setInterval(() => {
    top.src = available[i++ % available.length];
    bot.src = available[i++ % available.length];
  }, 12000);
})();
