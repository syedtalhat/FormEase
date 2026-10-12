/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, Copy, Download, FileCode, PackageCheck, Terminal } from 'lucide-react';

export const ManifestExporter: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const manifestJson = `{
  "manifest_version": 3,
  "name": "FormAssist — Accessible Form Companion",
  "version": "1.0.0",
  "description": "Assistive overlay for web-form accessibility with plain-language explanations, risk classification, and context-aware chat.",
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "FormAssist"
  },
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["http://*/*", "https://*/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(manifestJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#DDE4E8] p-6 text-xs font-sans space-y-5">
      <div className="flex items-center justify-between border-b border-[#F1F4F5] pb-3">
        <div>
          <h3
            className="font-bold text-base text-[#0E5A64]"
            style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
          >
            Manifest V3 Extension Bundle
          </h3>
          <p className="text-xs text-[#4A5B66]">
            Strict Chromium MV3 extension package containing zero host portal pages per architectural constraints.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#0E5A64] text-[#0E5A64] font-semibold hover:bg-[#E3F0F1] transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#17724A]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Manifest'}</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Manifest Code */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-[#4A5B66] mb-1.5">
            <span className="flex items-center gap-1">
              <FileCode className="w-4 h-4 text-[#0E5A64]" />
              <span>manifest.json (MV3)</span>
            </span>
          </div>
          <pre className="p-3 bg-[#1F2D36] text-[#8FCFDB] rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72">
            {manifestJson}
          </pre>
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <div className="p-4 bg-[#F7FAFB] rounded-xl border border-[#DDE4E8] space-y-2">
            <div className="font-bold text-sm text-[#1F2D36] flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-[#17724A]" />
              <span>How to test in Google Chrome:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#4A5B66] leading-relaxed">
              <li>Open Google Chrome or Brave/Edge browser.</li>
              <li>Navigate to <code className="bg-slate-200 px-1 py-0.5 rounded text-[#1F2D36]">chrome://extensions</code>.</li>
              <li>Toggle <strong>Developer mode</strong> in top-right.</li>
              <li>Click <strong>Load unpacked</strong> and select the extension directory.</li>
              <li>Navigate to any target form and activate the FormAssist toolbar badge!</li>
            </ol>
          </div>

          <div className="p-3.5 bg-[#E4F4EC] border border-[#17724A]/20 rounded-xl text-xs text-[#124B32] space-y-1">
            <div className="font-bold">Architectural Boundary Enforcement:</div>
            <p className="text-[11px] leading-relaxed">
              In accordance with Section 0 rules, no government portal markup or simulation harness is packaged in the extension build. Only the Shadow DOM injector, popup, and background service worker ship.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
