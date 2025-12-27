'use client';

import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Calendar, CloudRain } from 'lucide-react';

interface ForecastItem {
  timestamp: string;
  temperature: number;
  description: string;
  precipitation_probability: number;
}

interface WeatherForecastProps {
  forecast: ForecastItem[];
}

export function WeatherForecast({ forecast }: WeatherForecastProps) {
  // Группируем прогноз по дням
  const groupedForecast = forecast.reduce((acc, item) => {
    const date = new Date(item.timestamp);
    const dateKey = date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
    const time = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }

    acc[dateKey].push({
      ...item,
      time,
      date
    });

    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Прогноз погоды
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedForecast).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {date}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      {item.time}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {item.temperature > 0 ? '+' : ''}{item.temperature}°
                      </div>
                      {item.precipitation_probability > 30 && (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <CloudRain className="h-4 w-4" />
                          <span className="text-xs">{item.precipitation_probability}%</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 capitalize">
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
