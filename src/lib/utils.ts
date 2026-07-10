export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function calcItemTotal(item: {
  price: number
  quantity: number
  discount: number
  discountType: string
}): number {
  const gross = item.price * item.quantity
  if (!item.discount) return gross
  if (item.discountType === 'percent') return gross * (1 - item.discount / 100)
  return Math.max(0, gross - item.discount)
}

export function calcQuoteTotal(
  items: Array<{ price: number; quantity: number; discount: number; discountType: string }>,
  discount: number,
  discountType: string
): { subtotal: number; discountAmount: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + calcItemTotal(item), 0)
  const discountAmount =
    discountType === 'percent' ? subtotal * (discount / 100) : Math.min(discount, subtotal)
  return { subtotal, discountAmount, total: subtotal - discountAmount }
}

export const ITEM_TYPE_LABELS: Record<string, string> = {
  SERVICE: 'Serviço',
  PACKAGE: 'Pacote',
  DAILY: 'Diária',
  UNIQUE: 'Serviço único',
  PRODUCT: 'Produto',
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviado',
  VIEWED: 'Visualizado',
  SIGNED: 'Assinado',
  DECLINED: 'Recusado',
  PAID: 'Pago',
}

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-zinc-400 bg-zinc-800',
  SENT: 'text-blue-400 bg-blue-900/40',
  VIEWED: 'text-yellow-400 bg-yellow-900/40',
  SIGNED: 'text-green-400 bg-green-900/40',
  DECLINED: 'text-red-400 bg-red-900/40',
  PAID: 'text-[#e8b84b] bg-[#e8b84b]/10',
}
