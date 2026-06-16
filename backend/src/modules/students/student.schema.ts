import { z } from 'zod';

export const createStudentSchema = z.object({
  body: z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    admission_number: z.string().optional().or(z.literal('')),
    dob: z.string().optional().or(z.literal('')),
    gender: z.string().optional().or(z.literal('')),
    guardian_name: z.string().optional().or(z.literal('')),
    guardian_phone: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    password: z.string().optional().or(z.literal('')),
    class_id: z.string().optional()
  })
});

export const updateStudentSchema = z.object({
  body: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    admission_number: z.string().optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    guardian_name: z.string().optional(),
    guardian_phone: z.string().optional(),
    address: z.string().optional()
  })
});

export const promoteClassSchema = z.object({
  body: z.object({
    student_ids: z.array(z.string()).min(1, 'At least one student ID is required'),
    new_class_id: z.string().min(1, 'New class ID is required')
  })
});

export const bulkEnrollSchema = z.object({
  body: z.object({
    students: z.array(z.any()).min(1, 'At least one student data is required')
  })
});

export const enrollBatchSchema = z.object({
  body: z.object({
    student_ids: z.array(z.string()).min(1, 'At least one student ID is required')
  })
});
