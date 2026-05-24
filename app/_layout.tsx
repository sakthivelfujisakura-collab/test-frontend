import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        // Prevent the white-flash blink visible during back-navigation.
        // The navigator's own background shows for a frame during the slide
        // animation; matching it to the app's background colour hides it.
        contentStyle: { backgroundColor: "#F5F7FB" },
        animation: "slide_from_right",
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(dashboard)" />
    </Stack>
  );
}
