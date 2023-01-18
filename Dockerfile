FROM node:14.21.1-alpine

RUN mkdir /root/.ssh

RUN mkdir -p /app/node_modules

WORKDIR /app

COPY . /app/

RUN npm install -y

EXPOSE 3333

CMD [ "sh" ]

# docker image build -f ./Dockerfile -t yess:local .
# docker run --name yess --privileged -d -it -p 3333:3333 -v $(pwd):/app yess:local
# docker exec -it yess sh
# node ace migration:run
# node ace serve