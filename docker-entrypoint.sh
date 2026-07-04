#!/bin/sh

if [ "$1" = "npm" ] && [ "$2" = "run" ] && [ "$3" = "start:dev" ]; then
  echo "🗄️ Rodando as migrações do banco de dados"
  npm run migration:run

  echo "🌱 Rodando as seeds do banco de dados"
  npm run seed || true
fi

echo "🚀 Iniciando a aplicação"
exec "$@"