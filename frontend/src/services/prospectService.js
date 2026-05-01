import apiClient from './apiClient';

// Mock database to fallback on if backend is not available
let mockProspects = [
  {
    id: 1,
    fullName: 'John Doe',
    phone: '9876543210',
    email: 'john@example.com',
    company: 'Acme Corp',
    city: 'Mumbai',
    source: 'Website',
    status: 'Contacted',
    dealValue: '50000',
    priority: 'High',
    followUpDate: '2023-10-28',
    followUpTime: '14:00',
    reminder: true,
    notes: 'Initial requirements discussed.',
    assignedTo: 'Current User',
    activityHistory: [
      { id: 1, type: 'call', title: 'Initial Call', desc: 'Discussed requirements.', date: 'Oct 24, 10:30 AM', icon: null },
    ],
    lastContactDate: '2023-10-24'
  },
  {
    id: 2,
    fullName: 'Jane Smith',
    phone: '9876543211',
    email: 'jane@example.com',
    company: 'Globex Inc',
    city: 'Delhi',
    source: 'Facebook',
    status: 'Untouched',
    dealValue: '120000',
    priority: 'Medium',
    followUpDate: '2023-11-02',
    followUpTime: '10:00',
    reminder: false,
    notes: 'Needs to be contacted ASAP.',
    assignedTo: 'Current User',
    activityHistory: [],
    lastContactDate: null
  },
  {
    id: 3,
    fullName: 'Rahul Sharma',
    phone: '9876543212',
    email: 'rahul@example.com',
    company: 'Tech Solutions',
    city: 'Bangalore',
    source: 'LinkedIn',
    status: 'Qualified',
    dealValue: '250000',
    priority: 'High',
    followUpDate: '2023-11-05',
    followUpTime: '11:30',
    reminder: true,
    notes: 'Requested a proposal.',
    assignedTo: 'Current User',
    activityHistory: [],
    lastContactDate: '2023-10-30'
  },
  {
    id: 4,
    fullName: 'Priya Patel',
    phone: '9876543213',
    email: 'priya@example.com',
    company: 'Innovate LLC',
    city: 'Ahmedabad',
    source: 'Referral',
    status: 'Contacted',
    dealValue: '80000',
    priority: 'Low',
    followUpDate: '2023-11-10',
    followUpTime: '15:00',
    reminder: true,
    notes: 'Follow up next week.',
    assignedTo: 'Current User',
    activityHistory: [],
    lastContactDate: '2023-10-28'
  },
  {
    id: 5,
    fullName: 'Amit Kumar',
    phone: '9876543214',
    email: 'amit@example.com',
    company: 'Future Tech',
    city: 'Hyderabad',
    source: 'Website',
    status: 'Lost',
    dealValue: '45000',
    priority: 'Low',
    followUpDate: '',
    followUpTime: '',
    reminder: false,
    notes: 'Not interested at the moment.',
    assignedTo: 'Current User',
    activityHistory: [],
    lastContactDate: '2023-10-15'
  },
  {
    id: 6,
    fullName: 'Sneha Gupta',
    phone: '9876543215',
    email: 'sneha@example.com',
    company: 'Design Studio',
    city: 'Pune',
    source: 'Other',
    status: 'Won',
    dealValue: '300000',
    priority: 'High',
    followUpDate: '',
    followUpTime: '',
    reminder: false,
    notes: 'Contract signed.',
    assignedTo: 'Current User',
    activityHistory: [],
    lastContactDate: '2023-10-31'
  },
  {
    id: 7,
    fullName: 'Vikram Singh',
    phone: '9876543216',
    email: 'vikram@example.com',
    company: 'Global Trade',
    city: 'Chennai',
    source: 'Facebook',
    status: 'Untouched',
    dealValue: '60000',
    priority: 'Medium',
    followUpDate: '2023-11-01',
    followUpTime: '09:00',
    reminder: true,
    notes: 'New lead from ad campaign.',
    assignedTo: 'Current User',
    activityHistory: [],
    lastContactDate: null
  },
  {
    id: 8,
    fullName: 'Neha Reddy',
    phone: '9876543217',
    email: 'neha@example.com',
    company: 'Health Plus',
    city: 'Kolkata',
    source: 'LinkedIn',
    status: 'Contacted',
    dealValue: '150000',
    priority: 'High',
    followUpDate: '2023-11-04',
    followUpTime: '16:00',
    reminder: true,
    notes: 'Very positive response.',
    assignedTo: 'Current User',
    activityHistory: [],
    lastContactDate: '2023-10-29'
  }
];

export const prospectService = {
  getProspects: async (params = {}) => {
    try {
      const response = await apiClient.get('/prospects', { params });
      return response.data;
    } catch (error) {
      console.warn('API /prospects failed. Falling back to mock data.', error);
      // Simulate network delay
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockProspects), 800);
      });
    }
  },

  getProspect: async (id) => {
    try {
      const response = await apiClient.get(`/prospects/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`API /prospects/${id} failed. Falling back to mock data.`, error);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const prospect = mockProspects.find(p => String(p.id) === String(id));
          if (prospect) resolve(prospect);
          else reject({ message: 'Prospect not found' });
        }, 800);
      });
    }
  },

  createProspect: async (data) => {
    try {
      const response = await apiClient.post('/prospects', data);
      return response.data;
    } catch (error) {
      console.warn('API POST /prospects failed. Falling back to mock data.', error);
      return new Promise((resolve) => {
        setTimeout(() => {
          const newProspect = {
            id: Date.now(),
            ...data,
            activityHistory: [],
            lastContactDate: new Date().toISOString().split('T')[0]
          };
          mockProspects.unshift(newProspect);
          resolve(newProspect);
        }, 1000);
      });
    }
  },

  updateProspect: async (id, data) => {
    try {
      const response = await apiClient.put(`/prospects/${id}`, data);
      return response.data;
    } catch (error) {
      console.warn(`API PUT /prospects/${id} failed. Falling back to mock data.`, error);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const index = mockProspects.findIndex(p => String(p.id) === String(id));
          if (index !== -1) {
            mockProspects[index] = { ...mockProspects[index], ...data };
            resolve(mockProspects[index]);
          } else {
            reject({ message: 'Prospect not found' });
          }
        }, 1000);
      });
    }
  },

  deleteProspect: async (id) => {
    try {
      const response = await apiClient.delete(`/prospects/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`API DELETE /prospects/${id} failed. Falling back to mock data.`, error);
      return new Promise((resolve) => {
        setTimeout(() => {
          mockProspects = mockProspects.filter(p => String(p.id) !== String(id));
          resolve({ success: true });
        }, 800);
      });
    }
  }
};
