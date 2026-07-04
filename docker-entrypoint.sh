#!/bin/sh

echo "🗄️ Rodando as migrações do banco de dados (Migration)..."
npm run migration:run

echo "🌱 Rodando as sementes do banco de dados (Seed)..."
npm run seed || true

echo "🚀 Iniciando a aplicação NestJS..."
exec "$@"