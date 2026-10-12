/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getApiClient, BackendHealthResult, HttpApiClient } from '../core/api';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface BackendHealthPanelProps {
  apiMode: 'mock' | 'live';
  onToggleApiMode: (mode: 'mock' | 'live') => void;
}

export const BackendHealthPanel: React.FC<BackendHealthPanelProps> = ({
  apiMode,
  onToggleApiMode,
}) => {
  const [healthData, setHealthData] = useState<BackendHealthResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState(() => {
    return (
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('formassist_supabase_url')) ||
      ''
    );
  });
  const [customKey, setCustomKey] = useState(() => {
    return (
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('formassist_supabase_anon_key')) ||
      ''
    );
  });

  const checkHealth = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (apiMode === 'live') {
        const client = new HttpApiClient(customUrl, customKey);
        const res = await client.checkHealth();
        setHealthData(res);
      } else {
        const client = getApiClient('mock');
        const res = await client.checkHealth();
        setHealthData(res);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setHealthData({
        ok: false,
        timestamp: new Date().toISOString(),
        database: { reachable: false, indexed_documents: 0, latency_ms: 0, error: msg },
        gemini: { reachable: false, model: 'unknown', error: msg },
        embedding: { reachable: false, model: 'unknown', error: msg },
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, [apiMode]);

  const handleSaveConfig = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('formassist_supabase_url', customUrl);
      localStorage.setItem('formassist_supabase_anon_key', customKey);
    }
    checkHealth();
  };

  return (
    <div className="bg-surface-card rounded-2xl border border-border-subtle p-6 shadow-sm space-y-6 text-text-primary">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-xl text-primary-container">
              Backend Health &amp; Integration Hub
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                healthData?.ok
                  ? 'bg-source-official-bg text-source-official border border-source-official/30'
                  : 'bg-danger-bg text-danger border border-danger/30'
              }`}
            >
              {healthData?.ok ? '● ALL SYSTEMS HEALTHY' : '▲ ATTENTION REQUIRED'}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Real-time diagnostics for Supabase database, pgvector document embeddings, and serverless Gemini inference.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* API Mode Selector */}
          <div className="flex items-center bg-surface-muted p-1 rounded-xl text-xs font-medium border border-border-subtle">
            <button
              type="button"
              onClick={() => onToggleApiMode('mock')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                apiMode === 'mock'
                  ? 'bg-white text-primary-container shadow-xs font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Mock Simulator
            </button>
            <button
              type="button"
              onClick={() => onToggleApiMode('live')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                apiMode === 'live'
                  ? 'bg-primary-container text-white shadow-xs font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Live Supabase Backend
            </button>
          </div>

          <Button
            variant="primary"
            onClick={checkHealth}
            disabled={isLoading}
            className="text-xs py-1.5 px-3"
          >
            <div className="flex items-center gap-1.5">
              <Icon name="refresh" className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Checking...' : 'Ping Backend'}</span>
            </div>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-danger-bg border border-danger/30 text-danger rounded-xl text-xs flex items-center gap-2">
          <Icon name="warning" className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 4 Health Status Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Database Reachability */}
        <div className="bg-surface-page p-4 rounded-xl border border-border-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Database (Postgres)</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  healthData?.database.reachable ? 'bg-source-official' : 'bg-danger'
                }`}
              />
            </div>
            <div className="mt-2 font-display text-lg font-bold">
              {healthData?.database.reachable ? 'Connected' : 'Unreachable'}
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
              Latency: {healthData?.database.latency_ms ?? 0} ms
            </p>
          </div>
          {healthData?.database.error && (
            <div className="text-[10px] text-danger mt-2 truncate" title={healthData.database.error}>
              {healthData.database.error}
            </div>
          )}
        </div>

        {/* 2. Indexed Source Documents */}
        <div className="bg-surface-page p-4 rounded-xl border border-border-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Source Documents</span>
              <span className="text-[10px] bg-source-page-bg text-source-page px-1.5 py-0.5 rounded font-mono font-bold">
                pgvector
              </span>
            </div>
            <div className="mt-2 font-display text-2xl font-extrabold text-primary-container">
              {healthData?.database.indexed_documents ?? 0}
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
              Official regulatory &amp; circular guidelines indexed
            </p>
          </div>
        </div>

        {/* 3. Gemini Inference Model */}
        <div className="bg-surface-page p-4 rounded-xl border border-border-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Gemini Text API</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  healthData?.gemini.reachable ? 'bg-source-official' : 'bg-danger'
                }`}
              />
            </div>
            <div className="mt-2 font-display text-base font-bold truncate">
              {healthData?.gemini.reachable ? 'Operational' : 'Unavailable'}
            </div>
            <p className="text-[11px] text-text-secondary mt-1 font-mono truncate" title={healthData?.gemini.model}>
              {healthData?.gemini.model || 'gemini-2.5-flash'}
            </p>
          </div>
          {healthData?.gemini.error && (
            <div className="text-[10px] text-danger mt-2 truncate" title={healthData.gemini.error}>
              {healthData.gemini.error}
            </div>
          )}
        </div>

        {/* 4. Embedding Model */}
        <div className="bg-surface-page p-4 rounded-xl border border-border-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Embeddings API</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  healthData?.embedding.reachable ? 'bg-source-official' : 'bg-danger'
                }`}
              />
            </div>
            <div className="mt-2 font-display text-base font-bold truncate">
              {healthData?.embedding.reachable ? 'Operational' : 'Unavailable'}
            </div>
            <p className="text-[11px] text-text-secondary mt-1 font-mono truncate" title={healthData?.embedding.model}>
              {healthData?.embedding.model || 'text-embedding-004'}
            </p>
          </div>
          {healthData?.embedding.error && (
            <div className="text-[10px] text-danger mt-2 truncate" title={healthData.embedding.error}>
              {healthData.embedding.error}
            </div>
          )}
        </div>
      </div>

      {/* Configuration & Deployment Credentials Card */}
      <div className="bg-surface-muted p-5 rounded-2xl border border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider text-text-secondary">
            Supabase Connection &amp; Live API Configuration
          </span>
          <span className="text-[11px] text-text-secondary">
            Last Ping: {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : 'Never'}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Supabase Project URL (e.g. https://xyzcompany.supabase.co)
            </label>
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://<your-project-id>.supabase.co"
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-border-strong bg-white focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Public Anon API Key (Client-Safe)
            </label>
            <input
              type="password"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-border-strong bg-white focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-text-secondary">
            🔒 <strong>Strict Privacy Architecture:</strong> Private keys (<code className="font-mono text-primary-container">GEMINI_API_KEY</code>, <code className="font-mono text-primary-container">SUPABASE_SERVICE_ROLE_KEY</code>) reside exclusively in Supabase Edge Function Secrets. Client browser only requires the public Anon key.
          </p>

          <Button variant="secondary" onClick={handleSaveConfig} className="text-xs py-1.5 px-3">
            Save &amp; Test Connection
          </Button>
        </div>
      </div>
    </div>
  );
};
