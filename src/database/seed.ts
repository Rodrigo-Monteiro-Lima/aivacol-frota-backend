import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/database.config';
import { User } from '../modules/users/entities/user.entity';
import { Model } from '../modules/models/entities/model.entity';
import { Vehicle } from '../modules/vehicles/entities/vehicle.entity';

dotenv.config();

interface SeedData {
  models: Array<{ name: string }>;
  vehicles: Array<{
    license_plate: string;
    chassis: string;
    renavam: string;
    year: number;
    model_name: string;
  }>;
}

async function seedUser(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const username = process.env.SEED_USER_USERNAME ?? 'aivacol';
  const plainPassword = process.env.SEED_USER_PASSWORD ?? 'aivacol123';

  const exists = await userRepo.findOne({ where: { nickname: username } });
  if (exists) {
    console.log(`[user] "${username}" já existe.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  await userRepo.save(
    userRepo.create({
      nickname: username,
      name: 'Usuário Aivacol',
      email: `${username}@aivacol.com`,
      password: hashedPassword,
      created_by: 'seed',
    }),
  );
  console.log(`[user] "${username}" criado.`);
}

async function seedVehicles(dataSource: DataSource): Promise<void> {
  const modelRepo = dataSource.getRepository(Model);
  const vehicleRepo = dataSource.getRepository(Vehicle);

  const filePath = path.join(__dirname, '../../seed_vehicles.json');
  const data: SeedData = JSON.parse(
    fs.readFileSync(filePath, 'utf-8'),
  ) as SeedData;

  const modelNameToId = new Map<string, string>();

  for (const modelData of data.models) {
    let model = await modelRepo.findOne({ where: { name: modelData.name } });
    if (!model) {
      model = await modelRepo.save(
        modelRepo.create({ name: modelData.name, created_by: 'seed' }),
      );
      console.log(`[model] "${modelData.name}" criado.`);
    }
    modelNameToId.set(modelData.name, model.id);
  }

  for (const vehicleData of data.vehicles) {
    try {
      const exists = await vehicleRepo.findOne({
        where: [
          { license_plate: vehicleData.license_plate },
          { chassis: vehicleData.chassis },
          { renavam: vehicleData.renavam },
        ],
      });
      if (exists) continue;

      const modelId = modelNameToId.get(vehicleData.model_name);
      if (!modelId) {
        console.warn(
          `[vehicle] model "${vehicleData.model_name}" não encontrado, pulando "${vehicleData.license_plate}".`,
        );
        continue;
      }

      await vehicleRepo.save(
        vehicleRepo.create({
          ...vehicleData,
          model_id: modelId,
          created_by: 'seed',
        }),
      );
      console.log(
        `[vehicle] "${vehicleData.license_plate}" criado com sucesso.`,
      );
    } catch (error) {
      console.log(error);
      console.error(
        `[vehicle] Erro ao inserir ${JSON.stringify(vehicleData)}: Dados únicos já existentes no banco.`,
      );
    }
  }
}

async function main() {
  const dataSource = new DataSource({
    ...typeOrmConfig(),
    entities: [User, Model, Vehicle],
  });
  await dataSource.initialize();

  await seedUser(dataSource);
  await seedVehicles(dataSource);

  await dataSource.destroy();
  console.log('Seed concluído.');
}

main().catch((err) => {
  console.error('Erro ao rodar seed:', err);
  process.exit(1);
});
