export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SubscriptionPlan = 'free' | 'pro' | 'team'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial'
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'
export type AssetType = 'CASH' | 'INVESTMENT' | 'PROPERTY' | 'DEBT'
export type KanbanStatus = 'TODO' | 'PLANNED' | 'PAID' | 'OVERDUE'
export type DebtType = 'OWE' | 'OWED'
export type BudgetPeriod = 'MONTHLY' | 'WEEKLY'
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          plan: SubscriptionPlan
          subscription_status: SubscriptionStatus
          trial_ends_at: string | null
          subscription_ends_at: string | null
          max_members: number
          max_savings_goals: number
          ai_requests_remaining: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          plan?: SubscriptionPlan
          subscription_status?: SubscriptionStatus
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          max_members?: number
          max_savings_goals?: number
          ai_requests_remaining?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          plan?: SubscriptionPlan
          subscription_status?: SubscriptionStatus
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          max_members?: number
          max_savings_goals?: number
          ai_requests_remaining?: number
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          theme_color: string
          language: string
          default_organization_id: string | null
          default_asset_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          theme_color?: string
          language?: string
          default_organization_id?: string | null
          default_asset_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          theme_color?: string
          language?: string
          default_organization_id?: string | null
          default_asset_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: TeamRole
          invited_by: string | null
          invited_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: TeamRole
          invited_by?: string | null
          invited_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: TeamRole
          invited_by?: string | null
          invited_at?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          organization_id: string
          name: string
          type: AssetType
          balance: number
          currency: string
          icon: string | null
          color: string | null
          initial_balance: number
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          type: AssetType
          balance?: number
          currency?: string
          icon?: string | null
          color?: string | null
          initial_balance?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          type?: AssetType
          balance?: number
          currency?: string
          icon?: string | null
          color?: string | null
          initial_balance?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          organization_id: string
          name: string
          type: TransactionType
          icon: string | null
          color: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          type: TransactionType
          icon?: string | null
          color?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          type?: TransactionType
          icon?: string | null
          color?: string | null
          is_default?: boolean
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          organization_id: string
          amount: number
          type: TransactionType
          description: string | null
          date: string
          category_id: string | null
          asset_id: string | null
          transfer_to_asset_id: string | null
          created_by: string
          notes: string | null
          tags: string[] | null
          attachments: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          amount: number
          type: TransactionType
          description?: string | null
          date?: string
          category_id?: string | null
          asset_id?: string | null
          transfer_to_asset_id?: string | null
          created_by: string
          notes?: string | null
          tags?: string[] | null
          attachments?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          amount?: number
          type?: TransactionType
          description?: string | null
          date?: string
          category_id?: string | null
          asset_id?: string | null
          transfer_to_asset_id?: string | null
          created_by?: string
          notes?: string | null
          tags?: string[] | null
          attachments?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      savings_goals: {
        Row: {
          id: string
          organization_id: string
          name: string
          target_amount: number
          current_amount: number
          deadline: string | null
          icon: string
          is_completed: boolean
          completed_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          target_amount: number
          current_amount?: number
          deadline?: string | null
          icon?: string
          is_completed?: boolean
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          target_amount?: number
          current_amount?: number
          deadline?: string | null
          icon?: string
          is_completed?: boolean
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      debts: {
        Row: {
          id: string
          organization_id: string
          name: string
          type: DebtType
          lender_name: string
          total_amount: number
          paid_amount: number
          due_date: string | null
          notes: string | null
          is_settled: boolean
          settled_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          type: DebtType
          lender_name: string
          total_amount: number
          paid_amount?: number
          due_date?: string | null
          notes?: string | null
          is_settled?: boolean
          settled_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          type?: DebtType
          lender_name?: string
          total_amount?: number
          paid_amount?: number
          due_date?: string | null
          notes?: string | null
          is_settled?: boolean
          settled_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          organization_id: string
          category_id: string | null
          category_name: string | null
          amount_limit: number
          period: BudgetPeriod
          start_date: string | null
          end_date: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          category_id?: string | null
          category_name?: string | null
          amount_limit: number
          period?: BudgetPeriod
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          category_id?: string | null
          category_name?: string | null
          amount_limit?: number
          period?: BudgetPeriod
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bill_tasks: {
        Row: {
          id: string
          organization_id: string
          title: string
          amount: number
          due_date: string
          status: KanbanStatus
          category_id: string | null
          assignee_id: string | null
          notes: string | null
          is_recurring: boolean
          recurrence_pattern: string | null
          paid_at: string | null
          paid_from_asset_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          amount: number
          due_date: string
          status?: KanbanStatus
          category_id?: string | null
          assignee_id?: string | null
          notes?: string | null
          is_recurring?: boolean
          recurrence_pattern?: string | null
          paid_at?: string | null
          paid_from_asset_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          amount?: number
          due_date?: string
          status?: KanbanStatus
          category_id?: string | null
          assignee_id?: string | null
          notes?: string | null
          is_recurring?: boolean
          recurrence_pattern?: string | null
          paid_at?: string | null
          paid_from_asset_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_org_member: {
        Args: { org_id: string }
        Returns: boolean
      }
      is_org_admin: {
        Args: { org_id: string }
        Returns: boolean
      }
    }
    Enums: {
      subscription_plan: SubscriptionPlan
      subscription_status: SubscriptionStatus
      transaction_type: TransactionType
      asset_type: AssetType
      kanban_status: KanbanStatus
      debt_type: DebtType
      budget_period: BudgetPeriod
      team_role: TeamRole
    }
  }
}
