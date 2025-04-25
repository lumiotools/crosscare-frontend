import { Stack } from "expo-router";

export default function ProfileStack() {
    return (
        <Stack screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen name="name" />
            <Stack.Screen name='pregrancy'/>
            <Stack.Screen name='earnbadge'/>
            <Stack.Screen name='language'/>
            <Stack.Screen name='notification'/>
            <Stack.Screen name='help'/>
            <Stack.Screen name='tnc'/>
        </Stack>
    )
}  