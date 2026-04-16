// components/LevelCard.tsx
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../constants/theme";

type Props = {
  level: string;
  title: string;
  subtitle: string;
  image: any;
  onPress: () => void;
};

export default function LevelCard({
  level,
  title,
  subtitle,
  image,
  onPress,
}: Props) {
  return (
    <View style={styles.card}>
      <Image source={image} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.level}>{level}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>Take Test</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 12,
    marginBottom: 12,
  },
  image: {
    width: 60,
    height: 60,
    marginRight: 12,
    resizeMode: "contain",
  },
  content: {
    flex: 1,
  },
  level: {
    color: "#EF4444",
    fontWeight: "700",
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  button: {
    backgroundColor: theme.colors.button,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
