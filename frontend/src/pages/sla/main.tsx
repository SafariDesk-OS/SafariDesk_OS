import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Shield, 
  Calendar, 
  Plus, 
  CheckCircle, 
  Edit, 
  Save,
  X
} from 'lucide-react';
import Drawer from '../../components/ui/Drawer';
import BusinessHoursForm from './mini/BusinessHoursForm';
import PolicyComponent from './mini/PoliciesComponent';
import BusinessHoursComponent from './mini/BusinessHoursComponent';
import PolicyForm from './mini/PolicyForm';
import HolidayForm from './mini/HolidayForm';
import HolidayComponent from './mini/HolidayComponent';
import http from '../../services/http';
import { APIS } from '../../services/apis';
import { successNotification, errorNotification } from '../../components/ui/Toast';

export const SlaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('policies');
  const [showDrawer, setShowDrawer] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [modalType, setModalType] = useState('');
  const [businessHoursCount, setBusinessHoursCount] = useState(0); // State to hold the count of business days
  const [allowSLA, setAllowSLA] = useState(false); // State to control if SLA is allowed (default: disabled)
  const [allowHolidays, setAllowHolidays] = useState(false); // State to control if Holidays are allowed (default: disabled)
  const [configId, setConfigId] = useState<number | null>(null); // Store config ID
  const [loadingConfig, setLoadingConfig] = useState(true); // Loading state for config

  // Mock data for demonstration
  const [policiesCount, setPoliciesCount] = useState(0); // State to hold the count of policies

  // Fetch SLA configuration on component mount
  useEffect(() => {
    fetchSLAConfig();
  }, []);

  const fetchSLAConfig = async () => {
    try {
      setLoadingConfig(true);
      const response = await http.get(APIS.SLA_CONFIG_CURRENT);
      setAllowSLA(response.data.allow_sla);
      setAllowHolidays(response.data.allow_holidays);
      setConfigId(response.data.id);
    } catch (error) {
      console.error('Failed to fetch SLA configuration:', error);
      // If config doesn't exist, use defaults (disabled)
      setAllowSLA(false);
      setAllowHolidays(false);
    } finally {
      setLoadingConfig(false);
    }
  };

  const updateSLAConfig = async (field: 'allow_sla' | 'allow_holidays', value: boolean) => {
    try {
      const payload = {
        [field]: value
      };
      
      await http.post(APIS.SLA_CONFIG_UPDATE, payload);
      successNotification(`${field === 'allow_sla' ? 'SLA' : 'Holidays'} ${value ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      errorNotification(`Failed to update configuration`);
      console.error('Failed to update SLA configuration:', error);
      // Revert the change on error
      if (field === 'allow_sla') {
        setAllowSLA(!value);
      } else {
        setAllowHolidays(!value);
      }
    }
  };

  const handleAllowSLAToggle = () => {
    const newValue = !allowSLA;
    setAllowSLA(newValue);
    updateSLAConfig('allow_sla', newValue);
  };

  const handleAllowHolidaysToggle = () => {
    const newValue = !allowHolidays;
    setAllowHolidays(newValue);
    updateSLAConfig('allow_holidays', newValue);
  };

  // Auto-switch to valid tab when toggles change
  useEffect(() => {
    if (!allowSLA && (activeTab === 'policies' || activeTab === 'business-hours')) {
      if (allowHolidays) {
        setActiveTab('holidays');
      }
    } else if (!allowHolidays && activeTab === 'holidays') {
      if (allowSLA) {
        setActiveTab('policies');
      }
    }
  }, [allowSLA, allowHolidays, activeTab]);

  const openModal = (type: string) => {
    setModalType(type);
    setShowDrawer(true);
  };

  const TabButton = ({ id, label, icon: Icon, active }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        active
          ? 'bg-green-600 text-white shadow-md'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );


 
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          {/* SLA Configuration Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SLA Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">Allow SLA</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enable or disable SLA tracking system-wide</p>
                </div>
                <button
                  onClick={handleAllowSLAToggle}
                  disabled={loadingConfig}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    allowSLA ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  } ${loadingConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      allowSLA ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">Allow Holidays</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Include holidays in SLA calculations</p>
                </div>
                <button
                  onClick={handleAllowHolidaysToggle}
                  disabled={loadingConfig}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    allowHolidays ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  } ${loadingConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      allowHolidays ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Policies</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{policiesCount}</p>
                </div>
                <Shield className="text-blue-600" size={32} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Business Days</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{businessHoursCount}</p>
                </div>
                <Clock className="text-green-600" size={32} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Holidays</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                </div>
                <Calendar className="text-orange-600" size={32} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">SLA Compliance</p>
                  <p className="text-2xl font-bold text-green-600">94%</p>
                </div>
                <CheckCircle className="text-green-600" size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {(allowSLA || allowHolidays) && (
          <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {allowSLA && (
              <>
                <TabButton
                  id="policies"
                  label="SLA Policies"
                  icon={Shield}
                  active={activeTab === 'policies'}
                />
                <TabButton
                  id="business-hours"
                  label="Business Hours"
                  icon={Clock}
                  active={activeTab === 'business-hours'}
                />
              </>
            )}
            {allowHolidays && (
              <TabButton
                id="holidays"
                label="Holidays"
                icon={Calendar}
                active={activeTab === 'holidays'}
              />
            )}
          </div>
        )}

        {/* Content */}
        {(allowSLA || allowHolidays) ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Tab Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {activeTab === 'policies' && 'SLA Policies'}
                  {activeTab === 'business-hours' && 'Business Hours'}
                  {activeTab === 'holidays' && 'Holidays'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {activeTab === 'policies' && 'Define response and resolution timeframes for different priorities'}
                  {activeTab === 'business-hours' && 'Configure working hours for SLA calculations'}
                  {activeTab === 'holidays' && 'Manage holidays that affect SLA timings'}
                </p>
              </div>
              {
                activeTab !== 'holidays' && (
                  <button
                    onClick={() => openModal(activeTab)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <Plus size={16} />
                    Add {activeTab === 'policies' ? 'Policy' : activeTab === 'business-hours' ? 'Schedule' : 'Holiday'}
                  </button>
                )
              }
              
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'policies' && allowSLA && (
                <PolicyComponent reload={reloadTrigger} setPoliciesCount={setPoliciesCount} />
              )}

              {activeTab === 'business-hours' && allowSLA && (
                <BusinessHoursComponent onEdit={() => {}} reload={reloadTrigger} setBusinessHoursCount={setBusinessHoursCount}/>
              )}
              {activeTab === 'holidays' && allowHolidays && (
                <HolidayComponent reload={reloadTrigger} />
              )}
              
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">SLA Features Disabled</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enable SLA or Holidays in the configuration above to manage your service level agreements.
              </p>
            </div>
          </div>
        )}

         
          </div>


          {/* Drawer */}
          <Drawer 
            close={() => setShowDrawer(false)} 
            isOpen={showDrawer} 
            content={
              activeTab === 'policies' ? (
                <PolicyForm onSucess={() => setReloadTrigger(prev => prev + 1)} />
              ) : activeTab === 'business-hours' ? (
                <BusinessHoursForm onSucess={() => setReloadTrigger(prev => prev + 1)} />
              ) : (
                <HolidayForm  onSucess={() => setReloadTrigger(prev => prev + 1)}/>
              )
            }
            showTitle={true} 
            title={
              activeTab === 'policies'
                ? 'Add SLA Policy'
                : activeTab === 'business-hours'
                ? 'Add Business Hours'
                : 'Add Holiday'
            }
            size="md"
          />




          </div>
          )}
