// Khi dev: gọi đường dẫn tương đối, Vite proxy chuyển tiếp sang VITE_SERVER_URL.
// Khi build production: gọi thẳng VITE_SERVER_URL (server cần bật CORS).
export const SERVER_URL: string = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:8000'

export const API_BASE_URL = `${import.meta.env.DEV ? '' : SERVER_URL.replace(/\/$/, '')}/api/v1`
