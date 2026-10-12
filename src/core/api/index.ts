/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExtensionApiClient } from './extensionClient';
import { HttpApiClient } from './httpClient';
import { MockApiClient } from './mockClient';
import { ApiClient } from './types';

export * from './types';
export * from './mockClient';
export * from './httpClient';
export * from './extensionClient';

const defaultMockClient = new MockApiClient();
let defaultHttpClient: HttpApiClient | null = null;
let defaultExtensionClient: ExtensionApiClient | null = null;

export function getApiClient(explicitMode?: 'mock' | 'live' | 'extension'): ApiClient {
  const envMode =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_MODE) ||
    (typeof process !== 'undefined' && process.env?.VITE_API_MODE) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('formassist_api_mode')) ||
    'mock';

  const mode = explicitMode || envMode;

  if (mode === 'extension') {
    if (!defaultExtensionClient) {
      defaultExtensionClient = new ExtensionApiClient();
    }
    return defaultExtensionClient;
  }

  if (mode === 'live') {
    if (!defaultHttpClient) {
      defaultHttpClient = new HttpApiClient();
    }
    return defaultHttpClient;
  }
  return defaultMockClient;
}

export { defaultMockClient };
