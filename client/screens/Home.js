import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function Home({ navigation }) {
  return (
    <View className="flex-1 bg-gray-100 items-center justify-center px-6">
      <Text className="text-3xl font-bold mb-6">Welcome to the Homepage!</Text>
      <TouchableOpacity
        className="bg-purple-600 px-6 py-3 rounded-2xl"
        onPress={() => navigation.goBack()}
      >
        <Text className="text-white font-bold">Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}
