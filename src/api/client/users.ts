import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class UsersClient extends BaseClient {
  // Users
  async listUsers(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/admins', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/admins', undefined, cleanedParams);
  }

  async getUser(userId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/admins/${userId}`, undefined, params);
  }

  // Roles
  async listRoles(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/roles', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/roles', undefined, cleanedParams);
  }

  async getRole(roleId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/roles/${roleId}`, undefined, params);
  }

  async createRole(role: any) {
    return this.request<LMResponse<any>>('POST', '/setting/roles', role);
  }

  async updateRole(roleId: number, role: any) {
    return this.request<LMResponse<any>>('PATCH', `/setting/roles/${roleId}`, role);
  }

  async deleteRole(roleId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/roles/${roleId}`);
  }

  // API Tokens
  async listApiTokens(userId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>(`/setting/admins/${userId}/apitokens`, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', `/setting/admins/${userId}/apitokens`, undefined, cleanedParams);
  }

  async createUser(user: any) {
    return this.request<LMResponse<any>>('POST', '/setting/admins', user);
  }

  async updateUser(userId: number, user: any, params?: { changePassword?: boolean; validationOnly?: boolean }) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/setting/admins/${userId}`,
      user,
      this.cleanParams(params || {}),
    );
  }

  async deleteUser(userId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/admins/${userId}`);
  }

  async createApiToken(userId: number, token: any, params?: { type?: string }) {
    return this.request<LMResponse<any>>(
      'POST',
      `/setting/admins/${userId}/apitokens`,
      token,
      this.cleanParams(params || {}),
    );
  }

  async updateApiToken(userId: number, apiTokenId: number, token: any) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/setting/admins/${userId}/apitokens/${apiTokenId}`,
      token,
    );
  }

  async deleteApiToken(userId: number, apiTokenId: number) {
    return this.request<LMResponse<any>>(
      'DELETE',
      `/setting/admins/${userId}/apitokens/${apiTokenId}`,
    );
  }

  // API usage stats
  async getExternalApiStats(params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', '/apiStats/externalApis', undefined, this.cleanParams(params || {}));
  }
}
