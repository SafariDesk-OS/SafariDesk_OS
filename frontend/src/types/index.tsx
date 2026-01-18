export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'agent' | 'staff';
  avatar?: string;
  workspaceId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  avatar_url?: string;
}

export interface Workspace {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  settings: WorkspaceSettings;
  subscription: SubscriptionInfo;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSettings {
  allowSelfRegistration: boolean;
  defaultRole: 'agent' | 'staff';
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  workingHours: {
    start: string;
    end: string;
    days: string[];
  };
}

export interface SubscriptionInfo {
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  userLimit: number;
  currentUsers: number;
  billingDate: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending' | 'on_hold' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical' | 'normal';
  category: string;
  department?: {
    id: number;
    name: string;
  };
  ticket_id: string;
  assigneeId?: string;
  assignee?: User;
  requesterId: string;
  requester: User;
  workspaceId: string;
  tags: string[];
  attachments: Attachment[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  resolvedAt?: string;
  breached?: boolean; // Added breached property
  source?: 'email' | 'web' | 'phone' | 'chat' | 'chatbot' | 'api' | 'internal' | 'customer_portal'; // Ticket source field
  is_merged?: boolean;
  merged_into?: {
    id?: number | string;
    ticket_id: string;
    title?: string;
  } | null;
  merged_children?: Array<{
    id: number | string;
    ticket_id: string;
    title?: string;
  }>;
  linked_tasks_count?: number; // Count of tasks linked to this ticket
  unread_activity_count?: number; // Count of unread activity stream messages
  attachments_count?: number; // Count of attachments
  comments_count?: number; // Count of comments
  is_opened?: boolean; // True once any agent has viewed this ticket
  has_new_reply?: boolean; // True when customer reply received; cleared on view
}

export interface Obj {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string;
  assignee?: User;
  ticketId?: string;
  workspaceId: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: User;
  ticketId: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  flagged: boolean;
  likes_count: number;
  replies?: CommentReply[];
}

export interface CommentReply {
  id: string;
  content: string;
  author: User;
  parentCommentId: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  likes_count: number;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  userId: string;
  workspaceId: string;
  actionUrl?: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  asset_tag?: string;
  name: string;
  description?: string;
  category: AssetCategory;
  vendor?: Vendor;
  brand?: string;
  model?: string;
  serial_number?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired' | 'lost' | 'stolen';
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  location?: string;
  purchase_price?: number;
  purchase_date?: string;
  supplier?: string;
  invoice_number?: string;
  warranty_start_date?: string;
  warranty_end_date?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  notes?: string;
  is_critical: boolean;
  // Computed properties
  warranty_status?: 'Active' | 'Expiring soon' | 'Expired' | 'No warranty info';
  needs_maintenance?: boolean;
  age_in_days?: number;
  get_current_value?: number;
  workspaceId: string;
  created_at: string;
  updated_at: string;
  // Relationships
  user_mappings?: AssetUserMapping[];
  history?: AssetHistory[];
  maintenance_records?: AssetMaintenance[];
  ticket_links?: AssetTicket[];
  dependencies?: AssetDependency[];
  vulnerabilities?: SecurityVulnerability[];
  patch_levels?: PatchLevel[];
  alerts?: Alert[];
  audits?: AuditLog[];
}

export interface AssetCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AssetType {
  id: string;
  name: string;
  type_category: 'hardware' | 'software' | 'digital' | 'consumable';
  description?: string;
  requires_assignment: boolean;
  requires_license: boolean;
  has_physical_presence: boolean;
  depreciation_applicable: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  is_active: boolean;
  supplier_category?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetLocation {
  id: string;
  name: string;
  location_type: 'office' | 'datacenter' | 'warehouse' | 'remote' | 'cloud' | 'contractor';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  manager?: User;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SoftwareLicense {
  id: string;
  name: string;
  vendor: Vendor;
  license_key?: string;
  license_type: 'perpetual' | 'subscription' | 'open_source' | 'trial' | 'academic';
  version?: string;
  max_users?: number;
  current_users: number;
  purchase_date: string;
  expiration_date?: string;
  renewal_date?: string;
  cost?: number;
  auto_renewal: boolean;
  compliance_status: 'compliant' | 'non_compliant' | 'expired' | 'warning';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed properties
  is_expired?: boolean;
  days_until_expiry?: number;
  license_utilization_percentage?: number;
}

export interface Contract {
  id: string;
  name: string;
  contract_number: string;
  contract_type: 'warranty' | 'support' | 'lease' | 'software' | 'service' | 'maintenance';
  vendor: Vendor;
  supplier?: Supplier;
  start_date: string;
  end_date: string;
  renewal_date?: string;
  auto_renewal: boolean;
  cost?: number;
  currency: string;
  payment_terms?: string;
  coverage?: string;
  limitations?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  notifications_enabled: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed properties
  is_expired?: boolean;
  days_until_expiry?: number;
  status?: 'Expired' | 'Expiring Soon' | 'Active';
}

export interface AssetHistory {
  id: string;
  asset: string; // Asset ID
  action: 'created' | 'assigned' | 'unassigned' | 'transferred' | 'maintenance' | 'repair' | 'retired' | 'status_change' | 'location_change';
  description: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
}

export interface AssetMaintenance {
  id: string;
  asset: string; // Asset ID
  maintenance_type: 'preventive' | 'corrective' | 'emergency' | 'upgrade';
  title: string;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  completed_date?: string;
  cost?: number;
  assigned_to?: string; // Technician assigned to this maintenance
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimated_cost?: number;
  actual_cost?: number;
  supplier?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed properties
  is_overdue?: boolean;
}

export interface Purchase {
  id: string;
  asset_name: string;
  description?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  currency: string;
  status: 'requested' | 'approved' | 'ordered' | 'received' | 'installed' | 'cancelled' | 'rejected';
  supplier: Supplier;
  vendor?: Vendor;
  requester: User;
  approver?: User;
  purchase_date?: string;
  delivery_date?: string;
  invoice_number?: string;
  po_number: string;
  budget_code?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed properties
  is_overdue?: boolean;
}

export interface Disposal {
  id: string;
  asset: string; // Asset ID
  disposal_method: 'donation' | 'recycling' | 'destruction' | 'sale' | 'transfer' | 'write_off' | 'return_to_vendor';
  disposal_date: string;
  reason?: string;
  residual_value?: number;
  disposal_cost?: number;
  recipient?: string;
  certificate_number?: string;
  environmental_compliance: boolean;
  approved_by?: User;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed properties
  net_value_change?: number;
}

export interface AssetUserMapping {
  id: string;
  asset: string; // Asset ID
  user: User;
  role: 'owner' | 'user' | 'administrator' | 'backup' | 'shared' | 'temporary';
  assigned_date: string;
  expected_return_date?: string;
  returned_date?: string;
  is_active: boolean;
  notes?: string;
  user_detail?: { // From serializer
    id: number;
    name: string;
    email: string;
  };
  // Computed properties
  is_overdue?: boolean;
  assignment_duration_days?: number;
}

export interface AssetTicket {
  id: string;
  asset: string; // Asset ID
  ticket: string; // Ticket ID
  relationship_type: 'affected' | 'resolved_by' | 'related' | 'replaced' | 'upgraded' | 'downgraded';
  impact_level: 'unknown' | 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetDependency {
  id: string;
  asset: string; // Asset ID - upstream
  dependent_asset: string; // Asset ID - downstream
  dependency_type: 'depends_on' | 'required_by' | 'connects_to' | 'contained_in' | 'contains' | 'related_to' | 'runs_on' | 'hosts' | 'supports' | 'managed_by';
  criticality_level: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryAgent {
  id: string;
  name: string;
  agent_type: 'network_scan' | 'software_inventory' | 'cloud_discovery' | 'active_directory' | 'manual_entry' | 'api_integration';
  description?: string;
  is_active: boolean;
  last_run?: string;
  next_run?: string;
  scan_interval_hours: number;
  ip_range?: string;
  credentials?: any;
  configuration?: any;
  success_rate?: number;
  last_success_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed properties
  is_overdue_for_scan?: boolean;
}

export interface DiscoveryResult {
  id: string;
  agent: string; // DiscoveryAgent ID
  discovered_ip?: string;
  discovered_hostname?: string;
  discovered_mac?: string;
  discovered_os?: string;
  discovered_software?: any;
  raw_discovery_data?: any;
  confidence_score?: number;
  matched_asset?: string; // Asset ID
  disposition: 'pending' | 'matched' | 'new_asset' | 'ignored' | 'false_positive';
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SecurityVulnerability {
  id: string;
  asset: string; // Asset ID
  cve_id?: string;
  title: string;
  description?: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  cvss_score?: number;
  affected_component?: string;
  detection_date: string;
  published_date?: string;
  patch_available: boolean;
  patch_date?: string;
  remediation_status: 'open' | 'mitigated' | 'patched' | 'accepted' | 'false_positive';
  exploitability: 'unknown' | 'unproven' | 'proof_of_concept' | 'functional' | 'high';
  remediation_deadline?: string;
  remediation_notes?: string;
  created_at: string;
  updated_at: string;
  // Computed properties
  is_overdue_for_remediation?: boolean;
}

export interface PatchLevel {
  id: string;
  asset: string; // Asset ID
  software_name: string;
  current_version?: string;
  latest_available_version?: string;
  patch_status: 'unknown' | 'current' | 'patch_available' | 'outdated' | 'unsupported' | 'end_of_life';
  last_check_date?: string;
  last_patch_date?: string;
  patch_source?: string;
  is_critical: boolean;
  auto_update_enabled: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed properties
  needs_update?: boolean;
}

export interface DepreciationRule {
  id: string;
  name: string;
  description?: string;
  rule_type: 'straight_line' | 'declining_balance' | 'units_of_production' | 'custom';
  depreciation_rate: number;
  useful_life_years: number;
  salvage_value_percentage: number;
  applicable_asset_types?: AssetType[];
  is_default: boolean;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Methods
  calculate_depreciation?: (purchase_price: number, purchase_date: string, current_date?: string) => number;
}

export interface Alert {
  id: string;
  title: string;
  description?: string;
  alert_type: 'warranty_expiring' | 'contract_expiring' | 'license_expiring' | 'maintenance_due' | 'asset_retirement' | 'security_patch' | 'compliance_issue' | 'assignment_overdue' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'critical';
  related_asset?: string; // Asset ID
  related_contract?: string; // Contract ID
  related_license?: string; // SoftwareLicense ID
  expected_date?: string;
  due_date?: string;
  escalation_date?: string;
  is_active: boolean;
  is_acknowledged: boolean;
  acknowledged_by?: User;
  acknowledged_date?: string;
  automated_action?: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  notification_recipients?: string[];
  recurrence_pattern?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed properties
  is_overdue?: boolean;
  days_until_due?: number;
}

export interface AuditLog {
  id: string;
  user?: User;
  action_type: 'created' | 'updated' | 'deleted' | 'accessed' | 'assigned' | 'unassigned' | 'transferred' | 'disposed' | 'maintenance' | 'security' | 'login' | 'logout';
  model_name: string;
  object_id?: number;
  object_name?: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  asset?: string; // Asset ID
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  api_endpoint?: string;
  http_method?: string;
  response_status?: number;
  compliance_required: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  audit_period?: string;
  created_at: string;
}



export type SessionUser = {
  token_type: "access" | string;
  exp: number;
  iat: number;
  jti: string;
  user_id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  first_login: boolean;
  phone_number: string;
  status: "A" | "I" | string; // Assuming "A" = Active, "I" = Inactive
  is_active: boolean;
  is_staff: boolean;
  avatar_url: string;
  category: "CUSTOMER" | "ADMIN" | string;
  permissions: string[];
  departments?: { id: number; name: string }[];
  business: {
    id: number;
    name: string;
    domain_url: string;
    email?: string;
    logo_url?: string;
    favicon_url?: string;
    phone?: string;
    timezone?: string; // Add timezone property
    support_url?: string;
  };
};



export type NavigationItem = {
  name: string | ((role: string) => string);
  href?: string;
  icon: React.ElementType;
  role: string[];
  children?: NavigationItem[];
}

export type BusinessHour = {
  id: string;
  name: string;
  weekday: number;
  weekday_display: string;
  start_time: string; // format: "HH:MM:SS"
  end_time: string;   // format: "HH:MM:SS"
  is_working_day: boolean;
  timezone: string;
};

export type Holiday = {
  id: string;
  name: string;
  date: string; // ISO date string (e.g., "2025-06-21")
  is_recurring: boolean;
  description: string;
};

type LinkedTicket = {
  id: number;
  title: string;
  ticket_id: string;
  status: 'assigned' | 'open' | 'closed' | string;
  priority: 'low' | 'medium' | 'high' | string;
};

type AssignedTo = {
  id: number;
  name: string;
  email: string;
  phone_number: string;
};
export type TaskObj = {
  id: number;
  title: string;
  description: string;
  task_status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical' | null;
  assigned_to_name: string | null;
  assigned_to: AssignedTo | null;
  created_by?: AssignedTo | null; // Added for task creator
  department?: {
    id: number;
    name: string;
    slag?: string;
  } | null; // Added for department
  due_date: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  is_converted_to_ticket: boolean;
  linked_ticket: LinkedTicket | null;
  status: string;
  task_trackid: string;
  attachments?: Array<{
    id: number;
    file_url: string;
    filename: string;
    description?: string;
    created_at: string;
  }>;
}



export type TaskData = {
  task: {
    id: number;
    title: string;
    description: string;
    priority: string;
    task_status: string;
    task_trackid: string;
    is_completed: boolean;
    is_overdue: boolean;
    due_date: string;
    completed_at: string | null;
    created_at: string;
    assigned_to: {
      id: number;
      name: string;
      email: string;
      phone_number: string;
    } | null;
    linked_ticket: {
      id: number;
      title: string;
      ticket_id: string;
      status: string;
      priority: string;
    } | null;
    attachments: Array<{
      id: number;
      file_url: string;
      description: string;
      created_at: string;
    }>;
    comments: Array<{
      id: number;
      content: string;
      created_at: string;
      updated_at: string;
      is_internal: boolean;
      is_solution: boolean;
      author: {
        id: number;
        name: string;
        email: string;
      };
    }>;
    department: {
      id: number;
      name: string;
      slag: string;
      created_at: string;
      support_email: string;
    } | null;
    created_by: {
      id: number;
      name: string;
      email: string;
      phone_number: string;
    } | null;
  };
}


export type TicketData = {
  ticket: {
    id: number;
    ticket_id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    due_date: string;
    resolved_at: string | null;
    is_public: boolean;
    tags: string[];
    is_overdue: boolean;
    breached: boolean;
    is_merged?: boolean;
    merged_into?: {
      id: number;
      ticket_id: string;
      title?: string;
    } | null;
    merged_children?: Array<{
      id: number;
      ticket_id: string;
      title?: string;
    }>;
    creator_name: string;
    creator_email: string;
    creator_phone: string;
    source?: 'email' | 'web' | 'phone' | 'chat' | 'chatbot' | 'api' | 'internal' | 'customer_portal';
    category: {
      id: number;
      name: string;
      description: string;
    };
    department: {
      id: number;
      name: string;
    };
    assigned_to: {
      id: number;
      name: string;
      email: string;
    } | null;
    watchers: Array<{
      id: number;
      name: string;
      email: string;
    }>;
    linked_tasks_count?: number;
    unread_activity_count?: number;
  };
  comments: Array<{
    id: number;
    content: string;
    created_at: string;
    updated_at: string;
    is_internal: boolean;
    is_solution: boolean;
    attachments?: Array<{
      id: number;
      file_url: string;
      file_name?: string;
      file_size?: number;
      file_type?: string;
    }>;
    author: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  email_messages?: Array<{
    id: number;
    direction: string;
    subject: string;
    sender: string;
    recipient: string;
    raw_body: string;
    html_body?: string;
    html_body_sanitized?: string;
    received_at: string;
  }>;
  attachments: Array<any>;
  activities: Array<any>;
  summary: {
    total_comments: number;
    total_attachments: number;
    has_solution: boolean;
    time_since_created: string;
  };
}



type Department = {
  id: number;
  name: string;
};

export type Agent = {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone_number: string;
  department: Department[];
  role: string;
  avatar_url?: string;
  status: string;
  is_active: boolean;
  date_joined: string;
};






export type GraphDataPoint = {
  period: string;
  date?: string; // For week view
  start_date?: string; // For month view
  end_date?: string; // For month view
  all: number;
  unassigned: number;
  closed: number;
  breached: number;
};

export type DashboardStats = {
  period: string; // "today" | "week" | "month"
  cards: {
    agents: number;
    departments: number;
    assets: number;
    articles: number;
  };
  ticket: {
    all: number;
    assigned: number;
    unassigned: number;
    open: number;
    closed: number;
    breached: number;
    reopened: number;
    recent: TicketItem[];
    graph: GraphDataPoint[];
  };
  task: {
    all: number;
    assigned: number;
    unassigned: number;
    open: number;
    closed: number;
    breached: number;
    recent: TaskItem[];
    graph: GraphDataPoint[];
  };
};

export type TicketItem = {
  id: number;
  ticket_id: string;
  title: string;
  status: string;
  description: string;
  priority: string;
  creator_name: string;
  creator_email: string;
  assigned_to: string | null;
  department: string | null;
  category: string | null;
  created_at: string; // ISO date string
};

export type TaskItem = {
  id: number;
  task_id: string;
  title: string;
  description: string;
  status: string;
  creator_name: string | null;
  assigned_to: string | null;
  department: string | null;
  created_at: string; // ISO date string
};

export interface TicketCategory {
  id: number;
  name: string;
  description: string;
}

// Additional utility types for different graph periods
export type TodayGraphData = {
  period: "today";
  all: number;
  unassigned: number;
  closed: number;
  breached: number;
};

export type WeekGraphData = {
  period: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  date: string;
  all: number;
  unassigned: number;
  closed: number;
  breached: number;
};

export type MonthGraphData = {
  period: "Week 1" | "Week 2" | "Week 3" | "Week 4" | "Week 5";
  start_date: string;
  end_date: string;
  all: number;
  unassigned: number;
  closed: number;
  breached: number;
};
