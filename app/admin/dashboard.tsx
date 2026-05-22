import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ListRenderItem,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

type Level = {
  id: string;
  title: string;
};

const levels: Level[] = [
  { id: "N5", title: "Beginning for you" },
  { id: "N4", title: "Basic Japanese" },
  { id: "N3", title: "Welcome to Japan" },
  { id: "N2", title: "You're professional" },
  { id: "N1", title: "Hello senpai" },
];

export default function AdminDashboard() {
  const router = useRouter();

  const renderItem: ListRenderItem<Level> = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{
          uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        }}
        style={styles.image}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.level}>{item.id}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>
          Advanced Japanese proficiency
        </Text>
      </View>

      <TouchableOpacity style={styles.button}
      onPress={() => router.push(`/admin/sets?level=${item.id}`)}>
        <Text style={styles.buttonText}>Manage</Text>
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
        <Text style={styles.appName}>Japanese Test App</Text>
        <Text style={styles.adminText}>Admin Panel</Text>

        <Image
          source={{
            uri: "https://randomuser.me/api/portraits/women/44.jpg",
          }}
          style={styles.avatar}
        />
      </LinearGradient>

      {/* 👋 GREETING */}
      <View style={styles.greeting}>
        <Text style={styles.greetText}>Hi Admin!</Text>
        <Text style={styles.subText}>
          View and manage your tests
        </Text>
      </View>

      {/* 📋 LEVEL LIST */}
      <FlatList
        data={levels}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
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
  appName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  adminText: {
    color: "#ddd",
    fontSize: 12,
    marginTop: 4,
  },
  avatar: {
    position: "absolute",
    right: 16,
    top: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  greeting: {
    padding: 16,
  },
  greetText: {
    fontSize: 16,
    fontWeight: "600",
  },
  subText: {
    color: "#777",
    fontSize: 12,
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  level: {
    color: "red",
    fontWeight: "600",
  },
  title: {
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    color: "#777",
  },
  button: {
    backgroundColor: "#6a5ae0",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
  },
});