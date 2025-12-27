'use client';

import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { LucideIcon } from 'lucide-react';

interface SensorCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

export function SensorCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  color = 'blue'
}: SensorCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-red-600 dark:text-red-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    orange: 'text-orange-600 dark:text-orange-400',
  };

  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </CardTitle>
          <Icon className={`h-5 w-5 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          <span className="ml-2 text-lg text-gray-600 dark:text-gray-400">{unit}</span>
          {trend && (
            <span className={`ml-2 text-sm ${trend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
              {trendSymbol}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
