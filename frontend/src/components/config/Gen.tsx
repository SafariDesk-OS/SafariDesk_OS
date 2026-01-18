import React, { useState, useEffect } from "react";
import { Building, Upload, Camera, X, Loader2, Clipboard, ExternalLink, Play } from "lucide-react";
import { SessionUser } from "../../types";
import http from "../../services/http";
import { APIS } from "../../services/apis";
import { errorNotification, successNotification } from "../ui/Toast";
import { useAuthStore } from "../../stores/authStore";
import Select from "../ui/Select";
import { useNavigate } from "react-router-dom";

type Props = {
  user: SessionUser | null;
};

const SettingsComponent: React.FC<Props> = ({ user }) => {
  const updateBusiness = useAuthStore((state) => state.updateBusiness);
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    name: "SafariDesk",
    email: "SafariDesk@example.com",
    phone: "254700000000",
    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Check if onboarding is available to resume (reactive state)
  const [showResumeButton, setShowResumeButton] = useState(
    () => localStorage.getItem('onboardingCompleted') !== 'true'
  );

  const [timezones, setTimezones] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleResumeSetup = () => {
    sessionStorage.removeItem('onboardingSkipped');
    navigate('/dashboard');
  };

  // Listen for changes in onboarding completion status
  useEffect(() => {
    const checkOnboardingStatus = () => {
      const isCompleted = localStorage.getItem('onboardingCompleted') === 'true';
      console.log('🔍 Checking onboarding status:', isCompleted);
      setShowResumeButton(!isCompleted);
    };

    // Check on mount and when window becomes visible
    checkOnboardingStatus();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkOnboardingStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also listen for storage events (if changed from another tab)
    window.addEventListener('storage', checkOnboardingStatus);

    // Poll for changes every 2 seconds (fallback)
    const interval = setInterval(checkOnboardingStatus, 2000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', checkOnboardingStatus);
      clearInterval(interval);
    };
  }, []);

  const [logoPreview, setLogoPreview] = useState<string | null>(
    null,
  );
  const [faviconPreview, setFaviconPreview] = useState<string | null>(
    null,
  );

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    // Populate timezones on component mount
    try {
      const allTimezones = (Intl as any).supportedValuesOf("timeZone"); // Cast to any to bypass TS error
      setTimezones(allTimezones);
    } catch (error) {
      console.error("Failed to get timezones:", error);
      // Fallback or error handling if Intl.supportedValuesOf is not supported
      setTimezones(["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"]);
    }
  }, []);

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "favicon",
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === "logo") {
          setLogoPreview(e.target?.result as string);
          setLogoFile(file);
        } else {
          setFaviconPreview(e.target?.result as string);
          setFaviconFile(file);

          // Optional: update browser favicon
          const link = (document.querySelector("link[rel*='icon']") ||
            document.createElement("link")) as HTMLLinkElement;
          link.type = "image/x-icon";
          link.rel = "shortcut icon";
          link.href = e.target?.result as string;
          document.getElementsByTagName("head")[0].appendChild(link);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true); // Show spinner
    try {
      const formData = new FormData();
      formData.append("name", settings.name);
      formData.append("email", settings.email);
      formData.append("phone", settings.phone);
      formData.append("timezone", settings.timezone); // Add timezone to form data
      if (logoFile) formData.append("logo", logoFile);
      if (faviconFile) formData.append("favicon", faviconFile);

      const response = await http.put(APIS.UPDATE_GENERAL_SETTINGS, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedBusiness = response.data?.business;

      if (updatedBusiness) {
        updateBusiness(updatedBusiness); // ⬅️ update zustand state
        successNotification("Settings updated successfully!");
      }
    } catch (error: any) {
      console.error("Failed to update settings", error);
      errorNotification("Failed to update settings. Please try again.");
    } finally {
      setIsSaving(false); // Hide spinner
    }
  };

  return (
    <div className="space-y-6">
      <div className=" space-y-6">
        {/* Resume Setup Wizard Card */}
        {showResumeButton && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm border border-blue-200 dark:border-blue-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Complete Your Setup
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Haven't finished setting up SafariDesk? Resume the onboarding wizard to complete your configuration and get the most out of the platform.
                </p>
              </div>
              <button
                onClick={handleResumeSetup}
                className="ml-4 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                <Play className="w-4 h-4" />
                Resume Setup Wizard
              </button>
            </div>
          </div>
        )}

        {/* Application Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Application Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                App Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={settings.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                System URL
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  value={""}
                />
                <button
                  onClick={() => {
                    // if (user?.business.domain_url) {
                    //   // navigator.clipboard.writeText(user.business.domain_url);
                    //   successNotification("System URL copied to clipboard!");
                    // }
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 border-l-0 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600"
                  title="Copy URL"
                >
                  <Clipboard className="w-4 h-4" />
                </button>
                
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Support URL
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  value={""}
                />
                <button
                  onClick={() => {
                    // if (user?.business.support_url) {
                    //   // navigator.clipboard.writeText(user.business.support_url);
                    //   successNotification("Support URL copied to clipboard!");
                    // }
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 border-l-0 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600"
                  title="Copy URL"
                >
                  <Clipboard className="w-4 h-4" />
                </button>
                {/* <button
                  onClick={() => {
                    if (user?.business.support_url) {
                      window.open(user.business.support_url, "_blank");
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600"
                  title="Navigate to URL"
                >
                  <ExternalLink className="w-4 h-4" />
                </button> */}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Support Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={settings.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Support Phone
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={settings.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone
              </label>
              <Select
                options={timezones.map((tz) => ({ value: tz, label: tz }))}
                value={settings.timezone}
                onChange={(value) => handleInputChange("timezone", value)}
                placeholder="Select a timezone"
                allowSearch={true} // Enable search functionality
              />
            </div>
          </div>
        </div>

        {/* Branding Assets */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Branding Assets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Logo
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div>
                  <label className="bg-green-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "logo")}
                    />
                  </label>
                  <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                    Recommended: 200x200px PNG or SVG
                  </p>
                </div>
                {logoPreview && (
                  <button
                    onClick={() => {
                      setLogoPreview(null);
                      setLogoFile(null);
                    }}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Favicon Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Favicon
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                  {faviconPreview ? (
                    <img
                      src={faviconPreview}
                      alt="Favicon preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div>
                  <label className="bg-green-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload Favicon</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "favicon")}
                    />
                  </label>
                  <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                    Recommended: 32x32px ICO or PNG
                  </p>
                </div>
                {faviconPreview && (
                  <button
                    onClick={() => {
                      setFaviconPreview(null);
                      setFaviconFile(null);
                    }}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center justify-center"
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsComponent;
