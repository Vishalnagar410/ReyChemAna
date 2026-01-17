/**
 * Application constants
 */

// User roles
export const USER_ROLES = {
    CHEMIST: 'chemist',
    ANALYST: 'analyst',
    ADMIN: 'admin'
};

// Request statuses
export const REQUEST_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

// Request status labels
export const STATUS_LABELS = {
    [REQUEST_STATUS.PENDING]: 'Pending',
    [REQUEST_STATUS.IN_PROGRESS]: 'In Progress',
    [REQUEST_STATUS.COMPLETED]: 'Completed',
    [REQUEST_STATUS.CANCELLED]: 'Cancelled'
};

// Request status colors
export const STATUS_COLORS = {
    [REQUEST_STATUS.PENDING]: '#f59e0b',
    [REQUEST_STATUS.IN_PROGRESS]: '#3b82f6',
    [REQUEST_STATUS.COMPLETED]: '#10b981',
    [REQUEST_STATUS.CANCELLED]: '#ef4444'
};

// Priority levels
export const PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
};

// Priority labels
export const PRIORITY_LABELS = {
    [PRIORITY.LOW]: 'Low',
    [PRIORITY.MEDIUM]: 'Medium',
    [PRIORITY.HIGH]: 'High',
    [PRIORITY.URGENT]: 'Urgent'
};

// Priority colors
export const PRIORITY_COLORS = {
    [PRIORITY.LOW]: '#6b7280',
    [PRIORITY.MEDIUM]: '#3b82f6',
    [PRIORITY.HIGH]: '#f59e0b',
    [PRIORITY.URGENT]: '#ef4444'
};

// Date format
export const DATE_FORMAT = 'YYYY-MM-DD';

// Max file size (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
