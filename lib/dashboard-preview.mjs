/** Gerenciamento de prévia HTML (PDF/Q&A) via blob URL. */
export function createPreviewBlobUrl(html) {
  return URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
}

export function revokePreviewBlobUrl(url) {
  if (url) URL.revokeObjectURL(url);
}
