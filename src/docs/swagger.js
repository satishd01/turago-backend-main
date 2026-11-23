/**
 * Swagger / OpenAPI specification.
 * Uses swagger-jsdoc to auto-generate spec from JSDoc comments in route files.
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Turago Backend API',
      version: '1.0.0',
      description: `
## Turago Ride-Booking Backend API

A modular monolith backend for the Turago ride-booking platform.

### Authentication
All protected endpoints require a JWT Bearer token in the Authorization header:
\`Authorization: Bearer <access_token>\`

Tokens are obtained via the OTP authentication flow:
1. \`POST /api/v1/auth/send-otp\` — send OTP to phone
2. \`POST /api/v1/auth/verify-otp\` — verify OTP, receive tokens

### API Versioning
All API endpoints are prefixed with \`/api/v1/\`

### Roles
- \`CUSTOMER\` — Mobile app users booking rides
- \`DRIVER\` — Drivers accepting and completing rides  
- \`ADMIN\` — Platform administrators
      `,
      contact: {
        name: 'Turago Development Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from /api/v1/auth/verify-otp',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  // Scan all route files for @swagger JSDoc comments
  apis: [
    join(__dirname, '../modules/*/routes/*.js'),
    join(__dirname, '../modules/auth/routes/*.js'),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
