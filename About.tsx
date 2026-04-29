import { Brain, Code, BarChart3, Shield, Users, Zap } from 'lucide-react';

export function About() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Predictions',
      description: 'Advanced machine learning algorithms analyze customer data to predict lifetime value and churn probability.'
    },
    {
      icon: BarChart3,
      title: 'Rich Analytics',
      description: 'Comprehensive dashboards with interactive charts and detailed insights into customer behavior.'
    },
    {
      icon: Zap,
      title: 'Real-time Processing',
      description: 'Process large datasets quickly with optimized batch prediction capabilities.'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Built with security-first approach, GDPR and CCPA compliant data handling.'
    },
  ];

  const techStack = [
    { name: 'React', category: 'Frontend' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Tailwind CSS', category: 'Styling' },
    { name: 'Vite', category: 'Build Tool' },
    { name: 'Recharts', category: 'Visualization' },
    { name: 'Framer Motion', category: 'Animations' },
    { name: 'Google Gemini AI', category: 'AI Engine' },
    { name: 'Lucide Icons', category: 'Icons' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">About CLV Predictor</h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Predicting Customer Lifetime Value with Advanced AI</p>
      </div>

      {/* Hero Section */}
      <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 sm:p-8 lg:p-10 text-white">
        <div className="max-w-3xl">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">Empowering Data-Driven Decisions</h3>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-indigo-100 leading-relaxed">
            Our mission is to help businesses understand their customers better. By leveraging state-of-the-art AI models, 
            we provide accurate forecasts of Customer Lifetime Value (CLV) and Churn Risk, enabling proactive customer 
            retention strategies and maximizing revenue potential.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-200" />
              <span className="text-sm"> Predictions</span>
            </div>
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-indigo-200" />
              <span className="text-sm">82-87% Accuracy</span>
            </div>
            <div className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-indigo-200" />
              <span className="text-sm">Real-time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-4 sm:mb-6">Key Features</h3>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
            >
              <div className="flex items-start">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/50 flex-shrink-0">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">{feature.title}</h4>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div className="rounded-xl bg-white p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
            <Code className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="ml-4">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Technology Stack</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Built with modern technologies</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {techStack.map((tech) => (
            <div
              key={tech.name}
              className="rounded-lg border border-slate-200 p-3 sm:p-4 text-center hover:border-indigo-300 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:hover:border-indigo-600 dark:hover:bg-slate-700/50"
            >
              <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-white">{tech.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{tech.category}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div className="rounded-xl bg-white p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4">About This Project</h3>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          CLV Predictor AI is a final year project built as a production-ready Customer Lifetime Value Prediction System.
          It integrates machine learning with modern web technologies to help businesses understand and retain their customers.
          The platform demonstrates best practices in responsive design, secure authentication, real-time data processing,
          and an interactive analytics dashboard.
        </p>
        <div className="mt-4 sm:mt-6 flex items-center">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
            CLV
          </div>
          <div className="ml-3 sm:ml-4">
            <p className="text-sm font-medium text-slate-900 dark:text-white">CLV Predictor Team</p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Building the future of predictive analytics</p>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center py-4">
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          CLV Predictor AI v1.0.0 • © 2024 All rights reserved
        </p>
      </div>
    </div>
  );
}
