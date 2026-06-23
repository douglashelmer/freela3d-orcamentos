export type SectionType = 'TEXT' | 'IMAGES' | 'TERMS'
export type ItemType = 'SERVICE' | 'PACKAGE' | 'DAILY' | 'UNIQUE' | 'PRODUCT'
export type QuoteStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'SIGNED' | 'DECLINED' | 'PAID'
export type DiscountType = 'percent' | 'fixed'

export interface BuilderClient {
  id?: string
  name: string
  email: string
  phone: string
  company: string
  document: string
  address: string
}

export interface BuilderImage {
  id: string
  url: string
  name: string
  order: number
}

export interface BuilderSection {
  id: string
  type: SectionType
  title: string
  content: string
  images: BuilderImage[]
  order: number
}

export interface BuilderItem {
  id: string
  name: string
  description: string
  type: ItemType
  quantity: number
  unit: string
  price: number
  discount: number
  discountType: DiscountType
  order: number
}

export interface QuoteBuilderState {
  title: string
  serialNumber: boolean
  client: BuilderClient | null
  sections: BuilderSection[]
  items: BuilderItem[]
  discount: number
  discountType: DiscountType
  notes: string
  validUntil: string
  paymentMethods: string[]
}
