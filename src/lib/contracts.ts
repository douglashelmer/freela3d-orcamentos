export const DEFAULT_CONTRACT_TEMPLATE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

IDENTIFICAÇÃO DAS PARTES CONTRATANTES

Pelo presente instrumento particular de Contrato, {{Nome do Prestador}}, com sede na {{Endereço do Prestador}}, {{Número do Endereço Prestador}} – {{Bairro do Prestador}}, na cidade de {{Cidade do Prestador}}, estado de {{Estado do Prestador}}, inscrito no CNPJ/CPF (MF) sob o n° {{CPF/CNPJ do Prestador}}, representado por {{Nome do Prestador}} (CONTRATADO)

e

{{Nome do Cliente}}, pessoa jurídica/física, com sede/residência em {{Endereço do Cliente}}, {{Número do Endereço Cliente}} – {{Bairro do Cliente}}, na {{Cidade do Cliente}} no estado de {{Estado do Cliente}}, inscrito no CNPJ/CPF sob o nº {{CPF/CNPJ do Cliente}}, neste ato representado por {{Representante do Cliente}}. (CONTRATANTE),

Ambas devidamente representadas na forma de seus respectivos Contratos Sociais, têm entre si justo e acordado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas e condições seguintes:

01 – DO OBJETO DO CONTRATO

1.1. O presente Contrato tem como objeto, a prestação pela CONTRATADO à CONTRATANTE, dos seguintes serviços:

Objetivo do projeto: {{Nome do Projeto}}

Serviços inclusos: {{Serviços Inclusos}}

02 – DO PRAZO DO CONTRATO

2.1. Esse Contrato vigorará entre as partes por prazo de:

{{Prazo do Contrato}}

podendo ser rescindido, mediante prévio aviso escrito com 60 (sessenta) dias de antecedência da finalização do prazo.

2.2. Durante o prazo de aviso-prévio, o CONTRATADO atenderá normalmente à CONTRATANTE, em todas as suas necessidades. Findo o prazo de aviso-prévio, a CONTRATANTE obriga-se a pagar todas as despesas que se vencerem após tal término, desde que por ela prévia e expressamente autorizadas.

03. DO PREÇO E CONDIÇÕES DE PAGAMENTO

Valor Total do Serviço: {{Valor Total}}
Valor do Desconto: {{Valor do Desconto}}
Valor do Serviço com desconto: {{Valor Final}}

Condição de Pagamento: {{Condições de Pagamento}}
Forma de Pagamento: {{Forma de Pagamento}}
Quantidade de Parcelas: {{Número de Parcelas}}

04 – DAS OBRIGAÇÕES DO CONTRATADO

a) Entregar o projeto no prazo estabelecido, sempre respeitando o escopo e as especificidades que o CONTRATANTE informou previamente para a consecução perfeita do serviço.

b) Entrar em contato com a CONTRATANTE sempre que precisar esclarecer alguma dúvida ou precisar de uma informação.

c) Informar sobre qualquer atraso na prestação de serviços, bem como a motivação dele.

d) Prestar o serviço com qualidade.

e) Eleger um representante para sempre estar em contato e esclarecer qualquer dúvida ou repassar informações para a parte CONTRATANTE.

05 – DAS OBRIGAÇÕES DA CONTRATANTE

a) Entregar os materiais e documentos que forem requeridos pelo CONTRATADO, conforme o prazo estabelecido nesse contrato, sob pena de atraso na conclusão do projeto, inexistindo qualquer responsabilidade para o CONTRATADO.

b) Eleger um representante para prestar esclarecimento e discutir dúvidas com a parte CONTRATADO.

c) Descrever com o maior número de características e funcionalidades possíveis ao projeto.

d) Efetuar os pagamentos na data acordada, sob pena de acréscimo de juros e multa.

e) Se for necessária a prestação de qualquer serviço externo ou que necessite de custos adicionais, inclusive ferramentas específicas, o pagamento será feito pelo CONTRATANTE.

f) Em caso de pagamento relacionado a cláusula anterior, o comprovante deverá ser anexo ao presente contrato e um termo aditivo que informe a motivação do pagamento.

g) Desenvolver com o CONTRATADO um cronograma exclusivo para o projeto, onde constarão as datas de entrega, produção e qualquer situação que precise estar prevista, com exceção daquelas imprevisíveis.

06 – DA CONFIDENCIALIDADE E DIREITOS AUTORAIS

6.1. Cada uma das partes, por si e por seus funcionários compromete-se a manter como confidenciais, os termos deste Contrato e de todas as outras informações e conhecimentos não públicos, recebidos em decorrência desse Contrato, objetivando sua execução, não podendo torná-las acessíveis a quaisquer terceiros sem concordância expressa da outra parte.

6.2 Pelo presente contrato, o CONTRATADO cede em favor do CONTRATANTE, com exclusividade, a totalidade dos direitos autorais de todo o trabalho desenvolvido em razão do presente contrato, podendo o CONTRATANTE editar, transformar, revender, replicar, alterar.

07 - DA NÃO EXCLUSIVIDADE

O CONTRATADO não atuará com exclusividade dentro do segmento do CONTRATANTE, podendo exercer sua atividade para outras empresas, ou efetuar negócios em nome e por conta própria.

08 – DAS RESPONSABILIDADES TRABALHISTAS

8.1. O presente Contrato não estabelece qualquer relação de emprego entre a CONTRATANTE e os empregados da CONTRATADO, sendo a última citada a única e exclusiva responsável pela contratação, pagamento e demissão de seus funcionários, durante o prazo de vigência desse Contrato.

8.2. O CONTRATADO compromete-se a cumprir fielmente a legislação trabalhista, previdenciária, fundiária e tributária, bem como as normas relativas à segurança e medicina do trabalho em relação aos seus empregados.

09 – DAS DISPOSIÇÕES GERAIS

9.1. É expressamente vedada a cessão ou transferência desse Contrato a terceiros, salvo de comum acordo entre as partes.

9.2. Todos os entendimentos sobre o andamento ou alteração do objeto, termos e condições desse Contrato, deverão ser mantidos por escrito, mediante Termos Aditivos assinados pelos representantes legais das partes, sendo certo que acordos verbais não produzirão quaisquer efeitos entre elas.

9.3. Esse Contrato foi ajustado dentro dos princípios da boa-fé e probidade, sem qualquer vício de consentimento.

10 – DA ASSINATURA

As partes aceitam que este contrato será assinado, atestando a sua integridade e validade jurídica.

11 – DO FORO

11.1. As partes elegem o foro da comarca de {{Cidade do Prestador}}, estado de {{Estado do Prestador}}, para dirimir questões decorrentes desse Contrato, com exclusão de qualquer outro por mais privilegiado que seja.

E por estarem justas e contratadas, as partes firmam o presente Contrato em 02 (Duas) vias de iguais teor e forma, perante as testemunhas abaixo, para que produza todos os efeitos de direito.

Data: {{Data}}


______________________________________________
{{Nome do Cliente}}
CONTRATANTE


______________________________________________
{{Nome do Prestador}}
CONTRATADO`

type ShortcodeData = {
  user: {
    name: string
    company?: string | null
    address?: string | null
    neighborhood?: string | null
    city?: string | null
    state?: string | null
    document?: string | null
  }
  contract: {
    clientName: string
    clientDocument?: string | null
    clientRepresentative?: string | null
    clientAddress?: string | null
    clientAddressNumber?: string | null
    clientNeighborhood?: string | null
    clientCity?: string | null
    clientState?: string | null
    projectName: string
    services?: string | null
    duration?: string | null
    totalValue: number
    discount: number
    finalValue: number
    installments: number
    paymentMethod: string
    paymentConditions: string
  }
}

export function applyShortcodes(template: string, data: ShortcodeData): string {
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const providerName = data.user.company || data.user.name

  return template
    .replace(/\{\{Nome do Prestador\}\}/g, providerName)
    .replace(/\{\{Endereço do Prestador\}\}/g, data.user.address || '')
    .replace(/\{\{Número do Endereço Prestador\}\}/g, '')
    .replace(/\{\{Bairro do Prestador\}\}/g, data.user.neighborhood || '')
    .replace(/\{\{Cidade do Prestador\}\}/g, data.user.city || '')
    .replace(/\{\{Estado do Prestador\}\}/g, data.user.state || '')
    .replace(/\{\{CPF\/CNPJ do Prestador\}\}/g, data.user.document || '')
    .replace(/\{\{Nome do Cliente\}\}/g, data.contract.clientName)
    .replace(/\{\{Endereço do Cliente\}\}/g, data.contract.clientAddress || '')
    .replace(/\{\{Número do Endereço Cliente\}\}/g, data.contract.clientAddressNumber || '')
    .replace(/\{\{Bairro do Cliente\}\}/g, data.contract.clientNeighborhood || '')
    .replace(/\{\{Cidade do Cliente\}\}/g, data.contract.clientCity || '')
    .replace(/\{\{Estado do Cliente\}\}/g, data.contract.clientState || '')
    .replace(/\{\{CPF\/CNPJ do Cliente\}\}/g, data.contract.clientDocument || '')
    .replace(/\{\{Representante do Cliente\}\}/g, data.contract.clientRepresentative || data.contract.clientName)
    .replace(/\{\{Nome do Projeto\}\}/g, data.contract.projectName)
    .replace(/\{\{Serviços Inclusos\}\}/g, data.contract.services || '')
    .replace(/\{\{Prazo do Contrato\}\}/g, data.contract.duration || '90 dias a partir da assinatura')
    .replace(/\{\{Valor Total\}\}/g, fmt(data.contract.totalValue))
    .replace(/\{\{Valor do Desconto\}\}/g, fmt(data.contract.discount))
    .replace(/\{\{Valor Final\}\}/g, fmt(data.contract.finalValue))
    .replace(/\{\{Condições de Pagamento\}\}/g, data.contract.paymentConditions)
    .replace(/\{\{Forma de Pagamento\}\}/g, data.contract.paymentMethod)
    .replace(/\{\{Número de Parcelas\}\}/g, String(data.contract.installments))
    .replace(/\{\{Data\}\}/g, today)
}

export const SHORTCODE_GROUPS = [
  {
    label: 'Dados do Prestador',
    codes: [
      { code: '{{Nome do Prestador}}', desc: 'Nome do Prestador' },
      { code: '{{Endereço do Prestador}}', desc: 'Endereço do Prestador' },
      { code: '{{Número do Endereço Prestador}}', desc: 'Número do Endereço' },
      { code: '{{Bairro do Prestador}}', desc: 'Bairro do Prestador' },
      { code: '{{Cidade do Prestador}}', desc: 'Cidade do Prestador' },
      { code: '{{Estado do Prestador}}', desc: 'Estado do Prestador' },
      { code: '{{CPF/CNPJ do Prestador}}', desc: 'CPF/CNPJ do Prestador' },
    ],
  },
  {
    label: 'Dados do Cliente',
    codes: [
      { code: '{{Nome do Cliente}}', desc: 'Nome do Cliente' },
      { code: '{{Endereço do Cliente}}', desc: 'Endereço do Cliente' },
      { code: '{{Número do Endereço Cliente}}', desc: 'Número do Endereço' },
      { code: '{{Bairro do Cliente}}', desc: 'Bairro do Cliente' },
      { code: '{{Cidade do Cliente}}', desc: 'Cidade do Cliente' },
      { code: '{{Estado do Cliente}}', desc: 'Estado do Cliente' },
      { code: '{{CPF/CNPJ do Cliente}}', desc: 'CPF/CNPJ do Cliente' },
      { code: '{{Representante do Cliente}}', desc: 'Representante do Cliente' },
    ],
  },
  {
    label: 'Dados do Projeto',
    codes: [
      { code: '{{Nome do Projeto}}', desc: 'Nome do Projeto' },
      { code: '{{Serviços Inclusos}}', desc: 'Serviços Inclusos' },
      { code: '{{Prazo do Contrato}}', desc: 'Prazo do Contrato' },
    ],
  },
  {
    label: 'Dados Financeiros',
    codes: [
      { code: '{{Valor Total}}', desc: 'Valor Total' },
      { code: '{{Valor do Desconto}}', desc: 'Valor do Desconto' },
      { code: '{{Valor Final}}', desc: 'Valor Final' },
      { code: '{{Condições de Pagamento}}', desc: 'Condições de Pagamento' },
      { code: '{{Forma de Pagamento}}', desc: 'Forma de Pagamento' },
      { code: '{{Número de Parcelas}}', desc: 'Número de Parcelas' },
    ],
  },
  {
    label: 'Outros',
    codes: [
      { code: '{{Data}}', desc: 'Data de geração' },
    ],
  },
]
