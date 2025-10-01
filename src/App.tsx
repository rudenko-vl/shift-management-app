import { useState } from 'react';
import EmployeeList from './components/EmployeeList';
import ShiftCalendar from './components/ShiftCalendar';
import AbsenceManager from './components/AbsenceManager';
import Statistics from './components/Statistics';
import { CalendarDays, Filter, X } from 'lucide-react';

function App() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'calendar' | 'absences' | 'statistics'>('calendar');

  const handleEmployeeSelect = (employeeId: string) => {
    if (selectedEmployeeId === employeeId) {
      setSelectedEmployeeId(undefined);
    } else {
      setSelectedEmployeeId(employeeId);
    }
  };

  const clearFilter = () => {
    setSelectedEmployeeId(undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Планирование смен</h1>
                <p className="text-sm text-gray-600">Управление рабочим графиком персонала</p>
              </div>
            </div>
            {selectedEmployeeId && (
              <button
                onClick={clearFilter}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Сбросить фильтр</span>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <EmployeeList
              onEmployeeSelect={handleEmployeeSelect}
              selectedEmployeeId={selectedEmployeeId}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'calendar'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Календарь смен
                </button>
                <button
                  onClick={() => setActiveTab('absences')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'absences'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Отпуска и больничные
                </button>
                <button
                  onClick={() => setActiveTab('statistics')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'statistics'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Статистика
                </button>
              </div>

              <div className="p-0">
                {activeTab === 'calendar' && (
                  <ShiftCalendar selectedEmployeeId={selectedEmployeeId} />
                )}
                {activeTab === 'absences' && (
                  <AbsenceManager selectedEmployeeId={selectedEmployeeId} />
                )}
                {activeTab === 'statistics' && (
                  <Statistics selectedEmployeeId={selectedEmployeeId} />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
