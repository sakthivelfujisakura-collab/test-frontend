import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type QuestionSet = {
  id: number;
  title: string;
  set_number: number;
};

export default function QuestionSetsScreen() {
  const router = useRouter();
  const { level } = useLocalSearchParams<{ level: string }>();
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  // ✅ FETCH SETS FROM BACKEND
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/test/sets?level=${level}`
        );
        const data = await res.json();

        console.log("SETS:", data);
        setSets(data);
      } catch (err) {
        console.log("Error fetching sets:", err);
      }
    };

    if (level) fetchSets();
  }, [level]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {/* 🔵 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back to Levels</Text>
        </TouchableOpacity>

        <Text style={styles.available}>Available Tests</Text>
        <Text style={styles.levelText}>
          Level {level} - Practice Tests
        </Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Test Your Skills</Text>

          {/* ❗ NO SETS CASE */}
          {sets.length === 0 && (
            <Text style={{ color: "gray" }}>
              No tests available for this level
            </Text>
          )}

          {/* ✅ SET LIST */}
          {sets.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.left}>
                <View style={styles.index}>
                  <Text style={styles.indexText}>{item.set_number}</Text>
                </View>

                <View>
                  <Text style={styles.testTitle}>
                    {item.title}
                  </Text>
                </View>
              </View>

              {/* ✅ FIXED NAVIGATION */}
              <TouchableOpacity
                style={styles.button}
                onPress={() =>
                  router.push({
                    pathname: "/test-overview",
                    params: {
                      level: level,
                      setNumber: item.set_number, // ✅ use setNumber (not setId)
                    },
                  })
                }
              >
                <Text style={styles.buttonText}>Start</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  /* Header */
  header: {
    backgroundColor: "#6C7CFF",
    padding: 20,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  back: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  available: {
    color: "#E0E7FF",
    fontSize: 12,
  },
  levelText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },

  /* Content */
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },

  /* Card */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  index: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  indexText: {
    fontWeight: "700",
    color: "#4F46E5",
  },
  testTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  /* Button */
  button: {
    backgroundColor: "#6C7CFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
