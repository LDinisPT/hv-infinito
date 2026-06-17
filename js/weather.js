// ============================================================
// WEATHER — meteo (Open-Meteo)
// ============================================================
async function fetchWeather() {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=40.1500&longitude=-8.8608&current=temperature_2m,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Europe/Lisbon&forecast_days=1';
    const res = await fetch(url);
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weathercode;
    const wind = Math.round(data.current.windspeed_10m);
    const tmax = Math.round(data.daily.temperature_2m_max[0]);
    const tmin = Math.round(data.daily.temperature_2m_min[0]);

    const icons = {
      0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️',
      45:'🌫️', 48:'🌫️',
      51:'🌦️', 53:'🌦️', 55:'🌧️',
      61:'🌧️', 63:'🌧️', 65:'🌧️',
      71:'❄️', 73:'❄️', 75:'❄️',
      80:'🌦️', 81:'🌧️', 82:'⛈️',
      95:'⛈️', 96:'⛈️', 99:'⛈️'
    };
    const descs = {
      0:'Céu limpo', 1:'Maioritariamente limpo', 2:'Parcialmente nublado', 3:'Nublado',
      45:'Nevoeiro', 48:'Nevoeiro',
      51:'Chuva fraca', 53:'Chuva moderada', 55:'Chuva forte',
      61:'Chuva fraca', 63:'Chuva moderada', 65:'Chuva forte',
      71:'Neve fraca', 73:'Neve moderada', 75:'Neve forte',
      80:'Aguaceiros', 81:'Aguaceiros', 82:'Aguaceiros fortes',
      95:'Trovoada', 96:'Trovoada', 99:'Trovoada'
    };
    const icon = icons[code] || icons[Math.floor(code/10)*10] || '🌡️';
    const desc = descs[code] || descs[Math.floor(code/10)*10] || '';

    const el = document.getElementById('weather-widget');
    if(el) el.innerHTML = `
      <span class="w-icon">${icon}</span>
      <div class="w-info">
        <div class="w-temp">${temp}°</div>
        <div class="w-pills">↑${tmax}° ↓${tmin}° · 💨 ${wind}km/h</div>
      </div>`;
    const dd = document.getElementById('dd-weather');
    if(dd) dd.textContent = ` · ${icon} ${temp}°`;
  } catch(e) {
    console.log('Weather unavailable');
  }
}

