import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTestResult } from "@/services/api";
import { TestResult } from "@/types/test";

export default function TestResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    loadResult();
  }, [sessionId]);

  const loadResult = async () => {
    try {
      const res = await getTestResult(Number(sessionId));
      setResult(res.data);
    } catch (e) {
      console.error("❌ Failed to load test result", e);
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => router.replace("/level");

  // ---------- LOADING ----------
  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#6C7CFF" />
        <Text style={styles.loadingText}>Loading your results…</Text>
      </View>
    );
  }

  // ---------- SAFETY ----------
  if (!result || !result.set) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>Result not available</Text>
        <Text style={styles.errorSub}>We couldn't load your test result.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={goHome}>
          <Text style={styles.btnText}>Back to Levels</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalCorrect = result.score ?? 0;
  const totalQuestions = result.total ?? 0;
  const overallPercent = result.percentage ?? 0;
  const passed = result.pass === true;

  const progressColor = passed ? "#22C55E" : "#EF4444";
  const bgColor = passed ? "#DCFCE7" : "#FEE2E2";

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ─── FIXED HERO HEADER ─── */}
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={goHome} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backLabel}>Levels</Text>
        </TouchableOpacity>

        <Text style={styles.heroLabel}>テスト結果</Text>
        <Text style={styles.heroTitle}>Test Complete!</Text>

        {/* Circular score badge */}
        <View style={[styles.scoreBadge, { backgroundColor: bgColor }]}>
          <Text style={[styles.scoreNum, { color: progressColor }]}>
            {overallPercent}%
          </Text>
          <Text style={[styles.scoreRatio, { color: progressColor }]}>
            {totalCorrect} / {totalQuestions}
          </Text>
        </View>

        {/* Pass / Fail pill */}
        <View
          style={[
            styles.statusPill,
            { backgroundColor: passed ? "#22C55E" : "#EF4444" },
          ]}
        >
          <Text style={styles.statusPillText}>
            {passed ? "🎉  PASSED" : "❌  FAILED"}
          </Text>
        </View>
      </View>

      {/* ─── SCROLLABLE CONTENT ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION BREAKDOWN */}
        {Array.isArray(result?.set?.sections) &&
          result.set.sections.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Section Breakdown</Text>

              {result.set.sections.map((section: any, i: number) => {
                const correct = section.correct ?? 0;
                const total = section.total ?? 0;
                if (total === 0) return null;

                const pct = Math.round((correct / total) * 100);
                const barColor =
                  pct >= 60 ? "#22C55E" : pct >= 40 ? "#F59E0B" : "#EF4444";

                return (
                  <View key={i} style={styles.sectionRow}>
                    <View style={styles.sectionMeta}>
                      <Text style={styles.sectionName}>
                        {section?.name ?? `Section ${i + 1}`}
                      </Text>
                      <Text style={[styles.sectionPct, { color: barColor }]}>
                        {correct}/{total} · {pct}%
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${pct}%` as any, backgroundColor: barColor },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

        {/* MOTIVATIONAL MESSAGE */}
        <View style={styles.messageCard}>
          <Text style={styles.messageText}>
            {passed
              ? "素晴らしい！Great work — keep pushing forward! 🚀"
              : "Don't give up! Review your answers and try again. がんばろう！ 💪"}
          </Text>
        </View>

        {/* ACTIONS */}
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() =>
            router.push({
              pathname: "/review" as any,
              params: { sessionId },
            })
          }
        >
          <Text style={styles.reviewBtnText}>📋  Review Answers</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={goHome}>
          <Text style={styles.homeBtnText}>Back to Levels</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
    paddingHorizontal: 32,
    gap: 12,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B7280",
  },

  errorEmoji: { fontSize: 48 },
  errorTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  errorSub: { fontSize: 14, color: "#6B7280", textAlign: "center" },

  /* ─── FIXED HERO ─── */
  hero: {
    backgroundColor: "#6C7CFF",
    paddingBottom: 36,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,

    // Shadow so it sits visually above the scroll content
    shadowColor: "#6C7CFF",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,

    // Clip the bottom rounded corners but keep the shadow visible
    zIndex: 10,
  },

  backBtn: {
    position: "absolute",
    left: 16,
    top: Platform.OS === "android"
      ? (StatusBar.currentHeight ?? 24) + 10
      : 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  backIcon: {
    fontSize: 28,
    color: "#fff",
    lineHeight: 32,
    fontWeight: "300",
  },

  backLabel: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },

  heroLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#C7D2FE",
    letterSpacing: 2,
    marginBottom: 4,
  },

  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 24,
  },

  scoreBadge: {
    width: 148,
    height: 148,
    borderRadius: 74,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  scoreNum: {
    fontSize: 40,
    fontWeight: "900",
    lineHeight: 46,
  },

  scoreRatio: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },

  statusPill: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },

  statusPillText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.5,
  },

  /* ─── SCROLL ─── */
  scroll: {
    flex: 1,
  },

  contentContainer: {
    paddingTop: 24,
  },

  /* ─── CARD ─── */
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },

  sectionRow: { marginBottom: 14 },

  sectionMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  sectionName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
    paddingRight: 8,
  },

  sectionPct: { fontSize: 13, fontWeight: "700" },

  barTrack: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
  },

  barFill: { height: 8, borderRadius: 4 },

  /* ─── MESSAGE ─── */
  messageCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },

  messageText: {
    fontSize: 14,
    color: "#4338CA",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },

  /* ─── BUTTONS ─── */
  reviewBtn: {
    backgroundColor: "#6C7CFF",
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#6C7CFF",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  reviewBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  homeBtn: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#6C7CFF",
  },

  homeBtnText: { color: "#6C7CFF", fontSize: 15, fontWeight: "700" },

  primaryBtn: {
    marginTop: 8,
    backgroundColor: "#6C7CFF",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },

  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
