import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftRight, CalendarClock, CircleAlert, CircleCheck, Star, TrendingUp } from 'lucide-react-native';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import {
  Emprestimo,
  formatarData,
  indiceCircularidade,
  meusEmprestimos,
  registrarDevolucao,
} from '../services/emprestimos';

/**
 * Meus empréstimos (Fase 6).
 *
 * A tela só lista e envia. Quem valida prazo, estado do item e reputação é o
 * Oracle: a devolução chama PRC_SH_REGISTRA_DEVOLUCAO e o indicador do topo
 * vem de FN_SH_INDICE_CIRCULARIDADE.
 */
export default function MyLoansScreen() {
  const { currentUser } = useAuth();
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [indice, setIndice] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<Emprestimo | null>(null);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  // Mesma ideia da tela de detalhe: a mensagem da procedure fica visivel na
  // tela, porque o Alert nao aparece na versao web.
  const [retorno, setRetorno] = useState<{ ok: boolean; texto: string } | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const lista = await meusEmprestimos();
      setEmprestimos(lista);
      try {
        const resumo = await indiceCircularidade();
        setIndice(Number(resumo?.indiceCircularidade ?? 0));
      } catch {
        setIndice(null);
      }
    } catch (e: any) {
      setErro(e.message ?? String(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const confirmarDevolucao = async () => {
    if (!selecionado) return;
    setEnviando(true);
    setRetorno(null);
    try {
      const resultado = await registrarDevolucao(selecionado.id, nota, comentario.trim() || undefined);
      setSelecionado(null);
      setComentario('');
      setNota(5);
      await carregar();
      const texto = resultado?.message ?? 'Devolução registrada.';
      setRetorno({ ok: true, texto });
      Alert.alert('Smart HAS', texto);
    } catch (e: any) {
      const texto = e.message ?? String(e);
      setSelecionado(null);
      setRetorno({ ok: false, texto });
      Alert.alert('Smart HAS', texto);
    } finally {
      setEnviando(false);
    }
  };

  const souOSolicitante = (item: Emprestimo) => item.borrowerId === currentUser?.id;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator color={colors.primaryBlue} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={carregar} />}
        >
          <View style={styles.indicadorCard}>
            <View style={styles.indicadorIcone}>
              <TrendingUp color={colors.white} size={20} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.indicadorTitulo}>Índice de circularidade</Text>
              <Text style={styles.indicadorLegenda}>
                Empréstimos concedidos por item publicado no mês, calculado no banco
              </Text>
            </View>
            <Text style={styles.indicadorValor}>{indice != null ? indice.toFixed(2) : '-'}</Text>
          </View>

          {retorno && (
            <View style={[styles.retorno, retorno.ok ? styles.retornoOk : styles.retornoErro]}>
              {retorno.ok ? (
                <CircleCheck color={colors.secondaryGreen} size={18} />
              ) : (
                <CircleAlert color={colors.danger} size={18} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.retornoTexto}>{retorno.texto}</Text>
                <Text style={styles.retornoFonte}>
                  {retorno.ok
                    ? 'Mensagem devolvida por PRC_SH_REGISTRA_DEVOLUCAO'
                    : 'Regra recusada pelo Oracle'}
                </Text>
              </View>
            </View>
          )}

          {erro && (
            <View style={styles.erroBox}>
              <CircleAlert color={colors.danger} size={18} />
              <Text style={styles.erroTexto}>{erro}</Text>
            </View>
          )}

          {emprestimos.length === 0 && !erro ? (
            <View style={styles.vazio}>
              <ArrowLeftRight color={colors.grey300} size={36} strokeWidth={1.5} />
              <Text style={styles.vazioTexto}>Você ainda não tem empréstimos registrados.</Text>
            </View>
          ) : (
            emprestimos.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTopo}>
                  <Text style={styles.cardTitulo}>{item.resourceTitle}</Text>
                  <View style={[styles.status, statusEstilo(item.status)]}>
                    <Text style={styles.statusTexto}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.cardLinha}>
                  {souOSolicitante(item) ? `Emprestado por ${item.ownerName}` : `Com ${item.borrowerName}`}
                </Text>
                <View style={styles.cardDatas}>
                  <CalendarClock color={colors.grey600} size={15} />
                  <Text style={styles.cardData}>
                    Pedido em {formatarData(item.requestedAt)} · devolver até {formatarData(item.dueAt)}
                  </Text>
                </View>
                {item.daysLate > 0 && item.status !== 'DEVOLVIDO' && (
                  <Text style={styles.atraso}>{item.daysLate} dia(s) de atraso</Text>
                )}
                {item.status !== 'DEVOLVIDO' && souOSolicitante(item) && (
                  <TouchableOpacity style={styles.botaoDevolver} onPress={() => setSelecionado(item)}>
                    <Text style={styles.botaoDevolverTexto}>REGISTRAR DEVOLUÇÃO</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={selecionado != null} transparent animationType="fade">
        <View style={styles.modalFundo}>
          <View style={styles.modalCaixa}>
            <Text style={styles.modalTitulo}>Devolver {selecionado?.resourceTitle}</Text>
            <Text style={styles.modalLegenda}>Avalie a experiência (opcional)</Text>
            <View style={styles.estrelas}>
              {[1, 2, 3, 4, 5].map((valor) => (
                <TouchableOpacity key={valor} onPress={() => setNota(valor)}>
                  <Star color="#F59E0B" fill={valor <= nota ? '#F59E0B' : 'transparent'} size={28} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.modalInput}
              value={comentario}
              onChangeText={setComentario}
              placeholder="Comentário sobre o item"
              multiline
            />
            <View style={styles.modalAcoes}>
              <TouchableOpacity onPress={() => setSelecionado(null)} style={styles.modalCancelar}>
                <Text style={styles.modalCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmar, enviando && { opacity: 0.6 }]}
                onPress={confirmarDevolucao}
                disabled={enviando}
              >
                <Text style={styles.modalConfirmarTexto}>{enviando ? 'Enviando...' : 'Confirmar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function statusEstilo(status: string) {
  if (status === 'DEVOLVIDO') return { backgroundColor: 'rgba(16,185,129,0.12)' };
  if (status === 'ATIVO') return { backgroundColor: 'rgba(14,165,233,0.12)' };
  return { backgroundColor: 'rgba(245,158,11,0.15)' };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.scaffoldBg },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  indicadorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  indicadorIcone: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.secondaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicadorTitulo: { fontWeight: 'bold', color: colors.textDark, fontSize: 15 },
  indicadorLegenda: { color: colors.grey600, fontSize: 11, marginTop: 2 },
  indicadorValor: { fontSize: 22, fontWeight: 'bold', color: colors.primaryDark, marginLeft: 8 },
  erroBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  erroTexto: { color: colors.danger, flex: 1, fontSize: 13 },
  retorno: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  retornoOk: { backgroundColor: 'rgba(16,185,129,0.12)' },
  retornoErro: { backgroundColor: 'rgba(239,68,68,0.10)' },
  retornoTexto: { color: colors.textDark, fontSize: 13.5, lineHeight: 19 },
  retornoFonte: { color: colors.grey500, fontSize: 11, marginTop: 5 },
  vazio: { backgroundColor: colors.white, borderRadius: 20, padding: 32, alignItems: 'center' },
  vazioTexto: { color: colors.grey500, marginTop: 8, textAlign: 'center' },
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 16, marginBottom: 12 },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitulo: { fontWeight: 'bold', fontSize: 16, color: colors.textDark, flex: 1, marginRight: 8 },
  status: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusTexto: { fontSize: 11, fontWeight: 'bold', color: colors.textDark },
  cardLinha: { color: colors.grey600, marginTop: 6, fontSize: 13 },
  cardDatas: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  cardData: { color: colors.grey600, fontSize: 12, flex: 1 },
  atraso: { color: colors.danger, fontWeight: 'bold', fontSize: 12, marginTop: 8 },
  botaoDevolver: {
    marginTop: 14,
    backgroundColor: colors.primaryBlue,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoDevolverTexto: { color: colors.white, fontWeight: 'bold', fontSize: 13 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCaixa: { backgroundColor: colors.white, borderRadius: 20, padding: 20, width: '88%' },
  modalTitulo: { fontSize: 17, fontWeight: 'bold', color: colors.textDark },
  modalLegenda: { color: colors.grey600, fontSize: 12, marginTop: 6 },
  estrelas: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 14 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    color: colors.textDark,
  },
  modalAcoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalCancelar: { paddingHorizontal: 14, paddingVertical: 10 },
  modalCancelarTexto: { color: colors.grey600, fontWeight: 'bold' },
  modalConfirmar: { backgroundColor: colors.secondaryGreen, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  modalConfirmarTexto: { color: colors.white, fontWeight: 'bold' },
});
