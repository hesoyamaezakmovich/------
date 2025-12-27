'use client';

import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { TrendingUp, TrendingDown, Lightbulb, AlertTriangle, Snowflake, Flame } from 'lucide-react';

interface SmartInsightsProps {
  indoorTemp?: number;
  outdoorTemp?: number;
  weatherForecast?: Array<{
    timestamp: string;
    temperature: number;
  }>;
  powerConsumption?: number;
}

export function SmartInsights({
  indoorTemp = 0,
  outdoorTemp = 0,
  weatherForecast = [],
  powerConsumption = 0
}: SmartInsightsProps) {
  const insights = generateInsights(indoorTemp, outdoorTemp, weatherForecast, powerConsumption);

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-indigo-200 dark:border-indigo-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
          <Lightbulb className="h-5 w-5" />
          Умные рекомендации
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                insight.type === 'warning'
                  ? 'bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700'
                  : insight.type === 'alert'
                  ? 'bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {insight.icon}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  insight.type === 'warning'
                    ? 'text-amber-900 dark:text-amber-200'
                    : insight.type === 'alert'
                    ? 'text-red-900 dark:text-red-200'
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {insight.title}
                </p>
                <p className={`text-xs mt-1 ${
                  insight.type === 'warning'
                    ? 'text-amber-700 dark:text-amber-300'
                    : insight.type === 'alert'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {insight.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface Insight {
  type: 'info' | 'warning' | 'alert';
  title: string;
  message: string;
  icon: JSX.Element;
}

function generateInsights(
  indoorTemp: number,
  outdoorTemp: number,
  forecast: Array<{ timestamp: string; temperature: number }>,
  power: number
): Insight[] {
  const insights: Insight[] = [];
  const tempDiff = indoorTemp - outdoorTemp;

  // Анализ температурной разницы
  if (tempDiff > 25) {
    insights.push({
      type: 'warning',
      title: 'Большая разница температур',
      message: `Разница ${tempDiff.toFixed(1)}°C может привести к повышенным теплопотерям. Проверьте утепление окон и дверей.`,
      icon: <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
    });
  }

  // Прогноз похолодания
  if (forecast.length >= 24) {
    const next24h = forecast.slice(0, 24);
    const minTemp = Math.min(...next24h.map(f => f.temperature));
    const currentOutdoor = outdoorTemp;

    if (minTemp < currentOutdoor - 5) {
      insights.push({
        type: 'alert',
        title: 'Ожидается сильное похолодание',
        message: `Температура упадёт до ${minTemp.toFixed(1)}°C. Рекомендуется заранее повысить температуру в доме на 1-2°C.`,
        icon: <Snowflake className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      });
    }
  }

  // Оптимизация энергопотребления
  if (outdoorTemp > 15 && indoorTemp > 22) {
    insights.push({
      type: 'info',
      title: 'Возможность экономии',
      message: 'При такой погоде можно снизить отопление или открыть окна для естественной вентиляции.',
      icon: <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
    });
  }

  // Прогноз потепления
  if (forecast.length >= 24) {
    const next24h = forecast.slice(0, 24);
    const maxTemp = Math.max(...next24h.map(f => f.temperature));

    if (maxTemp > outdoorTemp + 8) {
      insights.push({
        type: 'info',
        title: 'Ожидается потепление',
        message: `Завтра температура поднимется до ${maxTemp.toFixed(1)}°C. Можно будет снизить мощность отопления.`,
        icon: <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      });
    }
  }

  // Критически низкая температура снаружи
  if (outdoorTemp < -15) {
    insights.push({
      type: 'alert',
      title: 'Экстремально низкая температура',
      message: 'Проверьте, что трубы защищены от замерзания. Рекомендуется оставить небольшой поток воды.',
      icon: <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
    });
  }

  // Комфортная температура
  if (indoorTemp >= 20 && indoorTemp <= 22 && tempDiff < 20) {
    insights.push({
      type: 'info',
      title: 'Оптимальный климат',
      message: 'Температура в доме находится в комфортном диапазоне. Система работает эффективно.',
      icon: <Lightbulb className="h-5 w-5 text-green-600 dark:text-green-400" />
    });
  }

  return insights.length > 0 ? insights : [{
    type: 'info',
    title: 'Всё в порядке',
    message: 'Система работает нормально. Особых рекомендаций нет.',
    icon: <Lightbulb className="h-5 w-5 text-gray-600 dark:text-gray-400" />
  }];
}
