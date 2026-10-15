/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type IconName =
  | 'article'
  | 'verified'
  | 'auto_awesome'
  | 'volume_up'
  | 'volume_off'
  | 'stop'
  | 'play_arrow'
  | 'expand_more'
  | 'expand_less'
  | 'chat'
  | 'close'
  | 'warning'
  | 'arrow_forward'
  | 'arrow_back'
  | 'check'
  | 'check_circle'
  | 'lock'
  | 'language'
  | 'settings'
  | 'refresh'
  | 'send'
  | 'info'
  | 'visibility'
  | 'visibility_off'
  | 'delete'
  | 'shield'
  | 'open_in_new'
  | 'person'
  | 'radio_button_unchecked';

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
  'aria-hidden'?: boolean | 'true' | 'false';
  'aria-label'?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  className = 'w-4 h-4',
  size,
  'aria-hidden': ariaHidden = true,
  'aria-label': ariaLabel,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  const renderPath = () => {
    switch (name) {
      case 'article':
        return (
          <path
            fill="currentColor"
            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
          />
        );
      case 'verified':
        return (
          <path
            fill="currentColor"
            d="m12 1 2.2 2.8 3.5-.5 1 3.4 3.3 1.3-.8 3.5 2.2 2.8-2.2 2.8.8 3.5-3.3 1.3-1 3.4-3.5-.5L12 23l-2.2-2.8-3.5.5-1-3.4-3.3-1.3.8-3.5L.6 9.7l2.2-2.8-.8-3.5 3.3-1.3 1-3.4 3.5.5L12 1zm-1.8 14.2 6-6-1.4-1.4-4.6 4.6-2.2-2.2-1.4 1.4 3.6 3.6z"
          />
        );
      case 'auto_awesome':
        return (
          <path
            fill="currentColor"
            d="m19 9 1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zm7.5 5.5-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"
          />
        );
      case 'volume_up':
        return (
          <path
            fill="currentColor"
            d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
          />
        );
      case 'volume_off':
      case 'stop':
        return (
          <path
            fill="currentColor"
            d="M6 6h12v12H6z"
          />
        );
      case 'play_arrow':
        return (
          <path
            fill="currentColor"
            d="M8 5v14l11-7z"
          />
        );
      case 'expand_more':
        return (
          <path
            fill="currentColor"
            d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"
          />
        );
      case 'expand_less':
        return (
          <path
            fill="currentColor"
            d="m12 8-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"
          />
        );
      case 'chat':
        return (
          <path
            fill="currentColor"
            d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"
          />
        );
      case 'close':
        return (
          <path
            fill="currentColor"
            d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
          />
        );
      case 'warning':
        return (
          <path
            fill="currentColor"
            d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
          />
        );
      case 'arrow_forward':
        return (
          <path
            fill="currentColor"
            d="m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"
          />
        );
      case 'arrow_back':
        return (
          <path
            fill="currentColor"
            d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
          />
        );
      case 'check':
        return (
          <path
            fill="currentColor"
            d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
          />
        );
      case 'check_circle':
        return (
          <path
            fill="currentColor"
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
          />
        );
      case 'radio_button_unchecked':
        return (
          <path
            fill="currentColor"
            d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
          />
        );
      case 'lock':
        return (
          <path
            fill="currentColor"
            d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
          />
        );
      case 'language':
        return (
          <path
            fill="currentColor"
            d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"
          />
        );
      case 'settings':
        return (
          <path
            fill="currentColor"
            d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
          />
        );
      case 'refresh':
        return (
          <path
            fill="currentColor"
            d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
          />
        );
      case 'send':
        return (
          <path
            fill="currentColor"
            d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"
          />
        );
      case 'info':
        return (
          <path
            fill="currentColor"
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
          />
        );
      case 'visibility':
        return (
          <path
            fill="currentColor"
            d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
          />
        );
      case 'visibility_off':
        return (
          <path
            fill="currentColor"
            d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
          />
        );
      case 'delete':
        return (
          <path
            fill="currentColor"
            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
          />
        );
      case 'shield':
        return (
          <path
            fill="currentColor"
            d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
          />
        );
      case 'open_in_new':
        return (
          <path
            fill="currentColor"
            d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"
          />
        );
      case 'person':
        return (
          <path
            fill="currentColor"
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          />
        );
      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
    >
      {renderPath()}
    </svg>
  );
};
