/**
 * API Service for communicating with the Saffeh Backend
 * With API Key authentication
 */

import { Config } from '@/constants';

export interface QRValidationResponse {
  success: boolean;
  message: string;
  data?: {
    valid: boolean;
    vehicleInfo?: {
      plateNumber?: string;
      entryTime?: string;
      parkingDuration?: string;
      fee?: number;
    };
    gateAccess?: {
      allowed: boolean;
      gateId?: string;
      timestamp?: string;
    };
  };
  error?: string;
}

export interface QRValidationRequest {
  qrToken: string;
  gateId?: string;
  guardId?: string;
  timestamp?: string;
}

// ⚠️ API Key for QR validation
const API_KEY = 'qr_api_3a0bb21b4bba4cad9be1f4b3f4f991d7';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = Config.API_BASE_URL;
  }

  /**
   * Get headers with API key authentication
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-api-key': API_KEY,
      // Some backends use these alternative header names:
      // 'Authorization': `Bearer ${API_KEY}`,
      // 'Authorization': `ApiKey ${API_KEY}`,
      // 'api-key': API_KEY,
    };
  }

  /**
   * Validates a QR code token with the backend
   * @param qrToken - The QR code token string extracted from scanning
   * @param gateId - Optional gate identifier
   * @param guardId - Optional guard/operator identifier
   * @returns Promise with validation response
   */
  async validateQRCode(
    qrToken: string,
    gateId?: string,
    guardId?: string
  ): Promise<QRValidationResponse> {
    try {
      const url = `${this.baseUrl}${Config.API_ENDPOINTS.QR_VALIDATE}`;
      
      const requestBody: QRValidationRequest = {
        qrToken,
        gateId,
        guardId,
        timestamp: new Date().toISOString(),
      };

      console.log('Validating QR Code:', {
        url,
        token: qrToken.substring(0, 10) + '...',
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.status === 401) {
        return {
          success: false,
          message: 'Authentication failed. Invalid API key.',
          error: 'UNAUTHORIZED',
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          message: 'Access denied. API key does not have permission.',
          error: 'FORBIDDEN',
        };
      }

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Validation failed',
          error: data.error || `HTTP Error: ${response.status}`,
        };
      }

      return {
        success: true,
        message: data.message || 'QR Code validated successfully',
        data: data.data || data,
      };
    } catch (error) {
      console.error('QR Validation Error:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('Network')) {
        return {
          success: false,
          message: 'Network error - Please check your connection',
          error: 'NETWORK_ERROR',
        };
      }

      return {
        success: false,
        message: 'Failed to validate QR code',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test connection to the backend server
   * @returns Promise<boolean> - True if server is reachable
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-api-key': API_KEY,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;