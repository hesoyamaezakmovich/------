'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { Rule } from '@/types';

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    try {
      const { data } = await supabase
        .from('rules')
        .select('*')
        .order('priority', { ascending: false });

      if (data) {
        setRules(data);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRule(id: string, enabled: boolean) {
    try {
      const { error } = await supabase
        .from('rules')
        .update({ enabled: !enabled })
        .eq('id', id);

      if (!error) {
        setRules(prev =>
          prev.map(rule =>
            rule.id === id ? { ...rule, enabled: !enabled } : rule
          )
        );
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">Загрузка...</div>
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
                Правила и условия
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Управление автоматическими правилами мониторинга
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              На главную
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6">
          {rules.map(rule => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{rule.name}</CardTitle>
                  <button
                    onClick={() => toggleRule(rule.id, rule.enabled)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      rule.enabled
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500'
                    }`}
                  >
                    {rule.enabled ? 'Включено' : 'Выключено'}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {rule.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Условие:
                    </h4>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                      {JSON.stringify(rule.condition, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Действие:
                    </h4>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                      {JSON.stringify(rule.action, null, 2)}
                    </pre>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Приоритет: {rule.priority}</span>
                  <span>ID: {rule.id}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
