import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

const profile = () => {
  return (
    <SafeAreaView style={{
        flex:1,
        backgroundColor:'white'
    }}>
      <Text>Profile</Text>
    </SafeAreaView>
  )
}

export default profile

const styles = StyleSheet.create({})