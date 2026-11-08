import { API_BASE_URL } from '../config'

export type Operation = 'add' | 'subtract' | 'multiply' | 'divide' | 'modulo' | 'integer-divide'

/** Các phép chỉ nhận số nguyên ở backend */
export const INTEGER_OPS: Operation[] = ['modulo', 'integer-divide']

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`)
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = body?.detail
    const msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail[0]?.msg : null
    throw new Error(msg || `HTTP ${res.status}`)
  }
  return body as T
}

export async function healthCheck(): Promise<boolean> {
  try {
    return (await request<string>('/health')) === 'OK'
  } catch {
    return false
  }
}

export async function calculate(op: Operation, a: number, b: number): Promise<number> {
  const params = new URLSearchParams({ a: String(a), b: String(b) })
  const data = await request<{ result: number }>(`/calculator/${op}?${params}`)
  return data.result
}
