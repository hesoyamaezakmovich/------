'use client';

import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Cloud, Droplets, Wind, Gauge } from 'lucide-react';

interface WeatherCardProps {
  temperature: number;
  humidity: number;
  pressure: number;
  description: string;
  windSpeed: number;
}

export function WeatherCard({
  temperature,
  humidity,
  pressure,
  description,
  windSpeed
}: WeatherCardProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Cloud className="h-6 w-6" />
          Текущая погода
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl font-bold">
              {temperature > 0 ? '+' : ''}{temperature}°
            </div>
            <div className="text-xl mt-2 capitalize">{description}</div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <Droplets className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-semibold">{humidity}%</div>
              <div className="text-sm opacity-80">Влажность</div>
            </div>

            <div className="text-center">
              <Wind className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-semibold">{windSpeed} м/с</div>
              <div className="text-sm opacity-80">Ветер</div>
            </div>

            <div className="text-center">
              <Gauge className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-semibold">{pressure}</div>
              <div className="text-sm opacity-80">мм рт.ст.</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
