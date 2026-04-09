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
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 8, borderTop: '1px solid #E5E7EB', paddingTop: 10 },
  signatureArea: { marginTop: 60, flexDirection: 'row', justifyContent: 'space-between' },
  signatureLine: { width: '45%', borderTop: '1px solid #111827', paddingTop: 4, textAlign: 'center' },
  stageBox: { padding: 8, border: '1px solid #E5E7EB', borderRadius: 4, marginBottom: 4 }
})

export default function OrdemServicoPDF({ project, stages }: { project: any, stages: any[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>PROBlind</Text>
            <Text style={styles.subtitle}>Ordem de Serviço - Controle Interno</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>OS #{project.id.split('-')[0].toUpperCase()}</Text>
            <Text style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>Data O.S.: {new Date().toLocaleDateString('pt-BR')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação do Veículo e Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{project.customer_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Veículo/Placa:</Text>
            <Text style={styles.value}>{project.vehicle_model || '-'} / {project.plate || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Chassi:</Text>
            <Text style={styles.value}>{project.chassis || 'Não informado'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Odômetro:</Text>
            <Text style={styles.value}>{project.odometer_entry ? project.odometer_entry + ' km' : 'Não informado'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Previsão Entrega:</Text>
            <Text style={styles.value}>{project.expected_delivery_date ? new Date(project.expected_delivery_date).toLocaleDateString('pt-BR') : '-'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Roteiro de Produção (Etapas)</Text>
          {stages.map((stage: any, idx: number) => (
            <View key={idx} style={styles.stageBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: 'bold', color: '#111827' }}>{idx + 1}. {stage.stage_name}</Text>
                <Text style={{ color: '#64748B' }}>[   ] Concluído</Text>
              </View>
              <Text style={{ fontSize: 8, color: '#9CA3AF', marginTop: 4 }}>Responsável: ___________________________   Data: ___/___/20___</Text>
            </View>
          ))}
        </View>

        <View style={styles.signatureArea}>
          <View style={styles.signatureLine}>
            <Text>Recebedor / Gestor</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text>Técnico Responsável (Qualidade)</Text>
          </View>
        </View>

        <Text style={styles.footer}>Ordem de serviço gerada eletronicamente. PROBlind CRM.</Text>
      </Page>
    </Document>
  )
}
