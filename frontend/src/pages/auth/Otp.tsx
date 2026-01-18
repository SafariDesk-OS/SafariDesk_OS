import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, RotateCcw } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layouts/AuthLayout';


const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

type OTPFormData = z.infer<typeof otpSchema>;

const OTPVerification: React.FC = () => {
    const navigate = useNavigate()
  const { verifyOTP, resendOTP, isLoading, error, clearError, success, cleanFlow, isAuthenticated} = useAuthStore();
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendSuccess, setResendSuccess] = React.useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  useEffect(() => {
    if (isAuthenticated){
        cleanFlow()
        setTimeout(() => navigate('/dashboard'), 1000)
    }
  }, [isAuthenticated])

  const onSubmit = async (data: OTPFormData) => {
    clearError();
    await verifyOTP(data.otp);
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await resendOTP();
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (error) {
      // Handle error
    } finally {
      setResendLoading(false);
    }
  };

  

  // Auto-focus and format OTP input
  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setValue('otp', value);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start w-16 h-16 mx-auto lg:mx-0 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Verify your email</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            We've sent a 6-digit code to your email
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-300">
              Email verified successfully! Redirecting to your workspace...
            </p>
          </div>
        )}

        {/* Resend Success Alert */}
        {resendSuccess && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              A new OTP has been sent to your email address.
            </p>
          </div>
        )}

        {/* OTP Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Verification Code
            </label>
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              maxLength={6}
              fullWidth
              {...register('otp')}
              onChange={handleOTPChange}
              error={errors.otp?.message}
              className="text-center text-lg tracking-widest font-mono"
            />
          </div>

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            className="mt-6"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>
        </form>

        {/* Resend OTP */}
        <div className="text-center lg:text-left space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Didn't receive the code?
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleResendOTP}
            loading={resendLoading}
            className="w-full"
            icon={RotateCcw}
          >
            {resendLoading ? 'Sending...' : 'Resend Code'}
          </Button>
        </div>

        {/* Back to Login */}
        <div className="text-center lg:text-left">
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default OTPVerification
