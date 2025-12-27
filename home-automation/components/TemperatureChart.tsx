'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import type { SensorReading } from '@/types';

interface ChartDataPoint {
  time: string;
  indoor?: number;
  outdoor?: number;
  supply?: number;
  return?: number;
  difference?: number; // Разница между температурой дома и снаружи
}

interface VisibleLines {
  indoor: boolean;
  outdoor: boolean;
  supply: boolean;
  return: boolean;
  difference: boolean;
}

export function TemperatureChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [visibleLines, setVisibleLines] = useState<VisibleLines>({
    indoor: true,
    outdoor: true,
    supply: false,
    return: false,
    difference: false
  });

  useEffect(() => {
    fetchChartData();
  }, [timeRange]);

  async function fetchChartData() {
    try {
      const now = new Date();
      const ranges = {
        '1h': 60,
        '6h': 360,
        '24h': 1440,
        '7d': 10080
      };

      const minutesAgo = ranges[timeRange];
      const startTime = new Date(now.getTime() - minutesAgo * 60 * 1000);

      // Fetch моковые датчики из Supabase (indoor, supply, return - ЭТО НУЖНО!)
      const sensorTypes = [
        'temperature_indoor',
        'temperature_heating_supply',
        'temperature_heating_return'
      ];

      const results: Record<string, SensorReading[]> = {};

      for (const type of sensorTypes) {
        const { data } = await supabase
          .from('sensor_readings')
          .select('*')
          .eq('sensor_type', type)
          .gte('timestamp', startTime.toISOString())
          .order('timestamp', { ascending: true });

        if (data) {
          results[type] = data;
        }
      }

      // Fetch РЕАЛЬНУЮ погоду из API (НЕ temperature_outdoor из Supabase!)
      let currentTemperature: number | null = null;
      let weatherForecast: any[] = [];
      try {
        const weatherResponse = await fetch('/api/weather');
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          if (weatherData.success) {
            currentTemperature = weatherData.data.temperature;
            if (weatherData.data.forecast) {
              weatherForecast = weatherData.data.forecast;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }

      // Создаем массив всех временных точек из датчиков
      const allTimestamps = new Set<number>();
      Object.values(results).forEach(readings => {
        readings.forEach(reading => {
          allTimestamps.add(new Date(reading.timestamp).getTime());
        });
      });

      // Преобразуем в отсортированный массив и создаём точки графика
      const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
      const chartData: ChartDataPoint[] = [];

      sortedTimestamps.forEach(timestamp => {
        const date = new Date(timestamp);
        const timeKey = format(date, 'HH:mm');

        const point: ChartDataPoint = { time: timeKey };

        // Добавляем данные датчиков для этой временной точки
        Object.entries(results).forEach(([type, readings]) => {
          const reading = readings.find(r => new Date(r.timestamp).getTime() === timestamp);
          if (reading) {
            if (type === 'temperature_indoor') point.indoor = reading.value;
            else if (type === 'temperature_heating_supply') point.supply = reading.value;
            else if (type === 'temperature_heating_return') point.return = reading.value;
          }
        });

        // Находим ближайшую температуру из прогноза погоды
        if (currentTemperature !== null) {
          // Ищем прогноз, ближайший к этому времени
          let closestForecast: any = null;
          let minDiff = Infinity;

          weatherForecast.forEach(forecast => {
            const forecastTime = new Date(forecast.timestamp).getTime();
            const diff = Math.abs(forecastTime - timestamp);

            // Если разница меньше 2 часов, используем прогноз
            if (diff < 2 * 60 * 60 * 1000 && diff < minDiff) {
              minDiff = diff;
              closestForecast = forecast;
            }
          });

          if (closestForecast) {
            point.outdoor = closestForecast.temperature;
          } else {
            // Для исторических данных используем текущую температуру
            point.outdoor = currentTemperature;
          }
        }

        // Вычисляем разницу между температурой дома и снаружи
        if (point.indoor !== undefined && point.outdoor !== undefined) {
          point.difference = Math.round((point.indoor - point.outdoor) * 10) / 10;
        }

        chartData.push(point);
      });

      setData(chartData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleLine = (line: keyof VisibleLines) => {
    setVisibleLines(prev => ({ ...prev, [line]: !prev[line] }));
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle>История температур</CardTitle>
            <div className="flex gap-2">
              {(['1h', '6h', '24h', '7d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleLine('indoor')}
              className={`group relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                visibleLines.indoor
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/50 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${
                visibleLines.indoor ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-gray-400'
              }`}></span>
              <span>В доме</span>
            </button>

            <button
              onClick={() => toggleLine('outdoor')}
              className={`group relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                visibleLines.outdoor
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 ring-2 ring-green-500/50 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${
                visibleLines.outdoor ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400'
              }`}></span>
              <span>Снаружи</span>
            </button>

            <button
              onClick={() => toggleLine('supply')}
              className={`group relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                visibleLines.supply
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 ring-2 ring-red-500/50 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${
                visibleLines.supply ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-gray-400'
              }`}></span>
              <span>Подача</span>
            </button>

            <button
              onClick={() => toggleLine('return')}
              className={`group relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                visibleLines.return
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/50 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${
                visibleLines.return ? 'bg-amber-500 shadow-lg shadow-amber-500/50' : 'bg-gray-400'
              }`}></span>
              <span>Обратка</span>
            </button>

            <button
              onClick={() => toggleLine('difference')}
              className={`group relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                visibleLines.difference
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-2 ring-purple-500/50 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${
                visibleLines.difference ? 'bg-purple-500 shadow-lg shadow-purple-500/50' : 'bg-gray-400'
              }`}></span>
              <span>Разница</span>
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <span className="text-gray-600 dark:text-gray-400">Загрузка...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400">Нет данных для отображения</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="colorIndoor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOutdoor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDifference" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.2}
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="#6B7280"
                style={{ fontSize: '13px', fontWeight: '500' }}
                tickLine={false}
                axisLine={{ stroke: '#374151', strokeWidth: 1 }}
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '13px', fontWeight: '500' }}
                tickLine={false}
                axisLine={{ stroke: '#374151', strokeWidth: 1 }}
                tick={{ fill: '#9CA3AF' }}
                label={{
                  value: '°C',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#9CA3AF', fontSize: '14px', fontWeight: '600' }
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  padding: '12px 16px'
                }}
                labelStyle={{
                  color: '#F3F4F6',
                  fontWeight: '600',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}
                itemStyle={{
                  color: '#E5E7EB',
                  padding: '4px 0',
                  fontSize: '13px'
                }}
                formatter={(value: any) => [`${value}°C`, '']}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px'
                }}
                iconType="circle"
              />
              {visibleLines.indoor && (
                <Line
                  type="monotone"
                  dataKey="indoor"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  name="В доме"
                  dot={false}
                  activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                  fill="url(#colorIndoor)"
                />
              )}
              {visibleLines.outdoor && (
                <Line
                  type="monotone"
                  dataKey="outdoor"
                  stroke="#10B981"
                  strokeWidth={3}
                  name="Снаружи"
                  dot={false}
                  activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                  fill="url(#colorOutdoor)"
                />
              )}
              {visibleLines.supply && (
                <Line
                  type="monotone"
                  dataKey="supply"
                  stroke="#EF4444"
                  strokeWidth={3}
                  name="Подача"
                  dot={false}
                  activeDot={{ r: 6, fill: '#EF4444', stroke: '#fff', strokeWidth: 2 }}
                  fill="url(#colorSupply)"
                />
              )}
              {visibleLines.return && (
                <Line
                  type="monotone"
                  dataKey="return"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  name="Обратка"
                  dot={false}
                  activeDot={{ r: 6, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
                  fill="url(#colorReturn)"
                />
              )}
              {visibleLines.difference && (
                <Line
                  type="monotone"
                  dataKey="difference"
                  stroke="#A855F7"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name="Разница (дом-улица)"
                  dot={false}
                  activeDot={{ r: 6, fill: '#A855F7', stroke: '#fff', strokeWidth: 2 }}
                  fill="url(#colorDifference)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
