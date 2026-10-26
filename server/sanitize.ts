import 'server-only';
import sanitizeHtml from 'sanitize-html';

/**
 * Rich-text fields (brief_bio, experience, detailed_bio) are written with the
 * Quill editor and shown on public profile pages as HTML. Everything except the
 * formatting Quill (and pasted bios) actually use is removed: no scripts, event
 * handlers, iframes, forms, images or javascript:/data: links.
 *
 * Applied when a profile is saved and again when it is served, so bios stored
 * before this existed are safe without a data migration.
 */
const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i;

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'sub', 'sup'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    li: ['data-list'],
    '*': ['class', 'style']
  },
  allowedClasses: {
    '*': [/^ql-align-(center|right|justify)$/, /^ql-indent-\d$/, 'ql-ui']
  },
  allowedStyles: {
    '*': {
      color: [COLOR],
      'background-color': [COLOR],
      'text-align': [/^(left|right|center|justify)$/]
    }
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  transformTags: {
    // Links from user content open in a new tab and pass no ranking or opener.
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow' }
    })
  }
};

export function sanitizeRichText(value: unknown): string | undefined {
  if (typeof value !== 'string') return value as undefined;
  return sanitizeHtml(value, OPTIONS);
}

export const RICH_TEXT_FIELDS = ['brief_bio', 'experience', 'detailed_bio'] as const;

/** Sanitizes the rich-text fields of an object in place (fields that are absent are left alone). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeRichTextFields<T extends Record<string, any>>(data: T): T {
  for (const field of RICH_TEXT_FIELDS) {
    if (typeof data[field] === 'string') {
      (data as Record<string, unknown>)[field] = sanitizeRichText(data[field]);
    }
  }
  return data;
}
