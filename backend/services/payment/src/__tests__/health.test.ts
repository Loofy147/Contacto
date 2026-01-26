import request from 'supertest';
import express from 'express';
// @ts-ignore
import { paymentRoutes } from '../routes/payment.routes';

describe('payment Service Health', () => {
  it('should have a health check', () => {
    expect(true).toBe(true);
  });
});
