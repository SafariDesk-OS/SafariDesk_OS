import React, { useEffect, useState } from 'react';
import { Edit, X, Clock, Save } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import http from '../../../services/http';
import { APIS } from '../../../services/apis';
import { errorNotification } from '../../../components/ui/Toast';
import Spinner from '../../../components/ui/DataLoader';
import { EmptyState } from '../../../components/ui/NoItems';

type BusinessHour = {
  id: number;
  name: string;
  day_of_week: number; // 0-6
  start_time: string;
  end_time: string;
  is_working_day: boolean;
};

type BusinessHoursComponentProps = {
  onEdit?: () => void;
  onUpdateHours?: (updatedHour: BusinessHour) => void;
  reload: number;
  setBusinessHoursCount: React.Dispatch<React.SetStateAction<number>>;
};

const BusinessHoursComponent: React.FC<BusinessHoursComponentProps> = ({
  onEdit,
  onUpdateHours,
  reload,
  setBusinessHoursCount
}) => {
  const [selectedHour, setSelectedHour] = useState<BusinessHour | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState<BusinessHour | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHour[] | [] >([]);
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const loadBusinessHours = async () => {
      try{
        setLoading(true)

        const response = await http.get(APIS.LOAD_BUSINESS_HOURS);
        setBusinessHours(response.data)
        setBusinessHoursCount(response.data.filter((day: BusinessHour) => day.is_working_day).length); 


      }catch(error: any){
          errorNotification(error?.response?.data?.message || "An error occurred")
      }finally{
        setTimeout(() => setLoading(false), 100)
      }
    }

  useEffect(() => {
    loadBusinessHours()
  }, [reload])



  const handleCardClick = (hour: BusinessHour) => {
    setSelectedHour(hour);
    setEditForm({ ...hour }); // No need to map, use day_of_week directly
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedHour(null);
    setEditForm(null);
  };

  const handleSave = () => {
    if (editForm && onUpdateHours) {
      onUpdateHours(editForm);
    }
    handleCloseModal();
  };

  const handleFormChange = (field: keyof BusinessHour, value: any) => {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value });
    }
  };

  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  if(loading) {
   return <Spinner/>
  }

  return (
    <div className="space-y-6">
        {
            businessHours.length === 0 && <EmptyState title='No Business hours configured'/>
          }
      <div className=" p-6">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businessHours.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 group border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-500"
              onClick={() => handleCardClick(schedule)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {weekdays[schedule.day_of_week]}
                  </p>
                  <Clock size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {schedule.is_working_day
                    ? `${schedule.start_time} - ${schedule.end_time}`
                    : 'Closed'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full transition-colors ${
                    schedule.is_working_day ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <Edit size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
              </div>
            </div>
          ))}
        </div>
      </div>



      <Modal 
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)} 
      title={`Edit ${editForm ? weekdays[editForm.day_of_week] : ''} Hours`}> 
      {
        editForm && (
             <div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_working_day"
                  checked={editForm.is_working_day}
                  onChange={(e) => handleFormChange('is_working_day', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_working_day" className="text-sm font-medium text-gray-900 dark:text-white">
                  Working Day
                </label>
              </div>
              {/* Add name field for consistency with API */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name" // Added name attribute
                  value={editForm.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {editForm.is_working_day && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time
                    </label>
                    <select
                      value={editForm.start_time}
                      onChange={(e) => handleFormChange('start_time', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time
                    </label>
                    <select
                      value={editForm.end_time}
                      onChange={(e) => handleFormChange('end_time', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
        </div>
        )
      }
       
      </Modal>
    </div>
  );
};

export default BusinessHoursComponent;
