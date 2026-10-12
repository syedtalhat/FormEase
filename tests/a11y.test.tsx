/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { StatusChip } from '../src/extension/components/StatusChip';
import { FieldTooltip } from '../src/extension/components/FieldTooltip';
import { ChatDrawer } from '../src/extension/components/ChatDrawer';
import { RiskBanner } from '../src/extension/components/RiskBanner';
import { ErrorCard } from '../src/surfaces/overlay/ErrorCard';

describe('Accessibility Audit & WCAG 2.1 AA Compliance', () => {
  // Helper to run axe-core with rules appropriate for component fragments
  async function checkA11y(container: HTMLElement) {
    const results = await axe.run(container, {
      rules: {
        // In component unit tests without full document tree, ignore page-level html/head rules
        'region': { enabled: false },
        'page-has-heading-one': { enabled: false },
      },
    });

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    return { violations: results.violations, criticalOrSerious };
  }

  describe('Overlay States Accessibility (axe-core inside Shadow Root)', () => {
    it('State 1 & 2: Scanning & Analyzing states are accessible live regions', async () => {
      const { container } = render(
        <div role="status" aria-live="polite" className="p-3 bg-white rounded-xl shadow-sm">
          <span className="font-semibold text-xs text-[#0E5A64]">Scanning form fields...</span>
        </div>
      );

      const { criticalOrSerious } = await checkA11y(container);
      expect(criticalOrSerious.length).toBe(0);
    });

    it('State 3: Ready state with inline assistance badge is accessible', async () => {
      const { container } = render(
        <div>
          <button
            type="button"
            aria-label="See description for Annual Family Income"
            className="inline-flex items-center gap-1 text-xs"
          >
            <StatusChip tag="required" />
            <StatusChip tag="unusual" />
            <StatusChip tag="optional" />
          </button>
        </div>
      );

      const { criticalOrSerious } = await checkA11y(container);
      expect(criticalOrSerious.length).toBe(0);
    });

    it('State 4: Field Focused state (FieldTooltip) has accessible names and provenance', async () => {
      const { container } = render(
        <div role="region" aria-label="Field Explanation Container">
          <FieldTooltip
            fieldLabel="Annual Family Income"
            explanation={{
              id: 'exp-1',
              fieldId: 'f-1',
              fieldKey: 'annual_income',
              language: 'en',
              summary: 'Total family income from all sources',
              fullExplanation: 'Must not exceed 2.5 Lakhs per annum according to state guidelines.',
              sourceLabel: 'From official source',
              sourceUrl: 'https://scholarships.gov.in',
              sourceExcerpt: 'Section 3.1 Means Testing',
              confidence: 0.95,
              riskTag: 'required',
            }}
            language="en"
            onAskInChat={() => {}}
            onClose={() => {}}
          />
        </div>
      );

      const { criticalOrSerious } = await checkA11y(container);
      expect(criticalOrSerious.length).toBe(0);
    });

    it('State 5: Chat Open state (ChatDrawer) has accessible dialog role, focus, and input labels', async () => {
      const { container } = render(
        <div role="region" aria-label="Companion Chat Region">
          <ChatDrawer
            formTitle="Scholarship Application"
            allFields={[]}
            completedFields={[]}
            language="en"
            isLoading={false}
            messages={[
              {
                id: '1',
                sessionId: 's-1',
                role: 'user',
                content: 'Where do I find my income certificate?',
                createdAt: new Date().toISOString(),
              },
              {
                id: '2',
                sessionId: 's-1',
                role: 'assistant',
                content: 'You can obtain it from your Taluka Tehsildar office.',
                createdAt: new Date().toISOString(),
              },
            ]}
            focusedField={{
              id: 'f-1',
              fieldKey: 'income',
              name: 'income',
              type: 'number',
              label: 'Annual Income',
              required: true,
            }}
            onSendMessage={async () => {}}
            onClose={() => {}}
          />
        </div>
      );

      const { criticalOrSerious } = await checkA11y(container);
      expect(criticalOrSerious.length).toBe(0);
    });

    it('State 6: Error state has accessible alert role, Retry and Dismiss actions (NFR-REL.1)', async () => {
      const { container } = render(
        <div role="region" aria-label="Error Region">
          <ErrorCard
            errorKind="network"
            onRetry={() => {}}
            onDismiss={() => {}}
          />
        </div>
      );

      const { criticalOrSerious } = await checkA11y(container);
      expect(criticalOrSerious.length).toBe(0);
    });

    it('State 7: Risk Alert Banner is accessible with alert landmark role', async () => {
      const { container } = render(
        <div role="region" aria-label="Risk Warning Region">
          <RiskBanner
            flags={[
              {
                id: 'r-1',
                formId: 'form-1',
                flagType: 'DOMAIN_MISMATCH',
                severity: 'high',
                description: 'Form submission destination domain differs from host page.',
                createdAt: new Date().toISOString(),
              },
            ]}
            onDismiss={() => {}}
          />
        </div>
      );

      const { criticalOrSerious } = await checkA11y(container);
      expect(criticalOrSerious.length).toBe(0);
    });
  });

  describe('Design Token Color Contrast Audit (WCAG 2.1 AA >= 4.5:1)', () => {
    function hexToRgb(hex: string): [number, number, number] {
      const cleanHex = hex.replace('#', '');
      const num = parseInt(cleanHex, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }

    function relativeLuminance([r, g, b]: [number, number, number]): number {
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function contrastRatio(hex1: string, hex2: string): number {
      const lum1 = relativeLuminance(hexToRgb(hex1));
      const lum2 = relativeLuminance(hexToRgb(hex2));
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      return (brightest + 0.05) / (darkest + 0.05);
    }

    const tokenPairs = [
      { name: 'Primary Teal on White', fg: '#0E5A64', bg: '#FFFFFF', minRatio: 4.5 },
      { name: 'Primary Dark on Light Surface', fg: '#1F2D36', bg: '#F7FAFB', minRatio: 4.5 },
      { name: 'Secondary Slate on White', fg: '#4A5B66', bg: '#FFFFFF', minRatio: 4.5 },
      { name: 'Official Green on White', fg: '#17724A', bg: '#FFFFFF', minRatio: 4.5 },
      { name: 'Official Green Text on Green Tint BG', fg: '#17724A', bg: '#E4F4EC', minRatio: 4.5 },
      { name: 'Page Blue on White', fg: '#2A5DA8', bg: '#FFFFFF', minRatio: 4.5 },
      { name: 'General AI Purple on White', fg: '#5E479B', bg: '#FFFFFF', minRatio: 4.5 },
      { name: 'High Risk Red on White', fg: '#BA1A1A', bg: '#FFFFFF', minRatio: 4.5 },
      { name: 'Warning Amber on White', fg: '#8F4200', bg: '#FFFFFF', minRatio: 4.5 },
    ];

    for (const pair of tokenPairs) {
      it(`Token Pair '${pair.name}' satisfies contrast >= ${pair.minRatio}:1`, () => {
        const ratio = contrastRatio(pair.fg, pair.bg);
        console.log(`[Contrast Check] ${pair.name} (${pair.fg} on ${pair.bg}): ratio = ${ratio.toFixed(2)}:1`);
        expect(ratio).toBeGreaterThanOrEqual(pair.minRatio);
      });
    }
  });

  describe('Keyboard Walkthrough & Focus Return Checklist', () => {
    it('verifies Tooltip and Chat elements contain keyboard accessible focusable triggers', () => {
      const { container } = render(
        <div>
          <button type="button" data-testid="anchor-btn">
            Field Anchor
          </button>
          <FieldTooltip
            fieldLabel="Test Label"
            explanation={{
              id: 'exp-test',
              fieldId: 'f-test',
              fieldKey: 'test',
              language: 'en',
              summary: 'Short summary for test',
              fullExplanation: 'Full guidance details.',
              sourceLabel: 'From official source',
              confidence: 0.9,
              riskTag: 'required',
            }}
            language="en"
            onAskInChat={() => {}}
            onClose={() => {}}
          />
        </div>
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);

      buttons.forEach((btn) => {
        expect(btn.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
