import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, EyeOff, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/layouts/AuthLayout';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate()
  const brandName = 'SafariDesk';
  const [showPassword, setShowPassword] = React.useState(false);
  const [logged, setLogged] = React.useState(false);
    const { login, isLoading, error, clearError, success, clearSuccess, url } = useAuthStore();
    
    const { register, handleSubmit, formState: { errors },} = useForm<LoginFormData>({
      resolver: zodResolver(loginSchema),
      defaultValues: {
        email: '',
        password: '',
      },
    });
  
    const onSubmit = async (data: LoginFormData) => {
      clearError();
        await login(data.email, data.password);
    };


    useEffect(() => {
      if (!success) return;
      if (url !== 'dashboard') {
        setLogged(true);
      }
      const redirect = setTimeout(() => {
        navigate(`/${url}`);
        clearSuccess();
      }, 1000);
      return () => clearTimeout(redirect);
    }, [success, url, navigate, clearSuccess]);


 
  return (
    <AuthLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-emerald-700 dark:text-emerald-300">Sign in</p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Sign in to {brandName}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Jump back into tickets, SLAs, approvals, and the help center. Use your work email to continue.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {logged && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">An OTP has been sent to your email. Please check your inbox to complete the login process.</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <Input
              label="Work email or username"
              placeholder='you@company.com'
              type="text"
              icon={Mail}
              fullWidth
              {...register('email')}
              error={errors.email?.message}
            />
          </div>

          <div className="relative space-y-1">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder='Enter your password'
              fullWidth
              {...register('password')}
              error={errors.password?.message}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Signed in as part of {brandName}</p>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-blue-700 hover:text-blue-600 font-medium"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            className="mt-2"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          {/* <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/join"
                className="font-medium text-blue-700 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div> */}
        </form>
      </div>
    </AuthLayout>
  );
};


export default Login
