/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { SourceChip } from '../src/ui/SourceChip';
import { Tooltip, TooltipExplanationData } from '../src/surfaces/overlay/Tooltip';
import { ErrorCard } from '../src/surfaces/overlay/ErrorCard';
import { PopupError } from '../src/surfaces/popup/PopupError';
import { SegmentedControl } from '../src/ui/SegmentedControl';

describe('Design System & Surface Component Tests (§13)', () => {
  afterEach(() => {
    cleanup();
  });
  const sampleData: TooltipExplanationData = {
    field_key: 'annual_family_income',
    field_label: 'Annual Family Income',
    risk_tag: 'required',
    summary: 'Combined gross annual income of both parents before taxes.',
    text: 'Must be supported by a Tahsildar revenue certificate and be under ₹2,50,000 for full fee waiver.',
    source_label: 'official',
    source_url: 'https://scholarships.gov.in/guidelines/post-matric-2026.pdf',
    source_excerpt: 'Gross annual income must not exceed INR 2,50,000 per financial annum.',
    confidence: 0.98,
  };

  it('verifies Tooltip collapsed <-> expanded toggling', () => {
    const handleAskInChat = vi.fn();
    const handleClose = vi.fn();

    const { rerender } = render(
      <Tooltip
        data={sampleData}
        language="en"
        onAskInChat={handleAskInChat}
        onClose={handleClose}
        initialExpanded={false}
      />
    );

    // In collapsed state: summary is shown, but full text and source excerpt are not yet visible
    expect(screen.getByText(sampleData.summary)).toBeDefined();
    expect(screen.queryByText(/The source says:/)).toBeNull();

    // Click 'More' button to expand
    const moreBtn = screen.getByText('More');
    fireEvent.click(moreBtn);

    // After expanding: full text and source excerpt are visible
    expect(screen.getByText(sampleData.text)).toBeDefined();
    expect(screen.getByText(/The source says:/)).toBeDefined();

    // Click 'Less' button to collapse again
    const lessBtn = screen.getByText('Less');
    fireEvent.click(lessBtn);

    expect(screen.queryByText(/The source says:/)).toBeNull();
  });

  it('guarantees Error surfaces always show both Retry and Dismiss buttons (NFR-REL.1)', () => {
    const handleRetry = vi.fn();
    const handleDismiss = vi.fn();

    // Injected ErrorCard
    render(
      <ErrorCard
        errorKind="network"
        onRetry={handleRetry}
        onDismiss={handleDismiss}
      />
    );

    const retryBtn = screen.getByText('Retry');
    const dismissBtn = screen.getByText('Dismiss');
    expect(retryBtn).toBeDefined();
    expect(dismissBtn).toBeDefined();

    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);

    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);

    // PopupError
    const { unmount } = render(
      <PopupError
        errorKind="no_form"
        onRetry={handleRetry}
        onDismiss={handleDismiss}
      />
    );

    expect(screen.getAllByText('Retry').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dismiss').length).toBeGreaterThan(0);
    unmount();
  });

  it('renders all three SourceChip variants with distinct icons and labels', () => {
    const { unmount: u1 } = render(<SourceChip type="page" />);
    expect(screen.getByText('From this page')).toBeDefined();
    u1();

    const { unmount: u2 } = render(<SourceChip type="official" url="https://example.gov.in" />);
    expect(screen.getByText('From official source')).toBeDefined();
    u2();

    const { unmount: u3 } = render(<SourceChip type="ai" showCaption={true} />);
    expect(screen.getByText("AI's general knowledge")).toBeDefined();
    expect(screen.getByText('Not checked against an official source')).toBeDefined();
    u3();
  });

  it('verifies language switcher re-renders with the selected value', () => {
    let selectedLang = 'en';
    const handleChange = vi.fn((newLang) => {
      selectedLang = newLang;
    });

    const { rerender } = render(
      <SegmentedControl
        options={[
          { id: 'en', label: 'English' },
          { id: 'hi', label: 'हिन्दी' },
          { id: 'mr', label: 'मराठी' },
        ]}
        value={selectedLang as any}
        onChange={handleChange}
      />
    );

    const hiBtn = screen.getByText('हिन्दी');
    fireEvent.click(hiBtn);
    expect(handleChange).toHaveBeenCalledWith('hi');

    rerender(
      <SegmentedControl
        options={[
          { id: 'en', label: 'English' },
          { id: 'hi', label: 'हिन्दी' },
          { id: 'mr', label: 'मराठी' },
        ]}
        value="hi"
        onChange={handleChange}
      />
    );

    expect(screen.getByRole('radio', { name: 'हिन्दी' }).getAttribute('aria-checked')).toBe('true');
  });
});
