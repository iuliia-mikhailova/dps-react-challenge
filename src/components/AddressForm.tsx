import { useGermanAddressValidator } from '../hooks/useGermanAddressValidator';

export function AddressForm() {
	const {
		locality,
		postalCode,
		isPostalDropdown,
		uniqueSortedPostalCodes,
		error,
		errorSource,
		isLocked,
		uniqueLocalityNames,
		isSuggestionsOpen,
		handleLocalityChange,
		handleLocalityKeyDown,
		handlePostalCodeChange,
		selectLocalitySuggestion,
		closeSuggestions,
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
				<div className="form-field form-field--autocomplete">
					<label htmlFor="locality">Locality (city / town)</label>
					<div
						className={`field-input-wrapper${isLocked ? ' field-input-wrapper--success' : ''}${error && errorSource === 'locality' ? ' field-input-wrapper--error' : ''}`}
					>
						<input
							id="locality"
							type="text"
							value={locality}
							onChange={(event) => handleLocalityChange(event.target.value)}
							onKeyDown={handleLocalityKeyDown}
							onBlur={() => setTimeout(closeSuggestions, 200)}
							placeholder="e.g. Berlin"
							autoComplete="off"
							disabled={isLocked}
							aria-autocomplete="list"
							aria-expanded={isSuggestionsOpen}
						/>
						{isSuggestionsOpen && uniqueLocalityNames.length > 0 && (
							<ul
								className="locality-suggestions"
								role="listbox"
								aria-label="City suggestions"
							>
								{uniqueLocalityNames.map((name) => (
									<li
										key={name}
										role="option"
										className="locality-suggestion-item"
										onMouseDown={(e) => {
											e.preventDefault();
											selectLocalitySuggestion(name);
										}}
									>
										{name}
									</li>
								))}
							</ul>
						)}
					</div>
					<div className="field-message">
						{error && errorSource === 'locality' ? (
							<span className="field-message-error">{error}</span>
						) : (
							<span className="field-message-hint">
								Type a city name and pick from suggestions, or press Enter to search.
							</span>
						)}
					</div>
				</div>

				<div className="form-field">
					<label htmlFor="postalCode">Postal Code (PLZ)</label>

					<div
						className={`field-input-wrapper${isLocked ? ' field-input-wrapper--success' : ''}${error && errorSource === 'postal' ? ' field-input-wrapper--error' : ''}`}
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

					<div className="field-message">
						{error && errorSource === 'postal' ? (
							<span className="field-message-error">{error}</span>
						) : (
							<span className="field-message-hint">
								Type a 5-digit German PLZ to auto-fill the locality field.
							</span>
						)}
					</div>
				</div>

				<div className="form-clear-slot">
					<button
						type="button"
						onClick={clear}
						disabled={!locality && !postalCode && !isLocked}
						style={{
							visibility:
								isLocked || locality || postalCode ? 'visible' : 'hidden',
						}}
					>
						Clear
					</button>
				</div>
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

