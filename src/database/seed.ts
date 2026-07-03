import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/database.config';
import { User } from '../modules/users/entities/user.entity';

dotenv.config();

async function seed() {
  const dataSource = new DataSource({ ...typeOrmConfig(), entities: [User] });
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const exists = await userRepo.findOne({ where: { nickname: 'aivacol' } });

  if (exists) {
    console.log('Usuário "aivacol" já existe.');
  } else {
    const hashedPassword = await bcrypt.hash('aivacol123', 10);
    await userRepo.save(
      userRepo.create({
        nickname: 'aivacol',
        name: 'Usuário Aivacol',
        email: 'aivacol@aivacol.com',
        password: hashedPassword,
        created_by: 'seed',
      }),
    );
    console.log('Usuário "aivacol" criado.');
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Erro ao rodar seed:', err);
  process.exit(1);
});
