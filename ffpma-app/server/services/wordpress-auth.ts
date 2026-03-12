import axios from "axios";

interface WordPressUser {
  id: number;
  username: string;
  email: string;
  display_name: string;
  roles: string[];
}

interface AuthResult {
  success: boolean;
  user?: WordPressUser;
  token?: string;
  error?: string;
}

class WordPressAuthService {
  private baseUrl: string | null = null;
  private consumerKey: string | null = null;
  private consumerSecret: string | null = null;
  private applicationPassword: string | null = null;
  private isStaging: boolean = false;

  constructor() {
    // Check if staging mode is enabled
    this.isStaging = process.env.USE_STAGING === 'true';
    
    if (this.isStaging) {
      // Use staging credentials
      this.baseUrl = process.env.STAGING_WC_URL || process.env.STAGING_WP_SITE_URL || null;
      this.consumerKey = process.env.STAGING_WC_CONSUMER_KEY || null;
      this.consumerSecret = process.env.STAGING_WC_CONSUMER_SECRET || null;
      this.applicationPassword = process.env.STAGING_WP_APPLICATION_PASSWORD || null;
      console.log('WordPress Auth: Using STAGING environment -', this.baseUrl);
    } else {
      // Use production credentials
      this.baseUrl = process.env.WOOCOMMERCE_URL || process.env.WP_SITE_URL || null;
      this.consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.WC_CONSUMER_KEY || null;
      this.consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.WC_CONSUMER_SECRET || null;
      this.applicationPassword = process.env.WP_APPLICATION_PASSWORD || null;
    }
  }

  private ensureConfig() {
    // Reload missing values from process.env if they weren't set in constructor
    this.baseUrl = this.baseUrl || process.env.WOOCOMMERCE_URL || process.env.WP_SITE_URL || null;
    this.consumerKey = this.consumerKey || process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.WC_CONSUMER_KEY || null;
    this.consumerSecret = this.consumerSecret || process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.WC_CONSUMER_SECRET || null;
    this.applicationPassword = this.applicationPassword || process.env.WP_APPLICATION_PASSWORD || null;
  }

  isConfigured(): boolean {
    this.ensureConfig();
    return !!(this.baseUrl && (this.applicationPassword || (this.consumerKey && this.consumerSecret)));
  }

  getStatus(): { configured: boolean; url: string | null; hasAppPassword: boolean } {
    this.ensureConfig();
    return {
      configured: this.isConfigured(),
      url: this.baseUrl,
      hasAppPassword: !!this.applicationPassword,
    };
  }
  async authenticateUser(username: string, password: string): Promise<AuthResult> {
    this.ensureConfig();
    
    if (!this.baseUrl) {
      return { success: false, error: "WordPress URL not configured" };
    }

    let lastError = "";

    // First try JWT auth if available
    try {
      const response = await axios.post(
        `${this.baseUrl}/wp-json/jwt-auth/v1/token`,
        { username, password },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      if (response.data.token) {
        const userInfo = await this.getUserInfo(response.data.token);
        return {
          success: true,
          token: response.data.token,
          user: userInfo || {
            id: 0,
            username: response.data.user_nicename || username,
            email: response.data.user_email || "",
            display_name: response.data.user_display_name || username,
            roles: [],
          },
        };
      }
    } catch (jwtError: any) {
      const jwtMessage = jwtError.response?.data?.message || jwtError.message;

      if (jwtError.response?.status === 403) {
        return { success: false, error: "Invalid username or password." };
      }
      lastError = `WordPress Error: ${jwtMessage}`;
    }

    // Fallback: Direct Basic Auth against WordPress REST API using Application Password
    if (this.applicationPassword) {
      try {
        // 1. Verify the user's actual password using a lightweight login check (since REST APIs don't accept raw passwords)
        const verifyResult = await this.verifyPasswordViaWP(username, password);
        if (!verifyResult) {
          return { success: false, error: "Invalid username or password." };
        }

        // 2. We inject the system-wide Application Password to query their exact profile on their behalf
        const wpUsername = process.env.WP_USERNAME || 'admin';
        const basicAuth = Buffer.from(`${wpUsername}:${this.applicationPassword}`).toString('base64');
        
        // Lookup their profile by searching for their username or email
        const usersUrl = `${this.baseUrl}/wp-json/wp/v2/users?search=${encodeURIComponent(username)}&per_page=10&context=edit`;
        
        const response = await axios.get(usersUrl, {
          headers: { Authorization: `Basic ${basicAuth}` },
          timeout: 10000,
        });

        if (response.data && response.data.length > 0) {
          const user = response.data.find((u: any) => 
            u.slug?.toLowerCase() === username.toLowerCase() || 
            u.email?.toLowerCase() === username.toLowerCase() ||
            u.username?.toLowerCase() === username.toLowerCase()
          );

          if (user && user.id) {
            return {
              success: true,
              token: Buffer.from(`wp_${user.id}:${Date.now()}`).toString('base64'),
              user: {
                id: user.id,
                username: user.slug || user.username || username,
                email: user.email || "",
                display_name: user.name || username,
                roles: user.roles || ['member'],
              },
            };
          }
        }
      } catch (error: any) {
         console.error('[AUTH] Basic Auth fallback error against WP API:', error.message);
      }
    }

    // If we've reached here, authentication failed completely
    return { success: false, error: "Invalid username or password." };
  }

  private async verifyPasswordViaWP(username: string, password: string): Promise<boolean> {
    if (!this.baseUrl) return false;

    try {
      const formData = new URLSearchParams();
      formData.append('log', username);
      formData.append('pwd', password);
      formData.append('wp-submit', 'Log In');
      formData.append('redirect_to', `${this.baseUrl}/wp-admin/`);
      formData.append('testcookie', '1');

      const response = await axios.post(
        `${this.baseUrl}/wp-login.php`,
        formData.toString(),
        {
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': 'wordpress_test_cookie=WP%20Cookie%20check',
          },
          timeout: 15000,
          maxRedirects: 0,
          validateStatus: (status) => status < 500,
        }
      );

      const setCookies = response.headers['set-cookie'] || [];
      const cookieStr = Array.isArray(setCookies) ? setCookies.join(' ') : String(setCookies);
      const hasAuthCookie = cookieStr.includes('wordpress_logged_in_');

      if (hasAuthCookie) return true;

      if (response.status === 302) {
        const location = response.headers['location'] || '';
        if (location.includes('wp-admin') && !location.includes('wp-login.php')) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  async validateToken(token: string): Promise<AuthResult> {
    if (!this.baseUrl) {
      return { success: false, error: "WordPress URL not configured" };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/wp-json/jwt-auth/v1/token/validate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      if (response.data.code === "jwt_auth_valid_token") {
        const userInfo = await this.getUserInfo(token);
        return {
          success: true,
          token,
          user: userInfo || undefined,
        };
      }

      return { success: false, error: "Invalid token" };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Token validation failed",
      };
    }
  }

  private async getUserInfo(token: string): Promise<WordPressUser | null> {
    if (!this.baseUrl) return null;

    try {
      const response = await axios.get(`${this.baseUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      return {
        id: response.data.id,
        username: response.data.slug,
        email: response.data.email || "",
        display_name: response.data.name,
        roles: response.data.roles || [],
      };
    } catch (error) {
      console.error("Failed to get user info:", error);
      return null;
    }
  }

  async checkMembership(userId: number): Promise<{ isMember: boolean; membershipType?: string; expiresAt?: string }> {
    if (!this.baseUrl || !this.consumerKey || !this.consumerSecret) {
      return { isMember: false };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/wp-json/wc/v3/customers/${userId}`,
        {
          auth: {
            username: this.consumerKey,
            password: this.consumerSecret,
          },
          timeout: 10000,
        }
      );

      const meta = response.data.meta_data || [];
      const membershipMeta = meta.find((m: any) => m.key === "pma_membership_status");
      const membershipTypeMeta = meta.find((m: any) => m.key === "pma_membership_type");
      const expiryMeta = meta.find((m: any) => m.key === "pma_membership_expiry");

      return {
        isMember: membershipMeta?.value === "active",
        membershipType: membershipTypeMeta?.value,
        expiresAt: expiryMeta?.value,
      };
    } catch (error) {
      console.error("Failed to check membership:", error);
      return { isMember: false };
    }
  }

  async getAllUsers(): Promise<{ users: WordPressUser[]; counts: { total: number; doctors: number; clinics: number; members: number; admins: number } }> {
    if (!this.baseUrl || !this.applicationPassword) {
      return { users: [], counts: { total: 0, doctors: 0, clinics: 0, members: 0, admins: 0 } };
    }

    try {
      const wpUsername = process.env.WP_USERNAME || 'admin';
      const authHeader = Buffer.from(`${wpUsername}:${this.applicationPassword}`).toString('base64');
      let allUsers: WordPressUser[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(
          `${this.baseUrl}/wp-json/wp/v2/users`,
          {
            params: { per_page: 100, page, context: 'edit' },
            headers: {
              Authorization: `Basic ${authHeader}`,
            },
            timeout: 15000,
          }
        );

        const users = response.data.map((u: any) => ({
          id: u.id,
          username: u.slug,
          email: u.email || '',
          display_name: u.name,
          roles: u.roles || [],
        }));

        allUsers = allUsers.concat(users);
        
        const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');
        hasMore = page < totalPages;
        page++;
      }

      const counts = {
        total: allUsers.length,
        doctors: allUsers.filter(u => u.roles.includes('doctor') || u.roles.includes('physician') || u.roles.includes('holtorf')).length,
        clinics: allUsers.filter(u => u.roles.includes('clinic') || u.roles.includes('clinic_admin') || u.roles.includes('holtorf')).length,
        members: allUsers.filter(u => u.roles.includes('subscriber') || u.roles.includes('member') || u.roles.includes('customer') || u.roles.includes('info_only_member')).length,
        admins: allUsers.filter(u => u.roles.includes('administrator')).length,
      };

      return { users: allUsers, counts };
    } catch (error: any) {
      console.error("Failed to get all users:", error.response?.data || error.message);
      return { users: [], counts: { total: 0, doctors: 0, clinics: 0, members: 0, admins: 0 } };
    }
  }

  async getCustomerByEmail(email: string): Promise<WordPressUser | null> {
    if (!this.baseUrl || !this.consumerKey || !this.consumerSecret) {
      return null;
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/wp-json/wc/v3/customers`,
        {
          params: { email },
          auth: {
            username: this.consumerKey,
            password: this.consumerSecret,
          },
          timeout: 10000,
        }
      );

      if (response.data.length > 0) {
        const customer = response.data[0];
        return {
          id: customer.id,
          username: customer.username,
          email: customer.email,
          display_name: `${customer.first_name} ${customer.last_name}`.trim() || customer.username,
          roles: customer.role ? [customer.role] : [],
        };
      }

      return null;
    } catch (error) {
      console.error("Failed to get customer:", error);
      return null;
    }
  }

  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'doctor' | 'member' | 'customer';
    password?: string;
    meta?: Record<string, string>;
  }): Promise<{ success: boolean; user?: WordPressUser; error?: string }> {
    if (!this.baseUrl || !this.applicationPassword) {
      return { success: false, error: "WordPress Application Password not configured" };
    }

    try {
      const wpUsername = process.env.WP_USERNAME || 'admin';
      const authHeader = Buffer.from(`${wpUsername}:${this.applicationPassword}`).toString('base64');
      
      // Generate a secure random password if not provided
      const password = userData.password || this.generateSecurePassword();
      
      // Create username from email (before @)
      const username = userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);

      const response = await axios.post(
        `${this.baseUrl}/wp-json/wp/v2/users`,
        {
          username,
          email: userData.email,
          password,
          first_name: userData.firstName,
          last_name: userData.lastName,
          name: `${userData.firstName} ${userData.lastName}`.trim(),
          roles: [userData.role],
          meta: userData.meta || {},
        },
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      if (response.data?.id) {
        return {
          success: true,
          user: {
            id: response.data.id,
            username: response.data.slug || username,
            email: response.data.email || userData.email,
            display_name: response.data.name || `${userData.firstName} ${userData.lastName}`,
            roles: response.data.roles || [userData.role],
          },
        };
      }

      return { success: false, error: "Failed to create user - no ID returned" };
    } catch (error: any) {
      console.error("Failed to create WordPress user:", error.response?.data || error.message);
      
      // Check for duplicate email error
      if (error.response?.data?.code === 'existing_user_email') {
        return { success: false, error: "A user with this email already exists" };
      }
      if (error.response?.data?.code === 'existing_user_login') {
        return { success: false, error: "A user with this username already exists" };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || "Failed to create user" 
      };
    }
  }

  async updateUserRole(userId: number, newRole: string): Promise<{ success: boolean; error?: string }> {
    if (!this.baseUrl || !this.applicationPassword) {
      return { success: false, error: "WordPress Application Password not configured" };
    }

    try {
      const wpUsername = process.env.WP_USERNAME || 'admin';
      const authHeader = Buffer.from(`${wpUsername}:${this.applicationPassword}`).toString('base64');

      await axios.post(
        `${this.baseUrl}/wp-json/wp/v2/users/${userId}`,
        { roles: [newRole] },
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return { success: true };
    } catch (error: any) {
      console.error("Failed to update user role:", error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || "Failed to update user role" };
    }
  }

  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

export const wordPressAuthService = new WordPressAuthService();

// Function wrapper for Passport local strategy
export async function authenticateWithWordPress(username: string, password: string): Promise<{
  success: boolean;
  user?: {
    id: string | number;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    roles?: string[];
  };
  error?: string;
}> {
  const result = await wordPressAuthService.authenticateUser(username, password);
  
  if (result.success && result.user) {
    return {
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email || result.user.username,
        firstName: result.user.display_name?.split(' ')[0] || result.user.username,
        lastName: result.user.display_name?.split(' ').slice(1).join(' ') || '',
        profileImageUrl: undefined,
        roles: result.user.roles || [],
      },
    };
  }
  
  return {
    success: false,
    error: result.error || 'Authentication failed',
  };
}
