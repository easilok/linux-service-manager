// import { Request } from 'express';

export interface CustomError extends Error {
  stacktracePath?: string;
  statusCode?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}
