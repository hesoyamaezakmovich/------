'use client';

import { useEffect, useState } from 'react';
import { SensorCard } from '@/components/SensorCard';
import { SmartInsights } from '@/components/SmartInsights';
import {
  Thermometer,
  Droplets,
  Wind,
  Zap,
  Flame,
  Waves,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SensorReading, Alert } from '@/types';

export default function HomePage() {
  const [latestReadings, setLatestReadings] = useState<Record<string, SensorReading>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<any>(null);

  useEffect(() => {
    fetchLatestData();
    fetchWeatherData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('sensor-updates')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        (payload) => {
          const reading = payload.new as SensorReading;
          setLatestReadings(prev => ({
            ...prev,
            [reading.sensor_type]: reading
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchWeatherData() {
    try {
      const response = await fetch('/api/weather');
      const data = await response.json();
      if (data.success) {
        setWeatherData(data.data);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  }

  async function fetchLatestData() {
    try {
      // Fetch latest sensor readings for each type
      // Note: temperature_outdoor, humidity_outdoor, pressure_outdoor are now from Weather API
      const sensorTypes = [
        'temperature_indoor',
        'temperature_heating_supply',
        'temperature_heating_return',
        'humidity_indoor',
        'power_consumption',
        'voltage',
      ];

      const readings: Record<string, SensorReading> = {};

      for (const type of sensorTypes) {
        const { data } = await supabase
          .from('sensor_readings')
          .select('*')
          .eq('sensor_type', type)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          readings[type] = data;
        }
      }

      setLatestReadings(readings);

      // Fetch recent alerts
      const { data: alertsData } = await supabase
        .from('alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('timestamp', { ascending: false })
        .limit(5);

      if (alertsData) {
        setAlerts(alertsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">Загрузка данных...</div>
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
                Умный дом - Мониторинг
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Система управления инженерными системами
              </p>
            </div>
            <nav className="flex gap-4">
              <a
                href="/charts"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Графики
              </a>
              <a
                href="/weather"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Погода
              </a>
              <a
                href="/rules"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Правила
              </a>
              <a
                href="/control"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Управление
              </a>
              <a
                href="/settings"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Настройки
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Smart Insights */}
        <div className="mb-8">
          <SmartInsights
            indoorTemp={latestReadings.temperature_indoor?.value}
            outdoorTemp={weatherData?.temperature}
            weatherForecast={weatherData?.forecast}
            powerConsumption={latestReadings.power_consumption?.value}
          />
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-200">
                Активные оповещения
              </h2>
            </div>
            <ul className="space-y-2">
              {alerts.map(alert => (
                <li key={alert.id} className="text-sm text-red-800 dark:text-red-300">
                  {alert.message} - {new Date(alert.timestamp).toLocaleString('ru-RU')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Temperature Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Температура
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SensorCard
              title="Температура в доме"
              value={latestReadings.temperature_indoor?.value ?? 0}
              unit="°C"
              icon={Thermometer}
              color="blue"
            />
            <SensorCard
              title="Температура снаружи"
              value={weatherData?.temperature ?? 0}
              unit="°C"
              icon={Wind}
              color="blue"
            />
            <SensorCard
              title="Подача отопления"
              value={latestReadings.temperature_heating_supply?.value ?? 0}
              unit="°C"
              icon={Flame}
              color="red"
            />
            <SensorCard
              title="Обратка отопления"
              value={latestReadings.temperature_heating_return?.value ?? 0}
              unit="°C"
              icon={Flame}
              color="orange"
            />
          </div>
        </section>

        {/* Climate Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Климат
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SensorCard
              title="Влажность в доме"
              value={latestReadings.humidity_indoor?.value ?? 0}
              unit="%"
              icon={Droplets}
              color="blue"
            />
            <SensorCard
              title="Влажность снаружи"
              value={weatherData?.humidity ?? 0}
              unit="%"
              icon={Droplets}
              color="blue"
            />
            <SensorCard
              title="Атмосферное давление"
              value={weatherData?.pressure ?? 0}
              unit="мм рт.ст."
              icon={Waves}
              color="green"
            />
          </div>
        </section>

        {/* Power Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Электропитание
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SensorCard
              title="Потребление"
              value={latestReadings.power_consumption?.value ?? 0}
              unit="кВт"
              icon={Zap}
              color="yellow"
            />
            <SensorCard
              title="Напряжение"
              value={latestReadings.voltage?.value ?? 0}
              unit="В"
              icon={Zap}
              color="green"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
