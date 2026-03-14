import dpsLogo from './assets/DPS.svg';
import './App.css';
import { AddressForm } from './components/AddressForm';

function App() {
	return (
		<>
			<header className="app-header">
				<a href="https://www.digitalproductschool.io/" target="_blank" rel="noreferrer">
					<img src={dpsLogo} className="logo" alt="DPS logo" />
				</a>
			</header>

			<AddressForm />
		</>
	);
}

export default App;
