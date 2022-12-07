FROM node:16
LABEL AUTHOR="douqiting"
EXPOSE 3000/tcp
EXPOSE 80/tcp
ENV RUNNING_ENV=production
RUN echo "RUNNING_ENV: ${RUNNING_ENV}"
ENV NODE_ENV production
ENV workpath=/home
WORKDIR ${workpath}
RUN echo node -v
COPY . ${workpath}
# RUN rm -rf node_modules
# 设置apt镜像
RUN sed -i s@/archive.ubuntu.com/@/mirrors.aliyun.com/@g /etc/apt/sources.list && \
sed -i s@/deb.debian.org/@/mirrors.aliyun.com/@g /etc/apt/sources.list && \
sed -i s@/security.debian.org/@/mirrors.aliyun.com/@g /etc/apt/sources.list && \
apt-get clean && \
apt-get update

RUN apt-get install -qq build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
# RUN npm i cnpm -g
# RUN npm i pm2 -g
COPY package.json ${workpath}
COPY yarn.lock ${workpath}
RUN yarn config set registry https://registry.npm.taobao.org/
RUN yarn install --no-cache
# RUN cnpm i canvas --no-cache
RUN yarn build
VOLUME [ "/home/whiteboard-web", "/home/server-logs" ]
# CMD ["npm", "run", "build:prod:${running_env}"]
CMD npm run start:prod:${RUNNING_ENV}

# FROM node:16
# LABEL AUTHOR="douqiting"
# EXPOSE 3000/tcp
# EXPOSE 80/tcp
# ENV NODE_ENV production
# ENV workpath=/home
# WORKDIR ${workpath}
# RUN echo node -v
# COPY . ${workpath}
# RUN yarn --no-cache
# # RUN cnpm i canvas --no-cache
# RUN yarn build
# # VOLUME [ "/home/whiteboard-web", "/home/server-logs" ]
# CMD [ "node", "dist/main" ]