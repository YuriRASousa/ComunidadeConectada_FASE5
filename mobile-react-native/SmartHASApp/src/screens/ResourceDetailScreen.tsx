import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Package, MapPin } from 'lucide-react-native';
import { colors } from '../theme/theme';
import { useResources } from '../context/ResourceContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ResourceDetail'>;

export default function ResourceDetailScreen({ route, navigation }: Props) {
  const { resources } = useResources();
  const resource = resources.find((r) => r.id === route.params.resourceId);

  if (!resource) {
    return (
      <View style={styles.notFound}>
        <Text>Recurso não encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
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
        </View>
      </ScrollView>
      <View style={styles.bottomSheet}>
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() =>
            navigation.navigate('Chat', {
              resourceId: resource.id,
              resourceTitle: resource.title,
              offerantId: resource.offerantId,
            })
          }
        >
          <Text style={styles.requestButtonText}>SOLICITAR RECURSO</Text>
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
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: 20,
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
});
