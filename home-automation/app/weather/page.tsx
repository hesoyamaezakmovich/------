'use client';

import { useEffect, useState } from 'react';
import { WeatherCard } from '@/components/WeatherCard';
import { WeatherForecast } from '@/components/WeatherForecast';
import { WeeklyForecast } from '@/components/WeeklyForecast';
import { Card, CardContent } from '@/components/Card';
import Link from 'next/link';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  description: string;
  wind_speed: number;
  forecast: Array<{
    timestamp: string;
    temperature: number;
    description: string;
    precipitation_probability: number;
    wind_speed: number;
  }>;
  daily?: Array<{
    date: string;
    temp_max: number;
    temp_min: number;
    precipitation: number;
    precipitation_probability: number;
    description: string;
  }>;
}

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<{
    cached: boolean;
    cache_age_seconds?: number;
  } | null>(null);

  async function fetchWeather() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/weather');
      const data = await response.json();

      if (data.success) {
        setWeather(data.data);
        setCacheInfo({
          cached: data.cached || false,
          cache_age_seconds: data.cache_age_seconds
        });
      } else {
        setError(data.error || 'Ошибка загрузки погоды');
      }
    } catch (err) {
      setError('Не удалось загрузить данные погоды');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWeather();

    // Автообновление каждые 10 минут
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Погода
              </h1>
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                На главную
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-xl text-gray-600 dark:text-gray-400">
              Загрузка данных о погоде...
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Погода
              </h1>
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                На главную
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <div>
                <div className="font-semibold text-red-900 dark:text-red-200">
                  Ошибка загрузки погоды
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  {error || 'Не удалось получить данные'}
                </div>
                <button
                  onClick={fetchWeather}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Повторить попытку
                </button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Прогноз погоды
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {process.env.NEXT_PUBLIC_WEATHER_CITY || 'Текущий город'}
                {cacheInfo?.cached && (
                  <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                    Обновлено {cacheInfo.cache_age_seconds ? Math.floor(cacheInfo.cache_age_seconds / 60) : 0} мин назад
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchWeather}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Обновить
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                На главную
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Текущая погода */}
          <WeatherCard
            temperature={weather.temperature}
            humidity={weather.humidity}
            pressure={weather.pressure}
            description={weather.description}
            windSpeed={weather.wind_speed}
          />

          {/* Прогноз на неделю (с раскрывающимся почасовым прогнозом) */}
          {weather.daily && weather.daily.length > 0 && (
            <WeeklyForecast daily={weather.daily} hourly={weather.forecast} />
          )}

          {/* Информация об источнике */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Данные предоставлены{' '}
            {process.env.NEXT_PUBLIC_WEATHER_API_KEY ? 'OpenWeatherMap' : 'Open-Meteo'}
            {' • '}
            Обновляется каждые 10 минут
          </div>
        </div>
      </main>
    </div>
  );
}
