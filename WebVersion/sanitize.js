/**
 * QazGost AI — HTML Sanitization Utility
 * 
 * Prevents XSS attacks when inserting user-provided data into the DOM.
 * Drop-in replacement for dangerous innerHTML patterns.
 * 
 * Usage:
 *   import { escapeHtml, safeInnerHTML } from './sanitize.js';
 *   
 *   // Escape individual values
 *   element.innerHTML = `<span>${escapeHtml(userInput)}</span>`;
 *   
 *   // Or use safeInnerHTML with a template
 *   safeInnerHTML(element, '<div class="name">${name}</div>', { name: userData });
 */

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

const ESCAPE_REGEX = /[&<>"'`/]/g;

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str - Untrusted string
 * @returns {string} Safe HTML string
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(ESCAPE_REGEX, (char) => ESCAPE_MAP[char] || char);
}

/**
 * Safely set innerHTML by escaping template variables.
 * 
 * @param {HTMLElement} element - Target element
 * @param {string} template - HTML template with ${key} placeholders
 * @param {Object} values - Key-value pairs to interpolate (values are escaped)
 * 
 * @example
 *   safeInnerHTML(el, '<div class="name">${name}</div><p>${desc}</p>', {
 *     name: userInput,
 *     desc: userDescription,
 *   });
 */
export function safeInnerHTML(element, template, values = {}) {
  let html = template;
  for (const [key, val] of Object.entries(values)) {
    // Replace all occurrences of ${key} with escaped value
    html = html.replaceAll('${' + key + '}', escapeHtml(val));
  }
  element.innerHTML = html;
}

/**
 * Create a text node (always safe, no HTML interpretation).
 * @param {string} text - Any text
 * @returns {Text} DOM Text node
 */
export function safeText(text) {
  return document.createTextNode(text ?? '');
}

/**
 * Strip all HTML tags from a string.
 * @param {string} html - String potentially containing HTML
 * @returns {string} Plain text
 */
export function stripHtml(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.textContent = html; // textContent is safe
  return div.textContent;
}

// Make available globally for non-module scripts
window.QazSanitize = { escapeHtml, safeInnerHTML, safeText, stripHtml };
