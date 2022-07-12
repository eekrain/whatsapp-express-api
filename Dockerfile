FROM node:16.16.0-buster

RUN apt-get update && \
  apt-get install -y \
  chromium \
  libatk-bridge2.0-0 \
  libxkbcommon0 \
  libwayland-client0 \
  libgtk-3-0 && \
  rm -rf /var/lib/apt/lists/*

COPY package.json .
COPY yarn.lock .

RUN yarn

COPY index.ts .
COPY tsconfig.json .
COPY ./routes ./routes
COPY ./types ./types
COPY ./graphql ./graphql
COPY ./utils ./utils

RUN yarn build

EXPOSE 5000

CMD ["yarn", "start"]