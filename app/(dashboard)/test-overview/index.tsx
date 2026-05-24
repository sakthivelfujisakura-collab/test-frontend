import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { createSession, getSetConfig } from "@/services/api";

export default function TestOverviewScreen() {
  const router = useRouter();
  const { level, setNumber } = useLocalSearchParams<{
    level: string;
    setNumber: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // ✅ LOAD CONFIG (FIXED WITH LEVEL)
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await getSetConfig(level, Number(setNumber)); // ✅ FIXED
      setConfig(res.data);
    } catch (err: any) {
      console.error("Failed to load config", err);

      // ✅ Handle no data case (important UX fix)
      Alert.alert(
        "No Test Available",
        "This level does not have this test yet."
      );
      router.back();
    } finally {
      setLoadingConfig(false);
    }
  };

  // ✅ START TEST (FIXED PAYLOAD)
  const handleStart = async () => {
    setLoading(true);
    try {
      const payload = {
          question_set_id: Number(setNumber), // ✅ IMPORTANT FIX
          user_id: 1,
      };

      const res = await createSession(payload);
      const sessionId = res.data.session_id;

      router.replace({
        pathname: "/test",
        params: { sessionId },
      });
    } catch (err: any) {
        console.log("ERROR RESPONSE:", err?.response?.data || err);
        Alert.alert("Error", "Failed to start test session");
      }finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {loadingConfig || !config ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>← Back to Tests</Text>
            </TouchableOpacity>

            <Text style={styles.subtitle}>Test Configuration</Text>
            <Text style={styles.title}>
              Level {level} - Test {setNumber}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Test Your Skills</Text>

            {/* Info cards */}
            <View style={styles.infoRow}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Total Time</Text>
                <Text style={styles.infoValue}>
                  {config.total_time || 0} min
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Pass Percentage</Text>
                <Text style={styles.infoValue}>
                  {config.pass_percentage || 0}%
                </Text>
              </View>
            </View>

            {/* Section Breakdown */}
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Section Breakdown</Text>

              {config.sections && config.sections.length > 0 ? (
                config.sections.map((section: any) => (
                  <View key={section.id} style={styles.rowBetween}>
                    <Text style={styles.blockMain}>{section.title}</Text>
                    <Text style={styles.blockMain}>
                      {section.time_limit} min
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.note}>
                  No sections available for this test.
                </Text>
              )}
            </View>

            {/* Notes */}
            <View style={[styles.block, styles.noteBlock]}>
              <Text style={styles.blockTitle}>Important Notes</Text>

              <Text style={styles.note}>
                • All sections share a common timer.
              </Text>
              <Text style={styles.note}>
                • You can navigate back to previous sections.
              </Text>
              <Text style={styles.note}>
                • Maintain a stable internet connection.
              </Text>
              <Text style={styles.note}>
                • Answers auto-save at completion.
              </Text>
              <Text style={styles.note}>
                • Responses are auto-saved.
              </Text>
            </View>

            {/* Start Button */}
            <TouchableOpacity
              style={[
                styles.startButton,
                loading && { opacity: 0.7 },
              ]}
              onPress={handleStart}
              disabled={loading}
            >
              <Text style={styles.startButtonText}>
                {loading ? "Starting..." : "Start Exam"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  header: {
    backgroundColor: "#6C7CFF",
    padding: 20,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  back: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 10,
  },
  subtitle: {
    color: "#E0E7FF",
    fontSize: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },

  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
  },

  block: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  blockMain: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  noteBlock: {
    backgroundColor: "#FFF7ED",
  },
  note: {
    fontSize: 12,
    color: "#92400E",
    marginBottom: 6,
  },

  startButton: {
    backgroundColor: "#6C7CFF",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});