#!/bin/sh
set -e

echo "Running Prisma migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Running seed..."
node prisma/seed.js

echo "Starting server..."
exec node dist/server.js
