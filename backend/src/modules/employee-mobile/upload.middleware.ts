import { fieldsUpload } from '../../middleware/upload.middleware';

export const workUpdateUpload = fieldsUpload([
  { name: 'photos', maxCount: 10 },
  { name: 'documents', maxCount: 10 },
]);
