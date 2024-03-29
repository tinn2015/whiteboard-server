

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## docker

```bash
// pre
docker run -d -p 8090:3000 -p 80:80 -e RUNNING_ENV=production -v /home/whiteboard-web:/home/whiteboard-web -v /home/server-logs:/home/logs --restart=always image:tag
```

```bash
// pro
docker run -d -p 3000:3000 -p 8000:80 -e RUNNING_ENV=production -v /home/whiteboard-web:/home/whiteboard-web -v /home/server-logs:/home/logs --restart=always image:tag
```

## docker
```bash
// dev
docker run -d -p 9000:3000 -p 3030:80 -e RUNNING_ENV=development -v /home/nginx/html/dev:/home/whiteboard-web -v /home/server-logs:/home/logs --restart=always image:tag
```

## postgres
```bash

// local
docker run -d -e POSTGRES_PASSWORD=pass123 -e PGDATA=/var/lib/postgresql/data/pgdata -v /c/Users/douqiting01/Desktop/workspace/code/white-board/postgresql/pgdata:/var/lib/postgresql/data/pgdata -p 5432:5432  postgres

// dev
docker run -d -e POSTGRES_PASSWORD=pass123 -e PGDATA=/var/lib/postgresql/data/pgdata -v /home/whiteboard/postgresql/pgdata-dev:/var/lib/postgresql/data/pgdata -p 5433:5432 --restart=always postgres

// production
docker run -d -e POSTGRES_PASSWORD=pass123 -e PGDATA=/var/lib/postgresql/data/pgdata -v /home/whiteboard/postgresql/pgdata:/var/lib/postgresql/data/pgdata -p 5432:5432 --restart=always postgres

// production
docker run -d -e POSTGRES_PASSWORD=sH#wWJjU%RkzHP% -e PGDATA=/var/lib/postgresql/data/pgdata -v /home/whiteboard/postgresql/pgdata:/var/lib/postgresql/data/pgdata -p 5432:5432 --restart=always postgres
```

## 内网环境镜像仓库
172.25.10.100:5555/whiteboard:v1.0.6-alpha9