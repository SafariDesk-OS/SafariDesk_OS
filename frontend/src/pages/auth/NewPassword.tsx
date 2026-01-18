import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeOff, Eye, ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Spinner from '../../components/ui/DataLoader';
import { errorNotification } from '../../components/ui/Toast';
import { Loader } from '../../components/loader/loader';
import AuthLayout from '../../components/layouts/AuthLayout';


const newPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  repeatPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.repeatPassword, {
  message: "Passwords don't match",
  path: ["repeatPassword"],
});

type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

const NewPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const uid = searchParams.get('uid');

  
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const { 
    resetPassword, 
    isLoading, 
    error, 
    clearError, 
    hasPasswordReset, 
    clearSuccess 
  } = useAuthStore();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      newPassword: '',
      repeatPassword: '',
    },
  });

  const watchNewPassword = watch('newPassword');
  const watchRepeatPassword = watch('repeatPassword');

  // Validate token and uid on component mount
  useEffect(() => {
    clearSuccess();
    clearError();
    if (!token || !uid) {
      errorNotification("An error has occured!")
      return;
    }
  }, [token, uid, navigate]);

  const onSubmit = async (data: NewPasswordFormData) => {
    clearError();
    if (token && uid) {
      await resetPassword(token,  data.newPassword, uid);
    }
  };

  useEffect(() => {
    if (hasPasswordReset) {
      setPasswordReset(true);
      setTimeout(() => navigate('/auth'), 2000);
    }
  }, [hasPasswordReset, navigate]);

//   useEffect(() => {
//       clearSuccess();
//       clearError();
//   }, []);

  // Show loading or redirect if no token/uid
  if (!token || !uid) {
    return <Loader/>;
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center lg:text-left">
          <div className="mx-auto lg:mx-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            {passwordReset ? (
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {passwordReset ? 'Password Reset Successful' : 'New Password'}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {passwordReset
              ? 'Your password has been successfully reset. Redirecting to login...'
              : 'Create a new password for your account'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {passwordReset ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-300">
              Password reset successful! You will be redirected to the login page in a few seconds.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                fullWidth
                {...register('newPassword')}
                error={errors.newPassword?.message}
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Repeat Password"
                type={showRepeatPassword ? 'text' : 'password'}
                placeholder="Repeat new password"
                fullWidth
                {...register('repeatPassword')}
                error={errors.repeatPassword?.message}
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={() => setShowRepeatPassword(!showRepeatPassword)}
              >
                {showRepeatPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {watchNewPassword && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password strength:
                </div>
                <div className="flex space-x-1">
                  <div className={`h-2 w-1/4 rounded ${watchNewPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                  <div className={`h-2 w-1/4 rounded ${watchNewPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                  <div className={`h-2 w-1/4 rounded ${/(?=.*[a-z])(?=.*[A-Z])/.test(watchNewPassword) ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                  <div className={`h-2 w-1/4 rounded ${/(?=.*\d)/.test(watchNewPassword) ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                </div>
              </div>
            )}

            {watchRepeatPassword && (
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${watchNewPassword === watchRepeatPassword ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`text-sm ${watchNewPassword === watchRepeatPassword ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {watchNewPassword === watchRepeatPassword ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              className="mt-6"
              disabled={!watchNewPassword || !watchRepeatPassword || watchNewPassword !== watchRepeatPassword}
            >
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        )}

        <div className="text-center lg:text-left">
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to login
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default NewPassword;
