# Build the application
all: build

build:
	@echo "Building..."
	
	@pnpm build

# Run the application
run:
	@pnpm dev


# Open db studio
db-studio:
	@pnpm db:studio

db-seed:
	@pnpm db:seed

# Runs tests
test:
	@pnpm test

# Create DB container
docker-run:
	@if docker compose up 2>/dev/null; then \
		: ; \
	else \
		echo "Falling back to Docker Compose V1"; \
		docker-compose up; \
	fi

# Shutdown DB container
docker-down:
	@if docker compose down 2>/dev/null; then \
		: ; \
	else \
		echo "Falling back to Docker Compose V1"; \
		docker-compose down; \
	fi

# Clean the binary
clean:
	@echo "Cleaning..."
	@rm -f .next


.PHONY: all build run clean db-seed db-studio test 
