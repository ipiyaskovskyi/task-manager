import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Tracker API',
      version: '1.0.0',
      description:
        'API documentation for Task Tracker - A modern task management application',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            firstname: {
              type: 'string',
              example: 'John',
            },
            lastname: {
              type: 'string',
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            title: {
              type: 'string',
              example: 'Complete project documentation',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Write comprehensive API documentation',
            },
            type: {
              type: 'string',
              enum: ['Task', 'Subtask', 'Bug', 'Story', 'Epic'],
              nullable: true,
              example: 'Task',
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'review', 'done'],
              example: 'todo',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              example: 'high',
            },
            deadline: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2024-12-31T23:59:59Z',
            },
            assigneeId: {
              type: 'integer',
              nullable: true,
              example: 1,
            },
            assignee: {
              $ref: '#/components/schemas/User',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateTaskRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              example: 'Complete project documentation',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Write comprehensive API documentation',
            },
            type: {
              type: 'string',
              enum: ['Task', 'Subtask', 'Bug', 'Story', 'Epic'],
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'review', 'done'],
              default: 'todo',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              default: 'medium',
            },
            deadline: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            assigneeId: {
              type: 'integer',
              nullable: true,
            },
          },
        },
        UpdateTaskRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 1,
            },
            description: {
              type: 'string',
              nullable: true,
            },
            type: {
              type: 'string',
              enum: ['Task', 'Subtask', 'Bug', 'Story', 'Epic'],
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'review', 'done'],
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
            },
            deadline: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            assigneeId: {
              type: 'integer',
              nullable: true,
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['firstname', 'lastname', 'email', 'password'],
          properties: {
            firstname: {
              type: 'string',
              minLength: 2,
              example: 'John',
            },
            lastname: {
              type: 'string',
              minLength: 2,
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'password123',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              example: 'password123',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User',
            },
            token: {
              type: 'string',
              example:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDYwNDgwMH0.example',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
            },
          },
        },
        PaginatedTasksResponse: {
          type: 'object',
          properties: {
            tasks: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Task',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  example: 1,
                },
                limit: {
                  type: 'integer',
                  example: 20,
                },
                total: {
                  type: 'integer',
                  example: 100,
                },
                totalPages: {
                  type: 'integer',
                  example: 5,
                },
                hasNext: {
                  type: 'boolean',
                  example: true,
                },
                hasPrev: {
                  type: 'boolean',
                  example: false,
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
      },
      responses: {
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                error: 'Validation failed',
                details: [],
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                error: 'Resource not found',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                error: 'Unauthorized',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                error: 'Internal server error',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Tasks',
        description: 'Task management endpoints',
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/app/api/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
