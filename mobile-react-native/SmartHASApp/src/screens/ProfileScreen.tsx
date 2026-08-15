import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useResources } from '../context/ResourceContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Perfil'>,
  NativeStackScreenProps<RootStackParamList>
>;

function OptionTile({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={styles.optionTile}>
      <View style={styles.optionIcon}>
        <Text>{icon}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const auth = useAuth();
  const { resources } = useResources();
  const user = auth.currentUser;
  const [editVisible, setEditVisible] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [address, setAddress] = useState(user?.address ?? '');

  if (!user) {
    return (
      <View style={styles.notLogged}>
        <Text>Usuário não logado.</Text>
      </View>
    );
  }

  const myItems = resources.filter((r) => r.offerantId === user.id);

  const openEdit = () => {
    setName(user.name);
    setAddress(user.address);
    setEditVisible(true);
  };

  const saveEdit = async () => {
    try {
      await auth.updateUser({ name, address });
      setEditVisible(false);
      Alert.alert('Smart HAS', 'Perfil atualizado!');
    } catch (e: any) {
      Alert.alert('Smart HAS', `Não foi possível atualizar: ${e.message ?? e}`);
    }
  };

  const doLogout = () => {
    auth.logout();
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Onboarding' }] } as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 40 }}>👤</Text>
            </View>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.stat}>⭐ {user.reputation.toString()} Reputação</Text>
            <Text style={styles.stat}>🔄 {user.totalTransactions} Trocas</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={openEdit}>
            <Text style={styles.editButtonText}>EDITAR PERFIL</Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20 }}>
          <Text style={styles.sectionTitle}>Meus Itens Ofertados</Text>
          {myItems.length === 0 ? (
            <View style={styles.emptyItems}>
              <Text style={{ fontSize: 32 }}>📦</Text>
              <Text style={{ color: colors.grey500, marginTop: 8 }}>Você ainda não ofertou nada.</Text>
            </View>
          ) : (
            myItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
              </View>
            ))
          )}

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Configurações</Text>
          <OptionTile icon="🔔" title="Notificações" subtitle="Sons e alertas de mensagens" />
          <OptionTile icon="📍" title="Meu Endereço" subtitle={user.address} />
          <OptionTile icon="🔒" title="Privacidade" subtitle="Gerenciar visibilidade e dados" />
          <OptionTile icon="❓" title="Ajuda e Suporte" subtitle="FAQ e contato" />

          <TouchableOpacity style={styles.logoutButton} onPress={doLogout}>
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={editVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TextInput style={styles.modalInput} value={name} onChangeText={setName} placeholder="Nome Completo" />
            <TextInput style={styles.modalInput} value={address} onChangeText={setAddress} placeholder="Endereço" />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveEdit}>
                <Text style={styles.modalSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.scaffoldBg },
  notLogged: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: colors.white, alignItems: 'center', padding: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  avatarWrap: { marginBottom: 12 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(14,165,233,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.primaryDark },
  email: { color: colors.grey600, fontSize: 16, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 24, marginTop: 16 },
  stat: { fontWeight: 'bold', color: colors.textDark },
  editButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  editButtonText: { fontWeight: 'bold', color: colors.textDark },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primaryDark, marginBottom: 12 },
  emptyItems: { backgroundColor: colors.white, borderRadius: 20, padding: 32, alignItems: 'center' },
  itemRow: { backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 8 },
  itemTitle: { fontWeight: 'bold', color: colors.textDark },
  itemCategory: { color: colors.grey600, fontSize: 12, marginTop: 2 },
  optionTile: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 10 },
  optionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.scaffoldBg, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontWeight: 'bold', fontSize: 15, color: colors.textDark },
  optionSubtitle: { fontSize: 12, color: colors.grey600 },
  logoutButton: { marginTop: 16, alignItems: 'center', paddingVertical: 12 },
  logoutText: { color: colors.danger, fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalBox: { backgroundColor: colors.white, borderRadius: 20, padding: 20, width: '85%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: colors.textDark },
  modalInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, marginBottom: 12, color: colors.textDark },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8 },
  modalCancel: { color: colors.grey600, fontWeight: '600', paddingVertical: 10 },
  modalSave: { backgroundColor: colors.primaryBlue, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  modalSaveText: { color: colors.white, fontWeight: 'bold' },
});
