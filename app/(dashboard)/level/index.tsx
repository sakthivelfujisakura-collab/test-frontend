import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


const levels = [
  { level: "N5", title: "Beginning for you" },
  { level: "N4", title: "Basic Japanese" },
  { level: "N3", title: "Welcome to Japan" },
  { level: "N2", title: "You're professional" },
  { level: "N1", title: "Hello senpai" },
];

export default function LevelScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const LOGIN_PATH = '/users/me';

  const loadProfile = async () => {
    console.log("🚀 loadProfile() called");
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      console.log("🔑 Token:", token);

      const res = await fetch(`${API_URL}${LOGIN_PATH}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("STATUS:", res.status);
      console.log("HEADERS:", res.headers);

      const data = await res.json();

      console.log("RAW RESPONSE DATA 👉", data);

      setName(data.current_user?.username);
      // setEmail(data.current_user?.email);
      if (data.current_user?.profile_photo) {
        setImage(`${API_URL}/${data.current_user.profile_photo}`);
      } else {
        setImage(null);
      }
      console.log("IMAGE URL USED:", `${API_URL}/${data.current_user?.profile_photo}`);

    } catch (err) {
      console.log("Profile load error:", err);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (

    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>Japanese Test App</Text>
          <Text style={styles.appSubtitle}>
            日本語能力試験 - JLPT Preparation
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Image
            source={{
              uri: image ?? 'https://i.pravatar.cc/150',
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        {name ? (
          <View style={styles.userRow}>
            <Text style={styles.wave}>👋</Text>
            <Text style={styles.userName}>{name}</Text>
          </View>
        ) : null}
      </View>

      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.hello}>Hi Fuji!</Text>
        <Text style={styles.subHello}>Take your first test</Text>
      </View>

      {/* Level cards */}
      <View style={styles.list}>
        {levels.map((item) => (
          <View key={item.level} style={styles.card}>
            <View style={styles.cardLeft}>
              <Text style={styles.level}>{item.level}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>
                Advanced Japanese proficiency
              </Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                router.push({
                  pathname: "/question-sets",
                  params: { level: item.level },
                })
              }
            >
              <Text style={styles.buttonText}>Take Test</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  appSubtitle: {
    color: "#E0E7FF",
    fontSize: 12,
    marginTop: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  /* Greeting */
  greeting: {
    padding: 20,
  },
  hello: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subHello: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  /* Cards */
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  cardLeft: {
    flex: 1,
  },
  level: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  /* Button */
  button: {
    backgroundColor: "#6C7CFF",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  wave: {
    fontSize: 14,
    marginRight: 6,
  },
  userName: {
    color: '#F5F3FF',
    fontSize: 14,
    fontWeight: '600',
  },
});
