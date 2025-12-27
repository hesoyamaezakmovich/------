'use client';

import { NotificationSettings } from '@/components/NotificationSettings';
import Link from 'next/link';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Настройки
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Настройка уведомлений и параметров системы
                </p>
              </div>
            </div>
            <div>
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                На главную
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NotificationSettings />
      </main>
    </div>
  );
}
