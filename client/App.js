import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Web3Provider } from './context/Web3Context';
import ConnectWallet from './screens/ConnectWallet';
import Home from './screens/Home';
import CreateChallenge from './screens/CreateChallenge';
import JoinChallenge from './screens/JoinChallenge';
import MyChallenges from './screens/MyChallenges';
import ConnectStrava from './screens/ConnectStrava';

const Stack = createNativeStackNavigator();

// Deep linking configuration for OAuth callback
const linking = {
  prefixes: ['fitstake://', 'exp://'],
  config: {
    screens: {
      ConnectStrava: 'oauth-callback',
      ConnectWallet: 'connect-wallet',
      Home: 'home',
      CreateChallenge: 'create-challenge',
      JoinChallenge: 'join-challenge',
      MyChallenges: 'my-challenges',
    },
  },
};

export default function App() {
  return (
    <Web3Provider>
<<<<<<< HEAD
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="ConnectWallet" screenOptions={{ headerShown: false }}>
=======
      <NavigationContainer>
        <Stack.Navigator initialRouteName="ConnectStrava" screenOptions={{ headerShown: false }}>
>>>>>>> 371d86680ff50dbe8ce75da249a1e1186ee18bc1
          <Stack.Screen name="ConnectWallet" component={ConnectWallet} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="CreateChallenge" component={CreateChallenge} />
          <Stack.Screen name="JoinChallenge" component={JoinChallenge} />
          <Stack.Screen name="MyChallenges" component={MyChallenges} />
          <Stack.Screen name="ConnectStrava" component={ConnectStrava} />
        </Stack.Navigator>
      </NavigationContainer>
    </Web3Provider>
  );
}
