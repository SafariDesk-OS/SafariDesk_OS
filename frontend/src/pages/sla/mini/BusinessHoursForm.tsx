import React, { useState, useEffect } from 'react';
import z from "zod";
import Button from "../../../components/ui/Button"
import { Input } from "../../../components/ui/Input"
import http from '../../../services/http';
import { APIS } from '../../../services/apis';
import { errorNotification, successNotification } from '../../../components/ui/Toast';
import { AxiosError } from 'axios';

// Business Hours Schema
const businessHoursSchema = z.object({
  name: z.string().min(1, 'Business hours name is required'),
  weekday: z.number().min(0).max(6, 'Invalid weekday'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  is_working_day: z.boolean(),
  timezone: z.string().min(1, 'Timezone is required'),
});

type BusinessHours = z.infer<typeof businessHoursSchema>;

// Business Hours Form Component
type BusinessHoursFormProps = {
  onSucess: () => void;
};

const BusinessHoursForm: React.FC<BusinessHoursFormProps> = ({ onSucess }) => {
  const [detectedTimezone, setDetectedTimezone] = useState<string>('UTC');
  const [ sending, setSending ] = useState<boolean>(false)
  
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([
    {
      name: "Default Business Hours",
      weekday: 0,
      start_time: "08:00",
      end_time: "17:00",
      is_working_day: true,
      timezone: "UTC"
    }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-detect timezone on component mount
  useEffect(() => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTimezone(timezone);
      
      // Update initial business hours with detected timezone
      setBusinessHours(prev => prev.map(hour => ({
        ...hour,
        timezone: timezone
      })));
    } catch (error) {
      console.log('Could not detect timezone, using UTC as fallback');
    }
  }, []);

  const weekdays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const timezones = [
    detectedTimezone,
    'UTC', 
    'America/New_York', 
    'America/Chicago', 
    'America/Denver', 
    'America/Los_Angeles', 
    'Europe/London', 
    'Europe/Paris', 
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ].filter((tz, index, arr) => arr.indexOf(tz) === index); // Remove duplicates

  const validateBusinessHours = () => {
    const newErrors: Record<string, string> = {};
    
    businessHours.forEach((hour, index) => {
      try {
        businessHoursSchema.parse(hour);
        
        // Additional validation for time logic
        if (hour.is_working_day && hour.start_time >= hour.end_time) {
          newErrors[`time_${index}`] = 'End time must be after start time';
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            newErrors[`${err.path.join('_')}_${index}`] = err.message;
          });
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validateBusinessHours()) {
      // Build JSON and log it
      const data = businessHours.map(hour => ({
        name: hour.name,
        weekday: hour.weekday,
        start_time: hour.start_time,
        end_time: hour.end_time,
        is_working_day: hour.is_working_day,
        timezone: hour.timezone
      }));
      const payload = {
        data: data
      }
      
      try{
        setSending(true)
        const response = await http.post(APIS.CREATE_BUSINESS_HOURS, payload);
        successNotification(response.data.message)
        onSucess();
      }catch(error: any){
          errorNotification(error?.response?.data?.message || "An error occurred")
      }finally{
        setSending(false)
      }
      
      
    }
  };

  const updateBusinessHour = (index: number, field: keyof BusinessHours, value: any) => {
    const updated = [...businessHours];
    updated[index] = { ...updated[index], [field]: value };
    setBusinessHours(updated);
  };

  const addBusinessHour = () => {
    setBusinessHours([...businessHours, {
      name: `Business Hours ${businessHours.length + 1}`,
      weekday: 0,
      start_time: "09:00",
      end_time: "17:00",
      is_working_day: true,
      timezone: detectedTimezone
    }]);
  };

  const removeBusinessHour = (index: number) => {
    if (businessHours.length > 1) {
      setBusinessHours(businessHours.filter((_, i) => i !== index));
    }
  };


  return (
    <div className=" rounded-lg w-full  overflow-y-auto">
            
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Your timezone: <strong>{detectedTimezone}</strong>
              </p>
            </div>
            
            <div className="space-y-4">
              {businessHours.map((hour, index) => (
                <div key={index} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      Business Hours {index + 1}
                    </h3>
                    {businessHours.length > 1 && (
                      <Button 
                        onClick={() => removeBusinessHour(index)}
                        variant="outline"
                        size="sm"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Name"
                        value={hour.name}
                        onChange={(e) => updateBusinessHour(index, 'name', e.target.value)}
                        error={errors[`name_${index}`]}
                        fullWidth
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Weekday
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        value={hour.weekday}
                        onChange={(e) => updateBusinessHour(index, 'weekday', parseInt(e.target.value))}
                      >
                        {weekdays.map((day, dayIndex) => (
                          <option key={dayIndex} value={dayIndex}>{day}</option>
                        ))}
                      </select>
                      {errors[`weekday_${index}`] && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors[`weekday_${index}`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <Input
                        label="Start Time"
                        type="time"
                        value={hour.start_time}
                        onChange={(e) => updateBusinessHour(index, 'start_time', e.target.value)}
                        error={errors[`start_time_${index}`] || errors[`time_${index}`]}
                        fullWidth
                        disabled={!hour.is_working_day}
                      />
                    </div>

                    <div>
                      <Input
                        label="End Time"
                        type="time"
                        value={hour.end_time}
                        onChange={(e) => updateBusinessHour(index, 'end_time', e.target.value)}
                        error={errors[`end_time_${index}`]}
                        fullWidth
                        disabled={!hour.is_working_day}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Timezone
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        value={hour.timezone}
                        onChange={(e) => updateBusinessHour(index, 'timezone', e.target.value)}
                      >
                        {timezones.map((tz) => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                      {errors[`timezone_${index}`] && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors[`timezone_${index}`]}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={hour.is_working_day}
                          onChange={(e) => updateBusinessHour(index, 'is_working_day', e.target.checked)}
                          className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Working Day
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 mx-1">
              <Button onClick={addBusinessHour} variant="outline" className="w-full">
                Add Business Hours
              </Button>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600 mt-6">
              <Button onClick={handleSave} disabled={sending}>
                {
                  sending ? "Please wait..." : "Save Business Hours"
                }
              </Button>
            </div>
          </div>
  );
};

export default BusinessHoursForm;