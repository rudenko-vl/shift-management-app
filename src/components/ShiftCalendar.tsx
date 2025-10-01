import { useState, useEffect } from 'react';
import { supabase, type Shift, type Employee, type ShiftType, type Absence } from '../lib/supabase';
import { Calendar, Briefcase, Home, AlertCircle, Plus, X } from 'lucide-react';

interface ShiftCalendarProps {
  selectedEmployeeId?: string;
}

export default function ShiftCalendar({ selectedEmployeeId }: ShiftCalendarProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddShift, setShowAddShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEmployeeForShift, setSelectedEmployeeForShift] = useState<string>('');
  const [shiftType, setShiftType] = useState<ShiftType>('office');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [currentDate, selectedEmployeeId]);

  const loadData = async () => {
    setLoading(true);

    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];

    let shiftsQuery = supabase
      .from('shifts')
      .select('*')
      .gte('shift_date', startDate)
      .lte('shift_date', endDate);

    let absencesQuery = supabase
      .from('absences')
      .select('*')
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

    if (selectedEmployeeId) {
      shiftsQuery = shiftsQuery.eq('employee_id', selectedEmployeeId);
      absencesQuery = absencesQuery.eq('employee_id', selectedEmployeeId);
    }

    const [shiftsResult, absencesResult, employeesResult] = await Promise.all([
      shiftsQuery,
      absencesQuery,
      supabase.from('employees').select('*').eq('active', true).order('name')
    ]);

    if (shiftsResult.error) console.error('Error loading shifts:', shiftsResult.error);
    if (absencesResult.error) console.error('Error loading absences:', absencesResult.error);
    if (employeesResult.error) console.error('Error loading employees:', employeesResult.error);

    setShifts(shiftsResult.data || []);
    setAbsences(absencesResult.data || []);
    setEmployees(employeesResult.data || []);
    setLoading(false);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startingDayOfWeek = firstDay.getDay();

    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getShiftsForDate = (day: number) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split('T')[0];

    return shifts.filter(shift => shift.shift_date === dateStr);
  };

  const getAbsenceForDate = (day: number, employeeId: string) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split('T')[0];

    return absences.find(absence =>
      absence.employee_id === employeeId &&
      absence.start_date <= dateStr &&
      absence.end_date >= dateStr
    );
  };

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();

    const employeeAbsence = absences.find(absence =>
      absence.employee_id === selectedEmployeeForShift &&
      absence.start_date <= selectedDate &&
      absence.end_date >= selectedDate
    );

    if (employeeAbsence) {
      const absenceLabel = employeeAbsence.absence_type === 'vacation' ? 'отпуске' : 'больничном';
      alert(`Нельзя назначить смену. Сотрудник находится в ${absenceLabel} с ${new Date(employeeAbsence.start_date).toLocaleDateString('ru-RU')} по ${new Date(employeeAbsence.end_date).toLocaleDateString('ru-RU')}`);
      return;
    }

    const { error } = await supabase
      .from('shifts')
      .insert([{
        employee_id: selectedEmployeeForShift,
        shift_date: selectedDate,
        shift_type: shiftType,
        notes: notes || null
      }]);

    if (error) {
      console.error('Error creating shift:', error);
      return;
    }

    setShowAddShift(false);
    setSelectedDate('');
    setSelectedEmployeeForShift('');
    setShiftType('office');
    setNotes('');
    loadData();
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm('Удалить эту смену?')) return;

    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shift:', error);
    } else {
      loadData();
    }
  };

  // const openAddShiftDialog = (day: number) => {
  //   const dateStr = new Date(
  //     currentDate.getFullYear(),
  //     currentDate.getMonth(),
  //     day
  //   ).toISOString().split('T')[0];

  //   setSelectedDate(dateStr);
  //   setShowAddShift(true);
  // };

  const openAddShiftDialog = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0, поэтому +1
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;

    setSelectedDate(dateStr);
    setShowAddShift(true);
  };

  const getShiftTypeLabel = (type: ShiftType) => {
    switch (type) {
      case 'office': return 'Офис';
      case 'remote': return 'Удаленно';
      case 'oncall': return 'Дежурный';
      default: return type;
    }
  };

  const getShiftTypeColor = (type: ShiftType) => {
    switch (type) {
      case 'office': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'remote': return 'bg-green-100 text-green-800 border-green-200';
      case 'oncall': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAbsenceTypeLabel = (type: string) => {
    switch (type) {
      case 'vacation': return 'Отпуск';
      case 'sick_leave': return 'Больничный';
      default: return type;
    }
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const days = getDaysInMonth();

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
            <Calendar className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">График смен</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ←
            </button>
            <span className="font-medium text-gray-900 min-w-[150px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              →
            </button>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span className="text-gray-700">Офис</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-gray-700">Удаленно</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
            <span className="text-gray-700">Дежурный</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="text-gray-700">Отпуск</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-gray-700">Больничный</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center font-medium text-gray-700 text-sm">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }

            const dayShifts = getShiftsForDate(day);
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === currentDate.getMonth() &&
              new Date().getFullYear() === currentDate.getFullYear();


            return (
              <div
                onClick={() => openAddShiftDialog(day)}
                title="Добавить смену"
                key={day}
                className={`cursor-pointer aspect-square border rounded-lg p-2 hover:shadow-md transition-shadow ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  {/* <button
                    onClick={() => openAddShiftDialog(day)}
                    className="opacity-0 hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-all"
                    title="Добавить смену"
                  >
                    <Plus className="w-3 h-3 text-gray-600" />
                  </button> */}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-20">
                  {dayShifts.map((shift) => {
                    const employee = employees.find(e => e.id === shift.employee_id);
                    const absence = employee ? getAbsenceForDate(day, employee.id) : null;

                    return (
                      <div
                        key={shift.id}
                        className={`text-xs p-1 rounded border relative group ${absence
                          ? absence.absence_type === 'vacation'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                          : getShiftTypeColor(shift.shift_type)
                          }`}
                        title={`${employee?.name} - ${getShiftTypeLabel(shift.shift_type)}${absence ? ` (${getAbsenceTypeLabel(absence.absence_type)})` : ''
                          }${shift.notes ? `\n${shift.notes}` : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate flex-1">
                            {employee?.name.split(' ')[0]}
                          </span>
                          <button
                            onClick={() => handleDeleteShift(shift.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {absence && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span className="text-[10px]">
                              {getAbsenceTypeLabel(absence.absence_type)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAddShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Добавить смену</h3>
              <button
                onClick={() => setShowAddShift(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddShift} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Сотрудник
                </label>
                <select
                  value={selectedEmployeeForShift}
                  onChange={(e) => setSelectedEmployeeForShift(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Выберите сотрудника</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип смены
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setShiftType('office')}
                    className={`p-3 rounded-lg border-2 transition-colors ${shiftType === 'office'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Briefcase className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <span className="text-xs font-medium">Офис</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShiftType('remote')}
                    className={`p-3 rounded-lg border-2 transition-colors ${shiftType === 'remote'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Home className="w-5 h-5 mx-auto mb-1 text-green-600" />
                    <span className="text-xs font-medium">Удаленно</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShiftType('oncall')}
                    className={`p-3 rounded-lg border-2 transition-colors ${shiftType === 'oncall'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <AlertCircle className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                    <span className="text-xs font-medium">Дежурный</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Примечания
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Создать
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddShift(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
