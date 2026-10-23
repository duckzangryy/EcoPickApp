import { Redemption } from '@/api/services/badgeService';
import { useRedemptions } from '@/hooks/useBadgeQueries';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, Fonts, FontSizes, Spacing } from '../../constants';

export default function RedemptionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: redemptions = [], isLoading, isError, refetch } = useRedemptions();
  const redemption = redemptions.find((entry: Redemption) => entry.id === id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Quay lại">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mã nhận quà</Text>
        <View style={styles.backButton} />
      </View>
      {isLoading ? <ActivityIndicator style={styles.center} color={Colors.primary} /> : isError ? (
        <View style={styles.center}><Text style={styles.error}>Không tải được mã quà.</Text><TouchableOpacity onPress={() => void refetch()}><Text style={styles.retry}>Thử lại</Text></TouchableOpacity></View>
      ) : !redemption ? (
        <View style={styles.center}><Text style={styles.error}>Không tìm thấy phần thưởng này.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {redemption.item_image_url ? <Image source={{ uri: redemption.item_image_url }} style={styles.image} /> : <View style={styles.imageFallback}><Ionicons name="gift" size={36} color={Colors.primary} /></View>}
          <Text style={styles.itemTitle}>{redemption.item_title}</Text>
          {!!redemption.sponsor && <Text style={styles.sponsor}>Tài trợ bởi {redemption.sponsor}</Text>}
          <View style={styles.qrCard}>
            <QRCode value={redemption.code} size={220} color="#10231A" backgroundColor="#FFFFFF" />
            <Text style={styles.instruction}>Đưa mã QR này cho nhà tài trợ khi nhận quà</Text>
          </View>
          <Text selectable style={styles.code}>{redemption.code}</Text>
          <View style={styles.detailCard}>
            <DetailRow label="Điểm đã dùng" value={`${redemption.points_spent} điểm`} />
            <DetailRow label="Ngày đổi" value={new Date(redemption.created_at).toLocaleString('vi-VN')} />
            <DetailRow label="Trạng thái" value={redemption.status === 'unused' ? 'Chưa sử dụng' : redemption.status} />
          </View>
          <Text style={styles.disclaimer}>Mã QR hiện là mã đổi quà thử nghiệm. Việc xác nhận sử dụng với nhà tài trợ chưa được tích hợp.</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, color: Colors.textPrimary },
  content: { alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  image: { width: 110, height: 110, borderRadius: BorderRadius.lg, backgroundColor: '#F1F5F9' },
  imageFallback: { width: 110, height: 110, borderRadius: BorderRadius.lg, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl, color: Colors.textPrimary, textAlign: 'center' },
  sponsor: { fontFamily: Fonts.medium, fontSize: FontSizes.md, color: Colors.primary },
  qrCard: { marginTop: Spacing.sm, padding: Spacing.lg, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  instruction: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center', maxWidth: 250 },
  code: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, color: Colors.primary, letterSpacing: 1.5 },
  detailCard: { alignSelf: 'stretch', backgroundColor: Colors.white, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailLabel: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, color: Colors.textSecondary },
  detailValue: { flexShrink: 1, fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, color: Colors.textPrimary, textAlign: 'right' },
  disclaimer: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  error: { fontFamily: Fonts.medium, fontSize: FontSizes.md, color: Colors.textSecondary },
  retry: { fontFamily: Fonts.semiBold, color: Colors.primary },
});
