import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { User, Mail, Building, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import z from 'zod';
import AuthLayout from '../../components/layouts/AuthLayout';


// Step schemas for validation
const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
});

const businessInfoSchema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  organization_size: z.enum(['< 100', '100-1000', '> 1000'], {
    required_error: 'Please select organization size',
  }),
});

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  organization_size: z.enum(['< 100', '100-1000', '> 1000'], {
    required_error: 'Please select organization size',
  }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

// API interface for reference
interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  business_name: string;
  subdomain: string;
  organization_size: string;
}

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [showAlert, setShowAlert] = useState(false);
    const totalSteps = 2;

    const { register: registerBusiness, isLoading, error, clearError, message } = useAuthStore();

    const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
      setValue,
      trigger,
    } = useForm<RegisterFormData>({
      resolver: zodResolver(registerSchema),
    });
  
    const businessName = watch('business_name');
    
    React.useEffect(() => {
      if (businessName) {
        const domain = businessName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .slice(0, 20);
        
        setValue('subdomain', domain);
      }
    }, [businessName, setValue]);

    const nextStep = async () => {
      if (currentStep < totalSteps) {
        let isValid = false;

        if (currentStep === 1) {
          isValid = await trigger(['firstName', 'lastName', 'email']);
        } else if (currentStep === 2) {
          isValid = await trigger(['business_name', 'subdomain', 'organization_size']);
        }

        if (isValid) {
          setCurrentStep(currentStep + 1);
        }
      }
    };

    const prevStep = () => {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
    };

    const onSubmit = async (data: RegisterFormData) => {
      clearError();

      const registerData: RegisterData = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        business_name: data.business_name,
        subdomain: data.subdomain,
        organization_size: data.organization_size,
      };

      const response = await registerBusiness(registerData) as any;
      if (response && response.site_url) {
        setShowAlert(true);
        setTimeout(() => {
          window.location.replace(response.site_url);
        }, 1000);
      }
    };

    return (
        <AuthLayout>
            <div className="space-y-6">
                <div className="text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create workspace</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Set up your ticketing system
                    </p>
                </div>

                {showAlert && (
                    <Alert
                        message="Check your emails for Login details"
                        type="info"
                        onClose={() => setShowAlert(false)}
                    />
                )}

                {/* Stepper Indicator */}
                <div className="flex items-center justify-center space-x-4 mb-8">
                    {Array.from({ length: totalSteps }, (_, index) => {
                        const stepNumber = index + 1;
                        const isCompleted = stepNumber < currentStep;
                        const isCurrent = stepNumber === currentStep;

                        return (
                            <React.Fragment key={stepNumber}>
                                <div className="flex items-center">
                                    <div
                                        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${isCompleted
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : isCurrent
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-gray-300 text-gray-400'
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <span className="text-sm font-medium">{stepNumber}</span>
                                        )}
                                    </div>
                                    <span
                                        className={`ml-2 text-sm font-medium ${isCompleted || isCurrent
                                            ? 'text-gray-900 dark:text-gray-100'
                                            : 'text-gray-400'
                                            }`}
                                    >
                                        {stepNumber === 1 ? 'Personal Info' : 'Business Info'}
                                    </span>
                                </div>
                                {stepNumber < totalSteps && (
                                    <div
                                        className={`flex-1 h-0.5 mx-4 ${stepNumber < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {message && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-sm text-green-700 dark:text-green-300">
                            Your business has been set up successfully. Check your email for the next steps.
                        </p>
                    </div>
                )}

                {/* Step Content */}
                <div className="space-y-4">
                    {currentStep === 1 && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="First name"
                                    placeholder='Enter first name'
                                    icon={User}
                                    fullWidth
                                    {...register('firstName')}
                                    error={errors.firstName?.message}
                                />

                                <Input
                                    label="Last name"
                                    placeholder='Enter last name'
                                    icon={User}
                                    fullWidth
                                    {...register('lastName')}
                                    error={errors.lastName?.message}
                                />
                            </div>

                            <Input
                                label="Email address"
                                placeholder='Enter email'
                                type="email"
                                icon={Mail}
                                fullWidth
                                {...register('email')}
                                error={errors.email?.message}
                            />
                        </>
                    )}

                    {currentStep === 2 && (
                        <>
                            <Input
                                label="Workspace name"
                                icon={Building}
                                fullWidth
                                {...register('business_name')}
                                error={errors.business_name?.message}
                                placeholder="Enter business name"
                            />

                            <Input
                                label="Subdomain"
                                fullWidth
                                {...register('subdomain')}
                                error={errors.subdomain?.message}
                                placeholder="Subdomain name"
                            />

                            <Select
                                label="Organization size"
                                value={watch('organization_size') || ''}
                                onChange={(value) => setValue('organization_size', value as '< 100' | '100-1000' | '> 1000')}
                                options={[
                                    { value: '< 100', label: 'Less than 100 agents' },
                                    { value: '100-1000', label: '100-1000 agents' },
                                    { value: '> 1000', label: 'More than 1000 agents' },
                                ]}
                                placeholder="Select organization size"
                                error={errors.organization_size?.message}
                                required
                            />
                        </>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="flex items-center"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                    </Button>

                    {currentStep < totalSteps ? (
                        <Button
                            type="button"
                            onClick={nextStep}
                            className="flex items-center"
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            onClick={handleSubmit(onSubmit)}
                            loading={isLoading}
                            className="flex items-center"
                        >
                            {isLoading ? 'Creating workspace...' : 'Create workspace'}
                        </Button>
                    )}
                </div>

                <div className="text-center space-y-4">
                    {/* <button
                        type="button"
                        onClick={() => navigate('/site')}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <ChevronLeft size={16} className="mr-1" />
                        Go Back
                    </button> */}
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Already have a business account?{' '}
                            <Link
                                to="/auth"
                                className="font-medium text-blue-700 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </AuthLayout>
  );
};

export default Register;
