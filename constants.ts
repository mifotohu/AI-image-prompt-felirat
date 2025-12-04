import { AspectRatioConfig, AspectRatios } from './types';

export const INSTAGRAM_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
</svg>`;

export const PINTEREST_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="{color}" stroke="{color}" stroke-width="0" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.198-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.911 2.168-2.911 1.026 0 1.512.765 1.512 1.682 0 1.025-.653 2.557-.998 3.968-.285 1.19.605 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.56-5.409 5.199 0 .985.396 2.05.889 2.625.095.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.623 0 11.971-5.377 11.971-12.013C23.988 5.368 18.64 0 12.017 0z"/>
</svg>`;

export const GENERATOR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
  <rect x="9" y="9" width="6" height="6"></rect>
  <line x1="9" y1="1" x2="9" y2="4"></line>
  <line x1="15" y1="1" x2="15" y2="4"></line>
  <line x1="9" y1="20" x2="9" y2="23"></line>
  <line x1="15" y1="20" x2="15" y2="23"></line>
  <line x1="20" y1="9" x2="23" y2="9"></line>
  <line x1="20" y1="15" x2="23" y2="15"></line>
  <line x1="1" y1="9" x2="4" y2="9"></line>
  <line x1="1" y1="15" x2="4" y2="15"></line>
</svg>`;

export const ASPECT_RATIO_CONFIG: Record<AspectRatios, AspectRatioConfig> = {
  // Portrait
  '9:16': { width: 1080, height: 1920 },
  '2:3': { width: 1080, height: 1620 },
  '3:4': { width: 1080, height: 1440 },
  '4:5': { width: 1080, height: 1350 },
  // Square
  '1:1': { width: 1080, height: 1080 },
  // Landscape
  '5:4': { width: 1350, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '16:9': { width: 1920, height: 1080 },
};
