import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from '../modules/users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const hashedPassword = bcrypt.hashSync('aivacol123', 10);
  const mockUser = {
    id: '1',
    nickname: 'aivacol',
    name: 'Usuário Aivacol',
    email: 'aivacol@aivacol.com',
    password: hashedPassword,
  };

  const qbMock = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockUserRepo = {
    createQueryBuilder: jest.fn(() => qbMock),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('fake.jwt.token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('deve retornar access_token e dados do usuário com credenciais válidas', async () => {
      qbMock.getOne.mockResolvedValue(mockUser);

      const result = await service.login('aivacol', 'aivacol123');

      expect(result.access_token).toBe('fake.jwt.token');
      expect(result.user).toEqual({
        id: mockUser.id,
        nickname: mockUser.nickname,
        name: mockUser.name,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        nickname: mockUser.nickname,
      });
    });

    it('deve lançar UnauthorizedException se o usuário não existir', async () => {
      qbMock.getOne.mockResolvedValue(null);

      await expect(service.login('inexistente', 'qualquer')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException se a senha estiver incorreta', async () => {
      qbMock.getOne.mockResolvedValue(mockUser);

      await expect(service.login('aivacol', 'senha-errada')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve retornar a mesma mensagem de erro para usuário inexistente e senha incorreta', async () => {
      qbMock.getOne.mockResolvedValueOnce(null);
      const errorForMissingUser = await service
        .login('inexistente', 'qualquer')
        .catch((err) => err.message);

      qbMock.getOne.mockResolvedValueOnce(mockUser);
      const errorForWrongPassword = await service
        .login('aivacol', 'senha-errada')
        .catch((err) => err.message);

      expect(errorForMissingUser).toBe(errorForWrongPassword);
    });
  });
});
