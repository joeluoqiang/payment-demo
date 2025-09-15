#!/bin/bash
set -e

echo "Building Go application..."
go build -o main cmd/server/main.go
echo "Build completed successfully!"