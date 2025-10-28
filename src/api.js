const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }
  async getUsers() {
    return this.request('/users');
  }

  async getUserProfile() {
    return this.request('/users/profile');
  }
    async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }
  async getItems(params = {}) {
    const queryString = new URLSearchParams();
    
    if (params.status && params.status !== 'all') {
      queryString.append('status', params.status);
    }
    if (params.type && params.type !== 'all') {
      queryString.append('type', params.type);
    }
    if (params.search) {
      queryString.append('search', params.search);
    }

    const endpoint = queryString.toString() ? `/items?${queryString}` : '/items';
    return this.request(endpoint);
  }

  async getItem(id) {
    return this.request(`/items/${id}`);
  }
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getOverdueLoans() {
    return this.request('/reports/overdue');
  }
  async getCategories() {
    return this.request('/categories');
  }

  async getLocations() {
    return this.request('/locations');
  }
  async getLoans(params = {}) {
    const queryString = new URLSearchParams();
    
    if (params.borrower && params.borrower !== 'all') {
      queryString.append('borrower', params.borrower);
    }
    if (params.status && params.status !== 'all') {
      queryString.append('status', params.status);
    }
    if (params.search) {
      queryString.append('search', params.search);
    }

    const endpoint = queryString.toString() ? `/loans?${queryString}` : '/loans';
    return this.request(endpoint);
  }

  async createLoanRequest(loanData) {
    return this.request('/loans', {
      method: 'POST',
      body: JSON.stringify(loanData),
    });
  }

  async approveLoan(id) {
    return this.request(`/loans/${id}/approve`, {
      method: 'POST',
    });
  }

  async denyLoan(id) {
    return this.request(`/loans/${id}/deny`, {
      method: 'POST',
    });
  }
}
const apiService = new ApiService();
export default apiService;