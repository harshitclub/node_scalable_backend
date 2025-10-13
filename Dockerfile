# Step 1: Use Node 20 LTS as base image
FROM node:20-alpine

# Step 2: Set working directory inside container
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Step 4: Install all dependencies
RUN npm install

# Step 5: Copy the rest of the project (including prisma folder)
COPY . .

# Step 7: Build TypeScript
RUN npm run build

# Step 8: Expose port your app runs on
EXPOSE 5000

# Step 9: Start app with PM2 in production
CMD ["npm", "run", "start:prod"]