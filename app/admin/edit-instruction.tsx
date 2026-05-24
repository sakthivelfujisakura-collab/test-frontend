import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function EditInstructionScreen() {
  const router = useRouter();

  const { group_id, instruction } =
    useLocalSearchParams();

  const [value, setValue] = useState(
    String(instruction || "")
  );

  const handleSave = async () => {
    try {
      const token = await SecureStore.getItemAsync(
        "accessToken"
      );

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/admin/question-groups/${group_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            instruction: value,
          }),
        }
      );

      if (res.ok) {
        Alert.alert("Success", "Instruction updated");
        router.back();
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Edit Instruction
      </Text>

      <TextInput
        multiline
        value={value}
        onChangeText={setValue}
        style={styles.input}
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
    padding: 16,
    backgroundColor: "#fff",
  },

  label: {
    fontWeight: "600",
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    textAlignVertical: "top",
  },

  button: {
    marginTop: 20,
    backgroundColor: "#6a5ae0",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});