const CLE_API = import.meta.env.VITE_OPENWEATHER_KEY;

export async function getMeteo() {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=Septeme,FR&appid=${CLE_API}&units=metric&lang=fr`;

  const response = await fetch(url);
  const data = await response.json();

  return {
    temperature: Math.round(data.main.temp),
    description: data.weather[0].description,
    icone: data.weather[0].icon,
    ville: data.name,
  };
}

export function iconeMeteo(code) {
  const icones = {
    "01d": "☀️",
    "01n": "🌙",
    "02d": "🌤️",
    "02n": "🌤️", // peu nuageux
    "03d": "⛅",
    "03n": "⛅", // partiellement nuageux ← ici
    "04d": "☁️",
    "04n": "☁️", // très nuageux
    "09d": "🌧️",
    "09n": "🌧️",
    "10d": "🌦️",
    "10n": "🌧️",
    "11d": "⛈️",
    "11n": "⛈️",
    "13d": "❄️",
    "13n": "❄️",
    "50d": "🌫️",
    "50n": "🌫️",
  };
  return icones[code] || "🌤️";
}
