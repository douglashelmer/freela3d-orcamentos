FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npx prisma generate

ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

RUN npm run build

RUN npm prune --production

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["node_modules/.bin/next", "start", "--port", "3000"]
