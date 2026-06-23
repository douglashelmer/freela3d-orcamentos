import { NextResponse } from 'next/server'

type Ctx = { params: Promise<{ cep: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const { cep: rawCep } = await params
  const cep = rawCep.replace(/\D/g, '')
  if (cep.length !== 8) return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })

  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { cache: 'force-cache' })
  const data = await res.json()
  if (data.erro) return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 })

  return NextResponse.json({
    address: data.logradouro,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf,
  })
}
