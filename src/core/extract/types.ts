/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LabelSource =
  | 'label_for'
  | 'wrapping_label'
  | 'aria_label'
  | 'aria_labelledby'
  | 'aria_describedby'
  | 'preceding_text'
  | 'placeholder'
  | 'fallback_name';

export interface ExtractedFieldStructure {
  field_key: string;
  name: string;
  label: string;
  label_source: LabelSource;
  input_type: string;
  required: boolean;
  sensitive: boolean;
  placeholder?: string;
  options?: string[];
  page_help?: string;
  // Live DOM reference, client-side only (never serialized to network)
  anchorElement?: HTMLElement;
}

export interface ExtractedFormStructure {
  form_id: string;
  form_title: string;
  form_action: string;
  page_url: string;
  fields: ExtractedFieldStructure[];
}
