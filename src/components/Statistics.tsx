import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, TrendingUp } from 'lucide-react';

interface StatisticsProps {
  selectedEmployeeId?: string;
}

export default function Statistics({ selectedEmployeeId }: StatisticsProps) {
  const [stats, setStats] = useState({
    officeShifts: 0,
    remoteShifts: 0,
    oncallShifts: 0,
    vacationDays: 0,
    sickLeaveDays: 0,
    totalEmployees: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadStatistics();
  }, [selectedEmployeeId, dateRange]);

  const loadStatistics = async () => {
    setLoading(true);

    let shiftsQuery = supabase
      .from('shifts')
      .select('*')
      .gte('shift_date', dateRange.startDate)
      .lte('shift_date', dateRange.endDate);

    let absencesQuery = supabase
      .from('absences')
      .select('*')
      .or(`and(start_date.lte.${dateRange.endDate},end_date.gte.${dateRange.startDate})`);

    if (selectedEmployeeId) {
      shiftsQuery = shiftsQuery.eq('employee_id', selectedEmployeeId);
      absencesQuery = absencesQuery.eq('employee_id', selectedEmployeeId);
    }

    const [shiftsResult, absencesResult, employeesResult] = await Promise.all([
      shiftsQuery,
      absencesQuery,
      supabase.from('employees').select('id', { count: 'exact' }).eq('active', true)
    ]);

    if (shiftsResult.error) console.error('Error loading shifts:', shiftsResult.error);
    if (absencesResult.error) console.error('Error loading absences:', absencesResult.error);
    if (employeesResult.error) console.error('Error loading employees:', employeesResult.error);

    const shifts = shiftsResult.data || [];
    const absences = absencesResult.data || [];

    const officeShifts = shifts.filter(s => s.shift_type === 'office').length;
    const remoteShifts = shifts.filter(s => s.shift_type === 'remote').length;
    const oncallShifts = shifts.filter(s => s.shift_type === 'oncall').length;

    let vacationDays = 0;
    let sickLeaveDays = 0;

    absences.forEach(absence => {
      const start = new Date(Math.max(new Date(absence.start_date).getTime(), new Date(dateRange.startDate).getTime()));
      const end = new Date(Math.min(new Date(absence.end_date).getTime(), new Date(dateRange.endDate).getTime()));
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (absence.absence_type === 'vacation') {
        vacationDays += days;
      } else {
        sickLeaveDays += days;
      }
    });

    setStats({
      officeShifts,
      remoteShifts,
      oncallShifts,
      vacationDays,
      sickLeaveDays,
      totalEmployees: employeesResult.count || 0
    });

    setLoading(false);
  };

  const totalShifts = stats.officeShifts + stats.remoteShifts + stats.oncallShifts;

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Статистика</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата начала
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата окончания
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Офис</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">{stats.officeShifts}</div>
            <div className="text-xs text-blue-600 mt-1">
              {getPercentage(stats.officeShifts, totalShifts)}% от всех смен
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">Удаленно</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900">{stats.remoteShifts}</div>
            <div className="text-xs text-green-600 mt-1">
              {getPercentage(stats.remoteShifts, totalShifts)}% от всех смен
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-700">Дежурный</span>
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-900">{stats.oncallShifts}</div>
            <div className="text-xs text-orange-600 mt-1">
              {getPercentage(stats.oncallShifts, totalShifts)}% от всех смен
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-700">Отпуска</span>
              <TrendingUp className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-900">{stats.vacationDays}</div>
            <div className="text-xs text-yellow-600 mt-1">дней в выбранном периоде</div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-700">Больничные</span>
              <TrendingUp className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-900">{stats.sickLeaveDays}</div>
            <div className="text-xs text-red-600 mt-1">дней в выбранном периоде</div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Всего смен</span>
              <TrendingUp className="w-4 h-4 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalShifts}</div>
            <div className="text-xs text-gray-600 mt-1">
              {stats.totalEmployees} {selectedEmployeeId ? 'сотрудник' : 'активных сотрудников'}
            </div>
          </div>
        </div>

        {totalShifts > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Распределение смен</h3>
            <div className="h-8 flex rounded-lg overflow-hidden border border-gray-200">
              {stats.officeShifts > 0 && (
                <div
                  className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${getPercentage(stats.officeShifts, totalShifts)}%` }}
                >
                  {getPercentage(stats.officeShifts, totalShifts)}%
                </div>
              )}
              {stats.remoteShifts > 0 && (
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${getPercentage(stats.remoteShifts, totalShifts)}%` }}
                >
                  {getPercentage(stats.remoteShifts, totalShifts)}%
                </div>
              )}
              {stats.oncallShifts > 0 && (
                <div
                  className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${getPercentage(stats.oncallShifts, totalShifts)}%` }}
                >
                  {getPercentage(stats.oncallShifts, totalShifts)}%
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
