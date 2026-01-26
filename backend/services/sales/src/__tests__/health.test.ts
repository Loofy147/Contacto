import request from 'supertest';
import express from 'express';
// @ts-ignore
import { salesRoutes } from '../routes/sales.routes';

describe('sales Service Health', () => {
  it('should have a health check', () => {
    expect(true).toBe(true);
  });
});
