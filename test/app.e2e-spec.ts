import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  const seedUsername = process.env.SEED_USER_USERNAME ?? 'aivacol';
  const seedPassword = process.env.SEED_USER_PASSWORD ?? 'aivacol123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Autenticação e proteção de rotas', () => {
    it('deve retornar 401 ao acessar rota protegida sem token', () => {
      return request(app.getHttpServer()).get('/api/models').expect(401);
    });

    it('deve retornar 401 no login com credenciais inválidas', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          nickname: seedUsername,
          password: 'senha-errada',
        })
        .expect(401);
    });

    it('deve retornar 400 no login com payload inválido', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ nickname: seedUsername, password: '12' })
        .expect(400);
    });

    it('deve autenticar com credenciais válidas e retornar access_token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ nickname: seedUsername, password: seedPassword })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.nickname).toBe(seedUsername);
    });

    it('deve acessar rota protegida com token válido', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ nickname: seedUsername, password: seedPassword });

      const token = login.body.access_token;

      return request(app.getHttpServer())
        .get('/api/models')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('Fluxo de negócio: Brand -> Model -> Vehicle', () => {
    let token: string;
    let brandId: string;
    let modelId: string;
    let vehicleId: string;
    const uniqueSuffix = Date.now().toString().slice(-6);
    const chassis = (variant: string) =>
      `9BWZZZ377VT${uniqueSuffix.slice(0, 5)}${variant}`;

    beforeAll(async () => {
      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ nickname: seedUsername, password: seedPassword });
      token = login.body.access_token;
    });

    it('deve criar uma brand', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/brands')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Marca E2E ${uniqueSuffix}` })
        .expect(201);

      brandId = response.body.id;
      expect(brandId).toBeDefined();
    });

    it('deve criar um model vinculado à brand', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/models')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Modelo E2E ${uniqueSuffix}`, brand_id: brandId })
        .expect(201);

      modelId = response.body.id;
      expect(modelId).toBeDefined();
    });

    it('deve rejeitar criação de model sem brand_id', () => {
      return request(app.getHttpServer())
        .post('/api/models')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Modelo sem marca' })
        .expect(400);
    });

    it('deve criar um vehicle vinculado ao model', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          license_plate: `E2E${uniqueSuffix}`,
          chassis: chassis('A'),
          renavam: `999${uniqueSuffix}`,
          year: 2023,
          model_id: modelId,
        })
        .expect(201);

      vehicleId = response.body.id;
      expect(vehicleId).toBeDefined();
    });

    it('deve rejeitar vehicle com model_id inexistente', () => {
      return request(app.getHttpServer())
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          license_plate: `ZZZ${uniqueSuffix}`,
          chassis: chassis('B'),
          renavam: `888${uniqueSuffix}`,
          year: 2023,
          model_id: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);
    });

    it('deve rejeitar vehicle com placa duplicada', () => {
      return request(app.getHttpServer())
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          license_plate: `E2E${uniqueSuffix}`,
          chassis: chassis('C'),
          renavam: `777${uniqueSuffix}`,
          year: 2023,
          model_id: modelId,
        })
        .expect(409);
    });

    it('deve consultar o vehicle criado por id', () => {
      return request(app.getHttpServer())
        .get(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.license_plate).toBe(`E2E${uniqueSuffix}`);
        });
    });

    it('deve remover o vehicle criado', () => {
      return request(app.getHttpServer())
        .delete(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });

    it('deve rejeitar remoção de model com vehicle vinculado', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          license_plate: `LNK${uniqueSuffix}`,
          chassis: chassis('D'),
          renavam: `666${uniqueSuffix}`,
          year: 2023,
          model_id: modelId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/models/${modelId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);

      await request(app.getHttpServer())
        .delete(`/api/vehicles/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`);
    });

    afterAll(async () => {
      if (modelId) {
        await request(app.getHttpServer())
          .delete(`/api/models/${modelId}`)
          .set('Authorization', `Bearer ${token}`);
      }
      if (brandId) {
        await request(app.getHttpServer())
          .delete(`/api/brands/${brandId}`)
          .set('Authorization', `Bearer ${token}`);
      }
    });
  });
});
