import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  TrendingUp, 
  AlertTriangle, 
  BarChart2, 
  Settings, 
  Info, 
  Mail,
  Database,
  CheckCircle,
  Lightbulb,
  Users,
  LogOut,
  Shield,
  SlidersHorizontal,
  BarChart3,
  UserCircle
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { usePrediction } from '@/context/PredictionContext';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, requiresData: true, permission: 'view_dashboard' },
  { name: 'CLV Prediction', href: '/prediction', icon: TrendingUp, requiresData: true, permission: 'run_predictions' },
  { name: 'Churn Analysis', href: '/churn', icon: AlertTriangle, requiresData: true, permission: 'view_analytics' },
  { name: 'What-If Analysis', href: '/simulation', icon: SlidersHorizontal, requiresData: true, permission: 'manage_settings' },
  { name: 'Analytics', href: '/analytics', icon: BarChart2, requiresData: true, permission: 'view_analytics' },
  { name: 'AI Insights', href: '/insights', icon: Lightbulb, requiresData: true, permission: 'view_analytics' },
  { name: 'Mongo Explorer', href: '/mongo-explorer', icon: Database, requiresData: true, permission: 'view_mongo_explorer' },
  { name: 'Model Comparison', href: '/model-comparison', icon: BarChart3, requiresData: true, permission: 'view_analytics' },
  { name: 'User Management', href: '/users', icon: Users, requiresData: false, permission: 'manage_users' },
  { name: 'Settings', href: '/settings', icon: Settings, requiresData: false, permission: 'manage_settings' },
  { name: 'About', href: '/about', icon: Info, requiresData: false, permission: 'view_dashboard' },
  { name: 'Contact', href: '/contact', icon: Mail, requiresData: false, permission: 'manage_settings' },
  { name: 'Data Upload', href: '/upload', icon: Database, requiresData: false, permission: 'view_dashboard' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPredictions, dataSource } = usePrediction();
  const { user, logout, checkPermission, isAuthenticated } = useAuth();

  const handleClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
    if (onNavigate) onNavigate();
  };

  // Filter navigation based on permissions
  const filteredNavigation = navigation.filter(item => {
    if (!isAuthenticated) return true; // Show all if not logged in (for demo)
    return checkPermission(item.permission);
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':     return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      case 'sub-admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
      case 'analyst':   return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      case 'viewer':    return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default:          return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="flex h-full w-full flex-col border-r border-white/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl dark:border-white/10 transition-colors relative z-20">
      <div className="flex h-16 items-center px-4 lg:px-6">
        <h1 className="text-lg lg:text-xl font-bold text-indigo-600 dark:text-indigo-400">CLV Predictor</h1>
      </div>

      {/* Active Dataset Indicator */}
      {hasPredictions && (
        <div className="mx-3 mb-2 rounded-lg bg-green-50 p-2 lg:p-3 dark:bg-green-900/20">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="ml-2 text-xs font-medium text-green-700 dark:text-green-300">Active Dataset</span>
          </div>
          <p className="mt-1 text-xs text-green-600 dark:text-green-400 truncate">{dataSource}</p>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-2 lg:px-3 py-4 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          const showDataIndicator = item.requiresData && hasPredictions;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleClick}
              className={cn(
                'group flex items-center justify-between rounded-md py-2.5 lg:py-2 text-sm font-medium transition-all duration-300',
                isActive
                  ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500 pl-2 pr-3 shadow-[0_0_15px_rgba(99,102,241,0.1)] dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-l-4 border-transparent pl-2 pr-3 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              )}
            >
              <div className="flex items-center">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'
                    )}
                  />
                </motion.div>
                {item.name}
              </div>
              {showDataIndicator && (
                <span className="h-2 w-2 rounded-full bg-green-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-slate-200 p-3 lg:p-4 dark:border-slate-800">
        {isAuthenticated && user ? (
          <div className="space-y-3">
            <Link
              to="/profile"
              onClick={handleClick}
              className="flex items-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg p-1 transition-colors group"
              title="Edit Profile"
            >
              <div className="h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm dark:bg-indigo-900 dark:text-indigo-300 flex-shrink-0">
                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role}
                  </span>
                </div>
              </div>
              <UserCircle className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm dark:bg-indigo-900 dark:text-indigo-300">
              AD
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Demo User</p>
              <Link 
                to="/login" 
                onClick={handleClick}
                className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Sign in for full access
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
