import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Package, MapPin, FileText, MessageCircle, CircleCheck, CircleAlert } from 'lucide-react-native';
import { colors } from '../theme/theme';
import { useResources } from '../context/ResourceContext';
import { useAuth } from '../context/AuthContext';
import { fichaDoRecurso, solicitarEmprestimo } from '../services/emprestimos';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ResourceDetail'>;

const PRAZOS = [3, 7, 15];

export default function ResourceDetailScreen({ route, navigation }: Props) {
  const { resources, fetchResources } = useResources();
  const { currentUser } = useAuth();
  const resource = resources.find((r) => r.id === route.params.resourceId);

  const [ficha, setFicha] = useState<string | null>(null);
  const [prazo, setPrazo] = useState(7);
  const [enviando, setEnviando] = useState(false);
  // A resposta da procedure aparece na propria tela, e nao so no Alert: o
  // Alert do React Native nao renderiza na versao web, e essa mensagem e a
  // prova de que quem decidiu foi o banco.
  const [retorno, setRetorno] = useState<{ ok: boolean; texto: string } | null>(null);

  // A ficha vem pronta de FN_SH_FICHA_RECURSO: o texto exibido aqui é
  // montado dentro do Oracle, não no aplicativo.
  useEffect(() => {
    let ativo = true;
    if (resource) {
      fichaDoRecurso(resource.id)
        .then((texto) => ativo && setFicha(texto))
        .catch(() => ativo && setFicha(null));
    }
    return () => {
      ativo = false;
    };
  }, [resource?.id]);

  if (!resource) {
    return (
      <View style={styles.notFound}>
        <Text>Recurso não encontrado.</Text>
      </View>
    );
  }

  const souODono = currentUser?.id === resource.offerantId;
  const podeEmprestar = resource.type === 'Empréstimo' && !souODono;

  const pedirEmprestado = async () => {
    setEnviando(true);
    setRetorno(null);
    try {
      const resultado = await solicitarEmprestimo(resource.id, prazo);
      await fetchResources();
      const texto = resultado?.message ?? 'Empréstimo registrado.';
      setRetorno({ ok: true, texto });
      Alert.alert('Smart HAS', texto, [
        { text: 'Ver meus empréstimos', onPress: () => navigation.navigate('MyLoans') },
        { text: 'Fechar', style: 'cancel' },
      ]);
    } catch (e: any) {
      // A mensagem exibida é a que a procedure escreveu no
      // RAISE_APPLICATION_ERROR, sem reescrita no aplicativo.
      const texto = e.message ?? String(e);
      setRetorno({ ok: false, texto });
      Alert.alert('Smart HAS', texto);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 170 }}>
        <View style={styles.imageWrap}>
          {resource.imageUrl ? (
            <Image source={{ uri: resource.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <Package color={colors.primaryBlue} size={56} strokeWidth={1.5} />
          )}
        </View>
        <View style={styles.content}>
          <View style={styles.rowBetween}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{resource.category}</Text>
            </View>
            <Text style={styles.condition}>{resource.condition}</Text>
          </View>
          <Text style={styles.title}>{resource.title}</Text>
          <View style={styles.offerantRow}>
            <MapPin color={colors.primaryBlue} size={18} />
            <Text style={styles.offerant}>Ofertado por: {resource.offerantName}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.description}>{resource.description}</Text>

          {ficha && (
            <>
              <View style={styles.divider} />
              <View style={styles.fichaHeader}>
                <FileText color={colors.primaryBlue} size={18} />
                <Text style={styles.sectionTitle}>Ficha do item</Text>
              </View>
              <Text style={styles.ficha}>{ficha}</Text>
              <Text style={styles.fichaFonte}>Texto formatado pela função FN_SH_FICHA_RECURSO</Text>
            </>
          )}

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
                    ? 'Mensagem devolvida por PRC_SH_REGISTRA_EMPRESTIMO'
                    : 'Regra recusada pelo Oracle'}
                </Text>
              </View>
            </View>
          )}

          {podeEmprestar && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Por quantos dias?</Text>
              <View style={styles.prazos}>
                {PRAZOS.map((dias) => (
                  <TouchableOpacity
                    key={dias}
                    style={[styles.prazoChip, prazo === dias && styles.prazoChipAtivo]}
                    onPress={() => setPrazo(dias)}
                  >
                    <Text style={[styles.prazoTexto, prazo === dias && styles.prazoTextoAtivo]}>
                      {dias} dias
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomSheet}>
        {podeEmprestar && (
          <TouchableOpacity
            style={[styles.requestButton, enviando && { opacity: 0.6 }]}
            onPress={pedirEmprestado}
            disabled={enviando}
          >
            <Text style={styles.requestButtonText}>
              {enviando ? 'REGISTRANDO...' : 'PEDIR EMPRESTADO'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.chatButton, !podeEmprestar && styles.chatButtonSozinho]}
          onPress={() =>
            navigation.navigate('Chat', {
              resourceId: resource.id,
              resourceTitle: resource.title,
              offerantId: resource.offerantId,
            })
          }
        >
          <MessageCircle color={podeEmprestar ? colors.primaryBlue : colors.white} size={18} />
          <Text style={[styles.chatButtonText, !podeEmprestar && { color: colors.white }]}>
            FALAR COM O OFERTANTE
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageWrap: { height: 250, width: '100%', backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  content: { padding: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: {
    backgroundColor: 'rgba(14,165,233,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryBadgeText: { color: colors.primaryBlue, fontWeight: 'bold' },
  condition: { color: colors.grey600, fontWeight: '500' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 16, color: colors.textDark },
  offerantRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  offerant: { fontSize: 16, fontWeight: '500', marginLeft: 8, color: colors.textDark },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark },
  description: { fontSize: 16, lineHeight: 24, color: colors.slate600, marginTop: 12 },
  fichaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ficha: {
    marginTop: 12,
    backgroundColor: colors.scaffoldBg,
    borderRadius: 14,
    padding: 14,
    color: colors.textDark,
    fontSize: 14,
    lineHeight: 21,
  },
  fichaFonte: { color: colors.grey500, fontSize: 11, marginTop: 6 },
  retorno: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
  },
  retornoOk: { backgroundColor: 'rgba(16,185,129,0.12)' },
  retornoErro: { backgroundColor: 'rgba(239,68,68,0.10)' },
  retornoTexto: { color: colors.textDark, fontSize: 14, lineHeight: 20 },
  retornoFonte: { color: colors.grey500, fontSize: 11, marginTop: 6 },
  prazos: { flexDirection: 'row', gap: 10, marginTop: 12 },
  prazoChip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  prazoChipAtivo: { borderColor: colors.secondaryGreen, backgroundColor: 'rgba(16,185,129,0.12)' },
  prazoTexto: { color: colors.grey600, fontWeight: '600' },
  prazoTextoAtivo: { color: colors.secondaryGreen },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  requestButton: {
    backgroundColor: colors.secondaryGreen,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  requestButtonText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  chatButton: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBlue,
  },
  chatButtonSozinho: { backgroundColor: colors.primaryBlue, paddingVertical: 16 },
  chatButtonText: { color: colors.primaryBlue, fontWeight: 'bold', fontSize: 14 },
});
