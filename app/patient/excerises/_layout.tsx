import { Stack } from "expo-router";

export default function ExcerisesLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
        }}>
            <Stack.Screen name="excerise" />
            <Stack.Screen name="ask_doula" />
            <Stack.Screen name="audio_player"/>
        </Stack>
    )
}   