FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm install

# Source code mounted via volume
# COPY . .

# Expose Vite port (default 5173)
EXPOSE 5173

# Start Vite in host mode to be accessible from outside container
CMD ["npm", "run", "dev", "--", "--host"]
