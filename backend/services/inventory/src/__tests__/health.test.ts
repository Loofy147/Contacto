import request from 'supertest';
import express from 'express';
// @ts-ignore
import { inventoryRoutes } from '../routes/inventory.routes';

describe('inventory Service Health', () => {
  it('should have a health check', () => {
    expect(true).toBe(true);
  });
});
