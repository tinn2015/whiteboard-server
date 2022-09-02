FROM node:16
LABEL AUTHOR="douqiting"
EXPOSE 3000/tcp
EXPOSE 80/tcp
ENV NODE_ENV production
ENV workpath=/home
WORKDIR ${workpath}
RUN echo node -v
COPY . ${workpath}
RUN rm -rf node_modules
RUN apt-get update \
    && apt-get install -qq build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
# RUN npm i cnpm -g
# RUN npm i pm2 -g
COPY package.json yarn.lock ${workpath}
RUN yarn install --no-cache
# RUN cnpm i canvas --no-cache
RUN yarn build
VOLUME [ "/home/whiteboard-web", "/home/server-logs" ]
CMD [ "node", "dist/main.js" ]

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