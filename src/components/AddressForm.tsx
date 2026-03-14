import { useGermanAddressValidator } from '../hooks/useGermanAddressValidator';

export function AddressForm() {
	const {
		locality,
		postalCode,
		isPostalDropdown,
		uniqueSortedPostalCodes,
		error,
		hasActiveLookup,
		handleLocalityChange,
		handlePostalCodeChange,
		isLocked,
		clear,
	} = useGermanAddressValidator();

	return (
		<main className="home-card">
			<h1>German Address Validator</h1>
			<p className="subtitle">
				Validate German postal codes (PLZ) and localities using the Open PLZ API.
			</p>

			<form
				className="address-form"
				onSubmit={(event) => {
					event.preventDefault();
				}}
			>
				<div className="form-field">
					<label htmlFor="locality">Locality (city / town)</label>
					<div
						className={`field-input-wrapper${isLocked ? ' field-input-wrapper--success' : ''}`}
					>
						<input
							id="locality"
							type="text"
							value={locality}
							onChange={(event) => handleLocalityChange(event.target.value)}
							placeholder="e.g. Berlin"
							autoComplete="off"
							disabled={isLocked}
						/>
					</div>
					<p className="field-hint">
						Type a locality name to look up one or more matching postal codes.
					</p>
				</div>

				<div className="form-field">
					<label htmlFor="postalCode">Postal Code (PLZ)</label>

					<div
						className={`field-input-wrapper${isLocked ? ' field-input-wrapper--success' : ''}`}
					>
						{isPostalDropdown ? (
							<select
								id="postalCode"
								value={postalCode}
								onChange={(event) => handlePostalCodeChange(event.target.value)}
								disabled={isLocked}
							>
								<option value="" disabled>
									Select a postal code
								</option>
								{uniqueSortedPostalCodes.map((code) => (
									<option key={code} value={code}>
										{code}
									</option>
								))}
							</select>
						) : (
							<input
								id="postalCode"
								type="text"
								inputMode="numeric"
								pattern="\d{5}"
								value={postalCode}
								onChange={(event) => handlePostalCodeChange(event.target.value)}
								placeholder="e.g. 10115"
								autoComplete="off"
								disabled={isLocked}
							/>
						)}
					</div>

					<p className="field-hint">
						Type a 5-digit German PLZ to auto-fill the locality field.
					</p>
				</div>

				{hasActiveLookup && (
					<p className="status-message">Looking up data from the Open PLZ API…</p>
				)}
				{error && <p className="error-message">{error}</p>}

				{(isLocked || locality || postalCode) && (
					<button
						type="button"
						onClick={clear}
						disabled={!locality && !postalCode && !isLocked}
					>
						Clear
					</button>
				)}
			</form>

			<p className="footer-note">
				Data provided by the{' '}
				<a href="https://www.openplzapi.org/en/germany/" target="_blank" rel="noreferrer">
					Open PLZ API
				</a>
				.
			</p>
		</main>
	);
}

