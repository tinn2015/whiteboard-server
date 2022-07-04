FROM node:16-alpine
LABEL AUTHOR="douqiting"
EXPOSE 3000/tcp
EXPOSE 80/tcp
ENV NODE_ENV production
ENV workpath=/home
WORKDIR ${workpath}
RUN echo node -v
COPY package.json yarn.lock ${workpath}
RUN yarn
COPY . ${workpath}
RUN yarn build
CMD [ "node", "dist/main" ]