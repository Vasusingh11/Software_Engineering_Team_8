import './App.css';
import {useState, useEffect, useCallback} from 'react';
import {Download, Upload, Trash2, Menu, Edit, CheckCircle, Clock, AlertTriangle, Wrench, X, Settings, Search, FileText, Laptop, User, Plus, UserPlus} from 'lucide-react';
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
  const [loanFilterBorrower, setLoanFilterBorrower] = useState('all');
  const [loanFilterStatus, setLoanFilterStatus] = useState('all');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showLoanDetailsModal, setShowLoanDetailsModal] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceFormItem, setMaintenanceFormItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

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

  const MaintenanceFormModal = ({ isOpen, onClose, item }) => {
    const [formData, setFormData] = useState({
      item_id: item?.id || '',
      asset_id: item?.asset_id || '',
      issue_description: '',
      technician_name: currentUser?.name || '',
      cost: '',
      status: 'pending',
      resolution_notes: '',
      parts_used: ''
    });
    const [inventorySearch, setInventorySearch] = useState(
      item ? `${item.asset_id} - ${item.brand} ${item.model}` : ''
    );
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedItem, setSelectedItem] = useState(item || null);

    // Search inventory items
    const searchInventoryItems = (searchTerm) => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      const results = items.filter(inventoryItem => {
        const searchText = searchTerm.toLowerCase();
        return (
          inventoryItem.asset_id.toLowerCase().includes(searchText) ||
          inventoryItem.brand.toLowerCase().includes(searchText) ||
          inventoryItem.model.toLowerCase().includes(searchText) ||
          inventoryItem.type.toLowerCase().includes(searchText) ||
          (inventoryItem.rcb_sticker_number && inventoryItem.rcb_sticker_number.toLowerCase().includes(searchText))
        );
      }).slice(0, 10);

      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    };

    // Select an item from search results
    const selectInventoryItem = (inventoryItem) => {
      setSelectedItem(inventoryItem);
      setFormData({
        ...formData,
        item_id: inventoryItem.id,
        asset_id: inventoryItem.asset_id
      });
      setInventorySearch(`${inventoryItem.asset_id} - ${inventoryItem.brand} ${inventoryItem.model}`);
      setShowSearchResults(false);
    };

    const handleSubmit = async () => {
      if (!formData.asset_id || !formData.item_id) {
        setError('Please select an equipment item from inventory');
        return;
      }
      if (!formData.issue_description.trim()) {
        setError('Issue description is required');
        return;
      }

      try {
        await createMaintenanceRecord({
          item_id: formData.item_id,
          asset_id: formData.asset_id,
          issue_description: formData.issue_description,
          technician_name: formData.technician_name,
          cost: formData.cost || 0,
          status: formData.status,
          resolution_notes: formData.resolution_notes,
          parts_used: formData.parts_used
        });
        onClose();
        // Reset form
        setFormData({
          item_id: '',
          asset_id: '',
          issue_description: '',
          technician_name: currentUser?.name || '',
          cost: '',
          status: 'pending',
          resolution_notes: '',
          parts_used: ''
        });
        setSelectedItem(null);
        setInventorySearch('');
      } catch (error) {
        // Error is already handled in createMaintenanceRecord
      }
    };

    if (!isOpen) return null;

          return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
              <h3 className="text-xl font-bold text-white font-secondary">
                New Maintenance Record
              </h3>
              {selectedItem ? (
                <p className="text-orange-100 font-primary">
                  Asset: {selectedItem.asset_id} - {selectedItem.brand} {selectedItem.model}
                </p>
              ) : (
                <p className="text-orange-100 font-primary">
                  Search and select equipment from inventory
                </p>
              )}
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-160px)]">
              {/* Equipment Search */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">Asset ID *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => {
                      setInventorySearch(e.target.value);
                      searchInventoryItems(e.target.value);
                    }}
                    className="w-full px-4 py-3 pr-10 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-primary"
                    placeholder="Search by Asset ID, Brand, Model, Type, or RCB Sticker..."
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Search className="h-5 w-5 text-orange-400" />
                  </div>
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((inventoryItem) => (
                      <div
                        key={inventoryItem.id}
                        onClick={() => selectInventoryItem(inventoryItem)}
                        className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900 font-primary">
                              {inventoryItem.asset_id}
                            </div>
                            <div className="text-sm text-gray-600 font-primary">
                              {inventoryItem.brand} {inventoryItem.model} ({inventoryItem.type})
                            </div>
                            {inventoryItem.rcb_sticker_number && (
                              <div className="text-xs text-blue-600 font-primary">
                                RCB: {inventoryItem.rcb_sticker_number}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs rounded-full font-primary ${
                              inventoryItem.status === 'available' ? 'bg-green-100 text-green-800' :
                              inventoryItem.status === 'on_loan' ? 'bg-blue-100 text-blue-800' :
                              inventoryItem.status === 'maintenance' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {inventoryItem.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">Technician Name *</label>
                <input
                  type="text"
                  value={formData.technician_name}
                  onChange={(e) => setFormData({...formData, technician_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">Estimated Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">Parts Needed/Used</label>
                <input
                  type="text"
                  value={formData.parts_used}
                  onChange={(e) => setFormData({...formData, parts_used: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                  placeholder="List parts..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">Issue Description *</label>
              <textarea
                value={formData.issue_description}
                onChange={(e) => setFormData({...formData, issue_description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                rows="3"
                required
                placeholder="Describe the issue or maintenance needed..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">Resolution Notes</label>
              <textarea
                value={formData.resolution_notes}
                onChange={(e) => setFormData({...formData, resolution_notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                rows="3"
                placeholder="Describe the solution or work performed..."
              />
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-primary font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedItem}
              className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 font-primary font-semibold"
            >
              {loading ? 'Creating...' : 'Create Record'}
            </button>
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

	// User management
	const addUser = async (userData) => {
	  try {
		setLoading(true);
		
		// Prepare the payload for the loaner endpoint
		const userPayload = {
		  username: userData.email?.split('@')[0] || userData.username,
		  password: 'TempGSU2024!', // Temporary password
		  name: userData.name,
		  email: userData.email,
		  role: userData.role || 'borrower',
		  panther_id: userData.panther_id,
		  phone: userData.phone,
		  user_type: userData.user_type
		};
		
		console.log("📤 Creating user with payload:", userPayload);
		
		// Call the correct endpoint
		await ApiService.createUserForLoaner(userPayload);
		await loadUsers();
		
	  } catch (error) {
		console.error('Failed to add user:', error);
		setError('Failed to add user: ' + error.message);
	  } finally {
		setLoading(false);
	  }
	};

  const deleteUser = async (userId) => {
    try {
      setLoading(true);
      await ApiService.deleteUser(userId);
      await loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      setError('Failed to delete user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
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

  // Check for existing login on app start
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = await ApiService.getUserProfile();
          setCurrentUser(user);
          await loadInitialData();
        } catch {
          ApiService.logout();
        }
      }
    };
    
    checkAuthAndLoadData();
  }, [loadInitialData]);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const addItem = async (newItem) => {
    try {
      setLoading(true);
      const itemData = {
        asset_id: newItem.assetId,
        rcb_sticker_number: newItem.rcbStickerNumber,
        type: newItem.type,
        category_id: newItem.categoryId,
        brand: newItem.brand,
        model: newItem.model,
        serial_number: newItem.serialNumber,
        purchase_date: newItem.purchaseDate,
        purchase_price: newItem.purchasePrice,
        warranty_expiry: newItem.warrantyExpiry,
        condition: newItem.condition,
        location_id: newItem.locationId,
        notes: newItem.notes,
        specifications: newItem.specifications,
        parts_used: newItem.partsUsed,
        can_leave_building: newItem.canLeaveBuilding !== undefined ? newItem.canLeaveBuilding : 1
      };
      
      await ApiService.createItem(itemData);
      await loadItems();
      await loadAvailableItems();
      await loadDashboardStats();
    } catch (error) {
      console.error('Failed to add item:', error);
      setError('Failed to add item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    try {
      setLoading(true);
      await ApiService.deleteItem(id);
      await loadItems();
      await loadAvailableItems();
      await loadDashboardStats();
    } catch (error) {
      console.error('Failed to delete item:', error);
      setError('Failed to delete item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const markItemForMaintenance = async (itemId) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) {
        throw new Error('Item not found');
      }
      
      // Open maintenance form popup with item data
      setMaintenanceFormItem(item);
      setShowMaintenanceForm(true);
    } catch (error) {
      console.error('Failed to open maintenance form:', error);
      setError('Failed to open maintenance form: ' + error.message);
    }
  };

  const createMaintenanceRecord = async (recordData) => {
    try {
      setLoading(true);
      
      // Create maintenance record
      const newRecord = {
        id: Date.now(),
        item_id: recordData.item_id,
        asset_id: recordData.asset_id,
        issue_description: recordData.issue_description,
        technician_name: recordData.technician_name,
        cost: recordData.cost || 0,
        status: recordData.status || 'pending',
        resolution_notes: recordData.resolution_notes || '',
        parts_used: recordData.parts_used || '',
        maintenance_date: new Date().toISOString().split('T')[0]
      };
      
      // Add to maintenance records
      setMaintenanceRecords(prev => [...prev, newRecord]);
      
      // Update item status based on maintenance record status
      const item = items.find(i => i.id === recordData.item_id);
      if (item) {
        const updatedItemData = {
          assetId: item.asset_id,
          rcbStickerNumber: item.rcb_sticker_number,
          type: item.type,
          categoryId: item.category_id,
          brand: item.brand,
          model: item.model,
          serialNumber: item.serial_number,
          purchaseDate: item.purchase_date,
          purchasePrice: item.purchase_price,
          warrantyExpiry: item.warranty_expiry,
          condition: item.condition,
          locationId: item.location_id,
          notes: item.notes,
          specifications: item.specifications,
          partsUsed: item.parts_used,
          canLeaveBuilding: item.can_leave_building,
          // If maintenance is created as completed, mark item as available, otherwise maintenance
          status: newRecord.status === 'completed' ? 'available' : 'maintenance'
        };
        
        await updateItem(recordData.item_id, updatedItemData);
      }
      
      // Reload dashboard stats to reflect maintenance count
      await loadDashboardStats();
      
      const statusMessage = newRecord.status === 'completed' 
        ? 'Maintenance record created successfully - Item automatically marked as available' 
        : 'Maintenance record created successfully';
      setError(statusMessage);
    } catch (error) {
      console.error('Failed to create maintenance record:', error);
      setError('Failed to create maintenance record: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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
  
  const getItemTypes = () => {
    const types = [...new Set(items.map(item => item.type))];
    return types.sort();
  };
  const importItems = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:5001/api/items/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      const result = await response.json();
      await loadItems();
      await loadAvailableItems();
      await loadDashboardStats();
      
      setError(`Import completed: ${result.imported} items imported, ${result.errors.length} errors`);
    } catch (error) {
      console.error('Failed to import items:', error);
      setError('Failed to import items: ' + error.message);
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
  
  const openLoanDetails = (loan) => {
	setSelectedLoan(loan);
	setShowLoanDetailsModal(true);
  };

    // Loan Details Modal
  const LoanDetailsModal = ({ isOpen, onClose, loan }) => {
    if (!isOpen || !loan) return null;

    const formatReturnDetails = (returnData) => {
      if (!returnData) return null;
      
      const itemType = loan.type?.toLowerCase();
      
      const inspectionSections = {
        overall: {
          title: 'Overall Assessment',
          icon: '📋',
          color: 'blue',
          items: []
        },
        hardware: {
          title: 'Hardware Inspection',
          icon: '🔧',
          color: 'green',
          items: []
        },
        accessories: {
          title: 'Accessories & Components',
          icon: '📦',
          color: 'purple',
          items: []
        },
        notes: {
          title: 'Additional Notes',
          icon: '📝',
          color: 'gray',
          items: []
        }
      };

      // Overall condition assessment
      if (returnData.return_condition) {
        const conditionColor = {
          'excellent': '🟢',
          'good': '🟡', 
          'fair': '🟠',
          'poor': '🔴',
          'damaged': '❌'
        }[returnData.return_condition] || '⚪';
        
        inspectionSections.overall.items.push({
          label: 'Overall Condition',
          value: returnData.return_condition,
          status: conditionColor,
          detail: returnData.return_condition === 'excellent' ? 'No visible wear or damage' :
                  returnData.return_condition === 'good' ? 'Minor wear, fully functional' :
                  returnData.return_condition === 'fair' ? 'Noticeable wear, some issues noted' :
                  returnData.return_condition === 'poor' ? 'Significant wear or damage' :
                  returnData.return_condition === 'damaged' ? 'Requires repair or replacement' : ''
        });
      }

      if (returnData.physical_damage) {
        inspectionSections.overall.items.push({
          label: 'Physical Damage',
          value: 'Damage Reported',
          status: '⚠️',
          detail: 'Physical damage noted during inspection'
        });
      }

      // Product-specific hardware inspection
      if (itemType === 'laptop') {
        if (returnData.screen_condition) {
          const screenStatus = returnData.screen_condition === 'excellent' ? '✅' : 
                              returnData.screen_condition === 'good' ? '🟡' : 
                              returnData.screen_condition === 'fair' ? '🟠' : '❌';
          inspectionSections.hardware.items.push({
            label: 'Display Screen',
            value: returnData.screen_condition,
            status: screenStatus,
            detail: returnData.screen_condition === 'excellent' ? 'No scratches, cracks, or dead pixels' :
                   returnData.screen_condition === 'good' ? 'Minor scratches, fully functional' :
                   returnData.screen_condition === 'fair' ? 'Noticeable wear, some display issues' :
                   'Significant damage or display problems'
          });
        }

        if (returnData.keyboard_condition) {
          const keyboardStatus = returnData.keyboard_condition === 'excellent' ? '✅' : 
                                 returnData.keyboard_condition === 'good' ? '🟡' : 
                                 returnData.keyboard_condition === 'fair' ? '🟠' : '❌';
          inspectionSections.hardware.items.push({
            label: 'Keyboard',
            value: returnData.keyboard_condition,
            status: keyboardStatus,
            detail: returnData.keyboard_condition === 'excellent' ? 'All keys responsive, no wear' :
                   returnData.keyboard_condition === 'good' ? 'All keys working, minor wear visible' :
                   returnData.keyboard_condition === 'fair' ? 'Some keys sticky or worn' :
                   'Keys missing or not functioning properly'
          });
        }

        if (returnData.battery_condition) {
          const batteryStatus = returnData.battery_condition === 'excellent' ? '🔋' : 
                               returnData.battery_condition === 'good' ? '🟡' : 
                               returnData.battery_condition === 'fair' ? '🟠' : '⚠️';
          inspectionSections.hardware.items.push({
            label: 'Battery',
            value: returnData.battery_condition,
            status: batteryStatus,
            detail: returnData.battery_condition === 'excellent' ? 'Holds full charge, optimal performance' :
                   returnData.battery_condition === 'good' ? 'Normal battery life, good performance' :
                   returnData.battery_condition === 'fair' ? 'Reduced battery life, may need replacement soon' :
                   'Poor battery performance, requires immediate attention'
          });
        }

        if (returnData.ports_working !== undefined) {
          inspectionSections.hardware.items.push({
            label: 'Ports & Connectivity',
            value: returnData.ports_working ? 'All Working' : 'Issues Detected',
            status: returnData.ports_working ? '✅' : '❌',
            detail: returnData.ports_working ? 'USB, HDMI, audio ports tested and functional' : 'One or more ports not functioning properly'
          });
        }

        // Laptop accessories
        if (returnData.power_adapter_returned !== undefined) {
          inspectionSections.accessories.items.push({
            label: 'Power Adapter',
            value: returnData.power_adapter_returned ? 'Returned' : 'Missing',
            status: returnData.power_adapter_returned ? '✅' : '❌',
            detail: returnData.power_adapter_returned ? 'Original power adapter included' : 'Power adapter not returned with device'
          });
        }

        if (returnData.original_packaging !== undefined) {
          inspectionSections.accessories.items.push({
            label: 'Laptop Bag/Case',
            value: returnData.original_packaging ? 'Returned' : 'Missing',
            status: returnData.original_packaging ? '✅' : '❌',
            detail: returnData.original_packaging ? 'Original carrying case or bag included' : 'Carrying case or bag not returned'
          });
        }

      } else if (itemType === 'tablet') {
        if (returnData.screen_condition) {
          const screenStatus = returnData.screen_condition === 'excellent' ? '✅' : 
                              returnData.screen_condition === 'good' ? '🟡' : 
                              returnData.screen_condition === 'fair' ? '🟠' : '❌';
          inspectionSections.hardware.items.push({
            label: 'Touchscreen Display',
            value: returnData.screen_condition,
            status: screenStatus,
            detail: 'Touch responsiveness and display quality assessed'
          });
        }

        if (returnData.protective_case_returned !== undefined) {
          inspectionSections.accessories.items.push({
            label: 'Protective Case',
            value: returnData.protective_case_returned ? 'Returned' : 'Missing',
            status: returnData.protective_case_returned ? '✅' : '❌',
            detail: returnData.protective_case_returned ? 'Original protective case included' : 'Protective case not returned'
          });
        }

        if (returnData.stylus_returned !== undefined) {
          inspectionSections.accessories.items.push({
            label: 'Stylus/Apple Pencil',
            value: returnData.stylus_returned ? 'Returned' : 'Missing',
            status: returnData.stylus_returned ? '✅' : '❌',
            detail: returnData.stylus_returned ? 'Digital stylus or Apple Pencil included' : 'Stylus not returned (if applicable)'
          });
        }

        if (returnData.charging_cable_returned !== undefined) {
          inspectionSections.accessories.items.push({
            label: 'Charging Cable',
            value: returnData.charging_cable_returned ? 'Returned' : 'Missing',
            status: returnData.charging_cable_returned ? '✅' : '❌',
            detail: returnData.charging_cable_returned ? 'Original charging cable included' : 'Charging cable not returned'
          });
        }

      } else if (itemType === 'monitor') {
        if (returnData.screen_condition) {
          const screenStatus = returnData.screen_condition === 'excellent' ? '✅' : 
                              returnData.screen_condition === 'good' ? '🟡' : 
                              returnData.screen_condition === 'fair' ? '🟠' : '❌';
          inspectionSections.hardware.items.push({
            label: 'Display Panel',
            value: returnData.screen_condition,
            status: screenStatus,
            detail: 'Display quality, dead pixels, and color accuracy checked'
          });
        }

        if (returnData.stand_returned !== undefined) {
          inspectionSections.accessories.items.push({
            label: 'Monitor Stand',
            value: returnData.stand_returned ? 'Returned' : 'Missing',
            status: returnData.stand_returned ? '✅' : '❌',
            detail: returnData.stand_returned ? 'Original monitor stand or mount included' : 'Monitor stand not returned'
          });
        }

        if (returnData.cables_returned !== undefined) {
          inspectionSections.accessories.items.push({
            label: 'Connection Cables',
            value: returnData.cables_returned ? 'All Returned' : 'Missing',
            status: returnData.cables_returned ? '✅' : '❌',
            detail: returnData.cables_returned ? 'HDMI, USB-C, and power cables included' : 'One or more cables missing'
          });
        }

      } else {
        // General equipment
        if (returnData.all_accessories_returned !== undefined) {
          inspectionSections.accessories.items.push({
            label: 'All Accessories',
            value: returnData.all_accessories_returned ? 'Complete' : 'Incomplete',
            status: returnData.all_accessories_returned ? '✅' : '❌',
            detail: returnData.all_accessories_returned ? 'All original accessories accounted for' : 'Some accessories missing or not returned'
          });
        }
      }

      // Additional notes and observations
      if (returnData.return_notes && returnData.return_notes.trim()) {
        inspectionSections.notes.items.push({
          label: 'Staff Observations',
          value: returnData.return_notes,
          status: '📝',
          detail: 'Additional notes recorded during return inspection'
        });
      }

      // Remove empty sections
      Object.keys(inspectionSections).forEach(key => {
        if (inspectionSections[key].items.length === 0) {
          delete inspectionSections[key];
        }
      });

      return inspectionSections;
    };

    const returnDetails = formatReturnDetails(loan.return_inspection);

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gsu-blue to-gsu-cool-blue px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white font-secondary">
                  Loan Details
                </h3>
                <p className="text-gsu-light-blue font-primary">
                  {loan.loan_number || `Loan #${loan.id}`}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="text-white hover:text-gsu-light-blue transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Loan Application Details */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-bold text-gsu-blue mb-4 font-secondary flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Loan Application
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600 font-primary">Loan Number:</span>
                        <p className="text-gsu-blue font-semibold font-primary">{loan.loan_number || `#${loan.id}`}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 font-primary">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-primary ${
                          loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          loan.status === 'active' ? 'bg-green-100 text-green-800' :
                          loan.status === 'returned' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {loan.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-600 font-primary">Equipment:</span>
                      <p className="text-gray-900 font-primary">
                        {loan.asset_id} - {loan.brand} {loan.model} ({loan.type})
                      </p>
                      {loan.rcb_sticker_number && (
                        <p className="text-sm text-blue-600 font-primary">RCB Sticker: {loan.rcb_sticker_number}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-600 font-primary">Borrower:</span>
                      <p className="text-gray-900 font-primary">{loan.borrower_name}</p>
                      {loan.panther_id && (
                        <p className="text-sm text-gray-600 font-primary">Panther ID: {loan.panther_id}</p>
                      )}
                      {loan.user_type && (
                        <p className="text-sm text-gray-600 font-primary">Type: {loan.user_type}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600 font-primary">Request Date:</span>
                        <p className="text-gray-900 font-primary">{loan.request_date}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 font-primary">Expected Return:</span>
                        <p className="text-gray-900 font-primary">{loan.expected_return}</p>
                      </div>
                    </div>

                    {loan.approved_date && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600 font-primary">Approved Date:</span>
                          <p className="text-gray-900 font-primary">{loan.approved_date}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600 font-primary">Approved By:</span>
                          <p className="text-gray-900 font-primary">{loan.approved_by_name || 'N/A'}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-sm font-medium text-gray-600 font-primary">Reason:</span>
                      <p className="text-gray-900 font-primary">{loan.reason}</p>
                    </div>

                    {loan.application_type && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 font-primary">Application Type:</span>
                        <p className="text-gray-900 font-primary">
                          {loan.application_type === 'staff_created' ? 'Staff Created' : 'Self Service'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Return Details */}
              {loan.status === 'returned' && (
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-green-800 mb-4 font-secondary flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Return Inspection
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600 font-primary">Return Date:</span>
                          <p className="text-gray-900 font-primary">{loan.actual_return}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600 font-primary">Returned By:</span>
                          <p className="text-gray-900 font-primary">{loan.returned_by_name || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        {returnDetails && Object.keys(returnDetails).length > 0 ? (
                          <>
                            <span className="text-sm font-medium text-gray-600 font-primary mb-3 block">Detailed Inspection Report:</span>
                            <div className="space-y-4">
                              {Object.entries(returnDetails).map(([sectionKey, section]) => (
                                <div key={sectionKey} className="bg-white rounded border">
                                  {/* Section Header */}
                                  <div className={`px-3 py-2 bg-${section.color}-50 border-b border-${section.color}-200 rounded-t`}>
                                    <h6 className={`text-sm font-semibold text-${section.color}-800 font-primary flex items-center`}>
                                      <span className="mr-2">{section.icon}</span>
                                      {section.title}
                                    </h6>
                                  </div>
                                  
                                  {/* Section Items */}
                                  <div className="p-3 space-y-2">
                                    {section.items.map((item, index) => (
                                      <div key={index} className="flex items-start space-x-2 text-xs">
                                        <span className="flex-shrink-0 mt-0.5">{item.status}</span>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-700 font-primary">{item.label}:</span>
                                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                              item.value.toLowerCase().includes('excellent') || item.value.toLowerCase().includes('returned') || item.value.toLowerCase().includes('working') || item.value.toLowerCase().includes('complete') ? 
                                                'bg-green-100 text-green-700' :
                                              item.value.toLowerCase().includes('good') || item.value.toLowerCase().includes('normal') ?
                                                'bg-yellow-100 text-yellow-700' :
                                              item.value.toLowerCase().includes('fair') || item.value.toLowerCase().includes('reduced') ?
                                                'bg-orange-100 text-orange-700' :
                                              item.value.toLowerCase().includes('poor') || item.value.toLowerCase().includes('missing') || item.value.toLowerCase().includes('damage') || item.value.toLowerCase().includes('issues') ?
                                                'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                              {item.value}
                                            </span>
                                          </div>
                                          {item.detail && (
                                            <p className="text-xs text-gray-500 mt-1 font-primary">{item.detail}</p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="bg-white rounded border p-4 text-center">
                            <div className="text-gray-400 mb-2">📝</div>
                            <p className="text-sm text-gray-600 font-primary">
                              No detailed inspection information available for this return.
                            </p>
                            <p className="text-xs text-gray-500 font-primary mt-1">
                              Equipment was returned without completing the detailed inspection form.
                            </p>
                            {/* Debug info - can be removed in production */}
                            {loan.return_inspection && (
                              <details className="mt-3 text-left">
                                <summary className="text-xs text-gray-400 cursor-pointer">Debug Info</summary>
                                <pre className="text-xs text-gray-400 mt-2 bg-gray-100 p-2 rounded overflow-auto">
                                  {JSON.stringify(loan.return_inspection, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* If not returned yet, show status */}
              {loan.status !== 'returned' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-blue-800 mb-4 font-secondary flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Current Status
                    </h4>
                    
                    <div className="space-y-3">
                      <p className="text-blue-900 font-primary">
                        {loan.status === 'pending' && 'This loan is awaiting approval.'}
                        {loan.status === 'active' && 'This equipment is currently on loan.'}
                        {loan.status === 'denied' && 'This loan request was denied.'}
                      </p>
                      
                      {loan.status === 'active' && (
                        <div className="bg-white rounded p-3 border border-blue-200">
                          <p className="text-sm text-gray-600 font-primary">
                            Expected return date: <span className="font-semibold">{loan.expected_return}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gsu-blue text-white rounded-md hover:bg-gsu-cool-blue font-primary font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

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
                <span className="text-gsu-blue font-semibold">user1 / user123</span>
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
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [inventorySearch, setInventorySearch] = useState('');
    const [debouncedInventorySearch, setDebouncedInventorySearch] = useState('');

    // Debounce inventory search
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedInventorySearch(inventorySearch);
      }, 300);
      return () => clearTimeout(handler);
    }, [inventorySearch]);

    // Updated filter logic to use debouncedInventorySearch
    const filteredItems = items.filter(item => {
      const searchText = debouncedInventorySearch.trim().toLowerCase();
      const fields = [
        item.asset_id,
        item.type,
        item.brand,
        item.model,
        item.serial_number,
        item.rcb_sticker_number,
        item.location_name,
        item.notes,
        item.specifications
      ];
      const matchesSearch = !searchText || fields.some(field =>
        field && field.toString().toLowerCase().includes(searchText)
      );
      const matchesStatusFilter = filterStatus === 'all' || item.status === filterStatus;
      const matchesTypeFilter = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesStatusFilter && matchesTypeFilter;
    });
    const itemTypes = getItemTypes();

    const ItemForm = ({ item, onSave, onCancel }) => {
      const [formData, setFormData] = useState(item || {
        assetId: '',
        rcbStickerNumber: '',
        type: 'Laptop',
        categoryId: 1,
        brand: '',
        model: '',
        serialNumber: '',
        purchaseDate: '',
        purchasePrice: '',
        warrantyExpiry: '',
        condition: 'excellent',
        locationId: 1,
        notes: '',
        specifications: '',
        partsUsed: '',
        canLeaveBuilding: false
      });

      const handleSubmit = async () => {
        try {
          await onSave(formData);
          onCancel();
        } catch (error) {
          // Error is already handled in the parent functions
        }
      };

      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">{item ? 'Edit Item' : 'Add New Item'}</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Asset ID *</label>
                <input
                  type="text"
                  value={formData.assetId || formData.asset_id || ''}
                  onChange={(e) => setFormData({...formData, assetId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">RCB Sticker Number</label>
                <input
                  type="text"
                  value={formData.rcbStickerNumber || formData.rcb_sticker_number || ''}
                  onChange={(e) => setFormData({...formData, rcbStickerNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Laptop">Laptop</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Charger">Charger</option>
                  <option value="Adapter">Adapter</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Webcam">Webcam</option>
                  <option value="Clickers">Clickers</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.categoryId || formData.category_id || 1}
                  onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brand *</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Model *</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Serial Number *</label>
                <input
                  type="text"
                  value={formData.serialNumber || formData.serial_number || ''}
                  onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchaseDate || formData.purchase_date || ''}
                  onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice || formData.purchase_price || ''}
                  onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Warranty Expiry</label>
                <input
                  type="date"
                  value={formData.warrantyExpiry || formData.warranty_expiry || ''}
                  onChange={(e) => setFormData({...formData, warrantyExpiry: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <select
                  value={formData.locationId || formData.location_id || 1}
                  onChange={(e) => setFormData({...formData, locationId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Specifications</label>
              <textarea
                value={formData.specifications || ''}
                onChange={(e) => setFormData({...formData, specifications: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="2"
                placeholder="Technical specifications..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Parts Used</label>
              <textarea
                value={formData.partsUsed || formData.parts_used || ''}
                onChange={(e) => setFormData({...formData, partsUsed: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="2"
                placeholder="Parts and accessories included..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="2"
                placeholder="Additional notes..."
              />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!formData.canLeaveBuilding}
                  onChange={(e) => setFormData({...formData, canLeaveBuilding: !e.target.checked})}
                  id="cannotLeaveBuilding"
                />
                <label htmlFor="cannotLeaveBuilding" className="text-sm font-medium text-yellow-800">
                  🏢 Cannot leave Buckhead Center Building (Default: Checked)
                </label>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Check this box for equipment that must remain on campus premises at all times
              </p>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    };

    const ImportModal = () => {
      const [file, setFile] = useState(null);

      const handleFileSelect = (e) => {
        setFile(e.target.files[0]);
      };

      const handleImport = async () => {
        if (file) {
          await importItems(file);
          setShowImportModal(false);
          setFile(null);
        }
      };

      return (
        <Modal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          title="Import Items from Excel"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Upload an Excel file with columns: Asset ID, RCB Sticker Number, Type, Brand, Model, Serial Number, Purchase Date, Purchase Price, Condition, Notes, Specifications, Parts Used
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Import'}
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold font-secondary tracking-tight">INVENTORY MANAGEMENT</h2>
          {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
            <div className="space-x-2">
              <button
                onClick={() => setShowImportModal(true)}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 font-semibold font-primary"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Excel
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-gsu-blue text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 font-semibold font-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>
          )}
        </div>

        {/* New Search Bar */}
        <div className="mb-4 flex items-center max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              value={inventorySearch}
              onChange={e => setInventorySearch(e.target.value)}
              placeholder="Search inventory..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <Search className="h-5 w-5" />
            </span>
            {inventorySearch && (
              <button
                type="button"
                onClick={() => setInventorySearch('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Custom Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Filter Dropdowns */}
            <div className="min-w-0 flex-1 lg:flex-none lg:w-40">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full py-3 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="loaned">On Loan</option>
                <option value="maintenance">Maintenance</option>
                <option value="faulty">Faulty</option>
              </select>
            </div>
            <div className="min-w-0 flex-1 lg:flex-none lg:w-40">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full py-3 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Types</option>
                {itemTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Search Results Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredItems.length}</span> of <span className="font-semibold text-gray-900">{items.length}</span> items
              {(filterStatus !== 'all' || filterType !== 'all' || debouncedInventorySearch) && (
                <span> with applied filters</span>
              )}
            </p>
          </div>
        </div>

        {showAddForm && (
          <ItemForm
            onSave={addItem}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {editingItem && (
          <ItemForm
            item={editingItem}
            onSave={(updatedItem) => updateItem(editingItem.id, updatedItem)}
            onCancel={() => setEditingItem(null)}
          />
        )}

        <ImportModal />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RCB Sticker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand/Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.asset_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{item.rcb_sticker_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.brand} {item.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.status === 'available' ? 'bg-green-100 text-green-800' :
                        item.status === 'loaned' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'maintenance' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{item.condition}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {item.location_name}
                        {!item.can_leave_building && (
                          <div className="text-xs text-red-600">No exit</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.purchase_price ? `$${item.purchase_price}` : 'N/A'}
                    </td>
                    {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            title="Edit Item"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {item.status === 'available' && (
                            <button
                              onClick={() => markItemForMaintenance(item.id)}
                              disabled={loading}
                              className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                              title="Mark for Maintenance"
                            >
                              <Wrench className="h-4 w-4" />
                            </button>
                          )}
                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => deleteItem(item.id)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="Delete Item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Form Modal */}
        <MaintenanceFormModal
          isOpen={showMaintenanceForm}
          onClose={() => {
            setShowMaintenanceForm(false);
            setMaintenanceFormItem(null);
          }}
          item={maintenanceFormItem}
        />
      </div>
    );
  };

  //Loan Management Component

  const LoanManagement = () => {
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [loansSearch, setLoansSearch] = useState('');
    const [debouncedLoansSearch, setDebouncedLoansSearch] = useState('');

    // Debounce loans search
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedLoansSearch(loansSearch);
      }, 300);
      return () => clearTimeout(handler);
    }, [loansSearch]);

    // Updated filter logic to use debouncedLoansSearch
    const filteredLoans = loans.filter(loan => {
      const searchText = debouncedLoansSearch.trim().toLowerCase();
      const fields = [
        loan.asset_id,
        loan.borrower_name,
        loan.reason,
        loan.panther_id,
        loan.type,
        loan.status,
        loan.approved_by_name,
        loan.returned_by_name
      ];
      const matchesSearch = !searchText || fields.some(field =>
        field && field.toString().toLowerCase().includes(searchText)
      );
      const matchesBorrowerFilter = loanFilterBorrower === 'all' || loan.borrower_id === parseInt(loanFilterBorrower);
      const matchesStatusFilter = loanFilterStatus === 'all' || loan.status === loanFilterStatus;
      return matchesSearch && matchesBorrowerFilter && matchesStatusFilter;
    });

    const RequestForm = () => {
      const [formData, setFormData] = useState({
        itemId: '',
        assetId: '',
        expectedReturn: '',
        reason: ''
      });

      const userAvailableItems = availableItems.filter(item => 
        currentUser.role === 'borrower' ? item.can_leave_building : true
      );

      const handleSubmit = async () => {
        try {
          await createLoanRequest(formData);
          setShowRequestForm(false);
          setFormData({ itemId: '', assetId: '', expectedReturn: '', reason: '' });
        } catch (error) {
          // Error is already handled in createLoanRequest
        }
      };

  const markItemForMaintenance = async (itemId) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) {
        throw new Error('Item not found');
      }
      
      // Open maintenance form popup with item data
      setMaintenanceFormItem(item);
      setShowMaintenanceForm(true);
    } catch (error) {
      console.error('Failed to open maintenance form:', error);
      setError('Failed to open maintenance form: ' + error.message);
    }
  };

  const createMaintenanceRecord = async (recordData) => {
    try {
      setLoading(true);
      
      // Create maintenance record
      const newRecord = {
        id: Date.now(),
        item_id: recordData.item_id,
        asset_id: recordData.asset_id,
        issue_description: recordData.issue_description,
        technician_name: recordData.technician_name,
        cost: recordData.cost || 0,
        status: recordData.status || 'pending',
        resolution_notes: recordData.resolution_notes || '',
        parts_used: recordData.parts_used || '',
        maintenance_date: new Date().toISOString().split('T')[0]
      };
      
      // Add to maintenance records
      setMaintenanceRecords(prev => [...prev, newRecord]);
      
      // Update item status based on maintenance record status
      const item = items.find(i => i.id === recordData.item_id);
      if (item) {
        const updatedItemData = {
          assetId: item.asset_id,
          rcbStickerNumber: item.rcb_sticker_number,
          type: item.type,
          categoryId: item.category_id,
          brand: item.brand,
          model: item.model,
          serialNumber: item.serial_number,
          purchaseDate: item.purchase_date,
          purchasePrice: item.purchase_price,
          warrantyExpiry: item.warranty_expiry,
          condition: item.condition,
          locationId: item.location_id,
          notes: item.notes,
          specifications: item.specifications,
          partsUsed: item.parts_used,
          canLeaveBuilding: item.can_leave_building,
          // If maintenance is created as completed, mark item as available, otherwise maintenance
          status: newRecord.status === 'completed' ? 'available' : 'maintenance'
        };
        
        await updateItem(recordData.item_id, updatedItemData);
      }
      
      // Reload dashboard stats to reflect maintenance count
      await loadDashboardStats();
      
      const statusMessage = newRecord.status === 'completed' 
        ? 'Maintenance record created successfully - Item automatically marked as available' 
        : 'Maintenance record created successfully';
      setError(statusMessage);
    } catch (error) {
      console.error('Failed to create maintenance record:', error);
      setError('Failed to create maintenance record: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  

  const importItems = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:5001/api/items/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      const result = await response.json();
      await loadItems();
      await loadAvailableItems();
      await loadDashboardStats();
      
      setError(`Import completed: ${result.imported} items imported, ${result.errors.length} errors`);
    } catch (error) {
      console.error('Failed to import items:', error);
      setError('Failed to import items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

	// Main function to create loan request (handles staff and borrower)
	const createLoanRequest = async (request) => {
	  setLoading(true);
	  setError('');

	  try {
		const loanData = {
		  item_id: parseInt(request.itemId),
		  expected_return: request.expectedReturn,
		  reason: request.reason,
		  loan_number: generateLoanNumber(),
		};

		if (currentUser?.role === 'staff') {
		  await createStaffLoanRequest(loanData);
		} else {
		  await ApiService.createLoanRequest(loanData);
		}

		await loadLoans();
		await loadDashboardStats();
	  } catch (error) {
		console.error('Failed to create loan request:', error);
		setError('Failed to create loan request: ' + (error.message || error));
	  } finally {
		setLoading(false);
	  }
	};
  
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Request Equipment Loan</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Item</label>
              <select
                value={formData.itemId}
                onChange={(e) => {
                  const selectedItem = userAvailableItems.find(item => item.id === parseInt(e.target.value));
                  setFormData({
                    ...formData,
                    itemId: e.target.value,
                    assetId: selectedItem ? selectedItem.asset_id : ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select an item...</option>
                {userAvailableItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.asset_id} - {item.type} ({item.brand} {item.model})
                    {item.rcb_sticker_number && ` - RCB: ${item.rcb_sticker_number}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expected Return Date</label>
              <input
                type="date"
                value={formData.expectedReturn}
                onChange={(e) => setFormData({...formData, expectedReturn: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason for Request</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="3"
                required
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    };
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold font-secondary tracking-tight">LOAN MANAGEMENT</h2>
          {currentUser.role === 'borrower' && (
                          <button
                onClick={() => setShowRequestForm(true)}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-robinson-blue text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 font-primary font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Request Loan
              </button>
          )}
        </div>

        {/* New Search Bar */}
        <div className="mb-4 flex items-center max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              value={loansSearch}
              onChange={e => setLoansSearch(e.target.value)}
              placeholder="Search loans..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <Search className="h-5 w-5" />
            </span>
            {loansSearch && (
              <button
                type="button"
                onClick={() => setLoansSearch('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Custom Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Filter Dropdowns */}
            {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
              <div className="min-w-0 flex-1 lg:flex-none lg:w-48">
                <select
                  value={loanFilterBorrower}
                  onChange={(e) => setLoanFilterBorrower(e.target.value)}
                  className="block w-full py-3 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Borrowers</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="min-w-0 flex-1 lg:flex-none lg:w-40">
              <select
                value={loanFilterStatus}
                onChange={(e) => setLoanFilterStatus(e.target.value)}
                className="block w-full py-3 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="returned">Returned</option>
                <option value="denied">Denied</option>
              </select>
            </div>
          </div>
          {/* Search Results Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredLoans.length}</span> of <span className="font-semibold text-gray-900">{loans.length}</span> loan records
              {(loanFilterBorrower !== 'all' || loanFilterStatus !== 'all' || debouncedLoansSearch) && (
                <span> with applied filters</span>
              )}
            </p>
          </div>
        </div>

        {showRequestForm && <RequestForm />}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RCB Sticker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrower</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Return</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Returned By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Inspection</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLoans.map(loan => (
                  <tr key={loan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openLoanDetails(loan)}
                        className="text-gsu-blue hover:text-gsu-cool-blue font-semibold font-primary underline"
                      >
                        {loan.loan_number || `#${loan.id}`}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{loan.asset_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{loan.rcb_sticker_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{loan.borrower_name}</div>
                        {loan.panther_id && (
                          <div className="text-sm text-gray-500">ID: {loan.panther_id}</div>
                        )}
                        {loan.user_type && (
                          <div className="text-xs text-gray-500">{loan.user_type}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        loan.status === 'active' ? 'bg-green-100 text-green-800' :
                        loan.status === 'returned' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {loan.status}
                      </span>
                      {loan.application_type === 'staff_created' && (
                        <div className="text-xs text-purple-600 mt-1">Staff Created</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{loan.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{loan.request_date || loan.checkout_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{loan.expected_return}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{loan.approved_by_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{loan.returned_by_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {loan.status === 'returned' && loan.return_inspection ? (
                        <div className="flex items-center space-x-1">
                          <span className={`w-2 h-2 rounded-full ${
                            loan.return_inspection.return_condition === 'excellent' ? 'bg-green-500' :
                            loan.return_inspection.return_condition === 'good' ? 'bg-yellow-500' :
                            loan.return_inspection.return_condition === 'fair' ? 'bg-orange-500' :
                            loan.return_inspection.return_condition === 'poor' || loan.return_inspection.return_condition === 'damaged' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`}></span>
                          <span className="text-xs text-gray-600 capitalize font-medium">
                            {loan.return_inspection.return_condition || 'N/A'}
                          </span>
                          {loan.return_inspection.physical_damage && (
                            <span className="text-xs text-red-600 font-medium">⚠️</span>
                          )}
                        </div>
                      ) : loan.status === 'returned' ? (
                        <span className="text-xs text-gray-400">No details</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">{loan.reason}</td>
                    {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {loan.status === 'pending' && currentUser.role === 'admin' && (
                          <div className="space-x-2">
                            <button
                              onClick={() => approveLoan(loan.id)}
                              disabled={loading}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50 font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => denyLoan(loan.id)}
                              disabled={loading}
                              className="text-robinson-red hover:text-robinson-red hover:opacity-80 disabled:opacity-50 font-medium font-primary"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                        {loan.status === 'pending' && currentUser.role === 'staff' && (
                          <span className="text-gray-500 text-xs">Admin Only</span>
                        )}
                        {loan.status === 'active' && (
                          <button
                            onClick={() => {
                              setReturnLoanData(loan);
                              setShowReturnModal(true);
                            }}
                            disabled={loading}
                            className="text-robinson-blue hover:text-robinson-blue hover:opacity-80 disabled:opacity-50 font-medium font-primary"
                          >
                            Return
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ReturnConfirmationModal
          isOpen={showReturnModal}
          onClose={() => {
            setShowReturnModal(false);
            setReturnLoanData(null);
          }}
          loan={returnLoanData}
        />

        <LoanDetailsModal
          isOpen={showLoanDetailsModal}
          onClose={() => {
            setShowLoanDetailsModal(false);
            setSelectedLoan(null);
          }}
          loan={selectedLoan}
        />
      </div>
    );
  };
  
  	const generateLoanNumber = () => {
	  const currentYear = new Date().getFullYear();
	  const existingLoans = loans.filter(loan => 
		loan.loan_number && loan.loan_number.includes(currentYear.toString())
	  );
	  const nextNumber = String(existingLoans.length + 1).padStart(3, '0');
	  return `LOAN-${currentYear}-${nextNumber}`;
	};
  
  	// Create user specifically for loaner applications
	const createUserForLoanerApp = async (userData) => {
	  try {
		const newUserData = {
		  username: userData.email?.split('@')[0] || userData.panther_id,
		  password: 'TempGSU2024!', // Temporary password
		  name: userData.name,
		  email: userData.email,
		  role: 'borrower',
		  panther_id: userData.panther_id,
		  phone: userData.phone,
		  user_type: userData.user_type,
		  created_by_staff: true,
		  requires_password_reset: true,
		};
		
		console.log("📤 Sending newUserData:", newUserData);

		const response = await fetch(
		  'http://localhost:5001/api/users/create-for-loaner',
		  {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			  'Authorization': `Bearer ${localStorage.getItem('token')}`,
			},
			body: JSON.stringify(newUserData),
		  }
		);

		if (!response.ok) {
		  const error = await response.json();
		  throw new Error(error.error || 'Failed to create user');
		}

		const result = await response.json();

		// Reload users list if staff/admin
		if (currentUser?.role === 'admin' || currentUser?.role === 'staff') {
		  await loadUsers();
		}

		return result;
	  } catch (error) {
		console.error('Error creating user for loaner app:', error);
		throw error;
	  }
	};

	// Create loan request for staff (auto-approved)
	const createStaffLoanRequest = async (loanData) => {
	  try {
		const loanNumber = generateLoanNumber();
		const response = await fetch('http://localhost:5001/api/loans/staff-create', {
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${localStorage.getItem('token')}`,
		  },
		  body: JSON.stringify({
			...loanData,
			loan_number: loanNumber,
			auto_approve: true,
		  }),
		});

		if (!response.ok) {
		  const error = await response.json();
		  throw new Error(error.error || 'Failed to create loan request');
		}

		return await response.json();
	  } catch (error) {
		console.error('Failed to create staff loan request:', error);
		throw error;
	  }
	};

  const MaintenanceRecords = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [maintenanceSearch, setMaintenanceSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [inventorySearchTerm, setInventorySearchTerm] = useState('');
    const [inventorySearchResults, setInventorySearchResults] = useState([]);
    const [showInventorySearch, setShowInventorySearch] = useState(false);

    const filteredRecords = maintenanceRecords.filter(record => {
      const searchText = maintenanceSearch.toLowerCase();
      const matchesSearch = !searchText || 
        record.asset_id.toLowerCase().includes(searchText) ||
        record.issue_description.toLowerCase().includes(searchText) ||
        record.technician_name.toLowerCase().includes(searchText);
      
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Search for inventory items
    const searchInventoryItems = (searchTerm) => {
      if (!searchTerm.trim()) {
        setInventorySearchResults([]);
        return;
      }
      
      const results = items.filter(item => {
        const search = searchTerm.toLowerCase();
        return (
          item.asset_id.toLowerCase().includes(search) ||
          item.brand.toLowerCase().includes(search) ||
          item.model.toLowerCase().includes(search) ||
          item.type.toLowerCase().includes(search) ||
          (item.rcb_sticker_number && item.rcb_sticker_number.toLowerCase().includes(search))
        );
      }).slice(0, 10); // Limit to 10 results
      
      setInventorySearchResults(results);
    };

    // Create maintenance record from inventory search
    const createMaintenanceFromInventory = (item) => {
      setMaintenanceFormItem(item);
      setShowMaintenanceForm(true);
      setShowInventorySearch(false);
      setInventorySearchTerm('');
      setInventorySearchResults([]);
    };

    const addMaintenanceRecord = async (recordData) => {
      try {
        // Use the global createMaintenanceRecord function to ensure proper syncing
        await createMaintenanceRecord(recordData);
      } catch (error) {
        setError('Failed to add maintenance record: ' + error.message);
      }
    };

    const updateMaintenanceRecord = async (id, recordData) => {
      try {
        setLoading(true);
        
        // Check if status is being changed to completed
        const existingRecord = maintenanceRecords.find(record => record.id === id);
        const isCompleted = recordData.status === 'completed';
        
        // Update maintenance record
        setMaintenanceRecords(maintenanceRecords.map(record => 
          record.id === id ? { ...record, ...recordData } : record
        ));
        
        // If maintenance is completed, automatically mark item as available
        if (isCompleted && existingRecord) {
          const itemToUpdate = items.find(item => item.asset_id === existingRecord.asset_id);
          if (itemToUpdate && itemToUpdate.status === 'maintenance') {
            const updatedItemData = {
              assetId: itemToUpdate.asset_id,
              rcbStickerNumber: itemToUpdate.rcb_sticker_number,
              type: itemToUpdate.type,
              categoryId: itemToUpdate.category_id,
              brand: itemToUpdate.brand,
              model: itemToUpdate.model,
              serialNumber: itemToUpdate.serial_number,
              purchaseDate: itemToUpdate.purchase_date,
              purchasePrice: itemToUpdate.purchase_price,
              warrantyExpiry: itemToUpdate.warranty_expiry,
              condition: itemToUpdate.condition,
              locationId: itemToUpdate.location_id,
              notes: itemToUpdate.notes,
              specifications: itemToUpdate.specifications,
              partsUsed: itemToUpdate.parts_used,
              canLeaveBuilding: itemToUpdate.can_leave_building,
              status: 'available'
            };
            
            await updateItem(itemToUpdate.id, updatedItemData);
          }
        }
        
        setError('Maintenance record updated successfully' + (isCompleted ? ' - Item automatically marked as available' : ''));
      } catch (error) {
        setError('Failed to update maintenance record: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    const MaintenanceForm = ({ record, onSave, onCancel }) => {
      const [formData, setFormData] = useState(record || {
        asset_id: '',
        issue_description: '',
        technician_name: currentUser?.name || '',
        cost: '',
        status: 'pending',
        resolution_notes: '',
        parts_used: ''
      });

      const handleSubmit = async () => {
        try {
          await onSave(formData);
          onCancel();
        } catch (error) {
          // Error is already handled in parent function
        }
      };

      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
              <h3 className="text-xl font-bold text-white font-secondary">
                {record ? 'Edit Maintenance Record' : 'New Maintenance Record'}
              </h3>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">Asset ID *</label>
                  <input
                    type="text"
                    value={formData.asset_id}
                    onChange={(e) => setFormData({...formData, asset_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                    required
                    placeholder="GSU-LAP-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">Technician Name *</label>
                  <input
                    type="text"
                    value={formData.technician_name}
                    onChange={(e) => setFormData({...formData, technician_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">Issue Description *</label>
                <textarea
                  value={formData.issue_description}
                  onChange={(e) => setFormData({...formData, issue_description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                  rows="3"
                  required
                  placeholder="Describe the issue..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">Resolution Notes</label>
                <textarea
                  value={formData.resolution_notes}
                  onChange={(e) => setFormData({...formData, resolution_notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                  rows="3"
                  placeholder="Describe the solution..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">Parts Used</label>
                <input
                  type="text"
                  value={formData.parts_used}
                  onChange={(e) => setFormData({...formData, parts_used: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                  placeholder="List parts used..."
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-primary font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 font-primary font-semibold"
              >
                {loading ? 'Saving...' : (record ? 'Update Record' : 'Create Record')}
              </button>
            </div>
          </div>
        </div>
      );
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'completed': return 'bg-green-100 text-green-800';
        case 'in_progress': return 'bg-blue-100 text-blue-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gsu-light-blue to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-8 py-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-white font-secondary">
                    Maintenance Records
                  </h1>
                  <p className="text-orange-100 font-primary">
                    Track equipment maintenance and repairs
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMaintenanceFormItem(null);
                    setShowMaintenanceForm(true);
                  }}
                  className="flex items-center px-6 py-3 bg-white text-orange-600 rounded-md hover:bg-gray-50 font-primary font-semibold shadow-md"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Record
                </button>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex flex-col space-y-4">
              {/* Maintenance Records Search */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={maintenanceSearch}
                      onChange={(e) => setMaintenanceSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                      placeholder="Search maintenance records..."
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Inventory Search */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">
                  Create Maintenance Record from Inventory
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={inventorySearchTerm}
                    onChange={(e) => {
                      setInventorySearchTerm(e.target.value);
                      searchInventoryItems(e.target.value);
                      setShowInventorySearch(e.target.value.length > 0);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-primary"
                    placeholder="Search inventory by Asset ID, Brand, Model, or Type..."
                  />
                  
                  {/* Inventory Search Results */}
                  {showInventorySearch && inventorySearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {inventorySearchResults.map(item => (
                        <div
                          key={item.id}
                          onClick={() => createMaintenanceFromInventory(item)}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900 font-primary">{item.asset_id}</p>
                              <p className="text-sm text-gray-600 font-primary">
                                {item.brand} {item.model} - {item.type}
                              </p>
                              {item.rcb_sticker_number && (
                                <p className="text-xs text-blue-600 font-primary">
                                  RCB: {item.rcb_sticker_number}
                                </p>
                              )}
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              item.status === 'available' ? 'bg-green-100 text-green-800' :
                              item.status === 'loaned' ? 'bg-yellow-100 text-yellow-800' :
                              item.status === 'maintenance' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showInventorySearch && inventorySearchTerm && inventorySearchResults.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                      <div className="px-4 py-3 text-gray-500 text-center font-primary">
                        No inventory items found matching "{inventorySearchTerm}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary">Asset ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary">Issue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary">Technician</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 font-primary">{record.asset_id}</td>
                      <td className="px-6 py-4 text-gray-900 font-primary">
                        <div className="max-w-xs truncate" title={record.issue_description}>
                          {record.issue_description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-primary">{record.technician_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-primary">{record.maintenance_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-primary">
                        {record.cost ? `$${parseFloat(record.cost).toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)} font-primary`}>
                          {record.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingRecord(record)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Edit Record"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500 font-primary">
                        No maintenance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Forms */}
          {showAddForm && (
            <MaintenanceForm
              onSave={addMaintenanceRecord}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {editingRecord && (
            <MaintenanceForm
              record={editingRecord}
              onSave={(data) => updateMaintenanceRecord(editingRecord.id, data)}
              onCancel={() => setEditingRecord(null)}
            />
          )}

          {/* Maintenance Form Modal for Inventory Items */}
          <MaintenanceFormModal
            isOpen={showMaintenanceForm}
            onClose={() => {
              setShowMaintenanceForm(false);
              setMaintenanceFormItem(null);
            }}
            item={maintenanceFormItem}
          />
        </div>
      </div>
    );
  };

  const LoanerApplicationForm = () => {
	  const [showForm, setShowForm] = useState(false);
	  const [showTerms, setShowTerms] = useState(false);
	  const [termsAccepted, setTermsAccepted] = useState(false);
	  const [itemSearchTerm, setItemSearchTerm] = useState('');
	  const [userSearchTerm, setUserSearchTerm] = useState('');
	  const [searchResults, setSearchResults] = useState([]);
	  const [showSearchResults, setShowSearchResults] = useState(false);
	  const [showEmailNotification, setShowEmailNotification] = useState(false);
	  const [lastSubmittedApplication, setLastSubmittedApplication] = useState(null);

	  const [formData, setFormData] = useState({
		name: currentUser?.name || '',
		email: currentUser?.email || '',
		panther_id: currentUser?.panther_id || '',
		phone: currentUser?.phone || '',
		user_type: currentUser?.user_type || 'student',
		item_ids: [],
		loan_date: new Date().toISOString().split('T')[0],
		expected_return: new Date().toISOString().split('T')[0],
		reason: '',
		borrower_signature: ''
	  });

	  useEffect(() => {
		if (currentUser && showForm) {
		  setFormData(prevData => ({
			...prevData,
			name: currentUser.name || prevData.name,
			email: currentUser.email || prevData.email,
			panther_id: currentUser.panther_id || prevData.panther_id,
			phone: currentUser.phone || prevData.phone,
			user_type: currentUser.user_type || prevData.user_type
		  }));
		}
	  }, [currentUser, showForm]);

	  const searchUsers = async (searchTerm) => {
		if (searchTerm.length < 2) {
		  setSearchResults([]);
		  setShowSearchResults(false);
		  return;
		}
		try {
		  const filteredUsers = users.filter(user =>
			user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(user.panther_id && user.panther_id.toLowerCase().includes(searchTerm.toLowerCase()))
		  );
		  setSearchResults(filteredUsers);
		  setShowSearchResults(true);
		} catch (error) {
		  console.error('Error searching users:', error);
		}
	  };

	  const selectUser = (user) => {
		setFormData({
		  ...formData,
		  name: user.name,
		  email: user.email,
		  panther_id: user.panther_id || '',
		  phone: user.phone || '',
		  user_type: user.user_type || 'student'
		});
		setUserSearchTerm(user.name);
		setShowSearchResults(false);
	  };

	  const sendEmailNotification = async () => {
		try {
		  setLoading(true);
		  const emailContent = `
	Dear ${formData.name},

	Your equipment loan application has been submitted successfully!

	Application Details:
	- Panther ID: ${formData.panther_id}
	- Email: ${formData.email}
	- Phone: ${formData.phone}
	- User Type: ${formData.user_type}
	- Equipment Count: ${formData.item_ids.length} items
	- Expected Return: ${formData.expected_return}
	- Reason: ${formData.reason}
	- Signature: ${formData.borrower_signature}

	Your application is pending admin approval. You will be notified once approved.

	Best regards,
	GSU Tech Support Team
		  `;
		  console.log('Email notification sent:', emailContent);
		  setError('Email notification sent successfully to ' + formData.email);
		  setShowEmailNotification(false);
		} catch (error) {
		  setError('Failed to send email notification: ' + error.message);
		} finally {
		  setLoading(false);
		}
	  };

	  const filteredAvailableItems = availableItems.filter(item => {
		const searchText = itemSearchTerm.toLowerCase();
		return (
		  item.asset_id.toLowerCase().includes(searchText) ||
		  item.type.toLowerCase().includes(searchText) ||
		  item.brand.toLowerCase().includes(searchText) ||
		  item.model.toLowerCase().includes(searchText) ||
		  (item.rcb_sticker_number && item.rcb_sticker_number.toLowerCase().includes(searchText))
		);
	  });

	  const handleItemSelection = (itemId, selected) => {
		if (selected) {
		  setFormData({
			...formData,
			item_ids: [...formData.item_ids, parseInt(itemId)]
		  });
		} else {
		  setFormData({
			...formData,
			item_ids: formData.item_ids.filter(id => id !== parseInt(itemId))
		  });
		}
	  };

	  const TermsAndConditions = () => (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		  <div className="bg-white rounded-lg max-w-5xl max-h-96 overflow-hidden flex flex-col">
			<div className="bg-gsu-blue px-8 py-6 flex items-center justify-between">
			  <div>
				<h2 className="text-xl font-bold text-white font-secondary">Georgia State University - Loaner Program</h2>
				<p className="text-gsu-light-blue font-primary">Equipment Loan Terms & Conditions</p>
			  </div>
			  <button onClick={() => setShowTerms(false)} className="text-white hover:text-gsu-light-blue">
				<X className="h-6 w-6" />
			  </button>
			</div>
			<div className="flex-1 overflow-y-auto px-8 py-6 text-sm font-primary space-y-6">
			  <div className="text-center border-b border-gray-200 pb-4">
				<p className="font-semibold text-gsu-blue">
				  By proceeding with this application, you agree to the following terms and conditions regarding the temporary loan of equipment:
				</p>
			  </div>
			  {/* Example Sections */}
			  <div>
				<h4 className="font-semibold text-gsu-blue mb-2">1. Loan Eligibility</h4>
				<ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
				  <li>Equipment is available only to authorized GSU students, faculty, or staff with valid identification.</li>
				  <li>Equipment must be checked out in person from the designated Tech Support location.</li>
				</ul>
			  </div>
			  <div>
				<h4 className="font-semibold text-gsu-blue mb-2">2. Equipment Responsibility</h4>
				<ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
				  <li>You are fully responsible for the care and condition of the equipment during the loan period.</li>
				  <li>Any damage, loss, or theft must be reported immediately.</li>
				</ul>
			  </div>
			</div>
			<div className="bg-gray-50 px-8 py-4 border-t flex justify-end space-x-3">
			  <button onClick={() => setShowTerms(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-primary font-medium">Cancel</button>
			  <button onClick={() => { setTermsAccepted(true); setShowTerms(false); }} className="px-6 py-2 bg-gsu-blue text-white rounded-md hover:bg-opacity-90 font-primary font-medium">Accept Terms</button>
			</div>
		  </div>
		</div>
	  );

	  const handleSubmit = async (e) => {
		e.preventDefault();

		if (!termsAccepted) {
		  setError('You must accept the terms and conditions before proceeding');
		  return;
		}

		if (!formData.name || !formData.email || !formData.panther_id || !formData.phone ||
			!formData.user_type || formData.item_ids.length === 0 || !formData.loan_date ||
			!formData.expected_return || !formData.reason || !formData.borrower_signature) {
		  setError('Please fill in all required fields including your signature');
		  return;
		}

		try {
		  setLoading(true);
		  let createdUserId = null;
		  const existingUser = users.find(user =>
			user.email.toLowerCase() === formData.email.toLowerCase() || user.panther_id === formData.panther_id
		  );

		if (!existingUser) {
		  const userPayload = {
			username: formData.email,
			password: formData.password,
			name: formData.name,
			email: formData.email,
			panther_id: formData.panther_id,
			phone: formData.phone,
			user_type: formData.user_type,
			role: "borrower"
		  };
		  console.log("📥 Loaner userPayload:", userPayload);
		  const userResult = await createUserForLoanerApp(userPayload);
		  createdUserId = userResult.id;
		} else {
		  createdUserId = existingUser.id;
		}

		  const successfulLoans = [];
		  const failedLoans = [];

		  for (const itemId of formData.item_ids) {
			try {
			  const loanData = { item_id: itemId, borrower_id: createdUserId, ...formData, application_type: 'staff_created' };
			  await createStaffLoanRequest(loanData);
			  successfulLoans.push(itemId);
			} catch (loanError) {
			  console.error(`Failed to create loan for item ${itemId}:`, loanError);
			  failedLoans.push(itemId);
			}
		  }

		  setLastSubmittedApplication({
			...formData,
			successfulLoans: successfulLoans.length,
			failedLoans: failedLoans.length,
			createdNewUser: !existingUser
		  });

		  await loadItems();
		  await loadAvailableItems();
		  await loadLoans();
		  await loadDashboardStats();
		  if (currentUser?.role === 'admin') await loadUsers();

		  setShowForm(false);
		  setShowEmailNotification(true);

		  // Reset form
		  setFormData({
			name: '',
			email: '',
			panther_id: '',
			phone: '',
			user_type: 'student',
			item_ids: [],
			loan_date: new Date().toISOString().split('T')[0],
			expected_return: new Date().toISOString().split('T')[0],
			reason: '',
			borrower_signature: ''
		  });
		  setTermsAccepted(false);
		  setItemSearchTerm('');
		  setUserSearchTerm('');
		  setShowSearchResults(false);

		  setError(successfulLoans.length > 0
			? `Successfully created and APPROVED ${successfulLoans.length} loan application(s)${failedLoans.length > 0 ? ` (${failedLoans.length} failed)` : ''}!`
			: 'Failed to create any loan applications. Please try again.'
		  );
		} catch (error) {
		  console.error('Failed to create loaner application:', error);
		  setError('Failed to create loaner application: ' + error.message);
		} finally {
		  setLoading(false);
		}
	  };
	  
	if (!showForm) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gsu-light-blue to-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-gsu-blue to-gsu-cool-blue px-8 py-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-white font-secondary mb-2">
                      GSU Equipment Loaner Program
                    </h1>
                    <p className="text-gsu-light-blue font-primary">
                      Request equipment for academic and professional use
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm(true)}
                    disabled={loading}
                    className="flex items-center px-6 py-3 bg-white text-gsu-blue rounded-md hover:bg-gray-50 disabled:opacity-50 font-primary font-semibold shadow-md"
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    New Application
                  </button>
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6 text-gsu-blue font-secondary">Getting Started</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 font-secondary">📋 Application Process</h3>
                  <ol className="space-y-2 text-sm text-blue-700 font-primary">
                    <li>1. Search for existing users or add new</li>
                    <li>2. Select required equipment</li>
                    <li>3. Set loan dates and provide purpose</li>
                    <li>4. Accept terms and add digital signature</li>
                  </ol>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 font-secondary">Email Guidelines</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-primary">
                  <div>
                    <h4 className="font-semibold text-gsu-blue mb-2">Students</h4>
                    <div className="space-y-1 text-gray-700">
                      <div>Email: @student.gsu.edu</div>
                      <div>Panther ID: 002XXXXXX format</div>
                      <div>Valid GSU student status required</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gsu-blue mb-2">Faculty & Staff</h4>
                    <div className="space-y-1 text-gray-700">
                      <div>Email: @gsu.edu</div>
                      <div>Any valid GSU Panther ID</div>
                      <div>Current employment verification</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gsu-light-blue to-gray-100">
        {showTerms && <TermsAndConditions />}
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-gsu-blue to-gsu-cool-blue px-8 py-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-white font-secondary">
                    New Equipment Loan Application
                  </h1>
                  <p className="text-gsu-light-blue font-primary">
                    Complete all sections below to process the loan request
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-md hover:bg-opacity-30 font-primary font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. User Information Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gsu-blue to-gsu-cool-blue px-6 py-4">
                <h2 className="text-xl font-semibold text-white font-secondary flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  User Information
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* User Search Bar */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Search Existing User</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gsu-blue focus:border-gsu-blue font-primary"
                      placeholder="Search by name, email, or Panther ID..."
                    />
                  </div>
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map(user => (
                        <div
                          key={user.id}
                          onClick={() => selectUser(user)}
                          className="px-4 py-3 hover:bg-gsu-light-blue hover:bg-opacity-20 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900 font-primary">{user.name}</div>
                          <div className="text-sm text-gray-600 font-primary">{user.email}</div>
                          {user.panther_id && (
                            <div className="text-xs text-gray-500 font-primary">Panther ID: {user.panther_id}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showSearchResults && searchResults.length === 0 && userSearchTerm.length >= 2 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-md shadow-lg">
                      <div className="px-4 py-3 text-gray-500 font-primary">
                        No users found. Fill in the details below to create a new user.
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gsu-blue focus:border-gsu-blue font-primary"
                      required
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gsu-blue focus:border-gsu-blue font-primary"
                      required
                      placeholder="@student.gsu.edu or @gsu.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Panther ID *</label>
                    <input
                      type="text"
                      value={formData.panther_id}
                      onChange={(e) => setFormData({...formData, panther_id: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gsu-blue focus:border-gsu-blue font-primary"
                      required
                      placeholder="002XXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gsu-blue focus:border-gsu-blue font-primary"
                      required
                      placeholder="(xxx) xxx-xxxx"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">User Type *</label>
                    <select
                      value={formData.user_type}
                      onChange={(e) => setFormData({...formData, user_type: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gsu-blue focus:border-gsu-blue font-primary"
                      required
                    >
                      <option value="student">Student</option>
                      <option value="GSU Team">GSU Team Member</option>
                      <option value="faculty">Faculty</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Equipment Selection Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white font-secondary flex items-center">
                  <Laptop className="h-5 w-5 mr-2" />
                  Equipment Selection
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Search Available Equipment</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={itemSearchTerm}
                      onChange={(e) => setItemSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-primary"
                      placeholder="Search by Asset ID, RCB Sticker, Type, Brand, or Model..."
                    />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary">Select</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary">Asset ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary">RCB Sticker</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary">Brand/Model</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-primary">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredAvailableItems.map(item => (
                          <tr key={item.id} className="hover:bg-green-50">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={formData.item_ids.includes(item.id)}
                                onChange={(e) => handleItemSelection(item.id, e.target.checked)}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium font-primary">{item.asset_id}</td>
                            <td className="px-4 py-3 text-gsu-blue font-primary">{item.rcb_sticker_number || '-'}</td>
                            <td className="px-4 py-3 font-primary">{item.type}</td>
                            <td className="px-4 py-3 font-primary">{item.brand} {item.model}</td>
                            <td className="px-4 py-3 font-primary">{item.location_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredAvailableItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500 font-primary">
                      No available equipment matches your search
                    </div>
                  )}
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-sm text-green-700 font-primary">
                    <strong>Selected items: {formData.item_ids.length}</strong>
                    {formData.item_ids.length > 0 && ' - Ready for checkout once approved'}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Loan Details Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white font-secondary flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Loan Details
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Loan Date *</label>
                    <input
                      type="date"
                      value={formData.loan_date}
                      onChange={(e) => setFormData({...formData, loan_date: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Expected Return Date *</label>
                    <input
                      type="date"
                      value={formData.expected_return}
                      onChange={(e) => setFormData({...formData, expected_return: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-primary"
                      required
                      min={formData.loan_date}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Reason for Loan Request *</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-primary"
                    rows="4"
                    required
                    placeholder="Please describe the purpose for borrowing this equipment..."
                  />
                </div>
              </div>
            </div>

            {/* 4. Signature Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white font-secondary flex items-center">
                  <Edit className="h-5 w-5 mr-2" />
                  Digital Signature
                </h2>
              </div>
              
              <div className="p-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-primary">Borrower Signature *</label>
                    <input
                      type="text"
                      value={formData.borrower_signature}
                      onChange={(e) => setFormData({...formData, borrower_signature: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-primary"
                      required
                      placeholder="Type your full name as digital signature"
                    />
                  </div>
                  <p className="text-sm text-orange-700 font-primary">
                    By typing your name above, you are providing a legally binding digital signature and acknowledge that you agree to all terms and conditions.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Terms and Conditions Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gsu-red to-red-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white font-secondary flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Terms and Conditions
                </h2>
              </div>
              
              <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <input
                      type="checkbox"
                      id="termsAccepted"
                      checked={termsAccepted}
                      onChange={(e) => {
                        // Prevent direct checking - must go through modal
                        e.preventDefault();
                        setShowTerms(true);
                      }}
                      className="h-5 w-5 text-gsu-blue focus:ring-gsu-blue border-gray-300 rounded cursor-pointer mt-0.5"
                      required
                    />
                    <label htmlFor="termsAccepted" className="text-sm font-medium text-yellow-800 cursor-pointer font-primary">
                      I have read and accept the terms and conditions for equipment loan from Georgia State University
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-gsu-blue hover:text-gsu-cool-blue text-sm underline font-primary font-medium"
                  >
                    📖 Read Full Terms and Conditions
                  </button>
                </div>
              </div>
            </div>

            {/* 6. Submit Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 font-secondary">Ready to Submit?</h3>
                    <p className="text-sm text-gray-600 font-primary">
                      This will create and automatically approve individual loan requests for each selected item.
                      Equipment will be ready for immediate checkout.
                      {!users.find(user => user.email.toLowerCase() === formData.email.toLowerCase()) && formData.email && (
                        <span className="text-gsu-blue font-medium"> A new user account will be created automatically.</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-primary font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !termsAccepted || formData.item_ids.length === 0 || !formData.borrower_signature}
                      className="px-6 py-3 bg-gsu-blue text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-primary font-semibold shadow-md"
                    >
                      {loading ? 'Creating Application...' : `Create Loan Application (${formData.item_ids.length} items)`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  const Reports = () => {
    const generateReport = (type) => {
      let data = [];
      let filename = '';

      switch (type) {
        case 'inventory':
          data = items.map(item => ({
            'Asset ID': item.asset_id,
            'RCB Sticker': item.rcb_sticker_number || '',
            'Type': item.type,
            'Brand': item.brand,
            'Model': item.model,
            'Serial Number': item.serial_number,
            'Status': item.status,
            'Condition': item.condition,
            'Location': item.location_name,
            'Purchase Price': item.purchase_price || 'N/A',
            'Purchase Date': item.purchase_date || 'N/A',
            'Warranty Expiry': item.warranty_expiry || 'N/A',
            'Specifications': item.specifications || 'N/A',
            'Parts Used': item.parts_used || 'N/A',
            'Can Leave Building': item.can_leave_building ? 'Yes' : 'No',
            'Notes': item.notes || 'N/A'
          }));
          filename = 'gsu_inventory_report.csv';
          break;
        case 'loans':
          data = loans.map(loan => ({
            'Asset ID': loan.asset_id,
            'RCB Sticker': loan.rcb_sticker_number || '',
            'Borrower': loan.borrower_name,
            'Panther ID': loan.panther_id || '',
            'User Type': loan.user_type || '',
            'Status': loan.status,
            'Application Type': loan.application_type,
            'Request Date': loan.request_date || loan.checkout_date,
            'Approved Date': loan.approved_date || 'N/A',
            'Expected Return': loan.expected_return,
            'Actual Return': loan.actual_return || 'N/A',
            'Approved By': loan.approved_by_name || 'N/A',
            'Returned By': loan.returned_by_name || 'N/A',
            'Reason': loan.reason,
            'Return Condition': loan.return_condition || 'N/A',
            'Return Notes': loan.return_notes || 'N/A'
          }));
          filename = 'gsu_loans_report.csv';
          break;
        case 'overdue':
          const overdueLoans = loans.filter(loan => {
            if (loan.status !== 'active') return false;
            const today = new Date();
            const returnDate = new Date(loan.expected_return);
            return today > returnDate;
          });
          data = overdueLoans.map(loan => ({
            'Asset ID': loan.asset_id,
            'RCB Sticker': loan.rcb_sticker_number || '',
            'Borrower': loan.borrower_name,
            'Panther ID': loan.panther_id || '',
            'Checkout Date': loan.checkout_date,
            'Expected Return': loan.expected_return,
            'Days Overdue': Math.floor((new Date() - new Date(loan.expected_return)) / (1000 * 60 * 60 * 24)),
            'Approved By': loan.approved_by_name || 'N/A',
            'Reason': loan.reason
          }));
          filename = 'gsu_overdue_report.csv';
          break;
        case 'maintenance':
          data = maintenanceRecords.map(record => ({
            'Asset ID': record.asset_id,
            'Issue Description': record.issue_description,
            'Technician': record.technician_name,
            'Date': record.maintenance_date,
            'Status': record.status,
            'Cost': record.cost ? `$${parseFloat(record.cost).toFixed(2)}` : '$0.00',
            'Parts Used': record.parts_used || 'N/A',
            'Resolution Notes': record.resolution_notes || 'N/A'
          }));
          filename = 'gsu_maintenance_report.csv';
          break;
        default:
          return;
      }

      // Convert to CSV format
      if (data.length > 0) {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).map(value => 
          `"${String(value).replace(/"/g, '""')}"`
        ).join(','));
        const csv = [headers, ...rows].join('\n');
        
        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    };

    const overdueCount = loans.filter(loan => {
      if (loan.status !== 'active') return false;
      const today = new Date();
      const returnDate = new Date(loan.expected_return);
      return today > returnDate;
    }).length;

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold font-secondary tracking-tight">REPORTS</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-4 font-primary">Inventory Report</h3>
            <p className="text-gray-600 mb-6 flex-grow font-primary">Complete list of all inventory items with current status and GSU details.</p>
            <button
              onClick={() => generateReport('inventory')}
              className="flex items-center px-4 py-2 bg-robinson-blue text-white rounded-md hover:bg-opacity-90 font-primary"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-4 font-primary">Loans Report</h3>
            <p className="text-gray-600 mb-6 flex-grow font-primary">All loan transactions including pending, active, and returned items with Panther IDs.</p>
            <button
              onClick={() => generateReport('loans')}
              className="flex items-center px-4 py-2 bg-robinson-blue text-white rounded-md hover:bg-opacity-90 font-primary"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-4 font-primary">Overdue Items Report</h3>
            <p className="text-gray-600 mb-4 flex-grow font-primary">Items past their expected return date with staff details and GSU information.</p>
            <div className="flex items-center justify-between mb-4 p-3 bg-red-50 rounded-md">
              <span className="text-2xl font-bold text-red-600 font-primary">{overdueCount}</span>
              <span className="text-sm text-gray-500 font-primary">overdue items</span>
            </div>
            <button
              onClick={() => generateReport('overdue')}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-primary"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-4 font-primary">Maintenance Report</h3>
            <p className="text-gray-600 mb-4 flex-grow font-primary">Complete maintenance history with costs, technicians, and repair details.</p>
            <div className="flex items-center justify-between mb-4 p-3 bg-orange-50 rounded-md">
              <span className="text-2xl font-bold text-orange-600 font-primary">{maintenanceRecords.length}</span>
              <span className="text-sm text-gray-500 font-primary">maintenance records</span>
            </div>
            <button
              onClick={() => generateReport('maintenance')}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-primary"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 font-primary">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-robinson-blue font-primary">{dashboardStats.totalItems || 0}</p>
              <p className="text-sm text-gray-600 font-primary">Total Items</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 font-primary">{dashboardStats.availableItems || 0}</p>
              <p className="text-sm text-gray-600 font-primary">Available</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gsu-vibrant-blue font-primary">{dashboardStats.activeLoans || 0}</p>
              <p className="text-sm text-gray-600 font-primary">Active Loans</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gsu-red font-primary">{dashboardStats.pendingLoans || 0}</p>
              <p className="text-sm text-gray-600 font-primary">Pending Requests</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600 font-primary">{maintenanceRecords.length}</p>
              <p className="text-sm text-gray-600 font-primary">Maintenance Records</p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // User Management Component
  const UserManagement = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState(null);

    // Debounce user search
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedUserSearch(userSearch);
      }, 300);
      return () => clearTimeout(handler);
    }, [userSearch]);

    // Filter users by search
    const filteredUsers = users.filter(user => {
      const searchText = debouncedUserSearch.trim().toLowerCase();
      if (!searchText) return true;
      const fields = [
        user.username,
        user.name,
        user.email,
        user.panther_id,
        user.user_type,
        user.role
      ];
      return fields.some(field => field && field.toString().toLowerCase().includes(searchText));
    });

    // Edit user handlers
    const handleEditUser = (user) => {
      setEditingUser(user);
      setEditFormData({ ...user });
    };
    const handleEditChange = (e) => {
      const { name, value, type, checked } = e.target;
      setEditFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    };
    const handleEditSave = async () => {
      try {
        setLoading(true);
        // Prepare update payload
        const updateData = {
          name: editFormData.name,
          email: editFormData.email,
          role: editFormData.role,
          phone: editFormData.phone,
          user_type: editFormData.user_type,
          panther_id: editFormData.panther_id,
          active: editFormData.active ? 1 : 0
        };
        await ApiService.updateUser(editFormData.id, updateData);
        await loadUsers();
        setEditingUser(null);
        setEditFormData(null);
      } catch (error) {
        setError('Failed to update user: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    const handleEditCancel = () => {
      setEditingUser(null);
      setEditFormData(null);
    };

    const UserForm = () => {
      const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        email: '',
        role: 'borrower',
        panther_id: '',
        phone: '',
        user_type: 'student'
      });

      const handleSubmit = async () => {
        try {
          await addUser(formData);
          setShowAddForm(false);
          setFormData({ 
            username: '', password: '', name: '', email: '', role: 'borrower',
            panther_id: '', phone: '', user_type: 'student'
          });
        } catch (error) {
          // Error is already handled in addUser
        }
      };

      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Add New GSU User</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 font-body">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 font-body">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Panther ID</label>
                <input
                  type="text"
                  value={formData.panther_id}
                  onChange={(e) => setFormData({...formData, panther_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="borrower">Borrower</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">User Type</label>
                <select
                  value={formData.user_type}
                  onChange={(e) => setFormData({...formData, user_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="student">Student</option>
                  <option value="GSU Team">GSU Team</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add User'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    };

    const handleDeleteUser = async (userId, userName) => {
      if (window.confirm(`Are you sure you want to deactivate user "${userName}"? This will prevent them from logging in but preserve all historical data.`)) {
        await deleteUser(userId);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold font-headlines tracking-tight">USER MANAGEMENT</h2>
                      <button
              onClick={() => setShowAddForm(true)}
              disabled={loading}
                              className="flex items-center px-4 py-2 bg-gsu-blue text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 font-primary font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </button>
        </div>

        {/* User Search Bar */}
        <div className="mb-4 flex items-center max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <Search className="h-5 w-5" />
            </span>
            {userSearch && (
              <button
                type="button"
                onClick={() => setUserSearch('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {showAddForm && <UserForm />}

        {/* Edit User Modal */}
        {editingUser && editFormData && (
          <Modal isOpen={true} onClose={handleEditCancel} title={`Edit User: ${editingUser.username}`}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Panther ID</label>
                  <input
                    type="text"
                    name="panther_id"
                    value={editFormData.panther_id || ''}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone || ''}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    name="role"
                    value={editFormData.role}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="borrower">Borrower</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">User Type</label>
                  <select
                    name="user_type"
                    value={editFormData.user_type}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="student">Student</option>
                    <option value="GSU Team">GSU Team</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    name="active"
                    checked={!!editFormData.active}
                    onChange={handleEditChange}
                    id="activeCheckbox"
                  />
                  <label htmlFor="activeCheckbox" className="text-sm font-medium">Active</label>
                </div>
              </div>
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={handleEditSave}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Panther ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Loans</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => {
                  const userActiveLoans = loans.filter(loan => loan.borrower_id === user.id && loan.status === 'active').length;
                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.panther_id || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.user_type === 'student' ? 'bg-purple-100 text-purple-800' :
                          user.user_type === 'GSU Team' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.user_type || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{userActiveLoans}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-900 mr-3 disabled:opacity-50"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {user.active && user.id !== currentUser.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
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
    ];

    if (currentUser.role === 'admin' || currentUser.role === 'staff') {
      tabs.splice(3, 0, { id: 'loaner-applications', label: 'Loaner Apps', icon: Laptop });
      tabs.splice(4, 0, { id: 'maintenance', label: 'Maintenance', icon: Wrench });
      tabs.splice(5, 0, { id: 'reports', label: 'Reports', icon: FileText });
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
                src="public/gsu-logo.jpg" 
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
