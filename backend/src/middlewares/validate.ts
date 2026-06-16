import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../utils/logger';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const zodError = error as any;
        logger.warn({ path: req.path, error: zodError.errors }, 'Validation failed');
        return res.status(400).json({
          error: 'Validation failed',
          details: zodError.errors,
        });
      }
      return next(error);
    }
  };
};
