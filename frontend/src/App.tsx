import { useCallback, useEffect, useState } from 'react'
import { calculate, healthCheck, type Operation } from './api/client'
import { SERVER_URL } from './config'

const OP_SYMBOL: Record<Operation, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  modulo: 'mod',
  'integer-divide': 'div',
}

type HistoryItem = { expr: string; result: string }

type KeyDef =
  | { label: string; kind: 'digit' }
  | { label: string; kind: 'op'; op: Operation }
  | { label: string; kind: 'action'; action: 'clear' | 'back' | 'sign' | 'dot' | 'equals' }

const KEYS: KeyDef[] = [
  { label: 'C', kind: 'action', action: 'clear' },
  { label: '⌫', kind: 'action', action: 'back' },
  { label: 'mod', kind: 'op', op: 'modulo' },
  { label: 'div', kind: 'op', op: 'integer-divide' },
  { label: '7', kind: 'digit' },
  { label: '8', kind: 'digit' },
  { label: '9', kind: 'digit' },
  { label: '÷', kind: 'op', op: 'divide' },
  { label: '4', kind: 'digit' },
  { label: '5', kind: 'digit' },
  { label: '6', kind: 'digit' },
  { label: '×', kind: 'op', op: 'multiply' },
  { label: '1', kind: 'digit' },
  { label: '2', kind: 'digit' },
  { label: '3', kind: 'digit' },
  { label: '−', kind: 'op', op: 'subtract' },
  { label: '±', kind: 'action', action: 'sign' },
  { label: '0', kind: 'digit' },
  { label: '.', kind: 'action', action: 'dot' },
  { label: '+', kind: 'op', op: 'add' },
  { label: '=', kind: 'action', action: 'equals' },
]

const KEYBOARD_OPS: Record<string, Operation> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '%': 'modulo',
  '\\': 'integer-divide',
}

export default function App() {
  const [display, setDisplay] = useState('0')
  const [stored, setStored] = useState<number | null>(null)
  const [pendingOp, setPendingOp] = useState<Operation | null>(null)
  const [waiting, setWaiting] = useState(false) // đang chờ nhập số thứ 2
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState<boolean | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  // Health check định kỳ
  useEffect(() => {
    const check = () => healthCheck().then(setOnline)
    check()
    const id = setInterval(check, 5000)
    return () => clearInterval(id)
  }, [])

  const inputDigit = (d: string) => {
    setError(null)
    if (waiting) {
      setDisplay(d)
      setWaiting(false)
    } else {
      setDisplay((cur) => (cur === '0' ? d : cur.length < 16 ? cur + d : cur))
    }
  }

  const inputDot = () => {
    setError(null)
    if (waiting) {
      setDisplay('0.')
      setWaiting(false)
    } else if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const clear = () => {
    setDisplay('0')
    setStored(null)
    setPendingOp(null)
    setWaiting(false)
    setError(null)
  }

  const backspace = () => {
    if (waiting) return
    setDisplay((cur) => (cur.length > 1 && cur !== '-0' ? cur.slice(0, -1).replace(/^-$/, '0') : '0'))
  }

  const toggleSign = () => {
    setDisplay((cur) => (cur.startsWith('-') ? cur.slice(1) : cur === '0' ? cur : '-' + cur))
  }

  /** Gọi API tính stored (op) current, trả về kết quả hoặc null nếu lỗi */
  const compute = async (op: Operation, a: number, b: number): Promise<number | null> => {
    setLoading(true)
    setError(null)
    try {
      const result = await calculate(op, a, b)
      setHistory((h) => [{ expr: `${a} ${OP_SYMBOL[op]} ${b}`, result: String(result) }, ...h].slice(0, 20))
      return result
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      return null
    } finally {
      setLoading(false)
    }
  }

  const chooseOp = async (op: Operation) => {
    if (loading) return
    const current = parseFloat(display)
    if (stored !== null && pendingOp && !waiting) {
      const result = await compute(pendingOp, stored, current)
      if (result === null) return
      setStored(result)
      setDisplay(String(result))
    } else {
      setStored(current)
    }
    setPendingOp(op)
    setWaiting(true)
  }

  const equals = async () => {
    if (loading || stored === null || !pendingOp) return
    const result = await compute(pendingOp, stored, parseFloat(display))
    if (result === null) return
    setDisplay(String(result))
    setStored(null)
    setPendingOp(null)
    setWaiting(true)
  }

  const press = (k: KeyDef) => {
    if (k.kind === 'digit') return inputDigit(k.label)
    if (k.kind === 'op') return void chooseOp(k.op)
    switch (k.action) {
      case 'clear': return clear()
      case 'back': return backspace()
      case 'sign': return toggleSign()
      case 'dot': return inputDot()
      case 'equals': return void equals()
    }
  }

  // Hỗ trợ bàn phím
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) inputDigit(e.key)
      else if (e.key === '.' || e.key === ',') inputDot()
      else if (e.key in KEYBOARD_OPS) void chooseOp(KEYBOARD_OPS[e.key])
      else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); void equals() }
      else if (e.key === 'Backspace') backspace()
      else if (e.key === 'Escape') clear()
    },
    [display, stored, pendingOp, waiting, loading],
  )

  useEffect(() => {
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onKey])

  const exprLine = stored !== null && pendingOp ? `${stored} ${OP_SYMBOL[pendingOp]}` : ' '

  return (
    <main className="page">
      <div className="calculator">
        <header className="brand">
          <span>API-CALC</span>
          <span className={`led ${online === null ? '' : online ? 'on' : 'off'}`} title={SERVER_URL}>
            {online === null ? 'checking' : online ? 'online' : 'offline'}
          </span>
        </header>

        <div className="screen">
          <div className="expr">{exprLine}</div>
          <div className="value">{loading ? '…' : display}</div>
          <div className="error">{error ?? ' '}</div>
        </div>

        <div className="keys">
          {KEYS.map((k) => (
            <button
              key={k.label}
              className={`key ${k.kind} ${k.kind === 'action' ? k.action : ''} ${
                k.kind === 'op' && pendingOp === k.op && waiting ? 'active' : ''
              }`}
              onClick={() => press(k)}
              disabled={loading}
            >
              {k.label}
            </button>
          ))}
        </div>

        <footer className="server">Server: {SERVER_URL}</footer>
      </div>

      <aside className="history">
        <h2>Lịch sử</h2>
        {history.length === 0 ? (
          <p className="empty">Chưa có phép tính</p>
        ) : (
          <ul>
            {history.map((h, i) => (
              <li key={i}>
                <span>{h.expr}</span>
                <strong>= {h.result}</strong>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </main>
  )
}
