import { NextRequest, NextResponse } from 'next/server';

// Кэш для погоды (обновляется раз в 10 минут)
let weatherCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 10 * 60 * 1000; // 10 минут в миллисекундах

// GET /api/weather - Get weather forecast
export async function GET(request: NextRequest) {
  try {
    // Проверяем кэш
    const now = Date.now();
    if (weatherCache && (now - weatherCache.timestamp) < CACHE_DURATION) {
      console.log('Returning cached weather data');
      return NextResponse.json({
        success: true,
        data: weatherCache.data,
        cached: true,
        cache_age_seconds: Math.round((now - weatherCache.timestamp) / 1000)
      });
    }

    // Проверяем, какой API использовать
    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

    let weatherData;

    if (apiKey && apiKey !== 'your-api-key') {
      // Используем OpenWeatherMap
      console.log('Fetching weather from OpenWeatherMap');
      weatherData = await fetchOpenWeatherMap(apiKey);
    } else {
      // Используем Open-Meteo (бесплатно, без ключа)
      console.log('Fetching weather from Open-Meteo (free)');
      weatherData = await fetchOpenMeteo();
    }

    // Сохраняем в кэш
    weatherCache = {
      data: weatherData,
      timestamp: now
    };

    return NextResponse.json({
      success: true,
      data: weatherData,
      cached: false
    });
  } catch (error) {
    console.error('Weather API error:', error);

    // Если есть старый кэш (даже просроченный), вернём его при ошибке
    if (weatherCache) {
      console.log('Returning stale cache due to error');
      return NextResponse.json({
        success: true,
        data: weatherCache.data,
        cached: true,
        stale: true,
        cache_age_seconds: Math.round((Date.now() - weatherCache.timestamp) / 1000)
      });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch weather data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// OpenWeatherMap API
async function fetchOpenWeatherMap(apiKey: string) {
  const city = process.env.NEXT_PUBLIC_WEATHER_CITY || 'Moscow';

  // Current weather
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ru`;
  console.log('Fetching from URL:', url);

  const currentResponse = await fetch(url);

  if (!currentResponse.ok) {
    const errorText = await currentResponse.text();
    console.error('OpenWeatherMap error response:', currentResponse.status, errorText);
    throw new Error(`OpenWeatherMap API error (${currentResponse.status}): ${errorText}`);
  }

  const currentData = await currentResponse.json();

  // Forecast
  const forecastResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=ru`
  );

  if (!forecastResponse.ok) {
    throw new Error('Failed to fetch OpenWeatherMap forecast');
  }

  const forecastData = await forecastResponse.json();

  return {
    temperature: Math.round(currentData.main.temp * 10) / 10,
    humidity: currentData.main.humidity,
    pressure: Math.round(currentData.main.pressure * 0.750062), // Convert to mmHg
    description: currentData.weather[0].description,
    wind_speed: currentData.wind.speed,
    forecast: forecastData.list.slice(0, 24).map((item: any) => ({
      timestamp: item.dt_txt,
      temperature: Math.round(item.main.temp * 10) / 10,
      description: item.weather[0].description,
      precipitation_probability: (item.pop * 100).toFixed(0)
    }))
  };
}

// Open-Meteo API (бесплатная альтернатива)
async function fetchOpenMeteo() {
  const latitude = process.env.NEXT_PUBLIC_WEATHER_LATITUDE || '55.7558';
  const longitude = process.env.NEXT_PUBLIC_WEATHER_LONGITUDE || '37.6173';

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,surface_pressure,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code&timezone=auto&forecast_days=7`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch Open-Meteo weather');
  }

  const data = await response.json();

  // Коды погоды Open-Meteo
  const weatherDescriptions: Record<number, string> = {
    0: 'ясно',
    1: 'преимущественно ясно',
    2: 'переменная облачность',
    3: 'пасмурно',
    45: 'туман',
    48: 'изморозь',
    51: 'слабая морось',
    53: 'морось',
    55: 'сильная морось',
    61: 'слабый дождь',
    63: 'дождь',
    65: 'сильный дождь',
    71: 'слабый снег',
    73: 'снег',
    75: 'сильный снег',
    77: 'снежная крупа',
    80: 'слабые ливни',
    81: 'ливни',
    82: 'сильные ливни',
    85: 'слабый снегопад',
    86: 'снегопад',
    95: 'гроза',
    96: 'гроза с градом',
    99: 'сильная гроза с градом',
  };

  const getWeatherDescription = (code: number): string => {
    return weatherDescriptions[code] || 'неизвестно';
  };

  return {
    temperature: Math.round(data.current.temperature_2m * 10) / 10,
    humidity: data.current.relative_humidity_2m,
    pressure: Math.round(data.current.surface_pressure * 0.750062), // Convert hPa to mmHg
    description: getWeatherDescription(data.current.weather_code),
    wind_speed: data.current.wind_speed_10m,
    forecast: data.hourly.time.map((time: string, index: number) => ({
      timestamp: time,
      temperature: Math.round(data.hourly.temperature_2m[index] * 10) / 10,
      description: getWeatherDescription(data.hourly.weather_code[index]),
      precipitation_probability: data.hourly.precipitation_probability[index] || 0,
      wind_speed: data.hourly.wind_speed_10m[index]
    })),
    daily: data.daily.time.map((date: string, index: number) => ({
      date: date,
      temp_max: Math.round(data.daily.temperature_2m_max[index] * 10) / 10,
      temp_min: Math.round(data.daily.temperature_2m_min[index] * 10) / 10,
      precipitation: data.daily.precipitation_sum[index] || 0,
      precipitation_probability: data.daily.precipitation_probability_max[index] || 0,
      description: getWeatherDescription(data.daily.weather_code[index])
    }))
  };
}
