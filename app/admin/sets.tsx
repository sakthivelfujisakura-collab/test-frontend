import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter , useLocalSearchParams } from "expo-router";

// const { level } = useLocalSearchParams();

type Test = {
  id: number;
  title: string;
};

const tests: Test[] = [
  { id: 1, title: "Test 1" },
  { id: 2, title: "Test 2" },
  { id: 3, title: "Test 3" },
  { id: 4, title: "Test 4" },
  { id: 5, title: "Test 5" },
  { id: 6, title: "Test 6" },
  { id: 7, title: "Test 7" },
  { id: 8, title: "Test 8" },
  { id: 9, title: "Test 9" },
  { id: 10, title: "Test 10" },
];

export default function SetsScreen() {
  const router = useRouter();
  const { level } = useLocalSearchParams();

  console.log("LEVEL IN SETS:", level);

  const renderItem = ({ item }: { item: Test }) => (
    <View style={styles.card}>
      
      {/* Number Box */}
      <View style={styles.numberBox}>
        <Text style={styles.number}>{item.id}</Text>
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
          Manage Test {item.id}
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
        data={tests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
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
    paddingTop: 50,
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
});