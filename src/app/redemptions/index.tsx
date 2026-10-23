import { useRedemptions } from '@/hooks/useBadgeQueries';
import { Redemption } from '@/api/services/badgeService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, Fonts, FontSizes, Spacing } from '../../constants';

export default function RedemptionsScreen() {
  const router = useRouter();
  const { data: redemptions = [], isLoading, isError, refetch } = useRedemptions();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Quay lại">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Phần thưởng đã đổi</Text>
        <View style={styles.backButton} />
      </View>
      {isLoading ? <ActivityIndicator style={styles.center} color={Colors.primary} /> : isError ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Không tải được danh sách phần thưởng.</Text>
          <TouchableOpacity onPress={() => void refetch()}><Text style={styles.retry}>Thử lại</Text></TouchableOpacity>
        </View>
      ) : redemptions.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="gift-outline" size={52} color="#94A3B8" />
          <Text style={styles.emptyText}>Bạn chưa đổi phần thưởng nào.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {redemptions.map((item: Redemption) => (
            <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.75} onPress={() => router.push(`/redemptions/${item.id}` as any)}>
              {item.item_image_url ? <Image source={{ uri: item.item_image_url }} style={styles.image} /> : <View style={styles.imageFallback}><Ionicons name="gift-outline" size={28} color={Colors.primary} /></View>}
              <View style={styles.info}>
                <Text style={styles.itemTitle} numberOfLines={2}>{item.item_title}</Text>
                {!!item.sponsor && <Text style={styles.sponsor}>{item.sponsor}</Text>}
                <Text style={styles.meta}>{item.points_spent} điểm · {new Date(item.created_at).toLocaleDateString('vi-VN')}</Text>
                <Text style={styles.showCode}>Mở mã QR để nhận quà <Ionicons name="chevron-forward" size={13} /></Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, color: Colors.textPrimary },
  list: { padding: Spacing.base, gap: Spacing.md },
  card: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  image: { width: 84, height: 84, borderRadius: BorderRadius.md, backgroundColor: '#F1F5F9' },
  imageFallback: { width: 84, height: 84, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4, justifyContent: 'center' },
  itemTitle: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md, color: Colors.textPrimary },
  sponsor: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, color: Colors.primary },
  meta: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, color: Colors.textSecondary },
  showCode: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, color: Colors.primary, marginTop: 3 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyText: { fontFamily: Fonts.medium, fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center' },
  retry: { fontFamily: Fonts.semiBold, color: Colors.primary },
});
