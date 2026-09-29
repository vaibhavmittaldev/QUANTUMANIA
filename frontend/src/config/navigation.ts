import {
  LayoutDashboard,
  GraduationCap,
  Cpu,
  Trophy,
  BarChart3,
  User,
  Settings,
  LucideIcon
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  phaseTag?: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/app/dashboard',
    icon: LayoutDashboard
  },
  {
    id: 'learn',
    label: 'Learn',
    path: '/app/learn',
    icon: GraduationCap,
    phaseTag: 'Phase 2'
  },
  {
    id: 'quantum-lab',
    label: 'Quantum Lab',
    path: '/app/quantum-lab',
    icon: Cpu,
    phaseTag: 'Phase 3-5'
  },
  {
    id: 'practice',
    label: 'Practice',
    path: '/app/practice',
    icon: Trophy,
    phaseTag: 'Phase 6'
  },
  {
    id: 'progress',
    label: 'Progress',
    path: '/app/progress',
    icon: BarChart3,
    phaseTag: 'Phase 6'
  }
];

export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    path: '/app/profile',
    icon: User
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/app/settings',
    icon: Settings
  }
];
