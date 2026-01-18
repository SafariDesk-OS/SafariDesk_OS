import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, Lock } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/layouts/AuthLayout';


const resetRequestSchema = z.object({
  identifier: z.string().nonempty("This field is required"),
});


type ResetRequestFormData = z.infer<typeof resetRequestSchema>;

const ForgotPassword: React.FC = () => {

  
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { 
    requestPasswordReset, 
    isLoading, 
    error, 
    clearError, 
    linkSent, 
    clearSuccess 
} = useAuthStore();

  const resetRequestForm = useForm<ResetRequestFormData>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: {
      identifier: '',
    },
  });



  const onSubmitResetRequest = async (data: ResetRequestFormData) => {
    clearError();
    await requestPasswordReset(data.identifier);
  };



  useEffect(() => {
    if (linkSent) {
      if (!token) {
        setResetEmailSent(true);
      } else {
        setTimeout(() => navigate('/auth'), 2000);
      }
    }
  }, [linkSent, token, navigate]);

  useEffect(() => {
    return () => {
      clearSuccess();
      clearError();
    };
  }, []);

  if (token) {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <div className="mx-auto lg:mx-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reset Password</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Enter your new password below
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {linkSent && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-300">
                Password reset successful! Redirecting to login...
              </p>
            </div>
          )}

          <div className="text-center lg:text-left">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to login
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Reset request form (initial form to request password reset)
  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center lg:text-left">
          <div className="mx-auto lg:mx-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {resetEmailSent ? 'Check your email' : 'Forgot Password'}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {resetEmailSent
              ? 'We\'ve sent a password reset link to your email address'
              : 'Enter your email address and we\'ll send you a link to reset your password'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {resetEmailSent ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-300">
              Password reset link has been sent to your email.
            </p>
          </div>
        ) : (
          <form onSubmit={resetRequestForm.handleSubmit(onSubmitResetRequest)} className="space-y-4">
            <Input
              label="Email Address or Username {if in multiple businesses use username}"
              placeholder="Enter your email or username"
              type="text"
              icon={Mail}
              fullWidth
              {...resetRequestForm.register('identifier')}
              error={resetRequestForm.formState.errors.identifier?.message}
            />

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              className="mt-6"
            >
              {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </Button>
          </form>
        )}

        <div className="text-center lg:text-left">
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to login
          </button>
        </div>

        {resetEmailSent && (
          <div className="text-center lg:text-left">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Didn't receive the email?{' '}
              <button
                type="button"
                onClick={() => {
                  setResetEmailSent(false);
                  clearSuccess();
                }}
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Try again
              </button>
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
