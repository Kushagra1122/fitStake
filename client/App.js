import { Web3Provider } from './context/Web3Context';
import ConnectWallet from './screens/ConnectWallet';

export default function App() {
  return (
    <Web3Provider>
      <ConnectWallet />
    </Web3Provider>
  );
}
