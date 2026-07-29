# 🔐 ФАЗА 1: Авторизация и База Данных

> **Срок:** Недели 1-4  
> **Статус:** 🟡 В планировании  
> **Приоритет:** P0 (Critical)

---

## 📋 Обзор фазы

Цель первой фазы — создать надёжный фундамент системы:

1. **Полноценная авторизация** — JWT, OAuth, роли и права
2. **PostgreSQL база данных** — схема, миграции, ORM
3. **FastAPI backend** — API Gateway для всех модулей
4. **База материалов** — справочник работ и цен

---

## 🗓️ Sprint 1.1: Авторизация (Неделя 1-2)

### Задачи

#### 1.1.1 FastAPI Backend Setup

**Оценка:** 3 дня | **Исполнитель:** Backend Dev

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Settings (Pydantic)
│   ├── database.py          # DB connection
│   ├── models/
│   │   ├── user.py          # User model
│   │   └── token.py         # Token model
│   ├── schemas/
│   │   ├── user.py          # User schemas
│   │   └── auth.py          # Auth schemas
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py      # Auth endpoints
│   │   │   └── users.py     # User endpoints
│   │   └── deps.py          # Dependencies
│   ├── core/
│   │   ├── security.py      # JWT, hashing
│   │   └── permissions.py   # RBAC
│   └── utils/
│       └── email.py         # Email sender
├── alembic/                  # Migrations
├── tests/
├── requirements.txt
└── Dockerfile
```

**Endpoints:**

```python
# Auth
POST   /api/v1/auth/register        # Регистрация
POST   /api/v1/auth/login           # Вход (JWT)
POST   /api/v1/auth/refresh         # Обновление токена
POST   /api/v1/auth/logout          # Выход
POST   /api/v1/auth/verify-email    # Подтверждение email
POST   /api/v1/auth/reset-password  # Сброс пароля
POST   /api/v1/auth/oauth/google    # OAuth Google
POST   /api/v1/auth/oauth/yandex    # OAuth Yandex

# Users
GET    /api/v1/users/me             # Текущий пользователь
PUT    /api/v1/users/me             # Обновление профиля
GET    /api/v1/users/{id}           # Профиль пользователя
GET    /api/v1/users                # Список (admin only)
```

#### 1.1.2 User Registration

**Оценка:** 2 дня

**Требования:**

- [ ] Email + пароль (min 8 chars, 1 digit, 1 special)
- [ ] Выбор роли при регистрации
- [ ] Подтверждение email через код
- [ ] reCAPTCHA v3
- [ ] Rate limiting (5 req/min)

**User Model:**

```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID, primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    
    # Profile
    first_name = Column(String(100))
    last_name = Column(String(100))
    company_name = Column(String(255))
    avatar_url = Column(String(500))
    
    # Role & Status
    role = Column(Enum(UserRole), default=UserRole.CLIENT)
    status = Column(Enum(UserStatus), default=UserStatus.PENDING)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime)
    
    # Relations
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    orders = relationship("Order", back_populates="client")
```

**Roles:**

```python
class UserRole(str, Enum):
    CLIENT = "client"           # Заказчик
    CONTRACTOR = "contractor"   # Подрядчик
    ENGINEER = "engineer"       # Инженер-эксперт
    ADMIN = "admin"             # Администратор
    PARTNER = "partner"         # B2B2C партнёр
```

#### 1.1.3 Email/SMS Verification

**Оценка:** 2 дня

**Email:**

- SMTP: SendGrid / Mailgun
- Шаблоны: verification, reset-password, notification

**SMS:**

- Provider: Mobizon / Twilio
- 6-digit code, 5 min TTL

#### 1.1.4 Role-Based Access Control

**Оценка:** 1 день

**Permissions Matrix:**

| Action | Client | Contractor | Engineer | Admin |
|--------|--------|------------|----------|-------|
| Create Estimate | ✅ | ❌ | ✅ | ✅ |
| View Order | Own | Assigned | All | All |
| Accept Work | ❌ | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ |
| View Analytics | Limited | Limited | Full | Full |

#### 1.1.5 OAuth Integration

**Оценка:** 2 дня

- Google OAuth 2.0
- Yandex OAuth
- Auto-registration if new user

---

## 🗓️ Sprint 1.2: База данных (Неделя 3-4)

### Задачи

#### 1.2.1 PostgreSQL Schema

**Оценка:** 2 дня

**Core Tables:**

```sql
-- Users & Auth
CREATE TABLE users (...);
CREATE TABLE user_profiles (...);
CREATE TABLE user_sessions (...);
CREATE TABLE password_resets (...);

-- Materials & Pricing
CREATE TABLE material_categories (...);
CREATE TABLE materials (...);
CREATE TABLE work_types (...);
CREATE TABLE regional_prices (...);
CREATE TABLE suppliers (...);

-- Estimates
CREATE TABLE estimates (...);
CREATE TABLE estimate_versions (...);
CREATE TABLE estimate_items (...);

-- Orders
CREATE TABLE orders (...);
CREATE TABLE order_stages (...);
CREATE TABLE order_photos (...);

-- Contractors
CREATE TABLE contractor_profiles (...);
CREATE TABLE contractor_specializations (...);
CREATE TABLE contractor_reviews (...);

-- VIP Projects
CREATE TABLE vip_projects (...);
CREATE TABLE wbs_nodes (...);
CREATE TABLE lots (...);
CREATE TABLE bids (...);
```

#### 1.2.2 Alembic Migrations

**Оценка:** 1 день

```bash
# Init
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial schema"

# Apply
alembic upgrade head

# Rollback
alembic downgrade -1
```

#### 1.2.3 SQLAlchemy ORM Models

**Оценка:** 3 дня

**Создать модели:**

- User, UserProfile
- Material, MaterialCategory
- WorkType, RegionalPrice
- Estimate, EstimateVersion, EstimateItem
- Order, OrderStage
- ContractorProfile, Review
- VipProject, WBSNode, Lot, Bid

#### 1.2.4 Materials Database

**Оценка:** 2 дня

**Material Model:**

```python
class Material(Base):
    __tablename__ = "materials"
    
    id = Column(UUID, primary_key=True)
    code = Column(String(50), unique=True)  # e.g., "MAT-001"
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Classification
    category_id = Column(UUID, ForeignKey("material_categories.id"))
    unit = Column(Enum(MeasureUnit))  # м, м², м³, шт, кг
    
    # Pricing
    base_price = Column(Numeric(12, 2))
    currency = Column(String(3), default="KZT")
    
    # Metadata
    specifications = Column(JSONB)  # { "diameter": 100, "material": "PVC" }
    is_active = Column(Boolean, default=True)
    
    # Relations
    category = relationship("MaterialCategory")
    regional_prices = relationship("RegionalPrice")
```

**Seed Data:**

```python
MATERIALS_SEED = [
    # Трубы
    {"code": "PIPE-PVC-100", "name": "Труба ПВХ ⌀100", "unit": "m", "base_price": 1500},
    {"code": "PIPE-PVC-150", "name": "Труба ПВХ ⌀150", "unit": "m", "base_price": 2200},
    {"code": "PIPE-HDPE-110", "name": "Труба ПНД ⌀110", "unit": "m", "base_price": 1800},
    
    # Материалы
    {"code": "SAND-RIVER", "name": "Песок речной", "unit": "m3", "base_price": 8000},
    {"code": "GRAVEL-20-40", "name": "Щебень фр. 20-40", "unit": "m3", "base_price": 12000},
    {"code": "CONCRETE-M200", "name": "Бетон М200", "unit": "m3", "base_price": 45000},
    
    # Работы
    {"code": "WORK-TRENCH", "name": "Рытье траншеи", "unit": "m3", "base_price": 3500},
    {"code": "WORK-PIPE-LAY", "name": "Укладка трубы", "unit": "m", "base_price": 800},
    {"code": "WORK-BACKFILL", "name": "Обратная засыпка", "unit": "m3", "base_price": 1500},
]
```

#### 1.2.5 Regional Pricing

**Оценка:** 2 дня

**RegionalPrice Model:**

```python
class RegionalPrice(Base):
    __tablename__ = "regional_prices"
    
    id = Column(UUID, primary_key=True)
    material_id = Column(UUID, ForeignKey("materials.id"))
    region = Column(String(50))  # "almaty", "astana", "shymkent"
    
    price = Column(Numeric(12, 2))
    coefficient = Column(Numeric(4, 2), default=1.0)  # Региональный коэффициент
    
    valid_from = Column(Date)
    valid_to = Column(Date)
    
    supplier_id = Column(UUID, ForeignKey("suppliers.id"), nullable=True)
```

**Regions:**

```python
REGIONS = {
    "almaty": {"name": "Алматы", "coef": 1.0},
    "astana": {"name": "Астана", "coef": 1.15},
    "shymkent": {"name": "Шымкент", "coef": 0.95},
    "karaganda": {"name": "Караганда", "coef": 1.05},
    "aktobe": {"name": "Актобе", "coef": 1.10},
    # ... остальные регионы
}
```

---

## ✅ Definition of Done

### Sprint 1.1 (Auth)

- [ ] User can register with email/password
- [ ] User receives verification email
- [ ] User can login and receive JWT
- [ ] User can refresh token
- [ ] User can reset password
- [ ] Roles are enforced on endpoints
- [ ] OAuth login works

### Sprint 1.2 (Database)

- [ ] PostgreSQL running in Docker
- [ ] All tables created via migrations
- [ ] ORM models tested
- [ ] Materials seeded (100+ items)
- [ ] Regional prices for 5+ regions
- [ ] API endpoints for materials

---

## 🧪 Testing

### Unit Tests

```python
# tests/test_auth.py
def test_register_user():
    response = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePass123!",
        "role": "client"
    })
    assert response.status_code == 201
    assert "id" in response.json()

def test_login():
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "SecurePass123!"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
```

### Integration Tests

- Auth flow: register → verify → login → refresh → logout
- RBAC: client vs contractor vs admin access

---

## 🔗 Dependencies

### External Services

- **SendGrid** — email delivery
- **Mobizon** — SMS
- **Google Cloud** — OAuth
- **Yandex ID** — OAuth

### Libraries

```
fastapi>=0.100.0
uvicorn[standard]>=0.22.0
sqlalchemy>=2.0.0
alembic>=1.11.0
asyncpg>=0.28.0
pydantic>=2.0.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6
httpx>=0.24.0
```

---

## 📊 Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Email deliverability | High | Medium | Use SendGrid, SPF/DKIM |
| OAuth quota limits | Medium | Low | Cache tokens, rate limit |
| DB performance | High | Low | Proper indexing |
| Security breach | Critical | Low | Audit, penetration testing |

---

## 📅 Timeline

```
Week 1 ━━━━━━━━━━━━━━━━━━━━━━━━━━
  Mon  │ FastAPI setup, Docker
  Tue  │ User model, DB schema
  Wed  │ Registration endpoint
  Thu  │ Login/JWT endpoints
  Fri  │ Email verification

Week 2 ━━━━━━━━━━━━━━━━━━━━━━━━━━
  Mon  │ Password reset
  Tue  │ RBAC implementation
  Wed  │ OAuth Google
  Thu  │ OAuth Yandex
  Fri  │ Testing & docs

Week 3 ━━━━━━━━━━━━━━━━━━━━━━━━━━
  Mon  │ PostgreSQL schema
  Tue  │ Alembic migrations
  Wed  │ ORM models (Part 1)
  Thu  │ ORM models (Part 2)
  Fri  │ ORM models (Part 3)

Week 4 ━━━━━━━━━━━━━━━━━━━━━━━━━━
  Mon  │ Materials database
  Tue  │ Materials seeding
  Wed  │ Regional prices
  Thu  │ API endpoints
  Fri  │ Integration tests
```

---

*Последнее обновление: 2026-01-30*
