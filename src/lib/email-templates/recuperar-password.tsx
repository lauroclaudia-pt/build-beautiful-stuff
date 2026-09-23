import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  nome?: string
  link?: string
  minutos?: number
  motivo?: 'CRIAR' | 'RECUPERAR'
}

const Email = ({ nome, link, minutos = 30, motivo = 'RECUPERAR' }: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>
      {motivo === 'CRIAR'
        ? 'Defina a palavra-passe da sua conta'
        : 'Recuperação da palavra-passe'}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {motivo === 'CRIAR' ? 'Definir palavra-passe' : 'Recuperar palavra-passe'}
        </Heading>
        <Text style={p}>{nome ? `Olá ${nome},` : 'Olá,'}</Text>
        <Text style={p}>
          Recebemos um pedido para {motivo === 'CRIAR' ? 'criar' : 'redefinir'} a palavra-passe
          da sua conta no portal de Recrutamento do IPMA, I.P. Clique no botão abaixo para
          escolher uma nova palavra-passe.
        </Text>
        {link ? (
          <Button style={button} href={link}>
            Definir palavra-passe
          </Button>
        ) : null}
        <Text style={small}>
          Esta ligação é pessoal e expira em {minutos} minutos. Se não pediu esta alteração,
          ignore este email — a sua palavra-passe atual mantém-se.
        </Text>
        <Text style={small}>Recrutamento IPMA, I.P.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Definição da palavra-passe — Recrutamento IPMA',
  displayName: 'Recuperar palavra-passe',
  previewData: { nome: 'Cláudia Lauro', link: 'https://exemplo.pt/definir-password?token=abc', minutos: 30 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Archivo, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', color: '#2C3987', margin: '0 0 12px' }
const p = { fontSize: '15px', lineHeight: '24px', color: '#1c1c1c' }
const small = { fontSize: '13px', lineHeight: '20px', color: '#5a5a5a' }
const button = {
  backgroundColor: '#2C3987',
  color: '#ffffff',
  borderRadius: '10px',
  padding: '12px 20px',
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '8px 0 16px',
}
