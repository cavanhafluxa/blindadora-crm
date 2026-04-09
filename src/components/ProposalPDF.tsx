import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { borderBottom: '2px solid #22C55E', paddingBottom: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#111827', borderBottom: '1px solid #E5E7EB', paddingBottom: 4 },
  row: { flexDirection: 'row', paddingVertical: 4 },
  label: { fontWeight: 'bold', color: '#64748B', width: 100 },
  value: { color: '#111827', flex: 1 },
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #E5E7EB', paddingBottom: 4, marginBottom: 4, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 4, borderBottom: '1px solid #F3F4F6' },
  colDesc: { flex: 1 },
  colQtd: { width: 40, textAlign: 'center' },
  colPrice: { width: 80, textAlign: 'right' },
  colTotal: { width: 80, textAlign: 'right' },
  totalBox: { marginTop: 20, alignItems: 'flex-end' },
  totalText: { fontSize: 16, fontWeight: 'bold', color: '#22C55E' },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 8, borderTop: '1px solid #E5E7EB', paddingTop: 10 },
  signatureArea: { marginTop: 60, flexDirection: 'row', justifyContent: 'space-between' },
  signatureLine: { width: '45%', borderTop: '1px solid #111827', paddingTop: 4, textAlign: 'center' },
})

export default function ProposalPDF({ proposal }: { proposal: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>PROBlind</Text>
            <Text style={styles.subtitle}>Especialistas em Blindagem Automotiva</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>PROPOSTA COMERCIAL</Text>
            <Text style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>ID: {proposal.id.split('-')[0]}</Text>
            <Text style={{ fontSize: 10, color: '#64748B' }}>Data: {new Date(proposal.created_at).toLocaleDateString('pt-BR')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Cliente e Veículo</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{proposal.customer_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Veículo:</Text>
            <Text style={styles.value}>{proposal.vehicle_model || 'Não informado'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nível Blindagem:</Text>
            <Text style={styles.value}>{proposal.armor_level || 'Não informado'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Validade:</Text>
            <Text style={styles.value}>{proposal.validity_days} dias</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição dos Serviços e Itens</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Descrição</Text>
            <Text style={styles.colQtd}>Qtd</Text>
            <Text style={styles.colPrice}>Vlr. Unitário</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {proposal.items.map((item: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQtd}>{item.quantity}</Text>
              <Text style={styles.colPrice}>R$ {Number(item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
              <Text style={styles.colTotal}>R$ {(item.quantity * item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </View>
          ))}
          <View style={styles.totalBox}>
            <Text style={styles.totalText}>Valor Total: R$ {Number(proposal.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {proposal.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações Gerais</Text>
            <Text style={{ fontStyle: 'italic', color: '#64748B' }}>{proposal.notes}</Text>
          </View>
        )}

        <View style={styles.signatureArea}>
          <View style={styles.signatureLine}>
            <Text>{proposal.customer_name}</Text>
            <Text style={{ color: '#64748B', fontSize: 8 }}>Cliente</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text>PROBlind</Text>
            <Text style={{ color: '#64748B', fontSize: 8 }}>Departamento Comercial</Text>
          </View>
        </View>

        <Text style={styles.footer}>Este documento é uma proposta comercial e está sujeito a avaliação técnica do veículo.</Text>
      </Page>
    </Document>
  )
}
