import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initializeMercadoPagoClient,
  getMercadoPagoClient,
  getPaymentAPI,
  getPreferenceAPI,
  getMercadoPagoPublicKey,
  testMercadoPagoConnection,
} from './mercadopago.service';

// Mock the MercadoPago SDK
const mockPreferenceCreate = vi.fn();
const mockPaymentGet = vi.fn();

// Create mock class constructors that are spies
const MockMercadoPagoConfig = vi.fn(function (this: any, config: any) {
  this.accessToken = config.accessToken;
});

const MockPayment = vi.fn(function (this: any, _client: any) {
  this.get = mockPaymentGet;
});

const MockPreference = vi.fn(function (this: any, _client: any) {
  this.create = mockPreferenceCreate;
});

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: MockMercadoPagoConfig,
  Payment: MockPayment,
  Preference: MockPreference,
  // Export mock functions so tests can access them
  __mockPreferenceCreate: mockPreferenceCreate,
  __mockPaymentGet: mockPaymentGet,
}));

// Mock the config
vi.mock('../config/mercadopago.config', () => ({
  mercadopagoConfig: {
    accessToken: 'TEST-mock-access-token',
    publicKey: 'TEST-mock-public-key',
    webhookSecret: 'mock-webhook-secret',
    appUrl: 'http://localhost:3000',
  },
  validateMercadoPagoConfig: vi.fn(),
}));

describe('MercadoPago Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the singleton instance between tests
    // This is a workaround since we can't directly access the private variable
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeMercadoPagoClient', () => {
    it('should initialize MercadoPago client with access token', async () => {
      const { initializeMercadoPagoClient } = await import('./mercadopago.service');
      const { MercadoPagoConfig } = await import('mercadopago');

      const client = initializeMercadoPagoClient();

      expect(client).toBeDefined();
      expect(MercadoPagoConfig).toHaveBeenCalledWith({
        accessToken: 'TEST-mock-access-token',
        options: {
          timeout: 5000,
          idempotencyKey: 'studio-booking',
        },
      });
    });

    it('should validate configuration before initialization', async () => {
      const { initializeMercadoPagoClient } = await import('./mercadopago.service');
      const { validateMercadoPagoConfig } = await import('../config/mercadopago.config');

      initializeMercadoPagoClient();

      expect(validateMercadoPagoConfig).toHaveBeenCalled();
    });
  });

  describe('getMercadoPagoClient', () => {
    it('should return existing client if already initialized', async () => {
      const { getMercadoPagoClient, initializeMercadoPagoClient } = await import('./mercadopago.service');

      // Initialize once
      const client1 = initializeMercadoPagoClient();
      const initialCallCount = MockMercadoPagoConfig.mock.calls.length;

      // Get client again
      const client2 = getMercadoPagoClient();
      const afterCallCount = MockMercadoPagoConfig.mock.calls.length;

      // Should return same instance without re-initializing (singleton pattern)
      expect(client1).toBe(client2);
      expect(afterCallCount).toBe(initialCallCount);
    });

    it('should initialize client if not already initialized', async () => {
      const { getMercadoPagoClient } = await import('./mercadopago.service');
      const { MercadoPagoConfig } = await import('mercadopago');

      const client = getMercadoPagoClient();

      expect(client).toBeDefined();
      expect(MercadoPagoConfig).toHaveBeenCalled();
    });
  });

  describe('getPaymentAPI', () => {
    it('should return Payment API instance', async () => {
      const { getPaymentAPI } = await import('./mercadopago.service');
      const { Payment } = await import('mercadopago');

      const paymentAPI = getPaymentAPI();

      expect(paymentAPI).toBeDefined();
      expect(Payment).toHaveBeenCalled();
    });
  });

  describe('getPreferenceAPI', () => {
    it('should return Preference API instance', async () => {
      const { getPreferenceAPI } = await import('./mercadopago.service');
      const { Preference } = await import('mercadopago');

      const preferenceAPI = getPreferenceAPI();

      expect(preferenceAPI).toBeDefined();
      expect(Preference).toHaveBeenCalled();
    });
  });

  describe('getMercadoPagoPublicKey', () => {
    it('should return public key from config', async () => {
      const { getMercadoPagoPublicKey } = await import('./mercadopago.service');

      const publicKey = getMercadoPagoPublicKey();

      expect(publicKey).toBe('TEST-mock-public-key');
    });
  });

  describe('testMercadoPagoConnection', () => {
    it('should return true when connection is successful', async () => {
      const mercadopago = await import('mercadopago');
      const mockPreferenceCreate = (mercadopago as any).__mockPreferenceCreate;

      mockPreferenceCreate.mockResolvedValueOnce({
        id: 'test-preference-id',
      });

      const { testMercadoPagoConnection } = await import('./mercadopago.service');
      const result = await testMercadoPagoConnection();

      expect(result).toBe(true);
      expect(mockPreferenceCreate).toHaveBeenCalledWith({
        body: expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              id: 'test-item',
              title: 'Test Connection',
              quantity: 1,
              unit_price: 100,
              currency_id: 'CLP',
            }),
          ]),
          back_urls: expect.objectContaining({
            success: expect.stringContaining('/test-success'),
            failure: expect.stringContaining('/test-failure'),
            pending: expect.stringContaining('/test-pending'),
          }),
        }),
      });
    });

    it('should return false when preference creation fails', async () => {
      const mercadopago = await import('mercadopago');
      const mockPreferenceCreate = (mercadopago as any).__mockPreferenceCreate;

      mockPreferenceCreate.mockResolvedValueOnce({
        id: null,
      });

      const { testMercadoPagoConnection } = await import('./mercadopago.service');
      const result = await testMercadoPagoConnection();

      expect(result).toBe(false);
    });

    it('should return false and log error when connection fails', async () => {
      const mercadopago = await import('mercadopago');
      const mockPreferenceCreate = (mercadopago as any).__mockPreferenceCreate;

      mockPreferenceCreate.mockRejectedValueOnce(new Error('Connection failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { testMercadoPagoConnection } = await import('./mercadopago.service');
      const result = await testMercadoPagoConnection();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ MercadoPago connection test failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
