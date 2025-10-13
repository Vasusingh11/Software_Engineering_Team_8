import './App.css';
import {useState} from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  return (
    <LoginForm />
  );
}

const LoginForm = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gsu-blue via-gsu-cool-blue to-gsu-vibrant-blue flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header with GSU Branding */}
          <div className="bg-gradient-to-r from-gsu-blue to-gsu-cool-blue px-8 py-6 text-center">
            <img 
              src="/gsu-logo.png" 
              alt="Georgia State University - J. Mack Robinson College of Business" 
              className="h-20 w-auto mx-auto mb-3 filter brightness-0 invert"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            <h2 className="text-2xl font-bold font-secondary tracking-tight text-white" style={{display: 'none'}}>
              EQUIPMENT PORTAL
            </h2>
            <h1 className="text-white text-xl font-bold font-secondary tracking-wide">
              EQUIPMENT PORTAL
            </h1>
            <p className="text-gsu-light-blue font-primary text-sm mt-1">
              J. Mack Robinson College of Business
            </p>
          </div>

          {/* Login Form */}
          <div className="p-8" onKeyPress={{/*handleKeyPress*/}}>
            <div className="mb-6">
              <label className="block text-gsu-blue text-sm font-bold mb-2 font-primary">
                Username
              </label>
              <input
                type="text"
                value={{/*username*/}}
                /*onChange={(e) => setUsername(e.target.value)}*/
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gsu-blue focus:ring-2 focus:ring-gsu-blue focus:ring-opacity-20 transition-all duration-200 font-primary"
                placeholder="Enter your username"
                disabled={{/*loading*/}}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gsu-blue text-sm font-bold mb-2 font-primary">
                Password
              </label>
              <input
                type="password"
                value={{/*password*/}}
                /*onChange={(e) => setPassword(e.target.value)}*/
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gsu-blue focus:ring-2 focus:ring-gsu-blue focus:ring-opacity-20 transition-all duration-200 font-primary"
                placeholder="Enter your password"
                disabled={{/*loading*/}}
                required
              />
            </div>

            {/*error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="text-red-600 text-sm font-primary">{error}</p>
              </div>
            )*/}

            <button
              onClick={{/*handleLogin*/}}
              disabled={{/*loading*/}}
              className="w-full bg-gradient-to-r from-gsu-blue to-gsu-cool-blue text-white py-3 px-4 rounded-lg hover:from-gsu-cool-blue hover:to-gsu-vibrant-blue transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:transform-none font-primary font-semibold text-lg shadow-lg"
            >
              {/*loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Logging in...
                </span>
              ) : (
                'Login'
              )*/}
            </button>
          </div>

          {/* Demo Accounts */}
          <div className="bg-gray-50 px-8 py-6 border-t">
            <h3 className="text-gsu-blue font-bold text-sm mb-3 font-secondary">
              DEMO ACCOUNTS
            </h3>
            <div className="space-y-2 text-sm font-primary">
              <div className="flex justify-between">
                <span className="text-gsu-cool-grey font-medium">Admin:</span>
                <span className="text-gsu-blue font-semibold">admin / admin123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gsu-cool-grey font-medium">Staff:</span>
                <span className="text-gsu-blue font-semibold">staff / staff123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gsu-cool-grey font-medium">Student:</span>
                <span className="text-gsu-blue font-semibold">john.doe / user123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
export default App;
