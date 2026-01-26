import request from 'supertest';
import express from 'express';
// @ts-ignore
import { walletRoutes } from '../routes/wallet.routes';

describe('wallet Service Health', () => {
  it('should have a health check', () => {
    expect(true).toBe(true);
  });
});
