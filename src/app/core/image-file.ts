/** Image uploads (banners, categories) must be one of these — matches the file inputs'
 *  `accept`, which a user can bypass by choosing "All files". */
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

/** Every buyer's phone downloads these images, and the server refuses very large uploads
 *  with an unhelpful error, so stop them here. Same cap the mobile app uses for receipts. */
const MAX_IMAGE_MB = 5;

/** '' when the file is an allowed image (or no file was picked), else the message to show. */
export function imageFileError(file: File | null): string {
  if (!file) return '';
  const name = file.name || '';
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return `Invalid file extension ".${ext || '?'}" — allowed: ${ALLOWED_IMAGE_EXTENSIONS.map((e) => '.' + e).join(', ')}.`;
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    return `Image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_IMAGE_MB} MB.`;
  }
  return '';
}
