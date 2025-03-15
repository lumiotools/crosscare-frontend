import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const PatientStack = () => {
  return (
    <Stack screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
    }}>
        <Stack.Screen name="(tabs)"  />
        <Stack.Screen name='track'/>
        <Stack.Screen name='health'/>
        <Stack.Screen name='steps'/>
        <Stack.Screen name='water'/>
        <Stack.Screen name='heart'/>
        <Stack.Screen name='newnotes' options={{
          presentation: 'fullScreenModal',
        }}/>
        <Stack.Screen name='newphotos' options={{
          presentation: 'fullScreenModal',
        }}/>
        <Stack.Screen name='editphoto' options={{
          presentation: 'fullScreenModal',
        }}/>
        <Stack.Screen name='openphoto'/>
        <Stack.Screen name='opennote'/>
        <Stack.Screen name='weight'/>
        <Stack.Screen name='medications'/>
        <Stack.Screen name='addmedication'/>
        <Stack.Screen name='askdoula'/>
        <Stack.Screen name='sleep'/>
        <Stack.Screen name='tracksleep'/>
        <Stack.Screen name='bedtime'/>
        <Stack.Screen name='meals'/>
        <Stack.Screen name='addmeals'/>
        <Stack.Screen name='upccode'/>
        <Stack.Screen name='sleepup'/>
        <Stack.Screen name='wakeup'/>
        <Stack.Screen name='unitscreen'/>
        <Stack.Screen name='weightunit'/>
    </Stack>
  )
}

export default PatientStack

const styles = StyleSheet.create({})