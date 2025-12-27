'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import type { SensorReading } from '@/types';
import { Play, RotateCcw } from 'lucide-react';
import { simulationScenarios, applySimulation } from '@/lib/simulationScenarios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartDataPoint {
  time: string;
  indoor?: number;
  outdoor?: number;
  supply?: number;
  return?: number;
  difference?: number;
}

interface VisibleLines {
  indoor: boolean;
  outdoor: boolean;
  supply: boolean;
  return: boolean;
  difference: boolean;
}

export function TemperatureChartV2() {
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
  const [simulationActive, setSimulationActive] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    if (!simulationActive) {
      fetchChartData();
    }
  }, [timeRange, simulationActive]);

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

      const allTimestamps = new Set<number>();
      Object.values(results).forEach(readings => {
        readings.forEach(reading => {
          allTimestamps.add(new Date(reading.timestamp).getTime());
        });
      });

      const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
      const chartData: ChartDataPoint[] = [];

      sortedTimestamps.forEach(timestamp => {
        const date = new Date(timestamp);
        const timeKey = format(date, 'HH:mm');

        const point: ChartDataPoint = { time: timeKey };

        Object.entries(results).forEach(([type, readings]) => {
          const reading = readings.find(r => new Date(r.timestamp).getTime() === timestamp);
          if (reading) {
            if (type === 'temperature_indoor') point.indoor = reading.value;
            else if (type === 'temperature_heating_supply') point.supply = reading.value;
            else if (type === 'temperature_heating_return') point.return = reading.value;
          }
        });

        if (currentTemperature !== null) {
          let closestForecast: any = null;
          let minDiff = Infinity;

          weatherForecast.forEach(forecast => {
            const forecastTime = new Date(forecast.timestamp).getTime();
            const diff = Math.abs(forecastTime - timestamp);

            if (diff < 2 * 60 * 60 * 1000 && diff < minDiff) {
              minDiff = diff;
              closestForecast = forecast;
            }
          });

          if (closestForecast) {
            point.outdoor = closestForecast.temperature;
          } else {
            point.outdoor = currentTemperature;
          }
        }

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

  async function runSimulation(scenarioId: string) {
    setLoading(true);
    setSimulationActive(true);
    setActiveScenario(scenarioId);

    const result = await applySimulation(scenarioId);
    if (!result) {
      setLoading(false);
      return;
    }

    const { data: simData, scenario } = result;

    // Преобразуем данные симуляции в формат графика
    const chartData: ChartDataPoint[] = [];
    const maxLength = Math.max(
      simData.indoor.length,
      simData.supply.length,
      simData.return.length
    );

    for (let i = 0; i < maxLength; i++) {
      const point: ChartDataPoint = {
        time: simData.indoor[i] ? format(new Date(simData.indoor[i].timestamp), 'HH:mm') : '',
      };

      if (simData.indoor[i]) point.indoor = simData.indoor[i].value;
      if (simData.supply[i]) point.supply = simData.supply[i].value;
      if (simData.return[i]) point.return = simData.return[i].value;
      point.outdoor = simData.outdoor;

      if (point.indoor !== undefined && point.outdoor !== undefined) {
        point.difference = Math.round((point.indoor - point.outdoor) * 10) / 10;
      }

      chartData.push(point);
    }

    setData(chartData);
    if (simData.alerts) {
      setAlerts(simData.alerts);
    }
    setLoading(false);
  }

  function resetSimulation() {
    setSimulationActive(false);
    setActiveScenario(null);
    setAlerts([]);
    fetchChartData();
  }

  const toggleLine = (line: keyof VisibleLines) => {
    setVisibleLines(prev => ({ ...prev, [line]: !prev[line] }));
  };

  // Подготовка данных для Chart.js
  const chartData = {
    labels: data.map(d => d.time),
    datasets: [
      visibleLines.indoor && {
        label: 'В доме',
        data: data.map(d => d.indoor),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 3,
      },
      visibleLines.outdoor && {
        label: 'Снаружи',
        data: data.map(d => d.outdoor),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 3,
      },
      visibleLines.supply && {
        label: 'Подача',
        data: data.map(d => d.supply),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 3,
      },
      visibleLines.return && {
        label: 'Обратка',
        data: data.map(d => d.return),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 3,
      },
      visibleLines.difference && {
        label: 'Разница',
        data: data.map(d => d.difference),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2,
        borderDash: [5, 5],
      },
    ].filter(Boolean) as any,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F3F4F6',
        bodyColor: '#E5E7EB',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}°C`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(55, 65, 81, 0.2)',
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          maxTicksLimit: 12,
        },
      },
      y: {
        grid: {
          color: 'rgba(55, 65, 81, 0.2)',
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          callback: function(value: any) {
            return value + '°C';
          },
        },
      },
    },
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                История температур
                {simulationActive && activeScenario && (
                  <span className="ml-3 text-sm font-normal text-orange-600 dark:text-orange-400">
                    (Симуляция: {simulationScenarios.find(s => s.id === activeScenario)?.name})
                  </span>
                )}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              {!simulationActive ? (
                <>
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
                </>
              ) : (
                <button
                  onClick={resetSimulation}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <RotateCcw className="h-4 w-4" />
                  Сбросить симуляцию
                </button>
              )}
            </div>
          </div>

          {/* Алерты симуляции */}
          {alerts.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <ul className="space-y-1">
                {alerts.map((alert, idx) => (
                  <li key={idx} className="text-sm text-red-800 dark:text-red-300">
                    ⚠️ {alert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Кнопки симуляций */}
          {!simulationActive && (
            <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="w-full mb-2">
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                  🎮 Симуляции ситуаций:
                </p>
              </div>
              {simulationScenarios.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => runSimulation(scenario.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm"
                  title={scenario.description}
                >
                  <Play className="h-3 w-3" />
                  {scenario.name}
                </button>
              ))}
            </div>
          )}

          {/* Переключатели линий */}
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
          <div className="h-96 flex items-center justify-center">
            <span className="text-gray-600 dark:text-gray-400">Загрузка...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="h-96 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400">Нет данных для отображения</span>
          </div>
        ) : (
          <div className="h-96">
            <Line data={chartData} options={options} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
