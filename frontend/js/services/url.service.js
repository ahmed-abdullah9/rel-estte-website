const urlService = {
  async shorten(url, customCode = null) {
    const payload = { url };
    if (customCode) payload.customCode = customCode;
    return await api.post('/urls/shorten', payload);
  },

  async getStats(shortCode) {
    return await api.get(`/urls/stats/${shortCode}`);
  },

  async getUserUrls(page = 1, limit = 10) {
    return await api.get(`/urls/my-urls?page=${page}&limit=${limit}`);
  }
};