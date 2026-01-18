import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Save } from 'lucide-react';
import { successNotification, errorNotification } from '../../../components/ui/Toast';
import { APIS } from '../../../services/apis';
import http from '../../../services/http';

const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  date: z.string().min(1, 'Date is required'),
  is_recurring: z.boolean(),
  description: z.string().optional(),
});

type HolidayFormValues = z.infer<typeof holidaySchema>;

type Props = {
    onSucess: () => void,
}

const HolidayForm: React.FC<Props> = ({ 
    onSucess
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      name: '',
      date: '',
      is_recurring: false,
      description: '',
    },
  });

  const onSubmit = async (data: HolidayFormValues) => {
    try {
      const response = await http.post(APIS.HOLIDAYS, data);
      successNotification(response.data.message);
      onSucess();
      reset();
    } catch (error: any) {
      errorNotification(error?.response?.data?.message || 'Failed to create holiday');
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Holiday Name
          </label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
            placeholder="e.g., Christmas Day"
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date
          </label>
          <input
            {...register('date')}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
          />
          {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
          placeholder="Holiday description..."
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register('is_recurring')}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Recurring annually</span>
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Save size={16} />
          {isSubmitting ? 'Saving...' : 'Save Holiday'}
        </button>
      </div>
    </form>
  );
};

export default HolidayForm;
