const API_BASE = '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('email_system_token') || null;
    this.user = JSON.parse(localStorage.getItem('email_system_user') || 'null');
  }

  setSession(token, user) {
    this.token = token;
    this.user = user;
    if (token) {
      localStorage.setItem('email_system_token', token);
      localStorage.setItem('email_system_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('email_system_token');
      localStorage.removeItem('email_system_user');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errorMsg = data?.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.code = data?.errorCode;
      err.details = data?.errors;
      throw err;
    }

    return data;
  }

  // --- Auth & Persona Switching ---
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    this.setSession(res.data.token, res.data.admin);
    return res.data;
  }

  async getMe() {
    if (!this.token) return null;
    const res = await this.request('/auth/me');
    this.user = res.data;
    localStorage.setItem('email_system_user', JSON.stringify(res.data));
    return res.data;
  }

  logout() {
    this.setSession(null, null);
  }

  // Quick switch persona helper (signs up / logs in as test super_admin or admin)
  async switchPersona(role = 'super_admin') {
    const email = role === 'super_admin' ? 'superadmin@example.com' : 'admin1@company.com';
    const password = 'Password@123';

    try {
      return await this.login(email, password);
    } catch (err) {
      // If admin doesn't exist yet, sign up
      if (role === 'admin') {
        try {
          await this.request('/auth/signup', {
            method: 'POST',
            body: {
              email,
              password,
              fullName: 'Enterprise Admin',
              organization: 'Acme Corp'
            }
          });
          return await this.login(email, password);
        } catch {
          throw err;
        }
      }
      throw err;
    }
  }

  // --- Templates & Drag-and-Drop Editing ---
  async listTemplates() {
    const res = await this.request('/templates');
    return res.data;
  }

  async getTemplate(idOrSlug) {
    const res = await this.request(`/templates/${idOrSlug}`);
    return res.data;
  }

  async createDefaultTemplate(templateData) {
    const res = await this.request('/templates', {
      method: 'POST',
      body: templateData
    });
    return res.data;
  }

  async updateDefaultTemplate(idOrSlug, templateData) {
    const res = await this.request(`/templates/${idOrSlug}`, {
      method: 'PUT',
      body: templateData
    });
    return res.data;
  }

  async deleteDefaultTemplate(idOrSlug) {
    const res = await this.request(`/templates/${idOrSlug}`, {
      method: 'DELETE'
    });
    return res.data;
  }

  // Admin Customization
  async saveAdminCustomization(idOrSlug, customizationData) {
    const res = await this.request(`/templates/${idOrSlug}/customize`, {
      method: 'POST',
      body: customizationData
    });
    return res.data;
  }

  async toggleCustomization(idOrSlug, isActive) {
    const res = await this.request(`/templates/${idOrSlug}/toggle`, {
      method: 'PATCH',
      body: { isActive }
    });
    return res.data;
  }

  async discardCustomization(idOrSlug) {
    const res = await this.request(`/templates/${idOrSlug}/customize`, {
      method: 'DELETE'
    });
    return res.data;
  }

  async previewTemplate(idOrSlug, variables = {}) {
    const res = await this.request(`/templates/${idOrSlug}/preview`, {
      method: 'POST',
      body: { variables }
    });
    return res.data;
  }

  // --- SMTP Settings ---
  async getSmtpSettings() {
    const res = await this.request('/admin/smtp');
    return res.data;
  }

  async saveSmtpSettings(settings) {
    const res = await this.request('/admin/smtp', {
      method: 'POST',
      body: settings
    });
    return res.data;
  }

  async verifySmtpSettings(settings) {
    const res = await this.request('/admin/smtp/verify', {
      method: 'POST',
      body: settings
    });
    return res.data;
  }

  async toggleSmtp(isActive) {
    const res = await this.request('/admin/smtp/toggle', {
      method: 'PATCH',
      body: { isActive }
    });
    return res.data;
  }

  async deleteSmtpSettings() {
    const res = await this.request('/admin/smtp', {
      method: 'DELETE'
    });
    return res.data;
  }

  // --- Email Delivery ---
  async getPlatformSmtpStatus() {
    const res = await this.request('/emails/smtp-status');
    return res.data;
  }

  async sendTestEmail(payload) {
    const res = await this.request('/emails/send-test', {
      method: 'POST',
      body: payload
    });
    return res.data;
  }

  async sendTemplatedEmail(payload) {
    const res = await this.request('/emails/send-templated', {
      method: 'POST',
      body: payload
    });
    return res.data;
  }
}

export const api = new ApiService();
export default api;
