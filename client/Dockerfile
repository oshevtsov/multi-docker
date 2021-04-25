# Build phase
FROM node:alpine as builder
WORKDIR /home/app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# Run phase
FROM nginx

# Needed for AWS deployment
# AWS Beanstalk will map this port automatically for incoming traffic
EXPOSE 80

COPY --from=builder /home/app/build /usr/share/nginx/html

