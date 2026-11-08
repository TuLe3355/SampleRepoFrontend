# RUN Frontend

Yêu cầu: Node.js >= 20, backend đang chạy (mặc định `http://localhost:8000`).

```shell
cd frontend
npm install
npm run dev
```

Mở http://localhost:5173

## Đổi server URL

Sửa biến `VITE_SERVER_URL` trong file `frontend/.env`, rồi chạy lại `npm run dev`:

```env
VITE_SERVER_URL=http://localhost:8000
```

## Build

```shell
cd frontend
npm run build
npm run preview
```

> Lưu ý: khi dev, request `/api` được Vite proxy sang `VITE_SERVER_URL`. Bản build gọi thẳng server nên backend cần bật CORS.
