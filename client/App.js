import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Web3Provider } from './context/Web3Context';
import ConnectWallet from './screens/ConnectWallet';
import Home from './screens/Home'; // <-- create this screen

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Web3Provider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="ConnectWallet" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="ConnectWallet" component={ConnectWallet} />
          <Stack.Screen name="Home" component={Home} />
        </Stack.Navigator>
      </NavigationContainer>
    </Web3Provider>
  );
}
