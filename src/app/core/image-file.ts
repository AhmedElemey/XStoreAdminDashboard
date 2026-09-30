/** Image uploads (banners, categories) must be one of these — matches the file inputs'
 *  `accept`, which a user can bypass by choosing "All files". */
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

/** '' when the file is an allowed image type (or no file was picked), else the message to show. */
export function imageExtensionError(file: File | null): string {
  if (!file) return '';
  const name = file.name || '';
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';
  return ALLOWED_IMAGE_EXTENSIONS.includes(ext)
    ? ''
    : `Invalid file extension ".${ext || '?'}" — allowed: ${ALLOWED_IMAGE_EXTENSIONS.map((e) => '.' + e).join(', ')}.`;
}
