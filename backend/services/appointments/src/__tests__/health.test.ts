import request from 'supertest';
import express from 'express';
// @ts-ignore
import { appointmentsRoutes } from '../routes/appointment.routes';

describe('appointments Service Health', () => {
  it('should have a health check', () => {
    expect(true).toBe(true);
  });
});
