import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
import { Linking, Animated } from 'react-native';

export default function App() {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    try {
      const metamaskDeepLink = 'https://metamask.app.link/';
      Linking.openURL(metamaskDeepLink);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View className="flex-1 bg-gray-100 items-center justify-center px-6">
      <Text className="text-3xl font-extrabold text-gray-900 mb-4 text-center">
        Welcome
      </Text>
      <Text className="text-gray-600 text-center mb-12">
        Connect your wallet to start interacting with your decentralized app.
      </Text>

      <TouchableOpacity
        className="bg-purple-600 px-8 py-4 rounded-2xl shadow-lg"
        onPress={connectWallet}
      >
        <Text className="text-white font-bold text-lg">
          {account ? `Connected: ${account.slice(0, 6)}...` : 'Connect Wallet'}
        </Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}
