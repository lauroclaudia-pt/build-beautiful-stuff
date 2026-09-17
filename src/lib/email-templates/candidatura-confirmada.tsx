import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import type { TemplateEntry } from './registry'

interface Props {
  nome?: string
  vagaTitulo?: string
  referencia?: string
  prazo?: string
}

export function CandidaturaConfirmada({
  nome = 'Candidato(a)',
  vagaTitulo = 'Procedimento concursal',
  referencia = 'BEP-000000',
  prazo = 'conforme aviso de abertura',
}: Props) {
  return (
    <Html lang="pt">
      <Head />
      <Preview>{`Recebemos a sua candidatura — ${referencia}`}</Preview>
      <Body style={{ backgroundColor: '#f4f6fa', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '600px', padding: '32px' }}>
          <Text style={{ color: '#2C3987', fontSize: '12px', letterSpacing: '2px', margin: 0 }}>
            IPMA · RECRUTAMENTO
          </Text>
          <Heading style={{ color: '#000000', fontSize: '22px', margin: '12px 0 16px' }}>
            Candidatura recebida
          </Heading>
          <Text style={{ color: '#1f2430', fontSize: '15px', lineHeight: '24px' }}>
            Caro(a) {nome}, confirmamos a receção da sua candidatura ao procedimento{' '}
            <strong>{vagaTitulo}</strong>.
          </Text>
          <Section style={{ backgroundColor: '#f4f6fa', borderRadius: '8px', margin: '20px 0', padding: '16px' }}>
            <Text style={{ color: '#2C3987', fontSize: '14px', margin: '0 0 6px' }}>
              Referência: <strong>{referencia}</strong>
            </Text>
            <Text style={{ color: '#2C3987', fontSize: '14px', margin: 0 }}>
              Prazo do procedimento: {prazo}
            </Text>
          </Section>
          <Text style={{ color: '#1f2430', fontSize: '15px', lineHeight: '24px' }}>
            Pode acompanhar o estado da sua candidatura e dos seus documentos no portal do candidato.
            Será notificado(a) por email sempre que o procedimento avançar de fase.
          </Text>
          <Hr style={{ borderColor: '#e3e7ef', margin: '24px 0' }} />
          <Text style={{ color: '#6b7280', fontSize: '12px', lineHeight: '18px' }}>
            Esta mensagem é automática. Para esclarecimentos, contacte a Divisão de Recursos Humanos do IPMA.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: CandidaturaConfirmada,
  displayName: 'Confirmação de candidatura',
  subject: (data: Record<string, any>) =>
    `Candidatura recebida — ${data['referencia'] ?? 'procedimento concursal'}`,
  previewData: {
    nome: 'Marta Costa',
    vagaTitulo: 'Técnico Superior — Meteorologia',
    referencia: 'BEP-123456',
    prazo: '30 de setembro de 2026',
  },
} satisfies TemplateEntry
