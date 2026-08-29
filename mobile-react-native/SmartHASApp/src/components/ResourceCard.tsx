import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Package, User, MessageCircle } from 'lucide-react-native';
import { colors, gradients } from '../theme/theme';
import { Resource } from '../types';

interface Props {
  resource: Resource;
  onPress: () => void;
  onAction: () => void;
}

export default function ResourceCard({ resource, onPress, onAction }: Props) {
  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={styles.imageWrap}>
          {resource.imageUrl ? (
            <Image source={{ uri: resource.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Package color={colors.primaryBlue} size={36} strokeWidth={1.5} />
            </View>
          )}
          <LinearGradient colors={gradients.brand} style={styles.badge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.badgeText}>{resource.category.toUpperCase()}</Text>
          </LinearGradient>
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {resource.title}
            </Text>
            <Text style={styles.type}>{resource.type}</Text>
          </View>
          <Text style={styles.description} numberOfLines={2}>
            {resource.description}
          </Text>
          <View style={styles.footerRow}>
            <View style={styles.avatar}>
              <User color={colors.primaryBlue} size={13} />
            </View>
            <Text style={styles.offerant} numberOfLines={1}>
              {resource.offerantName}
            </Text>
            <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.85}>
              <MessageCircle color={colors.white} size={13} />
              <Text style={styles.actionButtonText}>CONVERSAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  imageWrap: { height: 160, width: '100%', backgroundColor: colors.scaffoldBg },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
  body: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', color: colors.primaryDark },
  type: { color: colors.secondaryGreen, fontWeight: 'bold', fontSize: 12 },
  description: { color: colors.slate600, fontSize: 14, lineHeight: 20, marginTop: 6 },
  footerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(14,165,233,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerant: { flex: 1, marginLeft: 8, fontSize: 13, color: colors.textDark, fontWeight: '500' },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryDark,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButtonText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
});
