import type { SensorReading } from '@/types';

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  duration: number; // в минутах
  generateData: (baseTime: Date) => {
    indoor: SensorReading[];
    outdoor: number;
    supply: SensorReading[];
    return: SensorReading[];
    alerts?: string[];
  };
}

// Генерация временных меток
function generateTimestamps(baseTime: Date, count: number, intervalMinutes: number): Date[] {
  const timestamps: Date[] = [];
  for (let i = 0; i < count; i++) {
    timestamps.push(new Date(baseTime.getTime() - (count - 1 - i) * intervalMinutes * 60 * 1000));
  }
  return timestamps;
}

// Создание показания датчика
function createReading(timestamp: Date, type: string, value: number, unit: string): SensorReading {
  return {
    id: crypto.randomUUID(),
    timestamp: timestamp.toISOString(),
    sensor_type: type as any,
    value,
    unit,
  };
}

export const simulationScenarios: SimulationScenario[] = [
  {
    id: 'normal',
    name: '🌡️ Нормальная работа',
    description: 'Стабильная работа всех систем, комфортная температура',
    icon: '✅',
    duration: 60,
    generateData: (baseTime) => {
      const timestamps = generateTimestamps(baseTime, 60, 1);
      const outdoor = -5;

      return {
        indoor: timestamps.map(t =>
          createReading(t, 'temperature_indoor', 21 + Math.random() * 0.5, '°C')
        ),
        outdoor,
        supply: timestamps.map(t =>
          createReading(t, 'temperature_heating_supply', 65 + Math.random() * 3, '°C')
        ),
        return: timestamps.map(t =>
          createReading(t, 'temperature_heating_return', 45 + Math.random() * 2, '°C')
        ),
      };
    },
  },
  {
    id: 'cold_wave',
    name: '❄️ Резкое похолодание',
    description: 'Температура падает с -5°C до -20°C за 6 часов',
    icon: '🥶',
    duration: 360,
    generateData: (baseTime) => {
      const timestamps = generateTimestamps(baseTime, 72, 5);

      return {
        indoor: timestamps.map((t, i) => {
          // Температура в доме медленно падает
          const temp = 22 - (i / 72) * 3 + Math.random() * 0.3;
          return createReading(t, 'temperature_indoor', temp, '°C');
        }),
        outdoor: -5 - (72 / 72) * 15, // Финальная температура -20°C
        supply: timestamps.map((t, i) => {
          // Система увеличивает подачу
          const temp = 65 + (i / 72) * 15 + Math.random() * 2;
          return createReading(t, 'temperature_heating_supply', temp, '°C');
        }),
        return: timestamps.map((t, i) => {
          const temp = 45 + (i / 72) * 5 + Math.random() * 2;
          return createReading(t, 'temperature_heating_return', temp, '°C');
        }),
        alerts: [
          'Экстремально низкая температура снаружи!',
          'Система отопления работает на максимуме',
          'Рекомендуется проверить утепление труб'
        ],
      };
    },
  },
  {
    id: 'heating_failure',
    name: '🔥 Авария отопления',
    description: 'Отказ системы отопления, температура подачи падает',
    icon: '⚠️',
    duration: 120,
    generateData: (baseTime) => {
      const timestamps = generateTimestamps(baseTime, 60, 2);

      return {
        indoor: timestamps.map((t, i) => {
          // Температура быстро падает после 20-й минуты
          let temp = 22;
          if (i > 10) {
            temp = 22 - ((i - 10) / 50) * 7;
          }
          return createReading(t, 'temperature_indoor', temp + Math.random() * 0.2, '°C');
        }),
        outdoor: -10,
        supply: timestamps.map((t, i) => {
          // Подача резко падает после 20-й минуты
          let temp = 70;
          if (i > 10) {
            temp = 70 - ((i - 10) / 50) * 50;
          }
          return createReading(t, 'temperature_heating_supply', temp, '°C');
        }),
        return: timestamps.map((t, i) => {
          let temp = 50;
          if (i > 10) {
            temp = 50 - ((i - 10) / 50) * 30;
          }
          return createReading(t, 'temperature_heating_return', temp, '°C');
        }),
        alerts: [
          'КРИТИЧНО: Температура подачи отопления ниже 40°C!',
          'Возможна авария котла',
          'Немедленно проверьте систему отопления!'
        ],
      };
    },
  },
  {
    id: 'warm_spring',
    name: '🌸 Весеннее потепление',
    description: 'Температура растёт с -5°C до +15°C, можно снизить отопление',
    icon: '☀️',
    duration: 480,
    generateData: (baseTime) => {
      const timestamps = generateTimestamps(baseTime, 96, 5);

      return {
        indoor: timestamps.map((t, i) => {
          // Температура в доме растёт
          const temp = 20 + (i / 96) * 3 + Math.random() * 0.4;
          return createReading(t, 'temperature_indoor', temp, '°C');
        }),
        outdoor: -5 + (96 / 96) * 20, // От -5 до +15
        supply: timestamps.map((t, i) => {
          // Система снижает подачу
          const temp = 70 - (i / 96) * 30 + Math.random() * 2;
          return createReading(t, 'temperature_heating_supply', temp, '°C');
        }),
        return: timestamps.map((t, i) => {
          const temp = 50 - (i / 96) * 20 + Math.random() * 2;
          return createReading(t, 'temperature_heating_return', temp, '°C');
        }),
        alerts: [
          'Возможность экономии: можно снизить температуру отопления',
          'При температуре выше +10°C рекомендуется проветривание'
        ],
      };
    },
  },
  {
    id: 'heat_loss',
    name: '🪟 Большие теплопотери',
    description: 'Окно открыто, температура быстро падает несмотря на работу отопления',
    icon: '💨',
    duration: 60,
    generateData: (baseTime) => {
      const timestamps = generateTimestamps(baseTime, 60, 1);

      return {
        indoor: timestamps.map((t, i) => {
          // Быстрое падение температуры
          const temp = 22 - (i / 60) * 6 + Math.random() * 0.5;
          return createReading(t, 'temperature_indoor', temp, '°C');
        }),
        outdoor: -8,
        supply: timestamps.map((t, i) => {
          // Система пытается компенсировать
          const temp = 65 + (i / 60) * 10 + Math.random() * 3;
          return createReading(t, 'temperature_heating_supply', temp, '°C');
        }),
        return: timestamps.map((t, i) => {
          const temp = 45 + Math.random() * 2;
          return createReading(t, 'temperature_heating_return', temp, '°C');
        }),
        alerts: [
          'Обнаружены аномальные теплопотери!',
          'Разница температур превышает норму',
          'Проверьте окна и двери на герметичность'
        ],
      };
    },
  },
  {
    id: 'night_mode',
    name: '🌙 Ночной режим',
    description: 'Плавное снижение температуры ночью для экономии',
    icon: '😴',
    duration: 480,
    generateData: (baseTime) => {
      const timestamps = generateTimestamps(baseTime, 96, 5);

      return {
        indoor: timestamps.map((t, i) => {
          // Плавное снижение с 22 до 19, затем подъём обратно
          let temp = 22;
          if (i < 48) {
            temp = 22 - (i / 48) * 3; // Снижение
          } else {
            temp = 19 + ((i - 48) / 48) * 3; // Подъём
          }
          return createReading(t, 'temperature_indoor', temp + Math.random() * 0.3, '°C');
        }),
        outdoor: -7,
        supply: timestamps.map((t, i) => {
          let temp = 65;
          if (i < 48) {
            temp = 65 - (i / 48) * 20;
          } else {
            temp = 45 + ((i - 48) / 48) * 20;
          }
          return createReading(t, 'temperature_heating_supply', temp + Math.random() * 2, '°C');
        }),
        return: timestamps.map((t, i) => {
          let temp = 45;
          if (i < 48) {
            temp = 45 - (i / 48) * 10;
          } else {
            temp = 35 + ((i - 48) / 48) * 10;
          }
          return createReading(t, 'temperature_heating_return', temp + Math.random() * 2, '°C');
        }),
      };
    },
  },
];

// Функция для получения сценария по ID
export function getScenarioById(id: string): SimulationScenario | undefined {
  return simulationScenarios.find(s => s.id === id);
}

// Функция для применения сценария
export async function applySimulation(scenarioId: string) {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) return null;

  const baseTime = new Date();
  const data = scenario.generateData(baseTime);

  return {
    scenario,
    data,
    appliedAt: baseTime,
  };
}
