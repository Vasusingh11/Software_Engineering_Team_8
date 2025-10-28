import './App.css';
import {useState, useCallback} from 'react';
import {Menu, Edit, CheckCircle, Clock, AlertTriangle, Wrench, X, Settings, Search, FileText, Laptop, User,} from 'lucide-react';
import ApiService from './api';

const InventoryManager = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboardStats, setDashboardStats] = useState({});
  const [loans, setLoans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnLoanData, setReturnLoanData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Background overlay */}
          <div 
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={onClose}
          ></div>

          {/* Modal panel */}
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {title}
                </h3>
                <button 
                  onClick={onClose}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gsu-blue"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const loadItems = useCallback(async () => {
    try {
      const data = await ApiService.getItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
      setError('Failed to load items: ' + error.message);
    }
  }, []);

  const loadAvailableItems = useCallback(async () => {
    try {
      const data = await ApiService.getItems();
      const available = data.filter(item => item.status === 'available');
      setAvailableItems(available);
    } catch (error) {
      console.error('Failed to load available items:', error);
      setError('Failed to load available items: ' + error.message);
    }
  }, []);

  const loadLoans = useCallback(async () => {
    try {
      const data = await ApiService.getLoans();
      setLoans(data);
    } catch (error) {
      console.error('Failed to load loans:', error);
      setError('Failed to load loans: ' + error.message);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await ApiService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      const data = await ApiService.getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  }, []);

  const loadMaintenanceRecords = useCallback(async () => {
    try {
      // For now, using mock data - in real implementation this would call API
      const mockRecords = [
        {
          id: 1,
          item_id: 1,
          asset_id: 'GSU-LAP-001',
          issue_description: 'Screen flickering intermittently',
          maintenance_date: '2024-01-15',
          technician_name: 'John Smith',
          cost: 150.00,
          status: 'completed',
          resolution_notes: 'Replaced LCD cable and updated drivers',
          parts_used: 'LCD cable, driver software'
        },
        {
          id: 2,
          item_id: 3,
          asset_id: 'GSU-TAB-003',
          issue_description: 'Battery not holding charge',
          maintenance_date: '2024-01-20',
          technician_name: 'Sarah Johnson',
          cost: 75.00,
          status: 'in_progress',
          resolution_notes: 'Battery replacement in progress',
          parts_used: 'New battery ordered'
        }
      ];
      setMaintenanceRecords(mockRecords);
    } catch (error) {
      console.error('Failed to load maintenance records:', error);
      setError('Failed to load maintenance records: ' + error.message);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const data = await ApiService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users: ' + error.message);
    }
  }, []);

  const loadDashboardStats = useCallback(async () => {
    try {
      const data = await ApiService.getDashboardStats();
      setDashboardStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      setError('Failed to load dashboard stats: ' + error.message);
    }
  }, []);

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
  const logout = () => {
    ApiService.logout();
    setCurrentUser(null);
    setItems([]);
    setAvailableItems([]);
    setLoans([]);
    setUsers([]);
    setDashboardStats({});
    setActiveTab('dashboard');
    setError('');
  };
  const ItemsModal = ({ items, title }) => (
    <div>
      <div className="mb-4">
        <p className="text-gray-600">Total: {items.length} items</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-2 text-left">Asset ID</th>
              <th className="border border-gray-200 px-4 py-2 text-left">RCB Sticker</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Brand/Model</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Location</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className="border border-gray-200 px-4 py-2 font-medium">{item.asset_id}</td>
                <td className="border border-gray-200 px-4 py-2 text-blue-600">{item.rcb_sticker_number || '-'}</td>
                <td className="border border-gray-200 px-4 py-2">{item.type}</td>
                <td className="border border-gray-200 px-4 py-2">{item.brand} {item.model}</td>
                <td className="border border-gray-200 px-4 py-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.status === 'available' ? 'bg-green-100 text-green-800' :
                    item.status === 'loaned' ? 'bg-yellow-100 text-yellow-800' :
                    item.status === 'maintenance' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="border border-gray-200 px-4 py-2">{item.location_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadItems(),
        loadLoans(),
        loadDashboardStats(),
        loadCategories(),
        loadLocations(),
        loadMaintenanceRecords()
      ]);
      
      const user = await ApiService.getUserProfile();
      // Load users for both admin and staff (staff need users for loaner applications)
      if (user.role === 'admin' || user.role === 'staff') {
        await loadUsers();
      }

      if (user.role === 'admin' || user.role === 'staff') {
        await loadAvailableItems();
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setError('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [loadItems, loadLoans, loadDashboardStats, loadCategories, loadLocations, loadMaintenanceRecords, loadUsers, loadAvailableItems]);

  const updateItem = async (id, updatedItem) => {
    try {
      setLoading(true);
      const itemData = {
        asset_id: updatedItem.assetId || updatedItem.asset_id,
        rcb_sticker_number: updatedItem.rcbStickerNumber || updatedItem.rcb_sticker_number,
        type: updatedItem.type,
        category_id: updatedItem.categoryId || updatedItem.category_id,
        brand: updatedItem.brand,
        model: updatedItem.model,
        serial_number: updatedItem.serialNumber || updatedItem.serial_number,
        purchase_date: updatedItem.purchaseDate || updatedItem.purchase_date,
        purchase_price: updatedItem.purchasePrice || updatedItem.purchase_price,
        warranty_expiry: updatedItem.warrantyExpiry || updatedItem.warranty_expiry,
        status: updatedItem.status,
        condition: updatedItem.condition,
        location_id: updatedItem.locationId || updatedItem.location_id,
        notes: updatedItem.notes,
        specifications: updatedItem.specifications,
        parts_used: updatedItem.partsUsed || updatedItem.parts_used,
        can_leave_building: updatedItem.canLeaveBuilding !== undefined ? updatedItem.canLeaveBuilding : updatedItem.can_leave_building
      };
      
      await ApiService.updateItem(id, itemData);
      await loadItems();
      await loadAvailableItems();
      await loadDashboardStats();
    } catch (error) {
      console.error('Failed to update item:', error);
      setError('Failed to update item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const LoansModal = ({ loans, title }) => (
    <div>
      <div className="mb-4">
        <p className="text-gray-600">Total: {loans.length} loans</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-2 text-left">Asset ID</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Borrower</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Expected Return</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Approved By</th>
            </tr>
          </thead>
          <tbody>
            {loans.map(loan => (
              <tr key={loan.id}>
                <td className="border border-gray-200 px-4 py-2 font-medium">{loan.asset_id}</td>
                <td className="border border-gray-200 px-4 py-2">{loan.borrower_name}</td>
                <td className="border border-gray-200 px-4 py-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    loan.status === 'active' ? 'bg-green-100 text-green-800' :
                    loan.status === 'returned' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {loan.status}
                  </span>
                </td>
                <td className="border border-gray-200 px-4 py-2">{loan.expected_return}</td>
                <td className="border border-gray-200 px-4 py-2">{loan.approved_by_name || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const approveLoan = async (loanId) => {
    try {
      setLoading(true);
      await ApiService.approveLoan(loanId);
      await loadLoans();
      await loadItems();
      await loadAvailableItems();
      await loadDashboardStats();
    } catch (error) {
      console.error('Failed to approve loan:', error);
      setError('Failed to approve loan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const denyLoan = async (loanId) => {
    try {
      setLoading(true);
      await ApiService.denyLoan(loanId);
      await loadLoans();
      await loadDashboardStats();
    } catch (error) {
      console.error('Failed to deny loan:', error);
      setError('Failed to deny loan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const MaintenanceItemsModal = ({ items, title, onStatusChange }) => (
    <div>
      <div className="mb-4">
        <p className="text-gray-600">Total: {items.length} items</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-2 text-left">Asset ID</th>
              <th className="border border-gray-200 px-4 py-2 text-left">RCB Sticker</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Brand/Model</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Condition</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Location</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className="border border-gray-200 px-4 py-2 font-medium">{item.asset_id}</td>
                <td className="border border-gray-200 px-4 py-2 text-blue-600">{item.rcb_sticker_number || '-'}</td>
                <td className="border border-gray-200 px-4 py-2">{item.type}</td>
                <td className="border border-gray-200 px-4 py-2">{item.brand} {item.model}</td>
                <td className="border border-gray-200 px-4 py-2 capitalize">{item.condition}</td>
                <td className="border border-gray-200 px-4 py-2">{item.location_name}</td>
                <td className="border border-gray-200 px-4 py-2">
                  <button
                    onClick={() => onStatusChange(item.id, { ...item, status: 'available' })}
                    disabled={loading}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    Mark Available
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  const ErrorDisplay = () => {
    if (!error) return null;
    return (
      <div className="bg-gsu-red bg-opacity-10 border border-gsu-red text-gsu-red px-4 py-3 rounded mb-4 font-primary">
        <div className="flex justify-between items-center">
          <span>{error}</span>
          <button 
            onClick={() => setError('')}
            className="text-gsu-red hover:text-gsu-red hover:opacity-80 text-xl font-bold"
          >
            ×
          </button>
        </div>
      </div>
    );
  };
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gsu-blue"></div>
    </div>
  );
  const returnItem = async (loanId, returnData = {}) => {
    try {
      setLoading(true);
      await ApiService.returnItem(loanId, returnData);
      await loadLoans();
      await loadItems();
      await loadAvailableItems();
      await loadDashboardStats();
    } catch (error) {
      console.error('Failed to return item:', error);
      setError('Failed to return item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  //login
  const login = async (username, password) => {
      try {
        setLoading(true);
        setError('');
        const response = await ApiService.login(username, password);
        setCurrentUser(response.user);
        await loadInitialData();
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
              GEORGIA STATE UNIVERSITY
            </h2>
            <h1 className="text-white text-xl font-bold font-secondary tracking-wide">
              LOANER EQUIPMENT PORTAL
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
  const ReturnConfirmationModal = ({ isOpen, onClose, loan }) => {
    const [returnFormData, setReturnFormData] = useState({
      return_condition: 'excellent',
      return_notes: '',
      // Additional fields based on product type
      physical_damage: false,
      power_adapter_returned: false,
      original_packaging: false,
      screen_condition: 'excellent',
      keyboard_condition: 'excellent',
      ports_working: true,
      battery_condition: 'excellent',
      cables_returned: false,
      stand_returned: false,
      protective_case_returned: false,
      stylus_returned: false,
      charging_cable_returned: false,
      all_accessories_returned: false
    });

    if (!isOpen || !loan) return null;

    const handleReturnSubmit = async () => {
      try {
        await returnItem(loan.id, returnFormData);
        setShowReturnModal(false);
        setReturnLoanData(null);
        setReturnFormData({
          return_condition: 'excellent',
          return_notes: '',
          physical_damage: false,
          power_adapter_returned: false,
          original_packaging: false,
          screen_condition: 'excellent',
          keyboard_condition: 'excellent',
          ports_working: true,
          battery_condition: 'excellent',
          cables_returned: false,
          stand_returned: false,
          protective_case_returned: false,
          stylus_returned: false,
          charging_cable_returned: false,
          all_accessories_returned: false
        });
      } catch (error) {
        // Error handling is done in returnItem function
      }
    };

    const renderProductSpecificFields = () => {
      const itemType = loan.type?.toLowerCase();
      
      switch (itemType) {
        case 'laptop':
          return (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <h4 className="text-lg font-semibold text-white font-secondary flex items-center">
                  <Laptop className="h-5 w-5 mr-2" />
                  Laptop Inspection Checklist
                </h4>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Screen Condition</label>
                    <select
                      value={returnFormData.screen_condition}
                      onChange={(e) => setReturnFormData({...returnFormData, screen_condition: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-primary"
                    >
                      <option value="excellent">Excellent - No damage</option>
                      <option value="good">Good - Minor scratches</option>
                      <option value="fair">Fair - Noticeable wear</option>
                      <option value="poor">Poor - Cracks or significant damage</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Keyboard Condition</label>
                    <select
                      value={returnFormData.keyboard_condition}
                      onChange={(e) => setReturnFormData({...returnFormData, keyboard_condition: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-primary"
                    >
                      <option value="excellent">Excellent - All keys working</option>
                      <option value="good">Good - All keys working, minor wear</option>
                      <option value="fair">Fair - Some keys sticky</option>
                      <option value="poor">Poor - Keys missing or not working</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Battery Condition</label>
                    <select
                      value={returnFormData.battery_condition}
                      onChange={(e) => setReturnFormData({...returnFormData, battery_condition: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-primary"
                    >
                      <option value="excellent">Excellent - Holds charge well</option>
                      <option value="good">Good - Normal battery life</option>
                      <option value="fair">Fair - Reduced battery life</option>
                      <option value="poor">Poor - Battery issues</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="ports_working"
                        checked={returnFormData.ports_working}
                        onChange={(e) => setReturnFormData({...returnFormData, ports_working: e.target.checked})}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="ports_working" className="ml-3 text-sm text-gray-700 font-primary">
                        All ports working (USB, HDMI, Audio)
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="power_adapter_returned"
                        checked={returnFormData.power_adapter_returned}
                        onChange={(e) => setReturnFormData({...returnFormData, power_adapter_returned: e.target.checked})}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="power_adapter_returned" className="ml-3 text-sm text-gray-700 font-primary">
                        Power adapter returned
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="original_packaging"
                        checked={returnFormData.original_packaging}
                        onChange={(e) => setReturnFormData({...returnFormData, original_packaging: e.target.checked})}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="original_packaging" className="ml-3 text-sm text-gray-700 font-primary">
                        Returned with original laptop bag/case
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
          
        case 'tablet':
          return (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                <h4 className="text-lg font-semibold text-white font-secondary flex items-center">
                  <Laptop className="h-5 w-5 mr-2" />
                  Tablet Inspection Checklist
                </h4>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Screen Condition</label>
                    <select
                      value={returnFormData.screen_condition}
                      onChange={(e) => setReturnFormData({...returnFormData, screen_condition: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-primary"
                    >
                      <option value="excellent">Excellent - No scratches</option>
                      <option value="good">Good - Minor scratches</option>
                      <option value="fair">Fair - Noticeable scratches</option>
                      <option value="poor">Poor - Cracks or major damage</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="protective_case_returned"
                        checked={returnFormData.protective_case_returned}
                        onChange={(e) => setReturnFormData({...returnFormData, protective_case_returned: e.target.checked})}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="protective_case_returned" className="ml-3 text-sm text-gray-700 font-primary">
                        Protective case returned
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="stylus_returned"
                        checked={returnFormData.stylus_returned}
                        onChange={(e) => setReturnFormData({...returnFormData, stylus_returned: e.target.checked})}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="stylus_returned" className="ml-3 text-sm text-gray-700 font-primary">
                        Stylus/Apple Pencil returned (if applicable)
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="charging_cable_returned"
                        checked={returnFormData.charging_cable_returned}
                        onChange={(e) => setReturnFormData({...returnFormData, charging_cable_returned: e.target.checked})}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="charging_cable_returned" className="ml-3 text-sm text-gray-700 font-primary">
                        Charging cable returned
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
          
        case 'monitor':
          return (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h4 className="text-lg font-semibold text-white font-secondary flex items-center">
                  <Laptop className="h-5 w-5 mr-2" />
                  Monitor Inspection Checklist
                </h4>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Screen Condition</label>
                    <select
                      value={returnFormData.screen_condition}
                      onChange={(e) => setReturnFormData({...returnFormData, screen_condition: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-primary"
                    >
                      <option value="excellent">Excellent - No dead pixels</option>
                      <option value="good">Good - Working perfectly</option>
                      <option value="fair">Fair - Minor display issues</option>
                      <option value="poor">Poor - Dead pixels or major issues</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="stand_returned"
                        checked={returnFormData.stand_returned}
                        onChange={(e) => setReturnFormData({...returnFormData, stand_returned: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="stand_returned" className="ml-3 text-sm text-gray-700 font-primary">
                        Monitor stand returned
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="cables_returned"
                        checked={returnFormData.cables_returned}
                        onChange={(e) => setReturnFormData({...returnFormData, cables_returned: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="cables_returned" className="ml-3 text-sm text-gray-700 font-primary">
                        All cables returned (HDMI, USB-C, Power)
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="original_packaging"
                        checked={returnFormData.original_packaging}
                        onChange={(e) => setReturnFormData({...returnFormData, original_packaging: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="original_packaging" className="ml-3 text-sm text-gray-700 font-primary">
                        Original box/packaging returned
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
          
        case 'webcam':
        case 'clickers':
        case 'adapter':
        case 'charger':
          return (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
                <h4 className="text-lg font-semibold text-white font-secondary flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Accessory Inspection Checklist
                </h4>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="all_accessories_returned"
                      checked={returnFormData.all_accessories_returned}
                      onChange={(e) => setReturnFormData({...returnFormData, all_accessories_returned: e.target.checked})}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="all_accessories_returned" className="ml-3 text-sm text-gray-700 font-primary">
                      All accessories/cables included
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="original_packaging"
                      checked={returnFormData.original_packaging}
                      onChange={(e) => setReturnFormData({...returnFormData, original_packaging: e.target.checked})}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="original_packaging" className="ml-3 text-sm text-gray-700 font-primary">
                      Original packaging returned
                    </label>
                  </div>
                </div>
              </div>
            </div>
          );
          
        default:
          return (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gsu-cool-grey to-gray-600 px-6 py-4">
                <h4 className="text-lg font-semibold text-white font-secondary flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  General Equipment Inspection
                </h4>
              </div>
              
              <div className="p-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="all_accessories_returned"
                    checked={returnFormData.all_accessories_returned}
                    onChange={(e) => setReturnFormData({...returnFormData, all_accessories_returned: e.target.checked})}
                    className="h-4 w-4 text-gsu-blue focus:ring-gsu-blue border-gray-300 rounded"
                  />
                  <label htmlFor="all_accessories_returned" className="ml-3 text-sm text-gray-700 font-primary">
                    All accessories included and accounted for
                  </label>
                </div>
              </div>
            </div>
          );
      }
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-gsu-blue to-gsu-cool-blue px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white font-secondary">
                  Equipment Return Confirmation
                </h3>
                <p className="text-gsu-light-blue font-primary">
                  {loan.asset_id} - {loan.brand} {loan.model}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="text-white hover:text-gsu-light-blue transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Overall Condition Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gsu-blue to-gsu-cool-blue px-6 py-4">
                <h4 className="text-lg font-semibold text-white font-secondary flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  General Condition Assessment
                </h4>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Overall Condition</label>
                  <select
                    value={returnFormData.return_condition}
                    onChange={(e) => setReturnFormData({...returnFormData, return_condition: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gsu-blue focus:border-gsu-blue font-primary"
                  >
                    <option value="excellent">Excellent - Like new condition</option>
                    <option value="good">Good - Minor wear, fully functional</option>
                    <option value="fair">Fair - Noticeable wear, some issues</option>
                    <option value="poor">Poor - Significant damage or malfunction</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="physical_damage"
                    checked={returnFormData.physical_damage}
                    onChange={(e) => setReturnFormData({...returnFormData, physical_damage: e.target.checked})}
                    className="h-4 w-4 text-gsu-red focus:ring-gsu-red border-gray-300 rounded"
                  />
                  <label htmlFor="physical_damage" className="ml-3 text-sm text-gray-700 font-primary">
                    Physical damage noted (dents, cracks, scratches)
                  </label>
                </div>
              </div>
            </div>

            {/* Product-specific inspection */}
            {renderProductSpecificFields()}

            {/* Return Notes Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
                <h4 className="text-lg font-semibold text-white font-secondary flex items-center">
                  <Edit className="h-5 w-5 mr-2" />
                  Additional Notes
                </h4>
              </div>
              
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">
                  Return Notes
                  <span className="text-gray-500 text-xs ml-1 font-primary">(Optional)</span>
                </label>
                <textarea
                  value={returnFormData.return_notes}
                  onChange={(e) => setReturnFormData({...returnFormData, return_notes: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 font-primary"
                  rows="4"
                  placeholder="Any additional notes about the condition or issues..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-primary font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnSubmit}
                disabled={loading}
                className="px-8 py-3 bg-gsu-blue text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 font-primary font-semibold shadow-md"
              >
                {loading ? 'Processing Return...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
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
              {<div className="p-4 bg-blue-100 rounded-full">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>}
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

        {<ReturnConfirmationModal
          isOpen={showReturnModal}
          onClose={() => {
            setShowReturnModal(false);
            setReturnLoanData(null);
          }}
          loan={returnLoanData}
        />}
      </div>
    );
  };
  // Main Navigation
  const Navigation = () => {
    const tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: Settings },
      { id: 'inventory', label: 'Inventory', icon: Search },
      { id: 'loans', label: 'Loans', icon: Clock },
      { id: 'reports', label: 'Reports', icon: FileText },
    ];

    if (currentUser.role === 'admin' || currentUser.role === 'staff') {
      tabs.splice(3, 0, { id: 'loaner-applications', label: 'Loaner Apps', icon: Laptop });
      tabs.splice(4, 0, { id: 'maintenance', label: 'Maintenance', icon: Wrench });
    }

    if (currentUser.role === 'admin') {
      tabs.push({ id: 'users', label: 'Users', icon: User });
    }

    return (
      <>
        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        <nav className="bg-gsu-blue shadow-md relative z-50">
          <div className="max-w-full mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-3">
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
              <img 
                src="/gsu-logo.png" 
                alt="Georgia State University" 
                className="h-10 sm:h-14 w-auto"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'block';
                }}
              />
              <h1 className="text-sm sm:text-lg font-bold text-white font-secondary tracking-tight" style={{display: 'none'}}>
                GSU LOANER SYSTEM
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-3">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-semibold font-primary whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-white text-gsu-blue'
                        : 'text-white hover:text-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Desktop User Info */}
            <div className="hidden lg:flex items-center space-x-3">
              <span className="text-sm text-white font-primary">Welcome, {currentUser.name}</span>
              <span className="px-3 py-1 text-xs bg-white text-gsu-blue rounded font-medium font-primary">{currentUser.role}</span>
              {currentUser.user_type && (
                <span className="px-3 py-1 text-xs bg-gsu-light-blue text-white rounded font-medium font-primary">{currentUser.user_type}</span>
              )}
              <button
                onClick={logout}
                className="text-sm text-white hover:text-gray-200 font-semibold font-primary px-2 py-1"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              <span className="text-sm text-white font-primary truncate max-w-24">{currentUser.name}</span>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:text-gray-200 p-2"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gsu-light-blue">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center w-full px-3 py-2 rounded-md text-base font-semibold font-primary ${
                        activeTab === tab.id
                          ? 'bg-white text-gsu-blue'
                          : 'text-white hover:text-gray-200 hover:bg-gsu-light-blue hover:bg-opacity-30'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
                
                {/* Mobile User Info */}
                <div className="pt-4 border-t border-gsu-light-blue">
                  <div className="px-3 py-2">
                    <p className="text-base text-white font-primary">Welcome, {currentUser.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 text-xs bg-white text-gsu-blue rounded font-medium font-primary">{currentUser.role}</span>
                      {currentUser.user_type && (
                        <span className="px-2 py-1 text-xs bg-gsu-light-blue text-white rounded font-medium font-primary">{currentUser.user_type}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:text-gray-200 font-semibold font-primary"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      </>
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
  return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6">
          <ErrorDisplay />
          {loading && <LoadingSpinner />}
          {renderContent()}
        </main>
      </div>
    );
};
export default InventoryManager;