import { Stack } from "expo-router";

export default function DashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        contentStyle: { backgroundColor: "#F5F7FB" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="level/index" options={{ headerShown: false }} />
      <Stack.Screen name="question-sets/index" />
      <Stack.Screen name="test-overview/index" />
      <Stack.Screen name="test/index" />
      <Stack.Screen name="test-result/index" />
      <Stack.Screen name="review/index" />
      <Stack.Screen name="profile/index" options={{ headerShown: false }} />
    </Stack>
  );
}
