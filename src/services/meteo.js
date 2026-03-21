const CLE_API = "ebb66e7bbf68f1106c530ed97087f4ac";
const LAT = "45.5197";
const LON = "5.0539";

export async function getMeteo() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${CLE_API}&units=metric&lang=fr`;

  const response = await fetch(url);
  const data = await response.json();

  return {
    temperature: Math.round(data.main.temp),
    description: data.weather[0].description,
    icone: data.weather[0].icon,
    ville: "Septème",
  };
}

export function iconeMeteo(code) {
  const icones = {
    "01d": "☀️",
    "01n": "🌙",
    "02d": "⛅",
    "02n": "⛅",
    "03d": "☁️",
    "03n": "☁️",
    "04d": "☁️",
    "04n": "☁️",
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
