/**
 * QAZGOST AI - Swagger/OpenAPI Configuration
 */

const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./index');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'QAZGOST AI API',
        version: '2.0.0',
        description: `
# 🏗️ QAZGOST AI — REST API

Платформа для управления строительными проектами, сметами и инженерными обследованиями.

## Основные возможности
- **Аутентификация** — OTP через WhatsApp/SMS (Twilio)
- **Заказы** — создание, публикация, управление жизненным циклом
- **Инженеры** — подбор, отклики, рейтинг
- **Финансы** — кошельки, платежи, Escrow-сделки, подписки
- **Чат** — real-time обмен сообщениями (Socket.IO)
- **Файлы** — загрузка фото/PDF для смет

## Аутентификация
Используется JWT (Bearer Token). Получите токен через \`/auth/send-code\` → \`/auth/verify-code\`.

## Escrow-схема
\`\`\`
Заказчик → [CREATED] → [FUNDED] → [RELEASED] → Исполнитель
                                ↘ [DISPUTED] ↗ / [REFUNDED]
\`\`\`
        `,
        contact: {
            name: 'QAZGOST AI Team',
            email: 'support@qazgost.kz',
            url: 'https://qazgost.kz'
        },
        license: {
            name: 'Proprietary',
            url: 'https://qazgost.kz/license'
        }
    },
    servers: [
        {
            url: `http://localhost:${config.port}/api/${config.api.version}`,
            description: '🖥️ Local Development'
        },
        {
            url: `https://api.qazgost.kz/api/${config.api.version}`,
            description: '🌐 Production'
        }
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT access token. Получите через POST /auth/verify-code'
            }
        },
        schemas: {
            // ========== AUTH ==========
            SendCodeRequest: {
                type: 'object',
                required: ['phone'],
                properties: {
                    phone: { type: 'string', example: '+77001234567', description: 'Номер телефона в формате +7...' },
                    method: { type: 'string', enum: ['whatsapp', 'sms'], default: 'whatsapp' }
                }
            },
            VerifyCodeRequest: {
                type: 'object',
                required: ['phone', 'code'],
                properties: {
                    phone: { type: 'string', example: '+77001234567' },
                    code: { type: 'string', example: '123456', description: '6-значный OTP-код' },
                    role: { type: 'string', enum: ['customer', 'executor', 'engineer'], default: 'customer' }
                }
            },
            AuthResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/UserShort' },
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresIn: { type: 'integer', example: 900, description: 'Время жизни access token (сек)' }
                }
            },

            // ========== USER ==========
            UserShort: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    phone: { type: 'string', example: '+77001234567' },
                    role: { type: 'string', enum: ['customer', 'executor', 'engineer'] },
                    firstName: { type: 'string', example: 'Алексей' },
                    lastName: { type: 'string', example: 'Иванов' },
                    avatar: { type: 'string', nullable: true },
                    rating: { type: 'number', example: 4.8 },
                    isVerified: { type: 'boolean' }
                }
            },
            UserProfile: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    phone: { type: 'string' },
                    email: { type: 'string', format: 'email', nullable: true },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    avatar: { type: 'string', nullable: true },
                    role: { type: 'string', enum: ['customer', 'executor', 'engineer'] },
                    isVerified: { type: 'boolean' },
                    rating: { type: 'number' },
                    reviewsCount: { type: 'integer' },
                    city: { type: 'string', nullable: true },
                    isCompany: { type: 'boolean' },
                    companyName: { type: 'string', nullable: true },
                    experienceYears: { type: 'integer', nullable: true },
                    hourlyRate: { type: 'number', nullable: true },
                    specializations: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                code: { type: 'string' },
                                name: { type: 'string' },
                                icon: { type: 'string' }
                            }
                        }
                    },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },

            // ========== ORDER ==========
            Order: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    title: { type: 'string', example: 'Ремонт кровли здания' },
                    description: { type: 'string' },
                    objectType: { type: 'string', enum: ['residential', 'commercial', 'industrial'] },
                    city: { type: 'string', example: 'Алматы' },
                    address: { type: 'string' },
                    status: {
                        type: 'string',
                        enum: ['DRAFT', 'PUBLISHED', 'IN_WORK', 'ON_REVIEW', 'DONE', 'CANCELLED', 'ARCHIVED']
                    },
                    budgetMin: { type: 'number' },
                    budgetMax: { type: 'number' },
                    deadline: { type: 'string', format: 'date' },
                    customerId: { type: 'string', format: 'uuid' },
                    executorId: { type: 'string', format: 'uuid', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            CreateOrderRequest: {
                type: 'object',
                required: ['title', 'objectType', 'city'],
                properties: {
                    title: { type: 'string', example: 'Обследование фундамента' },
                    description: { type: 'string' },
                    objectType: { type: 'string', enum: ['residential', 'commercial', 'industrial'] },
                    city: { type: 'string', example: 'Нур-Султан' },
                    address: { type: 'string' },
                    budgetMin: { type: 'number', example: 100000 },
                    budgetMax: { type: 'number', example: 500000 },
                    deadline: { type: 'string', format: 'date', example: '2025-12-31' },
                    specializations: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['structural', 'geotechnical']
                    }
                }
            },

            // ========== ENGINEER ==========
            Engineer: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    rating: { type: 'number' },
                    reviewsCount: { type: 'integer' },
                    specializations: { type: 'array', items: { type: 'string' } },
                    city: { type: 'string' },
                    isVerified: { type: 'boolean' },
                    experienceYears: { type: 'integer' },
                    completedOrders: { type: 'integer' }
                }
            },
            ApplicationRequest: {
                type: 'object',
                required: ['orderId'],
                properties: {
                    orderId: { type: 'string', format: 'uuid' },
                    price: { type: 'number', example: 250000 },
                    estimatedDays: { type: 'integer', example: 14 },
                    message: { type: 'string', example: 'Имею опыт аналогичных работ' }
                }
            },

            // ========== FINANCE ==========
            Wallet: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    balance: { type: 'number', example: 150000 },
                    holdBalance: { type: 'number', example: 50000 },
                    currency: { type: 'string', enum: ['KZT', 'USD', 'RUB'], default: 'KZT' }
                }
            },
            Escrow: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    orderId: { type: 'string' },
                    customerId: { type: 'string' },
                    executorId: { type: 'string' },
                    amount: { type: 'number', example: 500000 },
                    commissionAmount: { type: 'number', example: 15000 },
                    netAmount: { type: 'number', example: 485000 },
                    currency: { type: 'string', enum: ['KZT', 'USD', 'RUB'] },
                    status: {
                        type: 'string',
                        enum: ['CREATED', 'FUNDED', 'RELEASED', 'DISPUTED', 'REFUNDED', 'PARTIALLY_RELEASED', 'EXPIRED']
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    fundedAt: { type: 'string', format: 'date-time', nullable: true },
                    releasedAt: { type: 'string', format: 'date-time', nullable: true },
                    expiresAt: { type: 'string', format: 'date-time' },
                    disputeReason: { type: 'string', nullable: true }
                }
            },
            Transaction: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    walletId: { type: 'string' },
                    type: { type: 'string' },
                    amount: { type: 'number' },
                    currency: { type: 'string' },
                    description: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },

            // ========== CHAT ==========
            ChatMessage: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    orderId: { type: 'string' },
                    senderId: { type: 'string' },
                    senderRole: { type: 'string' },
                    senderName: { type: 'string' },
                    text: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    readAt: { type: 'string', format: 'date-time', nullable: true }
                }
            },

            // ========== FILE ==========
            FileUploadResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    file: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            filename: { type: 'string' },
                            originalName: { type: 'string' },
                            mimeType: { type: 'string' },
                            size: { type: 'integer' },
                            url: { type: 'string' }
                        }
                    }
                }
            },

            // ========== NOTIFICATION ==========
            Notification: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    userId: { type: 'string' },
                    type: { type: 'string', enum: ['order', 'payment', 'deadline', 'chat', 'system'] },
                    title: { type: 'string' },
                    message: { type: 'string' },
                    isRead: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },

            // ========== COMMON ==========
            Error: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Описание ошибки' },
                    code: { type: 'string', example: 'NOT_FOUND' }
                }
            },
            PaginatedResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: {} },
                    pagination: {
                        type: 'object',
                        properties: {
                            page: { type: 'integer' },
                            limit: { type: 'integer' },
                            total: { type: 'integer' },
                            totalPages: { type: 'integer' }
                        }
                    }
                }
            }
        },
        responses: {
            Unauthorized: {
                description: 'Не авторизован — требуется Bearer token',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            success: false,
                            error: 'Требуется авторизация',
                            code: 'UNAUTHORIZED'
                        }
                    }
                }
            },
            NotFound: {
                description: 'Ресурс не найден',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: { success: false, error: 'Не найдено', code: 'NOT_FOUND' }
                    }
                }
            },
            BadRequest: {
                description: 'Невалидные данные',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' }
                    }
                }
            },
            TooManyRequests: {
                description: 'Превышен лимит запросов',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: { success: false, error: 'Слишком много запросов', code: 'RATE_LIMIT' }
                    }
                }
            }
        }
    },
    tags: [
        { name: 'Auth', description: '🔐 Аутентификация и авторизация (OTP)' },
        { name: 'Users', description: '👤 Управление профилями пользователей' },
        { name: 'Orders', description: '📋 Заказы — создание, публикация, жизненный цикл' },
        { name: 'Engineers', description: '👷 Инженеры — поиск, отклики, рейтинг' },
        { name: 'Projects', description: '🏗️ Проекты — группировка заказов' },
        { name: 'Files', description: '📁 Загрузка и управление файлами' },
        { name: 'Chat', description: '💬 Real-time обмен сообщениями' },
        { name: 'Finance', description: '💰 Финансы — кошельки, платежи, Escrow' },
        { name: 'Notifications', description: '🔔 Уведомления' }
    ],
    paths: {
        // ========== AUTH ==========
        '/auth/send-code': {
            post: {
                tags: ['Auth'],
                summary: 'Отправить OTP-код',
                description: 'Отправляет 6-значный код подтверждения через WhatsApp или SMS',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/SendCodeRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Код отправлен',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        method: { type: 'string' },
                                        message: { type: 'string' },
                                        devCode: { type: 'string', description: 'Только в dev-режиме' }
                                    }
                                }
                            }
                        }
                    },
                    429: { $ref: '#/components/responses/TooManyRequests' }
                }
            }
        },
        '/auth/verify-code': {
            post: {
                tags: ['Auth'],
                summary: 'Подтвердить OTP-код',
                description: 'Верифицирует OTP и возвращает JWT-токены',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/VerifyCodeRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Авторизация успешна',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AuthResponse' }
                            }
                        }
                    },
                    400: { $ref: '#/components/responses/BadRequest' }
                }
            }
        },
        '/auth/refresh': {
            post: {
                tags: ['Auth'],
                summary: 'Обновить access token',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['refreshToken'],
                                properties: {
                                    refreshToken: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Новые токены',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        accessToken: { type: 'string' },
                                        refreshToken: { type: 'string' },
                                        expiresIn: { type: 'integer' }
                                    }
                                }
                            }
                        }
                    },
                    401: { $ref: '#/components/responses/Unauthorized' }
                }
            }
        },
        '/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Получить текущего пользователя',
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Профиль пользователя',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        user: { $ref: '#/components/schemas/UserProfile' }
                                    }
                                }
                            }
                        }
                    },
                    401: { $ref: '#/components/responses/Unauthorized' }
                }
            }
        },

        // ========== USERS ==========
        '/users/{id}': {
            get: {
                tags: ['Users'],
                summary: 'Получить пользователя по ID',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                ],
                responses: {
                    200: {
                        description: 'Профиль пользователя',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } } }
                    },
                    404: { $ref: '#/components/responses/NotFound' }
                }
            },
            put: {
                tags: ['Users'],
                summary: 'Обновить профиль',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    firstName: { type: 'string' },
                                    lastName: { type: 'string' },
                                    email: { type: 'string', format: 'email' },
                                    city: { type: 'string' },
                                    isCompany: { type: 'boolean' },
                                    companyName: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Профиль обновлён' },
                    401: { $ref: '#/components/responses/Unauthorized' }
                }
            }
        },

        // ========== ORDERS ==========
        '/orders': {
            get: {
                tags: ['Orders'],
                summary: 'Список заказов',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
                    { name: 'status', in: 'query', schema: { type: 'string' } },
                    { name: 'city', in: 'query', schema: { type: 'string' } },
                    { name: 'objectType', in: 'query', schema: { type: 'string' } }
                ],
                responses: {
                    200: {
                        description: 'Список заказов с пагинацией',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } }
                    }
                }
            },
            post: {
                tags: ['Orders'],
                summary: 'Создать заказ',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateOrderRequest' }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Заказ создан',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } }
                    },
                    400: { $ref: '#/components/responses/BadRequest' }
                }
            }
        },
        '/orders/{id}': {
            get: {
                tags: ['Orders'],
                summary: 'Получить заказ по ID',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                ],
                responses: {
                    200: { description: 'Заказ', content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } },
                    404: { $ref: '#/components/responses/NotFound' }
                }
            },
            patch: {
                tags: ['Orders'],
                summary: 'Обновить заказ',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                ],
                requestBody: {
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrderRequest' } } }
                },
                responses: {
                    200: { description: 'Заказ обновлён' },
                    404: { $ref: '#/components/responses/NotFound' }
                }
            }
        },
        '/orders/{id}/publish': {
            post: {
                tags: ['Orders'],
                summary: 'Опубликовать заказ',
                description: 'Переводит заказ из DRAFT в PUBLISHED',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
                ],
                responses: {
                    200: { description: 'Заказ опубликован' },
                    400: { $ref: '#/components/responses/BadRequest' }
                }
            }
        },

        // ========== ENGINEERS ==========
        '/engineers': {
            get: {
                tags: ['Engineers'],
                summary: 'Поиск инженеров',
                parameters: [
                    { name: 'city', in: 'query', schema: { type: 'string' } },
                    { name: 'specialization', in: 'query', schema: { type: 'string' } },
                    { name: 'minRating', in: 'query', schema: { type: 'number' } },
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
                ],
                responses: {
                    200: {
                        description: 'Список инженеров',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } }
                    }
                }
            }
        },
        '/engineers/apply': {
            post: {
                tags: ['Engineers'],
                summary: 'Подать отклик на заказ',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ApplicationRequest' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Отклик отправлен' },
                    400: { $ref: '#/components/responses/BadRequest' }
                }
            }
        },

        // ========== FINANCE ==========
        '/finance/wallet': {
            get: {
                tags: ['Finance'],
                summary: 'Получить кошелёк текущего пользователя',
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Данные кошелька',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/Wallet' } } }
                    }
                }
            }
        },
        '/finance/wallet/topup': {
            post: {
                tags: ['Finance'],
                summary: 'Пополнить кошелёк',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['amount'],
                                properties: {
                                    amount: { type: 'number', example: 50000 },
                                    currency: { type: 'string', default: 'KZT' },
                                    provider: { type: 'string', enum: ['stripe', 'crypto'], default: 'stripe' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Ссылка на оплату' }
                }
            }
        },
        '/finance/transactions': {
            get: {
                tags: ['Finance'],
                summary: 'История транзакций',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
                    { name: 'type', in: 'query', schema: { type: 'string' } }
                ],
                responses: {
                    200: {
                        description: 'Список транзакций',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } }
                    }
                }
            }
        },
        '/finance/escrow': {
            post: {
                tags: ['Finance'],
                summary: 'Создать Escrow-сделку',
                description: 'Создаёт безопасную сделку для заказа. Средства блокируются до приёмки работы.',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['orderId'],
                                properties: {
                                    orderId: { type: 'string', format: 'uuid' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Escrow создан',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/Escrow' } } }
                    },
                    400: { $ref: '#/components/responses/BadRequest' }
                }
            }
        },
        '/finance/escrow/{id}/fund': {
            post: {
                tags: ['Finance'],
                summary: 'Заблокировать средства в Escrow',
                description: 'Списывает средства с кошелька заказчика и блокирует их в Escrow',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                ],
                responses: {
                    200: { description: 'Средства заблокированы' },
                    400: { $ref: '#/components/responses/BadRequest' }
                }
            }
        },
        '/finance/escrow/{id}/release': {
            post: {
                tags: ['Finance'],
                summary: 'Выплатить средства из Escrow',
                description: 'Выплачивает средства исполнителю (за вычетом комиссии) после приёмки работы',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                ],
                responses: {
                    200: { description: 'Средства выплачены' },
                    400: { $ref: '#/components/responses/BadRequest' }
                }
            }
        },
        '/finance/escrow/{id}/refund': {
            post: {
                tags: ['Finance'],
                summary: 'Вернуть средства из Escrow',
                description: 'Возвращает полную сумму на кошелёк заказчика',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    reason: { type: 'string', example: 'Отмена заказа' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Средства возвращены' },
                    400: { $ref: '#/components/responses/BadRequest' }
                }
            }
        },
        '/finance/escrow/{id}/dispute': {
            post: {
                tags: ['Finance'],
                summary: 'Открыть спор по Escrow',
                description: 'Замораживает средства и открывает спор для разбирательства',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['reason'],
                                properties: {
                                    reason: { type: 'string', minLength: 10, example: 'Работа выполнена некачественно, не соответствует смете' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Спор открыт' },
                    400: { $ref: '#/components/responses/BadRequest' }
                }
            }
        },

        // ========== CHAT ==========
        '/chat/{orderId}': {
            get: {
                tags: ['Chat'],
                summary: 'Получить сообщения чата',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
                    { name: 'before', in: 'query', schema: { type: 'string', format: 'date-time' } }
                ],
                responses: {
                    200: {
                        description: 'Список сообщений',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        messages: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/ChatMessage' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Chat'],
                summary: 'Отправить сообщение',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['text'],
                                properties: {
                                    text: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Сообщение отправлено',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ChatMessage' }
                            }
                        }
                    }
                }
            }
        },

        // ========== FILES ==========
        '/files/upload': {
            post: {
                tags: ['Files'],
                summary: 'Загрузить файл',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    file: { type: 'string', format: 'binary' },
                                    orderId: { type: 'string' },
                                    category: { type: 'string', enum: ['photo', 'document', 'estimate'] }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Файл загружен',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/FileUploadResponse' } } }
                    }
                }
            }
        },

        // ========== NOTIFICATIONS ==========
        '/notifications': {
            get: {
                tags: ['Notifications'],
                summary: 'Получить уведомления',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'unreadOnly', in: 'query', schema: { type: 'boolean', default: false } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
                ],
                responses: {
                    200: {
                        description: 'Список уведомлений',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        notifications: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Notification' }
                                        },
                                        unreadCount: { type: 'integer' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/notifications/{id}/read': {
            post: {
                tags: ['Notifications'],
                summary: 'Пометить уведомление как прочитанное',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                ],
                responses: {
                    200: { description: 'Отмечено как прочитанное' }
                }
            }
        }
    }
};

const swaggerOptions = {
    swaggerDefinition,
    // Scan routes for additional JSDoc annotations
    apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = { swaggerSpec, swaggerOptions };
