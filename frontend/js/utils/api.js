class APIClient {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        let error;
        if (contentType && contentType.includes('application/json')) {
          error = await response.json();
        } else {
          error = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(error.message || 'Request failed');
      }
      
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return { data: await response.text() };
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

const api = new APIClient();