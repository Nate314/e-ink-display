FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json main.ts ./
RUN npx tsc && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# main.ts writes img.bmp to the working directory.
RUN chown node:node /app
USER node
CMD ["node", "dist/main.js"]
