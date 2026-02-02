FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Tạo thư mục uploads và file db trống nếu chưa có
RUN mkdir -p public/uploads
EXPOSE 1506
CMD ["node", "app.js"]