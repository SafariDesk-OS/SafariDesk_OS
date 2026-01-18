import React from 'react';
import {
  BookOpen,
  Users,
  Settings,
  HelpCircle,
  Rocket,
  Wrench,
  Code,
  Shield,
  Database,
  Globe,
  FileText,
  Folder,
  LucideIcon
} from 'lucide-react';

// Simple mapping for common category types
const iconMap: Record<string, LucideIcon> = {
  // Category-specific mappings
  'getting-started': Rocket,
  'gettingstarted': Rocket,
  'rocket': Rocket,
  'account-management': Users,
  'accountmanagement': Users,
  'user-management': Users,
  'usermanagement': Users,
  'users': Users,
  'user': Users,
  'troubleshooting': Wrench,
  'wrench': Wrench,
  'advanced-features': Settings,
  'advancedfeatures': Settings,
  'cog': Settings,
  'settings': Settings,
  'api-documentation': Code,
  'apidocumentation': Code,
  'api': Code,
  'code': Code,
  'security': Shield,
  'shield': Shield,
  'database': Database,
  'general': Globe,
  'help': HelpCircle,
  'support': HelpCircle,
  'documentation': FileText,
  'docs': FileText,
  'guides': BookOpen,
  'tutorials': BookOpen,
  'files': Folder,
  'qa': HelpCircle,
  'q&a': HelpCircle,
  'qatester': HelpCircle,
  'tester': HelpCircle,
  'testing': HelpCircle,
  
  // Default fallback
  'default': BookOpen
};

interface CategoryIconProps {
  name?: string;
  icon?: string; // Add support for explicit icon name
  className?: string;
  size?: number;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  name = 'default', 
  icon,
  className = '',
  size = 20
}) => {
  // Priority: explicit icon prop > category name
  const iconToUse = icon || name || 'default';
  
  // Normalize the icon name by removing spaces, hyphens, and special chars
  const normalizedName = iconToUse.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Get the icon component, fallback to default if not found
  const IconComponent = iconMap[normalizedName] || iconMap.default;
  
  return (
    <IconComponent 
      className={className} 
      size={size}
    />
  );
};

export default CategoryIcon;
