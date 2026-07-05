# Aivacol · Backend de Gestão de Frota

Backend do módulo de Gestão de Frota, desenvolvido em NestJS + TypeORM + SQL Server, com autenticação JWT, cache em Redis, mensageria via RabbitMQ e auditoria em MongoDB.

## 🛠 Stack

- **Node.js** + **NestJS**
- **TypeORM** + **SQL Server**
- **JWT** (autenticação em todas as rotas, protegidas por padrão via guard global)
- **Redis** (cache de consultas de veículos, com invalidação automática)
- **RabbitMQ** (mensageria de eventos de veículos — bônus)
- **MongoDB** (auditoria de requisições — bônus)
- **Jest** (testes unitários e e2e)
- **Docker / Docker Compose**

## 📁 Estrutura do projeto

```
src/
├── auth/              # Login e estratégia JWT
├── common/            # Guards, decorators, entidade base
├── config/            # Configuração de banco de dados
├── database/          # DataSource (CLI), migrations e seed
├── redis/             # Módulo/serviço de cache
├── messaging/          # Publicação de eventos no RabbitMQ (bônus)
├── audit/              # Interceptor + service de auditoria no MongoDB (bônus)
└── modules/
    ├── models/         # CRUD de modelos de veículo
    ├── vehicles/        # CRUD de veículos + cache Redis + eventos
    ├── brands/           # CRUD de marcas — obrigatória para criar models (bônus)
    └── users/             # Entidade de usuário (usada na autenticação)

scripts/
├── init.sql                       # Cria o banco aivacol_frota no SQL Server
└── vehicle-events-consumer.ts     # Consumidor de exemplo dos eventos de vehicles

test/
└── app.e2e-spec.ts                # Testes de integração (auth + fluxo Brand→Model→Vehicle)
```

## ⚠️ Importante
O arquivo `.env` tem variáveis de host (`DB_HOST`, `REDIS_HOST`, `RABBITMQ_URL`, `MONGO_URL`) que **mudam de valor dependendo de onde a aplicação está rodando**:

| Variável | Rodando **fora** do Docker (aplicação local) | Rodando **dentro** do Docker Compose |
|---|---|---|
| `DB_HOST` | `localhost` | `sqlserver` |
| `REDIS_HOST` | `localhost` | `redis` |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | `amqp://guest:guest@rabbitmq:5672` |
| `MONGO_URL` | `mongodb://localhost:27017` | `mongodb://mongo:27017` |

**Por quê:** de fora do Docker, os contêineres só são alcançáveis via `localhost` + porta mapeada. De dentro de outro contêiner na mesma rede Docker, o nome do serviço é resolvido automaticamente pelo DNS interno do Compose.

## ▶️ Como rodar

### 1. Pré-requisitos
Docker e Docker Compose instalados.

### 2. Variáveis de ambiente
```bash
cp .env.example .env
```
Por padrão, o `.env.example` vem configurado para rodar a aplicação no **Docker**.

### 3A. Rodar tudo com Docker Compose (recomendado para avaliação rápida)

```bash
docker compose up -d --build
```

Isso sobe, nessa ordem de dependência:
1. `sqlserver`
2. `sqlserver-init`: roda `scripts/init.sql`, criando o banco `aivacol_frota`
3. `redis`, `rabbitmq`, `mongo`
4. `app`: só sobe depois que `sqlserver-init` terminar com sucesso e os demais serviços estiverem saudáveis. O entrypoint do contêiner já roda **migrations e seed automaticamente** antes de iniciar a aplicação
5. `aivacol-consumer`: processo separado, exemplo de consumidor dos eventos de `vehicles` publicados no RabbitMQ)

### 3B. Alternativa: rodar a aplicação localmente (fora do Docker)

Útil para desenvolvimento com hot-reload nativo do seu editor. Suba só a infraestrutura:
```bash
docker compose up -d sqlserver sqlserver-init redis rabbitmq mongo
```

Confirme que o `.env` está com `localhost` em `DB_HOST`, `REDIS_HOST`, e nas URLs de `RABBITMQ_URL`/`MONGO_URL` (é o padrão do `.env.example`). Depois:

```bash
npm install
npm run migration:run
npm run seed
npm run start:dev
```

## 🧪 Testes

### Unitários
```bash
npm test
npm run test:cov
```
Não dependem de infraestrutura externa, todas as dependências são mockadas.

### E2E

**Estes testes precisam de infraestrutura real rodando**, diferente dos unitários, eles fazem requisições HTTP de verdade contra a aplicação conectada ao banco real. Existem duas formas de rodar:

**Opção 1 — dentro do contêiner:**

Como o contêiner `app` já roda com as variáveis de ambiente apontando para os nomes de serviço corretos, basta entrar nele e rodar o teste lá dentro:

```bash
docker exec -it aivacol-app sh
npm run test:e2e
```

**Opção 2 — localmente:**

Se preferir rodar o e2e diretamente na sua máquina, a aplicação de teste vai tentar se conectar usando as variáveis do seu `.env` local, então elas **precisam estar com `localhost`**:

```bash
DB_HOST=localhost, 
REDIS_HOST=localhost,
RABBITMQ_URL=amqp://guest:guest@localhost:5672, 
MONGO_URL=mongodb://localhost:27017

docker compose up -d sqlserver sqlserver-init redis rabbitmq mongo
npm run migration:run
npm run seed
npm run test:e2e
```

## 🔒 Autenticação

Todas as rotas são protegidas por JWT por padrão (guard global), exceto `POST /api/auth/login`.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nickname":"aivacol","password":"aivacol123"}'
```

Use o `access_token` retornado no header `Authorization: Bearer <token>` nas demais requisições.

## 📌 Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Autenticação (pública) |
| GET/POST | `/api/models` | Listar / criar modelo (`brand_id` obrigatório) |
| GET/PATCH/DELETE | `/api/models/:id` | Consultar / atualizar / remover modelo |
| GET/POST | `/api/vehicles` | Listar (cacheado) / criar veículo |
| GET/PATCH/DELETE | `/api/vehicles/:id` | Consultar (cacheado) / atualizar / remover veículo |
| GET/POST | `/api/brands` | Bônus — listar / criar marca |
| GET/PATCH/DELETE | `/api/brands/:id` | Bônus — consultar / atualizar / remover marca |

### Coleção do Postman
Para facilitar a validação de todos os fluxos e cenários de testes manuais, foi incluído um arquivo de coleção do Postman pronto para uso na raiz do projeto aivacol.postman_collection.json

A coleção já possui Scripts de Teste (Tests) configurados na rota de login e na listagem de modelos. Eles capturam e atualizam dinamicamente as variáveis de ambiente do Postman (como USER_TOKEN e MODEL_ID), automatizando o fluxo de ponta a ponta sem que você precise copiar e colar IDs manualmente entre as requisições.

## ⚡ Cache Redis

Aplicado em `GET /vehicles` e `GET /vehicles/:id`. TTL configurável via `CACHE_TTL_SECONDS` no `.env` (padrão: 300s). Invalidado automaticamente em `POST`, `PATCH` e `DELETE` de veículos, tanto a chave da listagem quanto a do item específico.


## Brands
CRUD completo de marcas. `Model` exige uma `brand` associada, `brand_id`. Na prática, isso significa que uma `brand` precisa existir **antes** de qualquer `model` ser criado. O `seed.ts` já respeita essa ordem: cria `brands`, depois `models` associados, depois `vehicles`.

## Mensageria (RabbitMQ)
O `VehiclesService` publica eventos de domínio no exchange `aivacol.fleet` (tipo `topic`) sempre que um veículo é criado, atualizado ou removido:

| Routing key | Quando |
|---|---|
| `vehicle.created` | Após `POST /vehicles` |
| `vehicle.updated` | Após `PATCH /vehicles/:id` |
| `vehicle.deleted` | Após `DELETE /vehicles/:id` |



Um consumidor de exemplo, rodando como serviço `aivacol-consumer` no Compose escuta `vehicle.*` e loga cada evento recebido, demonstrando o fluxo produtor → RabbitMQ → consumidor de ponta a ponta. Painel de management disponível em `http://localhost:15672` (usuário/senha padrão: `guest`/`guest`).

## Auditoria (MongoDB)
Um interceptor global `AuditInterceptor` registra **toda** requisição HTTP na coleção `audit_logs` do banco `aivacol_audit`, contendo: método, rota, usuário autenticado, status code, duração em ms e timestamp.
