import './App.css';
import {useState} from 'react';
import ApiService from './api';

const InventoryManager = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboardStats, setDashboardStats] = useState({});
  const [loans, setLoans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnLoanData, setReturnLoanData] = useState(null);
    // Modal functionality with better loading states
  const showStatsModal = async (type) => {
    // Show loading immediately for async operations
    if (type === 'overdueItems') {
      setModalContent(
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading overdue items...</p>
        </div>
      );
      setShowModal(true);
    }
    
    let content = null;
    
    try {
      switch (type) {
        case 'totalItems':
          content = <ItemsModal items={items} title="All Items" />;
          setModalContent(content);
          setShowModal(true);
          break;
          
        case 'availableItems':
          const availableItemsFiltered = items.filter(item => item.status === 'available');
          content = <ItemsModal items={availableItemsFiltered} title="Available Items" />;
          setModalContent(content);
          setShowModal(true);
          break;
          
        case 'loanedItems':
          const activeLoans = loans.filter(loan => loan.status === 'active');
          content = <LoansModal loans={activeLoans} title="Active Loans" />;
          setModalContent(content);
          setShowModal(true);
          break;
          
        case 'overdueItems':
          try {
            const overdueLoans = await ApiService.getOverdueLoans();
            if (!overdueLoans || overdueLoans.length === 0) {
              content = (
                <div className="text-center py-8">
                  <div className="text-green-600 text-6xl mb-4">✅</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Overdue Items!</h3>
                  <p className="text-gray-600">All items are returned on time or within the expected return period.</p>
                </div>
              );
            } else {
              content = <LoansModal loans={overdueLoans} title="Overdue Items" />;
            }
            setModalContent(content);
            setShowModal(true);
          } catch (error) {
            console.error('Error loading overdue items:', error);
            setModalContent(
              <div className="text-center py-8">
                <div className="text-red-600 text-6xl mb-4">❌</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Data</h3>
                <p className="text-gray-600">Failed to load overdue items. Please try again.</p>
              </div>
            );
            setShowModal(true);
          }
          break;
          
        case 'maintenanceItems':
          const maintenanceItems = items.filter(item => item.status === 'maintenance');
          if (maintenanceItems.length === 0) {
            content = (
              <div className="text-center py-8">
                <div className="text-blue-600 text-6xl mb-4">🔧</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Items in Maintenance</h3>
                <p className="text-gray-600">All equipment is currently in working condition.</p>
              </div>
            );
          } else {
            content = <MaintenanceItemsModal items={maintenanceItems} title="Items in Maintenance" onStatusChange={updateItem} />;
          }
          setModalContent(content);
          setShowModal(true);
          break;
          
        default:
          return;
      }
    } catch (error) {
      console.error('Error in showStatsModal:', error);
      setModalContent(
        <div className="text-center py-8">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error</h3>
          <p className="text-gray-600">Something went wrong. Please try again.</p>
        </div>
      );
      setShowModal(true);
    }
  };
  //login
  const login = async (username, password) => {
      try {
        setLoading(true);
        setError('');
        const response = await ApiService.login(username, password);
        setCurrentUser(response.user);
        //await loadInitialData();
        return true;
      } catch (error) {
        console.error('Login failed:', error);
        setError(error.message);
        return false;
      } finally {
        setLoading(false);
      }
    };

  const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

      const handleLogin = async () => {
        await login(username, password);
      };

      const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
          handleLogin();
        }
      };
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
          <div className="p-8" onKeyPress={handleKeyPress}>
            <div className="mb-6">
              <label className="block text-gsu-blue text-sm font-bold mb-2 font-primary">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gsu-blue focus:ring-2 focus:ring-gsu-blue focus:ring-opacity-20 transition-all duration-200 font-primary"
                placeholder="Enter your username"
                disabled={loading}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gsu-blue text-sm font-bold mb-2 font-primary">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gsu-blue focus:ring-2 focus:ring-gsu-blue focus:ring-opacity-20 transition-all duration-200 font-primary"
                placeholder="Enter your password"
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="text-red-600 text-sm font-primary">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-gsu-blue to-gsu-cool-blue text-white py-3 px-4 rounded-lg hover:from-gsu-cool-blue hover:to-gsu-vibrant-blue transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:transform-none font-primary font-semibold text-lg shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
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
  const ReturnConfirmationModal = () => {
    return (<div>Return Confirmation Modal</div>);
  }
  const InventoryManagement = () => {
    return (<div>Return Confirmation Modal</div>);
  }
  const LoanManagement = () => {
    return (<div>Return Confirmation Modal</div>);
  }
  const LoanerApplicationForm = () => {
    return (<div>Return Confirmation Modal</div>);
  }
  const MaintenanceRecords = () => {
    return (<div>Return Confirmation Modal</div>);
  }
  const Reports = () => {
    return (<div>Return Confirmation Modal</div>);
  }
  const UserManagement = () => {
    return (<div>Return Confirmation Modal</div>);
  }
  const InventoryManager = () => {
    return (<div>Return Confirmation Modal</div>);
  }
  //dashboard
  // Dashboard Component
  const Dashboard = () => {
    const {
      totalItems = null,
      availableItems = null,
      loanedItems = null,
      maintenanceItems = null,
      overdueLoans = null
    } = dashboardStats;

    const pendingLoansList = loans.filter(loan => loan.status === 'pending');

    // Skeleton loader component
    const StatSkeleton = () => (
      <div className="animate-pulse flex space-x-4 items-center">
        <div className="rounded-full bg-gray-200 h-10 w-10" />
        <div className="h-6 bg-gray-200 rounded w-20" />
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-gsu-blue to-gsu-cool-blue px-8 py-6">
            <h1 className="text-3xl font-bold text-white font-secondary">
              GSU Equipment Dashboard
            </h1>
            <p className="text-gsu-light-blue font-primary">
              Real-time overview of equipment inventory and loans
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:scale-105 active:shadow-lg active:scale-100 transition-all duration-200 transform"
               onClick={() => showStatsModal('totalItems')}>
            <div className="flex items-center">
              <div className="p-4 bg-blue-100 rounded-full">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-bold text-gsu-cool-grey font-primary">Total Items</p>
                <p className="text-3xl font-bold text-gsu-blue font-secondary">
                  {totalItems === null ? <StatSkeleton /> : totalItems}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:scale-105 active:shadow-lg active:scale-100 transition-all duration-200 transform"
               onClick={() => showStatsModal('availableItems')}>
            <div className="flex items-center">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-bold text-gsu-cool-grey font-primary">Available</p>
                <p className="text-3xl font-bold text-green-600 font-secondary">
                  {availableItems === null ? <StatSkeleton /> : availableItems}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:scale-105 active:shadow-lg active:scale-100 transition-all duration-200 transform"
               onClick={() => showStatsModal('loanedItems')}>
            <div className="flex items-center">
              <div className="p-4 bg-yellow-100 rounded-full">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-bold text-gsu-cool-grey font-primary">On Loan</p>
                <p className="text-3xl font-bold text-yellow-500 font-secondary">
                  {loanedItems === null ? <StatSkeleton /> : loanedItems}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:scale-105 active:shadow-lg active:scale-100 transition-all duration-200 transform"
               onClick={() => showStatsModal('overdueItems')}>
            <div className="flex items-center">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-bold text-gsu-cool-grey font-primary">Overdue</p>
                <p className="text-3xl font-bold text-red-600 font-secondary">
                  {overdueLoans === null ? <StatSkeleton /> : overdueLoans}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:scale-105 active:shadow-lg active:scale-100 transition-all duration-200 transform"
               onClick={() => showStatsModal('maintenanceItems')}>
            <div className="flex items-center">
              <div className="p-4 bg-gray-100 rounded-full">
                <Wrench className="h-8 w-8 text-gray-700" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-bold text-gsu-cool-grey font-primary">Maintenance</p>
                <p className="text-3xl font-bold text-black font-secondary">
                  {maintenanceItems === null ? <StatSkeleton /> : maintenanceItems}
                </p>
              </div>
            </div>
          </div>
        </div>
        {(currentUser.role === 'admin' || currentUser.role === 'staff') && pendingLoansList.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-black mb-4 font-secondary text-gsu-blue">PENDING LOAN REQUESTS</h3>
            <div className="space-y-3">
              {pendingLoansList.map(loan => (
                <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium font-primary text-gsu-blue">{loan.borrower_name}</p>
                    <p className="text-sm text-gsu-cool-grey font-primary">
                      Asset: {loan.asset_id} | Due: {loan.expected_return} | Type: {loan.application_type}
                    </p>
                    {loan.panther_id && (
                      <p className="text-sm text-gsu-cool-grey font-primary">Panther ID: {loan.panther_id}</p>
                    )}
                    {loan.approved_by_name && (
                      <p className="text-sm text-gsu-blue font-primary">Approved by: {loan.approved_by_name}</p>
                    )}
                  </div>
                  <div className="space-x-2">
                                      <button
                    onClick={() => approveLoan(loan.id)}
                    disabled={loading}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-opacity-90 disabled:opacity-50 font-primary font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => denyLoan(loan.id)}
                    disabled={loading}
                    className="px-3 py-1 bg-gsu-red text-white text-sm rounded hover:bg-opacity-90 disabled:opacity-50 font-primary font-semibold"
                  >
                    Deny
                  </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Details"
        >
          {modalContent}
        </Modal>

        <ReturnConfirmationModal
          isOpen={showReturnModal}
          onClose={() => {
            setShowReturnModal(false);
            setReturnLoanData(null);
          }}
          loan={returnLoanData}
        />
      </div>
    );
  };
  // Main App Component
  if (!currentUser) {
    return <LoginForm />;
  }
  
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <InventoryManagement />;
      case 'loans':
        return <LoanManagement />;
      case 'loaner-applications':
        return (currentUser.role === 'admin' || currentUser.role === 'staff') ? <LoanerApplicationForm /> : <Dashboard />;
      case 'maintenance':
        return (currentUser.role === 'admin' || currentUser.role === 'staff') ? <MaintenanceRecords /> : <Dashboard />;
      case 'reports':
        return (currentUser.role === 'admin' || currentUser.role === 'staff') ? <Reports /> : <Dashboard />;
      case 'users':
        return currentUser.role === 'admin' ? <UserManagement /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };
  return renderContent();
}
export default InventoryManager;