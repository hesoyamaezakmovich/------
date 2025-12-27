'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Calendar, CloudRain, Sun, CloudSnow, ChevronDown, ChevronUp, Wind } from 'lucide-react';

interface DailyForecast {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation: number;
  precipitation_probability: number;
  description: string;
}

interface HourlyForecast {
  timestamp: string;
  temperature: number;
  description: string;
  precipitation_probability: number;
  wind_speed: number;
}

interface WeeklyForecastProps {
  daily: DailyForecast[];
  hourly: HourlyForecast[];
}

export function WeeklyForecast({ daily, hourly }: WeeklyForecastProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Завтра';
    } else {
      return date.toLocaleDateString('ru-RU', { weekday: 'long' });
    }
  };

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('снег') || desc.includes('снегопад')) {
      return <CloudSnow className="h-8 w-8 text-blue-300" />;
    } else if (desc.includes('дождь') || desc.includes('ливни') || desc.includes('морось')) {
      return <CloudRain className="h-8 w-8 text-blue-400" />;
    } else if (desc.includes('ясно') || desc.includes('солнечно')) {
      return <Sun className="h-8 w-8 text-yellow-400" />;
    }
    return <CloudRain className="h-8 w-8 text-gray-400" />;
  };

  const getHourlyForDay = (date: string) => {
    return hourly.filter(h => {
      const hourDate = new Date(h.timestamp).toISOString().split('T')[0];
      return hourDate === date;
    });
  };

  const toggleDay = (date: string) => {
    setExpandedDay(expandedDay === date ? null : date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Прогноз на неделю
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
            (нажмите на день для деталей)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {daily.map((day, index) => {
            const isExpanded = expandedDay === day.date;
            const hourlyData = getHourlyForDay(day.date);

            return (
              <div key={day.date} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* День - кликабельная карточка */}
                <button
                  onClick={() => toggleDay(day.date)}
                  className={`w-full p-4 flex items-center justify-between transition-colors ${
                    index === 0
                      ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* День недели */}
                    <div className="text-left min-w-[100px]">
                      <div className={`font-semibold ${index === 0 ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {getDayName(day.date)}
                      </div>
                      <div className={`text-xs ${index === 0 ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {new Date(day.date).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </div>
                    </div>

                    {/* Иконка */}
                    <div className="flex-shrink-0">
                      {getWeatherIcon(day.description)}
                    </div>

                    {/* Температура */}
                    <div className="min-w-[120px]">
                      <div className={`text-2xl font-bold ${index === 0 ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {day.temp_max > 0 ? '+' : ''}{day.temp_max}° / {day.temp_min > 0 ? '+' : ''}{day.temp_min}°
                      </div>
                    </div>

                    {/* Описание */}
                    <div className={`flex-1 text-left capitalize ${index === 0 ? 'text-blue-50' : 'text-gray-600 dark:text-gray-400'}`}>
                      {day.description}
                    </div>

                    {/* Осадки */}
                    {day.precipitation_probability > 20 && (
                      <div className={`flex items-center gap-1 ${index === 0 ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}>
                        <CloudRain className="h-4 w-4" />
                        <span className="text-sm">{day.precipitation_probability}%</span>
                      </div>
                    )}
                  </div>

                  {/* Стрелка раскрытия */}
                  <div className={index === 0 ? 'text-white' : 'text-gray-600 dark:text-gray-400'}>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </button>

                {/* Почасовой прогноз (раскрывающийся) */}
                {isExpanded && hourlyData.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Почасовой прогноз
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {hourlyData.map((hour) => (
                        <div
                          key={hour.timestamp}
                          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {new Date(hour.timestamp).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {hour.temperature > 0 ? '+' : ''}{hour.temperature}°
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {hour.precipitation_probability > 30 && (
                              <>
                                <CloudRain className="h-3 w-3 text-blue-500" />
                                <span>{hour.precipitation_probability}%</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                            <Wind className="h-3 w-3" />
                            <span>{hour.wind_speed} м/с</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 capitalize line-clamp-2">
                            {hour.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
