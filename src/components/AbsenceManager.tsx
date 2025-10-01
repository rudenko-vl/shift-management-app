import { useState, useEffect } from 'react';
import { supabase, type Absence, type Employee, type AbsenceType } from '../lib/supabase';
import { Coffee, Heart, Plus, CreditCard as Edit2, Trash2 } from 'lucide-react';

interface AbsenceManagerProps {
  selectedEmployeeId?: string;
}

export default function AbsenceManager({ selectedEmployeeId }: AbsenceManagerProps) {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    absence_type: 'vacation' as AbsenceType,
    start_date: '',
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedEmployeeId]);

  const loadData = async () => {
    setLoading(true);

    let absencesQuery = supabase
      .from('absences')
      .select('*')
      .order('start_date', { ascending: false });

    if (selectedEmployeeId) {
      absencesQuery = absencesQuery.eq('employee_id', selectedEmployeeId);
    }

    const [absencesResult, employeesResult] = await Promise.all([
      absencesQuery,
      supabase.from('employees').select('*').eq('active', true).order('name')
    ]);

    if (absencesResult.error) console.error('Error loading absences:', absencesResult.error);
    if (employeesResult.error) console.error('Error loading employees:', employeesResult.error);

    setAbsences(absencesResult.data || []);
    setEmployees(employeesResult.data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      alert('Дата окончания не может быть раньше даты начала');
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from('absences')
        .update({
          employee_id: formData.employee_id,
          absence_type: formData.absence_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          notes: formData.notes || null
        })
        .eq('id', editingId);

      if (error) {
        console.error('Error updating absence:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('absences')
        .insert([{
          employee_id: formData.employee_id,
          absence_type: formData.absence_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          notes: formData.notes || null
        }]);

      if (error) {
        console.error('Error creating absence:', error);
        return;
      }
    }

    resetForm();
    loadData();
  };

  const handleEdit = (absence: Absence) => {
    setFormData({
      employee_id: absence.employee_id,
      absence_type: absence.absence_type,
      start_date: absence.start_date,
      end_date: absence.end_date,
      notes: absence.notes || ''
    });
    setEditingId(absence.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту запись?')) return;

    const { error } = await supabase
      .from('absences')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting absence:', error);
    } else {
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      absence_type: 'vacation',
      start_date: '',
      end_date: '',
      notes: ''
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find(e => e.id === employeeId)?.name || 'Неизвестно';
  };

  const getAbsenceTypeLabel = (type: AbsenceType) => {
    return type === 'vacation' ? 'Отпуск' : 'Больничный';
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Отпуска и больничные</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сотрудник
              </label>
              <select
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
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
                Тип
              </label>
              <select
                value={formData.absence_type}
                onChange={(e) => setFormData({ ...formData, absence_type: e.target.value as AbsenceType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="vacation">Отпуск</option>
                <option value="sick_leave">Больничный</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата начала
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата окончания
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Примечания
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingId ? 'Обновить' : 'Создать'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-gray-200">
        {absences.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Нет записей
          </div>
        ) : (
          absences.map((absence) => (
            <div
              key={absence.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {absence.absence_type === 'vacation' ? (
                      <Coffee className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <Heart className="w-4 h-4 text-red-600" />
                    )}
                    <h3 className="font-medium text-gray-900">
                      {getEmployeeName(absence.employee_id)}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        absence.absence_type === 'vacation'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {getAbsenceTypeLabel(absence.absence_type)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(absence.start_date)} - {formatDate(absence.end_date)}
                    <span className="text-gray-500 ml-2">
                      ({getDuration(absence.start_date, absence.end_date)} дн.)
                    </span>
                  </div>
                  {absence.notes && (
                    <p className="text-sm text-gray-500 mt-1">{absence.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(absence)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(absence.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
