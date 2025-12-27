'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { ControllerCommand, Room } from '@/types';
import { Flame, Thermometer, Power } from 'lucide-react';

export default function ControlPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [commands, setCommands] = useState<ControllerCommand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch rooms
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .order('name');

      if (roomsData) {
        setRooms(roomsData);
      }

      // Fetch recent commands
      const { data: commandsData } = await supabase
        .from('controller_commands')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (commandsData) {
        setCommands(commandsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateRoomTemperature(roomId: string, temperature: number) {
    try {
      // Update room target temperature
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ target_temperature: temperature })
        .eq('id', roomId);

      if (updateError) throw updateError;

      // Create controller command
      const { error: commandError } = await supabase
        .from('controller_commands')
        .insert({
          command_type: 'set_room_temperature',
          parameters: { room_id: roomId, temperature },
          status: 'pending'
        });

      if (commandError) throw commandError;

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error updating temperature:', error);
    }
  }

  async function sendHeatingCommand(enable: boolean) {
    try {
      const { error } = await supabase
        .from('controller_commands')
        .insert({
          command_type: enable ? 'enable_heating' : 'disable_heating',
          parameters: { enabled: enable },
          status: 'pending'
        });

      if (!error) {
        fetchData();
      }
    } catch (error) {
      console.error('Error sending heating command:', error);
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
                Управление
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Управление системами дома
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
        {/* Heating Control */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-6 w-6 text-red-600" />
                Управление отоплением
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <button
                  onClick={() => sendHeatingCommand(true)}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Power className="h-5 w-5" />
                  Включить отопление
                </button>
                <button
                  onClick={() => sendHeatingCommand(false)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <Power className="h-5 w-5" />
                  Выключить отопление
                </button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Room Temperature Control */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Температура по комнатам
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(room => (
              <Card key={room.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5" />
                    {room.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Целевая температура
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="15"
                        max="30"
                        value={room.target_temperature}
                        onChange={(e) => {
                          const newTemp = parseFloat(e.target.value);
                          setRooms(prev =>
                            prev.map(r =>
                              r.id === room.id ? { ...r, target_temperature: newTemp } : r
                            )
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <button
                      onClick={() => updateRoomTemperature(room.id, room.target_temperature)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Применить
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Command History */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            История команд
          </h2>
          <Card>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-900 dark:text-white">
                        Время
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-900 dark:text-white">
                        Команда
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-900 dark:text-white">
                        Параметры
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-900 dark:text-white">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {commands.map(cmd => (
                      <tr key={cmd.id}>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                          {new Date(cmd.created_at).toLocaleString('ru-RU')}
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {cmd.command_type}
                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                          <pre className="text-xs">
                            {JSON.stringify(cmd.parameters)}
                          </pre>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            cmd.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            cmd.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            cmd.status === 'acknowledged' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {cmd.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
