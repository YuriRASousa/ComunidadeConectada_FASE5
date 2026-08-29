import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Sparkles } from 'lucide-react-native';
import { colors } from '../theme/theme';
import { categories, conditions, types } from '../types';
import { useAuth } from '../context/AuthContext';
import { useResources } from '../context/ResourceContext';
import { improveDescription } from '../services/gemini';

function OptionPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerBox}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, value === opt && styles.chipActive]}
              onPress={() => onChange(opt)}
            >
              <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

export default function OfferResourceScreen() {
  const auth = useAuth();
  const { addResource } = useResources();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [condition, setCondition] = useState(conditions[0]);
  const [type, setType] = useState(types[0]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Smart HAS', 'Permissão de acesso às fotos negada.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      // Sem endpoint de upload no backend — mantemos apenas como preview
      // local, mesma limitação conhecida do app Flutter original.
      setImageUri(result.assets[0].uri);
    }
  };

  const improveWithAI = async () => {
    if (!description) return;
    setIsImproving(true);
    try {
      const improved = await improveDescription(description);
      setDescription(improved);
    } catch {
      Alert.alert('Smart HAS', 'Erro ao conectar com a IA.');
    } finally {
      setIsImproving(false);
    }
  };

  const publish = async () => {
    if (auth.isGhost) {
      Alert.alert('Smart HAS', 'Crie uma conta para ofertar um recurso.');
      return;
    }
    if (!title.trim() || !description.trim()) {
      Alert.alert('Smart HAS', 'Preencha título e descrição.');
      return;
    }
    setIsPublishing(true);
    try {
      await addResource({
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        type,
        availability: 'Disponível',
        offerantId: auth.currentUser!.id,
        offerantName: auth.currentUser!.name,
      });
      Alert.alert('Smart HAS', 'Oferta publicada com sucesso!');
      setTitle('');
      setDescription('');
      setImageUri(null);
    } catch (e: any) {
      Alert.alert('Smart HAS', `Não foi possível publicar: ${e.message ?? e}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.heading}>O que você deseja compartilhar?</Text>
        <Text style={styles.subheading}>Sua oferta ajudará alguém na comunidade.</Text>

        <Text style={styles.label}>Título do Recurso</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Cadeira de Rodas, Doação de Alimentos..."
          placeholderTextColor={colors.grey400}
          value={title}
          onChangeText={setTitle}
        />

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <OptionPicker label="Categoria" value={category} options={categories} onChange={setCategory} />
        </View>
        <View style={{ marginTop: 16 }}>
          <OptionPicker label="Tipo de Oferta" value={type} options={types} onChange={setType} />
        </View>
        <View style={{ marginTop: 16 }}>
          <OptionPicker label="Condição" value={condition} options={conditions} onChange={setCondition} />
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Imagem do Produto</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Camera color={colors.grey400} size={30} strokeWidth={1.5} />
              <Text style={{ color: colors.grey500, marginTop: 8 }}>Adicionar Foto</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.descHeaderRow}>
          <Text style={styles.label}>Descrição Detalhada</Text>
          <TouchableOpacity style={styles.aiLinkRow} onPress={improveWithAI} disabled={isImproving}>
            {isImproving ? (
              <ActivityIndicator size="small" color={colors.primaryBlue} />
            ) : (
              <>
                <Sparkles color={colors.primaryBlue} size={14} />
                <Text style={styles.aiLink}>Melhorar com IA</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Descreva o estado, condições e como retirar..."
          placeholderTextColor={colors.grey400}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity style={styles.publishButton} onPress={publish} disabled={isPublishing}>
          {isPublishing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.publishButtonText}>PUBLICAR OFERTA</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.scaffoldBg },
  heading: { fontSize: 22, fontWeight: 'bold', color: colors.primaryDark },
  subheading: { color: colors.grey600, marginTop: 4, marginBottom: 24 },
  label: { fontWeight: 'bold', color: colors.primaryDark, marginBottom: 8 },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textDark,
  },
  pickerBox: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 6 },
  chipActive: { backgroundColor: colors.primaryBlue },
  chipText: { color: colors.textDark, fontSize: 13 },
  chipTextActive: { color: colors.white, fontWeight: 'bold' },
  imagePicker: {
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
  descHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  aiLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  aiLink: { color: colors.primaryBlue, fontWeight: '600' },
  publishButton: {
    height: 55,
    borderRadius: 12,
    backgroundColor: colors.secondaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  publishButtonText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
});
