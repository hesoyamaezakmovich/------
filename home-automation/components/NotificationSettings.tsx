'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Bell, BellOff, Mail, MessageSquare } from 'lucide-react';

interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  condition: string;
  channels: ('push' | 'email' | 'telegram')[];
}

const defaultRules: NotificationRule[] = [
  {
    id: '1',
    name: 'Резкое падение температуры',
    enabled: true,
    condition: 'Температура снаружи упала более чем на 5°C за 3 часа',
    channels: ['push']
  },
  {
    id: '2',
    name: 'Высокое энергопотребление',
    enabled: true,
    condition: 'Потребление электроэнергии превысило 5 кВт',
    channels: ['push', 'email']
  },
  {
    id: '3',
    name: 'Проблемы с отоплением',
    enabled: true,
    condition: 'Температура подачи ниже 40°C при включённом отоплении',
    channels: ['push', 'email', 'telegram']
  },
  {
    id: '4',
    name: 'Экстремальная погода',
    enabled: false,
    condition: 'Температура снаружи ниже -20°C или выше +35°C',
    channels: ['push', 'telegram']
  },
  {
    id: '5',
    name: 'Некомфортная температура дома',
    enabled: false,
    condition: 'Температура в доме ниже 18°C или выше 25°C',
    channels: ['push']
  }
];

export function NotificationSettings() {
  const [rules, setRules] = useState<NotificationRule[]>(defaultRules);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    // Загружаем настройки из localStorage
    const saved = localStorage.getItem('notificationRules');
    if (saved) {
      setRules(JSON.parse(saved));
    }

    // Проверяем поддержку push-уведомлений
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  const toggleRule = (id: string) => {
    const updated = rules.map(rule =>
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    );
    setRules(updated);
    localStorage.setItem('notificationRules', JSON.stringify(updated));
  };

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPushEnabled(permission === 'granted');

      if (permission === 'granted') {
        new Notification('Уведомления включены!', {
          body: 'Теперь вы будете получать важные уведомления о состоянии вашего дома.',
          icon: '/icon.png'
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Настройки уведомлений
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Push-уведомления */}
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              {pushEnabled ? (
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Push-уведомления
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {pushEnabled ? 'Включены' : 'Отключены'}
                </p>
              </div>
            </div>
            {!pushEnabled && (
              <button
                onClick={requestPushPermission}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Включить
              </button>
            )}
          </div>

          {/* Правила уведомлений */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Правила уведомлений
            </h3>
            {rules.map(rule => (
              <div
                key={rule.id}
                className={`p-4 rounded-lg border transition-all ${
                  rule.enabled
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {rule.name}
                      </h4>
                      {rule.enabled && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                          Активно
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {rule.condition}
                    </p>
                    <div className="flex items-center gap-2">
                      {rule.channels.includes('push') && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                          <Bell className="h-3 w-3" />
                          Push
                        </span>
                      )}
                      {rule.channels.includes('email') && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                          <Mail className="h-3 w-3" />
                          Email
                        </span>
                      )}
                      {rule.channels.includes('telegram') && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                          <MessageSquare className="h-3 w-3" />
                          Telegram
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      rule.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        rule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Инструкция для Telegram */}
          <div className="p-4 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg border border-cyan-200 dark:border-cyan-800">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-cyan-900 dark:text-cyan-100 mb-1">
                  Подключение Telegram бота
                </p>
                <p className="text-cyan-700 dark:text-cyan-300">
                  Для получения уведомлений в Telegram, найдите бота <code className="px-1 bg-cyan-200 dark:bg-cyan-900 rounded">@YourHomeBot</code> и отправьте команду <code className="px-1 bg-cyan-200 dark:bg-cyan-900 rounded">/start</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
