import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  nome?: string
  codigo?: string
  minutos?: number
}

const Email = ({ nome, codigo = '000000', minutos = 10 }: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>Código de confirmação de acesso</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Código de confirmação</Heading>
        <Text style={p}>{nome ? `Olá ${nome},` : 'Olá,'}</Text>
        <Text style={p}>
          Utilize o código abaixo para concluir o acesso ao portal de Recrutamento do IPMA, I.P.
        </Text>
        <Text style={code}>{codigo}</Text>
        <Text style={small}>
          O código expira em {minutos} minutos e só pode ser usado uma vez. Se não tentou entrar,
          altere a sua palavra-passe.
        </Text>
        <Text style={small}>Recrutamento IPMA, I.P.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Código de confirmação de acesso — Recrutamento IPMA',
  displayName: 'Código de acesso (2.º nível)',
  previewData: { nome: 'Cláudia Lauro', codigo: '481902', minutos: 10 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Archivo, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', color: '#2C3987', margin: '0 0 12px' }
const p = { fontSize: '15px', lineHeight: '24px', color: '#1c1c1c' }
const small = { fontSize: '13px', lineHeight: '20px', color: '#5a5a5a' }
const code = {
  fontSize: '34px',
  letterSpacing: '10px',
  fontWeight: 700,
  color: '#2C3987',
  margin: '16px 0',
}
