FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json main.ts ./
RUN npx tsc && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app/client-file-transfer
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# main.ts writes received images to ../img/img.bmp.
RUN mkdir /app/img && chown node:node /app/img
USER node
EXPOSE 8080
CMD ["node", "dist/main.js"]
