import React, { useState } from "react";
import {
  View,
 Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import * as SecureStore from "expo-secure-store";

export default function EditImageScreen() {
  const router = useRouter();

  const { question_id, image_url } =
    useLocalSearchParams();

  const [image, setImage] = useState(
    String(image_url || "")
  );

  const handleSave = async () => {
    try {
      const token =
        await SecureStore.getItemAsync(
          "accessToken"
        );

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/admin/questions/${question_id}/image`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            image_url: image,
          }),
        }
      );

      const data = await res.json();

      Alert.alert("Success", data.message, [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Edit Image URL
      </Text>

      <TextInput
        style={styles.input}
        value={image}
        onChangeText={setImage}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
      >
        <Text style={styles.buttonText}>
          Save Changes
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
  },

  button: {
    backgroundColor: "#6a5ae0",
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});