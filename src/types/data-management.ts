// types/data-management.ts
export interface DataSummary {
  userId: string;
  userEmail: string;
  accountCreated: string;
  dataToDelete: {
    instagramAccounts: {
      count: number;
      accounts: Array<{
        username: string;
        connectedSince: string;
      }>;
    };
    dailySnapshots: {
      count: number;
      description: string;
    };
    syncLogs: {
      count: number;
      description: string;
    };
  };
  deletionOptions: {
    instagram_only: {
      name: string;
      description: string;
      consequence: string;
    };
    complete: {
      name: string;
      description: string;
      consequence: string;
    };
  };
}

export interface DeletionResult {
  success: boolean;
  message: string;
  deletionResults?: {
    userId: string;
    userEmail: string;
    deletionType: string;
    deletionStarted: string;
    deletionCompleted?: string;
    steps: Array<{
      step: string;
      status: 'success' | 'error' | 'skipped';
      details?: string;
      count?: number;
    }>;
  };
  redirect?: boolean;
}

export interface ExportData {
  exportInfo: {
    exportDate: string;
    userId: string;
    userEmail: string;
    exportFormat: string;
    dataTypes: string[];
  };
  userProfile: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at?: string;
    email_confirmed_at?: string;
  };
  instagramAccounts?: {
    count: number;
    data: Array<{
      id: string;
      username: string;
      instagram_id: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>;
  };
  dailySnapshots?: {
    count: number;
    data: any[];
    dateRange?: {
      earliest: string;
      latest: string;
    };
  };
  syncLogs?: {
    count: number;
    data: Array<{
      id: string;
      sync_type: string;
      status: string;
      started_at: string;
      completed_at?: string;
      records_processed?: number;
      error_message?: string;
    }>;
  };
  summary: {
    totalInstagramAccounts: number;
    totalDailySnapshots: number;
    totalSyncLogs: number;
    dataTimespan: string;
    exportSize: number;
    exportedAt: string;
  };
}

export type DeletionType = 'instagram_only' | 'complete';