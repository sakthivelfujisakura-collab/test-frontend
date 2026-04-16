import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function QuestionSetsScreen() {
  const router = useRouter();
  const { level } = useLocalSearchParams<{ level: string }>();

  const TOTAL_SETS = 10;
  const sets = Array.from({ length: TOTAL_SETS }, (_, i) => ({
  id: i + 1,
  }));


  return (
    <>
      {/* Disable native header */}
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
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
        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Test Your Skills</Text>

        {sets.map((item) => (
        <View key={item.id} style={styles.card}>
          {/* Left */}
          <View style={styles.left}>
            <View style={styles.index}>
              <Text style={styles.indexText}>{item.id}</Text>
            </View>

            <View>
              <Text style={styles.testTitle}>Test {item.id}</Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              router.push({
                pathname: "/test-overview",
                params: { level, setNumber: item.id },
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
