FROM node:20

WORKDIR /usr/src/app


# Install dependencies strictly from lock file if available, or just install
# We use a volume for node_modules in dev, but copying package.json helps with image caching
COPY package*.json ./

# Install dependencies (including devDependencies)
RUN npm install --legacy-peer-deps

# Source code will be mounted via volume in docker-compose for dev
# COPY . . 

# Default command for development
CMD ["npm", "run", "start:dev"]
