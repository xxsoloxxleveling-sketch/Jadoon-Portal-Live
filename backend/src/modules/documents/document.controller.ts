import { Request, Response } from 'express';
import prisma from '../../config/database';

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, document_type, student_id, teacher_id, employee_id } = req.body;
    
    // Multer-storage-cloudinary gives us the URL in req.file.path
    const url = req.file.path;

    const document = await prisma.document.create({
      data: {
        title: title || req.file.originalname,
        url,
        document_type,
        student_id: student_id || null,
        teacher_id: teacher_id || null,
        employee_id: employee_id || null,
      }
    });

    res.status(201).json({ message: 'Document uploaded successfully', document });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.document.delete({ where: { id } });
    // Note: Cloudinary image deletion logic could be added here if needed.
    res.json({ message: 'Document record deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
