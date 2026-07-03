import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/role.middleware';
import { singleUpload } from '../middleware/upload.middleware';
import { createEmployee } from '../modules/employees/employee.service';
import { successResponse, errorResponse } from '../utils/response.utils';

const router = Router();

const parseCsv = (content: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(field);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.trim() !== '')) rows.push(row);
  }

  return rows;
};

router.post(
  '/admin/csv/upload',
  authenticateToken,
  requireSuperAdmin,
  singleUpload('file', ['.csv'], 5 * 1024 * 1024),
  async (req, res) => {
    try {
      if (!req.file) {
        return errorResponse(res, 'CSV file is required', 400);
      }

      const content = req.file.buffer.toString('utf8');
      const rows = parseCsv(content);
      if (rows.length < 2) {
        return errorResponse(res, 'CSV file must contain a header row and at least one data row', 400);
      }

      const headers = rows[0].map((value) => value.trim().toLowerCase());
      const requiredHeaders = ['firstname', 'lastname', 'email', 'joiningdate'];
      const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
      if (missingHeaders.length > 0) {
        return errorResponse(res, `CSV is missing required headers: ${missingHeaders.join(', ')}`, 400);
      }

      const imported: any[] = [];
      const errors: Array<{ row: number; message: string }> = [];

      for (let index = 1; index < rows.length; index++) {
        const row = rows[index];
        const data: Record<string, string> = {};

        headers.forEach((header, headerIndex) => {
          data[header] = row[headerIndex] ? row[headerIndex].trim() : '';
        });

        try {
          if (!data.firstname || !data.lastname || !data.email || !data.joiningdate) {
            throw new Error('firstName, lastName, email, and joiningDate are required');
          }

          const employee = await createEmployee({
            firstName: data.firstname,
            lastName: data.lastname,
            email: data.email,
            phone: data.phone,
            department: data.department,
            designation: data.designation,
            joiningDate: data.joiningdate,
            password: 'Temp@1234',
            role: data.role || 'EMPLOYEE',
            employeeCode: data.employeecode || undefined,
          });

          imported.push(employee);
        } catch (err: any) {
          errors.push({ row: index + 1, message: err.message });
        }
      }

      return successResponse(res, { imported, totalImported: imported.length, totalErrors: errors.length, errors }, 'CSV import completed');
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }
);

export default router;
