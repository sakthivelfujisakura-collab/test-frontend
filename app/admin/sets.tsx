import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

// const { level } = useLocalSearchParams();
type Test = {
  id: number;
  title: string;
  set_number: number;
};

export default function SetsScreen() {
  const router = useRouter();
  const { level } = useLocalSearchParams();

  const [tests, setTests] = useState<Test[]>([]);

  const mergedSets = Array.from({ length: 10 }, (_, index) => {
  const setNumber = index + 1;

  const existing = tests.find(
    (t) => t.set_number === setNumber
  );

  return (
    existing || {
      id: 0,
      set_number: setNumber,
      title: `Set ${setNumber}`,
    }
  );
});

console.log("MERGED SETS:", mergedSets);

  useEffect(() => {
  const fetchSets = async () => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/test/sets?level=${level}`
      );

      const data = await res.json();

      console.log("SETS:", data);

      setTests(data);
    } catch (err) {
      console.log("Error fetching sets:", err);
    }
  };

  if (level) {
    fetchSets();
  }
}, [level]);

  console.log("LEVEL IN SETS:", level);

  const renderItem = ({ item }: { item: Test }) => (
    <View style={styles.card}>
      
      {/* Number Box */}
      <View style={styles.numberBox}>
        <Text style={styles.number}>{item.set_number}</Text>
      </View>

      {/* Title */}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
      </View>

      {/* Button */}
      <TouchableOpacity style={styles.button}
      onPress={() =>
        router.push(`/admin/questions?testId=${item.id}&level=${level}`)
      }>
        <Text style={styles.buttonText}>
          Manage Test {item.set_number}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* 🔵 HEADER */}
      <LinearGradient
        colors={["#6a5ae0", "#5f7cf0"]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back to Home</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Manage Tests</Text>
      </LinearGradient>

      {/* 📋 LIST */}
      <FlatList
        data={mergedSets}
        keyExtractor={(item) => `set-${item.set_number}`}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              No sets available
            </Text>

            <Text style={styles.emptySubtitle}>
              No test sets have been created for this level yet.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },

  header: {
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  back: {
    color: "#fff",
    fontSize: 14,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 16,
    marginTop: 8,
    fontWeight: "600",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  numberBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  number: {
    fontWeight: "600",
  },

  title: {
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#6a5ae0",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 12,
  },

  emptyContainer: {
  backgroundColor: "#fff",
  padding: 24,
  borderRadius: 12,
  alignItems: "center",
  marginTop: 20,
},

emptyTitle: {
  fontSize: 16,
  fontWeight: "600",
  color: "#333",
},

emptySubtitle: {
  fontSize: 13,
  color: "#777",
  marginTop: 6,
  textAlign: "center",
},

});